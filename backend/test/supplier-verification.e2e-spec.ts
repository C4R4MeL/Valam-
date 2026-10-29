import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { SupplierSubtype, StatusDokumen, TipeDocument } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SupplierStorageService } from '../src/supplier/supplier-storage.service';
import { NotificationService } from '../src/supplier/notification.service';
import { stopTestTimers } from './test-timers';
const { assertTestEnvironment } = require('../scripts/pertamuda-env.cjs');
jest.setTimeout(60000);

describe('Supplier document verification rules (isolated fixture accounts)', () => {
  let app: INestApplication, prisma: PrismaService, supplierId: string;
  const ids: Record<string, string> = {},
    tokens: Record<string, string> = {};
  let failAudit = false;
  beforeAll(async () => {
    assertTestEnvironment(process.env);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SupplierStorageService)
      .useValue({ getSignedUrl: jest.fn().mockResolvedValue(null) })
      .overrideProvider(NotificationService)
      .useValue({
        sendVerificationApproved: jest.fn(),
        sendDocumentSubmittedToAdmin: jest.fn(),
      })
      .compile();
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
    stopTestTimers(app);
    prisma = app.get(PrismaService);
    const schema = await prisma.$queryRaw<
      { name: string }[]
    >`SELECT current_schema() AS name`;
    expect(schema[0].name).toBe('pertamuda_test');
    prisma.$use(async (params, next) => {
      if (
        failAudit &&
        params.model === 'VerificationLog' &&
        params.action === 'create'
      )
        throw new Error('DEMONSTRASI simulated audit failure');
      return next(params);
    });
    for (const roleName of ['admin', 'supplier', 'buyer']) {
      const role = await prisma.role.findUniqueOrThrow({
        where: { name: roleName },
      });
      const password = randomBytes(24).toString('base64url');
      const user = await prisma.user.create({
        data: {
          email: `verification-regression-${randomUUID()}@pertamuda.example.test`,
          password: await bcrypt.hash(password, 10),
          status: 'active',
          role_id: role.id,
          email_verified: true,
        },
      });
      ids[roleName] = user.id;
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password })
        .expect(200);
      tokens[roleName] = login.body.access_token;
    }
  }, 90000);
  beforeEach(async () => {
    supplierId = (
      await prisma.supplierProfile.create({
        data: {
          user_id: ids.supplier,
          supplier_subtype: SupplierSubtype.PETANI,
          punya_alat_suling: false,
          nama_pic: 'DEMONSTRASI regression only',
          ktp_pic: 'DEMO-NOT-A-REAL-ID',
          whatsapp: '',
          kabupaten: 'DEMONSTRASI',
          kecamatan: 'DEMONSTRASI',
          desa: 'DEMONSTRASI',
          grade_nilam: [],
          status: 'DALAM_VERIFIKASI',
        },
      })
    ).id;
  });
  afterEach(async () => {
    failAudit = false;
    if (supplierId)
      await prisma.supplierProfile.deleteMany({
        where: { id: supplierId, user_id: ids.supplier },
      });
  });
  afterAll(async () => {
    if (prisma)
      await prisma.user.deleteMany({
        where: { id: { in: Object.values(ids) } },
      });
    if (app) await app.close();
  });

  async function documents(
    withCoa = false,
    withAkta = false,
    lastPhoto: StatusDokumen = StatusDokumen.APPROVED,
  ) {
    const types = [
      TipeDocument.SURAT_PERNYATAAN,
      TipeDocument.FOTO_FASILITAS,
      TipeDocument.FOTO_FASILITAS,
      TipeDocument.FOTO_FASILITAS,
    ];
    if (withCoa) types.push(TipeDocument.COA);
    if (withAkta) types.push(TipeDocument.AKTA_KOPERASI);
    await prisma.supplierDocument.createMany({
      data: types.map((type, index) => ({
        supplier_id: supplierId,
        tipe_document: type,
        status_dokumen: index === 3 ? lastPhoto : StatusDokumen.APPROVED,
        file_url: 'DEMONSTRASI-not-a-real-document-' + randomUUID(),
        file_name: 'DEMONSTRASI-test-fixture.txt',
        file_size: 1,
        tanggal_coa: type === TipeDocument.COA ? new Date() : null,
      })),
    });
  }
  const verify = (role = 'admin') =>
    request(app.getHttpServer())
      .patch(`/api/admin/suppliers/${supplierId}/verify`)
      .auth(tokens[role], { type: 'bearer' });

  it.each([
    [SupplierSubtype.PETANI, false, false, false],
    [SupplierSubtype.PETANI, true, true, false],
    [SupplierSubtype.PENYULING, false, true, false],
    [SupplierSubtype.KOPERASI, false, true, true],
  ])(
    'accepts complete approved requirements for %s (equipment=%s) without batch-quality approval',
    async (subtype, equipment, coa, akta) => {
      await prisma.supplierProfile.update({
        where: { id: supplierId },
        data: { supplier_subtype: subtype, punya_alat_suling: equipment },
      });
      await documents(coa, akta);
      await verify('supplier').expect(403);
      await verify('buyer').expect(403);
      const results = await Promise.all([verify(), verify()]);
      expect(results.map((res) => res.status).sort()).toEqual([200, 400]);
      expect(
        (
          await prisma.supplierProfile.findUniqueOrThrow({
            where: { id: supplierId },
          })
        ).status,
      ).toBe('TERVERIFIKASI');
      const logs = await prisma.verificationLog.findMany({
        where: { supplier_id: supplierId, aksi: 'FINALIZE_VERIFIED' },
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].admin_id).toBe(ids.admin);
      expect(logs[0].catatan).toContain('Bukan evaluasi mutu batch');
    },
  );
  it('still requires Akta and COA for KOPERASI; failed validation cannot approve the profile', async () => {
    await prisma.supplierProfile.update({
      where: { id: supplierId },
      data: { supplier_subtype: 'KOPERASI' },
    });
    await documents();
    const res = await verify().expect(400);
    expect(res.body.unapprovedDocuments).toEqual([
      'Akta Pendirian Koperasi + SK Kemenkop',
      'Certificate of Analysis (COA)',
    ]);
    expect(
      (
        await prisma.supplierProfile.findUniqueOrThrow({
          where: { id: supplierId },
        })
      ).status,
    ).toBe('DALAM_VERIFIKASI');
    expect(
      await prisma.verificationLog.count({
        where: { supplier_id: supplierId },
      }),
    ).toBe(0);
  });
  it('requires three approved facility photos and reflects a real admin review in readiness', async () => {
    await documents(false, false, StatusDokumen.PENDING);
    await verify().expect(400);
    const photo = await prisma.supplierDocument.findFirstOrThrow({
      where: { supplier_id: supplierId, status_dokumen: 'PENDING' },
    });
    const review = await request(app.getHttpServer())
      .patch(`/api/admin/suppliers/${supplierId}/documents/${photo.id}/review`)
      .auth(tokens.admin, { type: 'bearer' })
      .send({ aksi: 'APPROVE' })
      .expect(200);
    const requirement = review.body.data.documentCompleteness.find(
      (entry: { tipe: string }) => entry.tipe === 'FOTO_FASILITAS',
    );
    expect(requirement.approved).toBe(3);
    expect(requirement.required).toBe(3);
    expect(requirement.approvalComplete).toBe(true);
    await verify().expect(200);
  });
  it.each(['missing', 'expired', 'future'])(
    'rejects an approved COA with %s date for an oil producer',
    async (kind) => {
      await prisma.supplierProfile.update({
        where: { id: supplierId },
        data: { supplier_subtype: 'PENYULING' },
      });
      await documents(true);
      const date =
        kind === 'missing'
          ? null
          : new Date(Date.now() + (kind === 'expired' ? -190 : 10) * 86400000);
      await prisma.supplierDocument.updateMany({
        where: { supplier_id: supplierId, tipe_document: 'COA' },
        data: { tanggal_coa: date },
      });
      const res = await verify().expect(400);
      expect(res.body.unapprovedDocuments).toContain(
        'Certificate of Analysis (COA)',
      );
      expect(
        (
          await prisma.supplierProfile.findUniqueOrThrow({
            where: { id: supplierId },
          })
        ).status,
      ).toBe('DALAM_VERIFIKASI');
    },
  );
  it('requires Surat Pernyataan at submission too, and never treats submission as document approval', async () => {
    await documents();
    await prisma.supplierDocument.deleteMany({
      where: { supplier_id: supplierId, tipe_document: 'SURAT_PERNYATAAN' },
    });
    await prisma.supplierProfile.update({
      where: { id: supplierId },
      data: { status: 'TERDAFTAR' },
    });
    await verify().expect(400);
    const submit = () =>
      request(app.getHttpServer())
        .post('/api/suppliers/me/submit-verification')
        .auth(tokens.supplier, { type: 'bearer' });
    const rejected = await submit().expect(400);
    expect(rejected.body.errors.join(' ')).toContain('Surat Pernyataan');
    await prisma.supplierDocument.create({
      data: {
        supplier_id: supplierId,
        tipe_document: 'SURAT_PERNYATAAN',
        status_dokumen: 'PENDING',
        file_url: 'DEMONSTRASI',
        file_name: 'DEMONSTRASI',
        file_size: 1,
      },
    });
    await submit().expect(201);
    await verify().expect(400);
  });
  it('rolls profile approval back when the audit entry cannot be written', async () => {
    await documents();
    failAudit = true;
    try {
      await verify().expect(500);
    } finally {
      failAudit = false;
    }
    expect(
      (
        await prisma.supplierProfile.findUniqueOrThrow({
          where: { id: supplierId },
        })
      ).status,
    ).toBe('DALAM_VERIFIKASI');
    expect(
      await prisma.verificationLog.count({
        where: { supplier_id: supplierId },
      }),
    ).toBe(0);
  });
});
