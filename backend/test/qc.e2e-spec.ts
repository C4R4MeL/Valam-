import { Test } from '@nestjs/testing';
import { stopTestTimers } from './test-timers';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
const { assertTestEnvironment } = require('../scripts/pertamuda-env.cjs');

describe('QC records without invented certification', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminId: string;
  let batchId: string;

  beforeAll(async () => {
    assertTestEnvironment(process.env);
    const accounts = JSON.parse(
      readFileSync('.pertamuda-credentials.json', 'utf8'),
    );
    const module = await Test.createTestingModule({
      imports: [AppModule],
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
    stopTestTimers(app);
    prisma = app.get(PrismaService);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(accounts.admin)
      .expect(200);
    adminToken = login.body.access_token;
    adminId = (
      await prisma.user.findUniqueOrThrow({
        where: { email: accounts.admin.email },
      })
    ).id;
    const supplier = await prisma.user.findUniqueOrThrow({
      where: { email: accounts.supplier.email },
    });
    batchId = (
      await prisma.product.create({
        data: {
          supplier_id: supplier.id,
          batch_code: `DEMO-QC-${Date.now()}`,
          is_demo: true,
          price_type: 'DEMONSTRATION',
          total_volume_kg: 10,
          available_volume_kg: 10,
          price_per_kg: 100,
        },
      })
    ).id;
  }, 60000);

  afterAll(async () => {
    if (prisma && batchId)
      await prisma.product.delete({ where: { id: batchId } });
    if (app) await app.close();
  });

  it('records missing results as null and creates no certificate or pass event', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/admin/qc/${batchId}`)
      .auth(adminToken, { type: 'bearer' })
      .send({})
      .expect(201);
    expect(response.body.cert).toBeNull();
    expect(response.body.qcResult).toMatchObject({
      pa_percentage: null,
      moisture: null,
      specific_gravity: null,
      refractive_index: null,
      optical_rotation: null,
      tested_at: null,
      overall_status: 'UNEVALUATED',
      admin_id: adminId,
    });
    expect(
      await prisma.certificate.count({ where: { product_id: batchId } }),
    ).toBe(0);
    expect(
      await prisma.traceLog.count({
        where: { product_id: batchId, event_type: 'LAB_VERIFIED' },
      }),
    ).toBe(0);
  });

  it('preserves true zero values and report metadata but does not automatically evaluate', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/qc/${batchId}`)
      .auth(adminToken, { type: 'bearer' })
      .send({
        moisture: 0,
        optical_rotation: 0,
        lab_name: 'LAB DEMONSTRASI',
        report_number: 'DEMO-REPORT-001',
        tested_at: '2026-09-01',
        source_document_url: 'https://example.test/demo-report.pdf',
      })
      .expect(201);
    expect(
      await prisma.qcResult.count({ where: { product_id: batchId } }),
    ).toBe(1);
    // A published fixture exercises the public mapper; it does not grant quality verification.
    await prisma.product.update({
      where: { id: batchId },
      data: { status: 'VERIFIED' },
    });
    const product = await request(app.getHttpServer())
      .get(`/api/products/${batchId}`)
      .expect(200);
    expect(product.body).toMatchObject({
      moisture: null,
      optical_rotation: null,
      pa_percentage: null,
      lab_verified: false,
      quality_status: 'UNEVALUATED',
      is_demo: true,
      price_type: 'DEMONSTRATION',
    });
    expect(product.body.qc_result).toBeNull();
    expect(product.body.document_review_status).toBe('NEEDS_REVIEW');
    expect(await prisma.qcResult.findUniqueOrThrow({ where: { product_id: batchId } })).toMatchObject({ moisture: 0, optical_rotation: 0, report_number: 'DEMO-REPORT-001' });
    await request(app.getHttpServer())
      .get(`/api/products/${batchId}/coa/download`)
      .expect(404);
  });

  it('rejects injected pass status/admin identity and invalid numerical values', async () => {
    for (const body of [
      { overall_status: 'pass' },
      { adminId: adminId },
      { pa_percentage: 101 },
      { moisture: -1 },
    ]) {
      await request(app.getHttpServer())
        .post(`/api/admin/qc/${batchId}`)
        .auth(adminToken, { type: 'bearer' })
        .send(body)
        .expect(400);
    }
    expect(
      (
        await prisma.qcResult.findUniqueOrThrow({
          where: { product_id: batchId },
        })
      ).overall_status,
    ).toBe('UNEVALUATED');
  });
});
