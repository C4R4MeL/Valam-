import { Test } from '@nestjs/testing';
import { stopTestTimers } from './test-timers';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const { assertTestEnvironment } = require('../scripts/pertamuda-env.cjs');

describe('Pertamuda authentication and API authorization (real isolated PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  const tokens: Record<string, string> = {};
  let accounts: Record<string, { email: string; password: string }>;
  let orderId: string;
  let batchId: string;

  beforeAll(async () => {
    assertTestEnvironment(process.env);
    accounts = JSON.parse(readFileSync('.pertamuda-credentials.json', 'utf8'));
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    stopTestTimers(app);
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    for (const role of ['buyer', 'supplier', 'admin']) {
      const login = await request(app.getHttpServer()).post('/api/auth/login').send(accounts[role]).expect(200);
      expect(login.body.role).toBe(role);
      expect(login.body.access_token).toEqual(expect.any(String));
      tokens[role] = login.body.access_token;
    }
    const buyer = await prisma.user.findUniqueOrThrow({ where: { email: accounts.buyer.email } });
    const supplier = await prisma.user.findUniqueOrThrow({ where: { email: accounts.supplier.email } });
    batchId = (await prisma.product.findUniqueOrThrow({ where: { batch_code: 'DEMO-PERTAMUDA-001' } })).id;
    const order = await prisma.order.create({ data: {
      order_number: `AUTH-TEST-${Date.now()}`, buyer_id: buyer.id, supplier_id: supplier.id,
      total_amount: 100, payment: { create: { amount: 100 } },
    } });
    orderId = order.id;
  }, 60000);

  afterAll(async () => {
    if (prisma && orderId) await prisma.order.delete({ where: { id: orderId } });
    if (app) await app.close();
  });

  it('rejects incorrect credentials without returning a token', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/login')
      .send({ ...accounts.buyer, password: 'incorrect-password' }).expect(401);
    expect(response.body.access_token).toBeUndefined();
  });

  it('rejects public admin signup and does not create an account', async () => {
    await request(app.getHttpServer()).post('/api/auth/register')
      .send({ email: 'forbidden-admin@pertamuda.example.test', password: 'test-password', roleName: 'admin' }).expect(400);
    expect(await prisma.user.count({ where: { email: 'forbidden-admin@pertamuda.example.test' } })).toBe(0);
  });

  it('protects direct admin/QC and user endpoints without a token', async () => {
    await request(app.getHttpServer()).get('/api/admin/dashboard').expect(401);
    await request(app.getHttpServer()).get('/api/users').expect(401);
    await request(app.getHttpServer()).post(`/api/admin/qc/${batchId}`).send({}).expect(401);
    await request(app.getHttpServer()).patch(`/api/admin/qc/${batchId}/receive`).expect(401);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: batchId } })).status).toBe('DRAFT');
  });

  it('enforces controller-level admin roles against buyer and supplier tokens', async () => {
    for (const role of ['buyer', 'supplier']) {
      await request(app.getHttpServer()).get('/api/admin/dashboard').auth(tokens[role], { type: 'bearer' }).expect(403);
      await request(app.getHttpServer()).get('/api/admin/suppliers').auth(tokens[role], { type: 'bearer' }).expect(403);
      await request(app.getHttpServer()).post(`/api/admin/qc/${batchId}`).auth(tokens[role], { type: 'bearer' }).send({}).expect(403);
    }
    await request(app.getHttpServer()).get('/api/admin/dashboard').auth(tokens.admin, { type: 'bearer' }).expect(200);
    await request(app.getHttpServer()).get('/api/admin/qc/products').auth(tokens.admin, { type: 'bearer' }).expect(200);
  });

  it('enforces dashboard role, payment ownership and own draft inventory', async () => {
    await request(app.getHttpServer()).get('/api/orders/supplier').auth(tokens.buyer, { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).get('/api/orders/buyer').auth(tokens.supplier, { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).get(`/api/payment/status/${orderId}`).auth(tokens.supplier, { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).get(`/api/payment/status/${orderId}`).auth(tokens.buyer, { type: 'bearer' }).expect(200);
    const response = await request(app.getHttpServer()).get('/api/products/mine?supplier_id=00000000-0000-4000-8000-000000000000')
      .auth(tokens.supplier, { type: 'bearer' }).expect(200);
    expect(response.body.data.length).toBe(3);
    await request(app.getHttpServer()).get(`/api/products/${batchId}`).expect(404);
    const publicProducts = await request(app.getHttpServer()).get('/api/products?status=DRAFT').expect(200);
    expect(publicProducts.body.data).toHaveLength(0);
  });

  it('does not expose password, identity or bank fields in order payloads', async () => {
    const response = await request(app.getHttpServer()).get('/api/orders/buyer').auth(tokens.buyer, { type: 'bearer' }).expect(200);
    const body = JSON.stringify(response.body);
    for (const key of ['password', 'ktp_pic', 'nomor_rekening', 'auth_sessions']) expect(body).not.toContain(`"${key}"`);
  });

  it('rejects invalid, expired JWTs and sessions expired in the database', async () => {
    await request(app.getHttpServer()).get('/api/profiles/me').auth('mock_token_123', { type: 'bearer' }).expect(401);
    const payload = jwt.decode(tokens.buyer) as { sub: string; jti: string; email: string };
    const expired = jwt.sign({ sub: payload.sub, jti: payload.jti }, { expiresIn: -1 });
    await request(app.getHttpServer()).get('/api/profiles/me').auth(expired, { type: 'bearer' }).expect(401);
    const fresh = await request(app.getHttpServer()).post('/api/auth/login').send(accounts.buyer).expect(200);
    const freshPayload = jwt.decode(fresh.body.access_token) as { jti: string };
    await prisma.authSession.update({ where: { id: freshPayload.jti }, data: { expires_at: new Date(0) } });
    await request(app.getHttpServer()).get('/api/profiles/me').auth(fresh.body.access_token, { type: 'bearer' }).expect(401);
  });

  it('reads role and account suspension from database on every request', async () => {
    const payload = jwt.decode(tokens.buyer) as { sub: string; jti: string };
    const forgedRole = jwt.sign({ sub: payload.sub, jti: payload.jti, role: 'admin' });
    await request(app.getHttpServer()).get('/api/admin/dashboard').auth(forgedRole, { type: 'bearer' }).expect(403);
    await prisma.user.update({ where: { id: payload.sub }, data: { status: 'rejected' } });
    try {
      await request(app.getHttpServer()).get('/api/profiles/me').auth(tokens.buyer, { type: 'bearer' }).expect(401);
    } finally { await prisma.user.update({ where: { id: payload.sub }, data: { status: 'active' } }); }
  });

  it('validates matching criteria at the HTTP boundary and returns explicit eligibility groups', async () => {
    const criteria = { volume_kg: 100, max_budget: 1000000, min_pa: 30, max_moisture: 3 };
    await request(app.getHttpServer()).post('/api/matching').auth(tokens.buyer, { type: 'bearer' }).send({ ...criteria, volume_kg: -1 }).expect(400);
    const result = await request(app.getHttpServer()).post('/api/matching').auth(tokens.buyer, { type: 'bearer' }).send(criteria).expect(201);
    expect(result.body.algorithm).toContain('Euclidean');
    expect(Array.isArray(result.body.matches)).toBe(true);
    expect(Array.isArray(result.body.alternatives)).toBe(true);
    expect(result.body.matches.every((entry: { is_eligible: boolean }) => entry.is_eligible)).toBe(true);
  });

  it('revokes a session on logout; replayed JWT cannot access API', async () => {
    await request(app.getHttpServer()).post('/api/auth/logout').auth(tokens.buyer, { type: 'bearer' }).expect(200);
    await request(app.getHttpServer()).get('/api/profiles/me').auth(tokens.buyer, { type: 'bearer' }).expect(401);
  });
});
