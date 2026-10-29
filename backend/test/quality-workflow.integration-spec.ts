import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { randomUUID, createHash } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { AuthModule } from '../src/auth/auth.module';
import { QualityModule } from '../src/quality/quality.module';
import { ProductsModule } from '../src/products/products.module';
import { TraceabilityModule } from '../src/traceability/traceability.module';
import { QcModule } from '../src/qc/qc.module';

describe('Quality partnership workflow: isolated PostgreSQL + real HTTP guards', () => {
  let app: INestApplication, db: PrismaService;
  let admin: any, supplier: any, other: any, buyer: any;
  let batch: any,
    secondBatch: any,
    demo: any,
    partner: any,
    submitted: any,
    report: any;
  const pdf = Buffer.from(
    '%PDF-1.4\n% TEST FIXTURE ONLY - NOT A LABORATORY DOCUMENT\n%%EOF',
  );
  const hash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
  const call = (
    verb: 'get' | 'post' | 'patch',
    path: string,
    account?: any,
  ) => {
    const r = request(app.getHttpServer())[verb](`/api/${path}`);
    return account ? r.auth(account.token, { type: 'bearer' }) : r;
  };
  const partnerData = (name: string) => ({
    name,
    kind: 'LABORATORY',
    services: ['TEST FIXTURE SERVICE'],
    publish_name: true,
    publish_logo: false,
    publish_reports: true,
    visible: true,
    accepting_requests: true,
    status: 'ACTIVE',
    contact: 'PRIVATE CONTACT',
    permission_notes: 'TEST FIXTURE ONLY',
  });
  async function upload(account: any, product = batch, content = pdf) {
    return (
      await call('post', `quality/manage/batches/${product.id}/files`, account)
        .attach('file', content, {
          filename: 'fixture.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)
    ).body;
  }
  const metadata = (file: any, extra = {}) => ({
    product_id: batch.id,
    partner_id: partner.id,
    file_id: file.id,
    report_number: 'FIXTURE-REPORT-01',
    sample_identity: 'FIXTURE-SAMPLE',
    parameters: [],
    source: 'TEST FIXTURE received from supplier',
    publication_allowed: true,
    is_demo: false,
    key: randomUUID(),
    ...extra,
  });
  const approve = () => ({
    status: 'APPROVED',
    notes:
      'TEST FIXTURE: issuer and batch association checked; dates absent in fixture.',
    checklist: {
      issuer: true,
      batch_sample: true,
      report_number: true,
      dates: true,
      completeness: true,
    },
    key: randomUUID(),
  });

  beforeAll(async () => {
    const schema = process.env.QUALITY_TEST_SCHEMA;
    if (
      !schema ||
      !/^quality_workflow_test_[a-f0-9]{12}$/.test(schema) ||
      new URL(process.env.DATABASE_URL!).searchParams.get('schema') !== schema
    )
      throw Error(
        'Run scripts/quality-workflow-test.cjs; never use an operational database',
      );
    const module = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        QualityModule,
        ProductsModule,
        TraceabilityModule,
        QcModule,
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    db = app.get(PrismaService);
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    async function account(role: string) {
      const r = await db.role.upsert({
        where: { name: role },
        update: {},
        create: { name: role },
      });
      const u = await db.user.create({
        data: {
          email: `${randomUUID()}@quality.test`,
          role_id: r.id,
          password: 'not-a-login',
          status: 'active',
        },
      });
      const session = await db.authSession.create({
        data: { user_id: u.id, expires_at: new Date(Date.now() + 3600000) },
      });
      return { ...u, token: jwt.sign({ sub: u.id, jti: session.id }) };
    }
    admin = await account('admin');
    supplier = await account('supplier');
    other = await account('supplier');
    buyer = await account('buyer');
    const makeBatch = (owner: string, is_demo = false) =>
      db.product.create({
        data: {
          supplier_id: owner,
          batch_code: `QUALITY-TEST-${randomUUID()}`,
          status: 'VERIFIED',
          total_volume_kg: 1,
          available_volume_kg: 1,
          price_per_kg: 1,
          is_demo,
        },
      });
    batch = await makeBatch(supplier.id);
    secondBatch = await makeBatch(other.id);
    demo = await makeBatch(supplier.id, true);
  }, 60000);
  afterAll(async () => {
    if (app) await app.close();
  });

  it('safely marks legacy certificates for review without converting them to ARC reports', async () => {
    const legacy = await db.certificate.findUniqueOrThrow({
      where: { certificate_number: 'LEGACY-UNPROVEN' },
    });
    expect(legacy.review_status).toBe('NEEDS_REVIEW');
    expect(legacy.admin_name).toBe('Unproven legacy signer');
    expect(await db.labReport.count()).toBe(0);
    const arc = await db.testingPartner.findUniqueOrThrow({
      where: { id: 'a7c00000-0000-4000-8000-000000000001' },
    });
    expect(arc).toMatchObject({
      name: 'ARC USK',
      accepting_requests: false,
      services: [],
      address: null,
      contact: null,
      logo_url: null,
    });
    await call('get', `products/${legacy.product_id}/coa/download`).expect(404);
  });
  it('creates a database-driven partner and keeps internal contacts/agreements private', async () => {
    await call('post', 'quality/manage/admin/partners', supplier)
      .send(partnerData('FORBIDDEN'))
      .expect(403);
    partner = (
      await call('post', 'quality/manage/admin/partners', admin)
        .send(partnerData('FIXTURE LAB'))
        .expect(201)
    ).body;
    const publicRows = (await call('get', 'quality/partners').expect(200)).body;
    expect(publicRows.find((p: any) => p.id === partner.id).name).toBe(
      'FIXTURE LAB',
    );
    expect(JSON.stringify(publicRows)).not.toContain('PRIVATE CONTACT');
    const agreement = (
      await call(
        'post',
        `quality/manage/admin/partners/${partner.id}/files`,
        admin,
      )
        .attach('file', pdf, {
          filename: 'agreement.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)
    ).body;
    await call(
      'get',
      `quality/manage/admin/agreements/${agreement.id}/source`,
      supplier,
    ).expect(403);
    await call('get', `quality/reports/${agreement.id}/source`).expect(404);
    await call('get', 'quality/manage', buyer).expect(403);
    await call('get', 'quality/manage').expect(401);
  });
  it('enforces batch ownership and idempotent concurrent request submission', async () => {
    const body = {
      product_id: batch.id,
      partner_id: partner.id,
      service: partner.services[0],
      key: randomUUID(),
    };
    await call('post', 'quality/manage/requests', other).send(body).expect(403);
    const responses = await Promise.all([
      call('post', 'quality/manage/requests', supplier).send(body),
      call('post', 'quality/manage/requests', supplier).send(body),
    ]);
    expect(responses.map((r: any) => r.status)).toEqual([201, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    submitted = responses[0].body;
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.shipping_info).toBeNull();
    expect(
      await db.qualityEvent.count({ where: { request_id: submitted.id } }),
    ).toBe(1);
    expect(
      await db.notification.count({
        where: { user_id: supplier.id, type: 'QUALITY' },
      }),
    ).toBe(1);
    const otherView = (await call('get', 'quality/manage', other).expect(200))
      .body;
    expect(otherView.requests).toHaveLength(0);
  });
  it('closes new requests for inactive partners while preserving history', async () => {
    await call('patch', `quality/manage/admin/partners/${partner.id}`, admin)
      .send({
        ...partnerData('FIXTURE LAB'),
        status: 'ENDED',
        accepting_requests: false,
      })
      .expect(200);
    await call('post', 'quality/manage/requests', supplier)
      .send({
        product_id: demo.id,
        partner_id: partner.id,
        service: partner.services[0],
        key: randomUUID(),
      })
      .expect(400);
    expect(
      (await call('get', 'quality/manage', supplier)).body.requests[0].id,
    ).toBe(submitted.id);
  });
  it('rejects skipped transitions, supplier receipt confirmation, and third-party mutations', async () => {
    await call('patch', `quality/manage/requests/${submitted.id}`, admin)
      .send({ status: 'TESTING', notes: 'skip', key: randomUUID() })
      .expect(400);
    await call('patch', `quality/manage/requests/${submitted.id}`, other)
      .send({ status: 'CANCELLED', notes: 'not owner', key: randomUUID() })
      .expect(403);
    await call('patch', `quality/manage/requests/${submitted.id}`, admin)
      .send({
        status: 'AWAITING_SHIPMENT',
        notes: 'TEST FIXTURE: partner instructions confirmed',
        key: randomUUID(),
      })
      .expect(200);
    const ship = {
      status: 'SHIPPED',
      notes: 'TEST FIXTURE shipment',
      shipping_info: 'TEST TRACKING',
      key: randomUUID(),
    };
    await call('patch', `quality/manage/requests/${submitted.id}`, supplier)
      .send(ship)
      .expect(200);
    await call('patch', `quality/manage/requests/${submitted.id}`, supplier)
      .send(ship)
      .expect(200);
    await call('patch', `quality/manage/requests/${submitted.id}`, supplier)
      .send({
        status: 'RECEIVED',
        notes: 'supplier cannot confirm',
        key: randomUUID(),
      })
      .expect(403);
    await call('patch', `quality/manage/requests/${submitted.id}`, admin)
      .send({
        status: 'RECEIVED',
        notes: 'TEST FIXTURE partner confirmation',
        key: randomUUID(),
      })
      .expect(200);
    await call('patch', `quality/manage/requests/${submitted.id}`, admin)
      .send({
        status: 'TESTING',
        notes: 'TEST FIXTURE testing confirmed',
        key: randomUUID(),
      })
      .expect(200);
    expect(
      await db.qualityEvent.count({
        where: { request_id: submitted.id, action: 'SHIPPED' },
      }),
    ).toBe(1);
  });
  it('validates file contents, ownership, scope, pending review, and report idempotency', async () => {
    await call(
      'post',
      `quality/manage/batches/${secondBatch.id}/files`,
      supplier,
    )
      .attach('file', pdf, {
        filename: 'x.pdf',
        contentType: 'application/pdf',
      })
      .expect(403);
    await call('post', `quality/manage/batches/${batch.id}/files`, supplier)
      .attach('file', Buffer.from('fake'), {
        filename: 'x.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    const file = await upload(supplier);
    const body = metadata(file, { request_id: submitted.id });
    await call('post', 'quality/manage/reports', other).send(body).expect(403);
    report = (
      await call('post', 'quality/manage/reports', supplier)
        .send(body)
        .expect(201)
    ).body;
    expect(
      (
        await call('post', 'quality/manage/reports', supplier)
          .send(body)
          .expect(201)
      ).body.id,
    ).toBe(report.id);
    expect(report.review_status).toBe('PENDING');
    expect(report.evaluation_status).toBe('UNEVALUATED');
    await call('patch', `quality/manage/reports/${report.id}/review`, supplier)
      .send(approve())
      .expect(403);
    expect((await call('get', `products/${batch.id}`)).body.lab_verified).toBe(
      false,
    );
    await call('get', `quality/reports/${report.id}/source`).expect(403);
    await call(
      'get',
      `quality/manage/reports/${report.id}/source`,
      other,
    ).expect(403);
  });
  it('requires every review check and matches reports to the correct request and batch', async () => {
    const file = await upload(other, secondBatch);
    await call('post', 'quality/manage/reports', admin)
      .send(
        metadata(file, {
          product_id: secondBatch.id,
          request_id: submitted.id,
        }),
      )
      .expect(400);
    await call('patch', `quality/manage/reports/${report.id}/review`, admin)
      .send({
        status: 'APPROVED',
        notes: 'missing checklist',
        key: randomUUID(),
      })
      .expect(400);
    const body = approve();
    await Promise.all([
      call('patch', `quality/manage/reports/${report.id}/review`, admin)
        .send(body)
        .expect(200),
      call('patch', `quality/manage/reports/${report.id}/review`, admin)
        .send(body)
        .expect(200),
    ]);
    expect(
      await db.qualityEvent.count({
        where: { report_id: report.id, action: 'APPROVED' },
      }),
    ).toBe(1);
    expect(
      (
        await db.testingRequest.findUniqueOrThrow({
          where: { id: submitted.id },
        })
      ).status,
    ).toBe('RESULTS_AVAILABLE');
    const product = (await call('get', `products/${batch.id}`)).body;
    expect(product).toMatchObject({
      lab_verified: true,
      testing_issuer: 'FIXTURE LAB',
      quality_status: 'UNEVALUATED',
      pa_percentage: null,
      moisture: null,
    });
  });
  it('returns the original source for preview/download and delivers in-app supplier notifications', async () => {
    const download = await call(
      'get',
      `quality/manage/reports/${report.id}/source?download=1`,
      supplier,
    ).expect(200);
    const preview = await call(
      'get',
      `quality/reports/${report.id}/source`,
    ).expect(200);
    expect(hash(download.body)).toBe(hash(pdf));
    expect(hash(preview.body)).toBe(hash(pdf));
    expect(download.headers['content-disposition']).toContain('attachment');
    expect(preview.headers['cache-control']).toContain('no-store');
    const view = (await call('get', 'quality/manage', supplier)).body;
    expect(view.notifications).toHaveLength(3);
    expect(view.reports[0].id).toBe(report.id);
  });
  it('preserves issuer snapshots after partner edits and revokes current product/QR report access', async () => {
    await call('patch', `quality/manage/admin/partners/${partner.id}`, admin)
      .send({
        ...partnerData('RENAMED FIXTURE LAB'),
        status: 'ENDED',
        accepting_requests: false,
      })
      .expect(200);
    expect(
      (await call('get', `quality/batches/${batch.id}/reports`)).body[0]
        .issuer_snapshot.name,
    ).toBe('FIXTURE LAB');
    await call('get', `trace/${batch.id}/qr`)
      .expect(200)
      .expect('Content-Type', /image\/png/);
    await call('patch', `quality/manage/reports/${report.id}/review`, admin)
      .send({
        status: 'REVOKED',
        notes: 'TEST FIXTURE withdrawn source',
        key: randomUUID(),
      })
      .expect(200);
    expect((await call('get', `products/${batch.id}`)).body.lab_verified).toBe(
      false,
    );
    expect(
      (await call('get', `trace/code/${batch.batch_code}`)).body.lab_verified,
    ).toBe(false);
    expect(
      (await call('get', `quality/batches/${batch.id}/reports`)).body,
    ).toEqual([]);
    await call('get', `quality/reports/${report.id}/source`).expect(403);
    await call(
      'get',
      `quality/manage/reports/${report.id}/source`,
      supplier,
    ).expect(200);
  });
  it('accepts independently obtained reports without inventing process events, and preserves replacement history', async () => {
    const file = await upload(
      supplier,
      batch,
      Buffer.concat([pdf, Buffer.from('\nREPLACEMENT TEST FIXTURE')]),
    );
    const replacement = (
      await call('post', 'quality/manage/reports', supplier)
        .send(
          metadata(file, {
            replaces_id: report.id,
            report_number: 'FIXTURE-REPLACEMENT',
          }),
        )
        .expect(201)
    ).body;
    expect(replacement.request_id).toBeNull();
    expect(replacement.review_status).toBe('PENDING');
    const requestEvents = await db.qualityEvent.count({
      where: { request_id: submitted.id },
    });
    await call(
      'patch',
      `quality/manage/reports/${replacement.id}/review`,
      admin,
    )
      .send(approve())
      .expect(200);
    expect(
      await db.qualityEvent.count({ where: { request_id: submitted.id } }),
    ).toBe(requestEvents);
    const current = (await call('get', `quality/batches/${batch.id}/reports`))
      .body;
    expect(current.map((r: any) => r.id)).toEqual([replacement.id]);
    const file2 = await upload(
      supplier,
      batch,
      Buffer.concat([pdf, Buffer.from('\nTHIRD TEST FIXTURE')]),
    );
    const v3 = (
      await call('post', 'quality/manage/reports', supplier)
        .send(
          metadata(file2, {
            replaces_id: replacement.id,
            report_number: 'FIXTURE-V3',
          }),
        )
        .expect(201)
    ).body;
    await call('patch', `quality/manage/reports/${v3.id}/review`, admin)
      .send(approve())
      .expect(200);
    expect(
      (await db.labReport.findUniqueOrThrow({ where: { id: replacement.id } }))
        .review_status,
    ).toBe('SUPERSEDED');
    expect(
      (await call('get', `trace/code/${batch.batch_code}`)).body.lab_verified,
    ).toBe(true);
  });
  it('never awards a demo badge and leaves absent testing values empty', async () => {
    const file = await upload(supplier, demo);
    const demoReport = (
      await call('post', 'quality/manage/reports', supplier)
        .send(
          metadata(file, {
            product_id: demo.id,
            report_number: 'DEMO-FIXTURE',
          }),
        )
        .expect(201)
    ).body;
    expect(demoReport.is_demo).toBe(true);
    await call('patch', `quality/manage/reports/${demoReport.id}/review`, admin)
      .send(approve())
      .expect(200);
    expect(
      (await call('get', `quality/batches/${demo.id}/reports`)).body,
    ).toEqual([]);
    expect((await call('get', `products/${demo.id}`)).body).toMatchObject({
      lab_verified: false,
      pa_percentage: null,
      moisture: null,
    });
    expect(
      (await call('get', `products/${secondBatch.id}`)).body,
    ).toMatchObject({
      lab_verified: false,
      pa_percentage: null,
      tested_at: null,
    });
  });
  it('records correction requests once and prevents hard deletion of partners with history', async () => {
    const f = await upload(
      other,
      secondBatch,
      Buffer.concat([pdf, Buffer.from('CORRECTION')]),
    );
    const r = (
      await call('post', 'quality/manage/reports', other)
        .send(
          metadata(f, {
            product_id: secondBatch.id,
            report_number: 'CORRECTION-FIXTURE',
          }),
        )
        .expect(201)
    ).body;
    const review = {
      status: 'REVISION_REQUESTED',
      notes: 'TEST FIXTURE sample identity needs clarification',
      key: randomUUID(),
    };
    await call('patch', `quality/manage/reports/${r.id}/review`, admin)
      .send(review)
      .expect(200);
    await call('patch', `quality/manage/reports/${r.id}/review`, admin)
      .send(review)
      .expect(200);
    expect(
      await db.notification.count({
        where: { user_id: other.id, type: 'QUALITY' },
      }),
    ).toBe(1);
    const correction = metadata(f, { product_id: secondBatch.id, report_number: 'CORRECTION-FIXTURE', replaces_id: r.id });
    const v2 = (await call('post', 'quality/manage/reports', other).send(correction).expect(201)).body;
    expect((await call('post', 'quality/manage/reports', other).send({ ...correction, key: randomUUID() }).expect(201)).body.id).toBe(v2.id);
    await call('patch', `quality/manage/reports/${v2.id}/review`, admin).send({ ...review, key: randomUUID() }).expect(200);
    const v3 = (await call('post', 'quality/manage/reports', other).send({ ...correction, replaces_id: v2.id, key: randomUUID() }).expect(201)).body;
    expect(v3.id).not.toBe(v2.id);
    expect(v3.replaces_id).toBe(v2.id);
    await expect(
      db.testingPartner.delete({ where: { id: partner.id } }),
    ).rejects.toThrow();
    expect(await db.labReport.count({ where: { product_id: batch.id } })).toBe(
      3,
    );
  });
  it('connects new batch registration, reviewed existing reports, supplier pricing, and buyer access', async () => {
    await db.supplierProfile.create({
      data: {
        user_id: supplier.id,
        nama_pic: 'TEST FIXTURE ONLY',
        ktp_pic: 'TEST FIXTURE ONLY',
        whatsapp: 'TEST FIXTURE ONLY',
        kabupaten: 'TEST FIXTURE ONLY',
        kecamatan: 'TEST FIXTURE ONLY',
        desa: 'TEST FIXTURE ONLY',
        grade_nilam: [],
        status: 'TERVERIFIKASI',
      },
    });
    const registered = (
      await call('post', 'products/batches', supplier)
        .send({
          batch_code: `QUALITY-REGISTERED-${randomUUID()}`,
          total_volume_kg: 1,
        })
        .expect(201)
    ).body;
    expect(registered.status).toBe('DRAFT');
    const file = await upload(supplier, registered);
    const pending = (
      await call('post', 'quality/manage/reports', supplier)
        .send(
          metadata(file, {
            product_id: registered.id,
            report_number: 'REGISTERED-BATCH-FIXTURE',
          }),
        )
        .expect(201)
    ).body;
    await call('patch', `quality/manage/reports/${pending.id}/review`, admin)
      .send(approve())
      .expect(200);
    expect(
      (await db.product.findUniqueOrThrow({ where: { id: registered.id } }))
        .status,
    ).toBe('AWAITING_PRICE');
    await call('get', `products/${registered.id}`).expect(404);
    await call('patch', `products/${registered.id}/price`, supplier)
      .send({ price: 1 })
      .expect(200);
    expect(
      (await call('get', `products/${registered.id}`).expect(200)).body
        .lab_verified,
    ).toBe(true);
    expect(
      (
        await call('get', `quality/batches/${registered.id}/reports`).expect(
          200,
        )
      ).body[0].id,
    ).toBe(pending.id);
  });
  it('archives legacy source changes and never republishes a generated legacy certificate', async () => {
    const legacy = await db.product.findUniqueOrThrow({
      where: { batch_code: 'LEGACY-QUALITY-FIXTURE' },
    });
    const body = { source_document_url: 'https://example.test/old-source.pdf' };
    await call('post', `admin/qc/${legacy.id}`, admin).send(body).expect(201);
    const count = await db.qualityEvent.count({
      where: { action: 'LEGACY_QC_RECORDED' },
    });
    await call('post', `admin/qc/${legacy.id}`, admin).send(body).expect(201);
    expect(
      await db.qualityEvent.count({ where: { action: 'LEGACY_QC_RECORDED' } }),
    ).toBe(count);
    await call('post', `admin/qc/${legacy.id}`, admin)
      .send({ source_document_url: 'https://example.test/new-source.pdf' })
      .expect(201);
    const events = await db.qualityEvent.findMany({
      where: { action: 'LEGACY_QC_RECORDED' },
      orderBy: { created_at: 'desc' },
    });
    expect(JSON.parse(events[0].notes!).before.source_document_url).toBe(
      body.source_document_url,
    );
    const records = (await call('get', 'quality/manage', admin)).body
      .legacy_records;
    expect(
      records.find((p: any) => p.id === legacy.id).certificate.review_status,
    ).toBe('NEEDS_REVIEW');
    await call('get', `products/${legacy.id}/coa/download`).expect(404);
  });
});
