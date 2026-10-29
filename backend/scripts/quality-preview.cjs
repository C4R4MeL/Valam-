// Used only by quality-workflow-test.cjs --preview, against its newly created schema.
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
async function main() {
  const schema = process.env.QUALITY_TEST_SCHEMA;
  if (!/^quality_workflow_test_[a-f0-9]{12}$/.test(schema || '') || new URL(process.env.DATABASE_URL).searchParams.get('schema') !== schema) throw Error('Isolated schema required');
  const { PrismaModule } = require('../dist/src/prisma/prisma.module');
  const { PrismaService } = require('../dist/src/prisma/prisma.service');
  const { AuthModule } = require('../dist/src/auth/auth.module');
  const { QualityModule } = require('../dist/src/quality/quality.module');
  const { ProductsModule } = require('../dist/src/products/products.module');
  const { TraceabilityModule } = require('../dist/src/traceability/traceability.module');
  const module = await Test.createTestingModule({ imports: [PrismaModule, AuthModule, QualityModule, ProductsModule, TraceabilityModule] }).compile();
  const app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api'); app.enableCors({ origin: 'http://127.0.0.1:3102' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init(); const db = app.get(PrismaService);
  const product = await db.product.findFirstOrThrow({ where: { batch_code: { startsWith: 'QUALITY-TEST-' }, lab_reports: { some: { review_status: 'APPROVED', is_demo: false } } } });
  const admin = await db.user.findFirstOrThrow({ where: { role: { name: 'admin' } } });
  const password = crypto.randomBytes(18).toString('base64url');
  const hashed = await require('bcryptjs').hash(password,10);
  for (const [id, email] of [[product.supplier_id, 'supplier@quality-preview.test'], [admin.id, 'admin@quality-preview.test']]) await db.user.update({ where: { id }, data: { email, password: hashed } });
  // Configured TEST FIXTURE partner for exercising the selector in the local preview.
  await db.testingPartner.create({ data: { name: 'LOCAL UI TEST FIXTURE LAB', status: 'ACTIVE', accepting_requests: true, services: ['UI TEST SERVICE'], publish_name: true, visible: true } });
  const credentialFile = path.join(__dirname,'../.quality-preview.json');
  fs.writeFileSync(credentialFile,JSON.stringify({ supplier: 'supplier@quality-preview.test', admin: 'admin@quality-preview.test', password, batch: product.id, batch_code: product.batch_code }));
  await app.listen(3103, '127.0.0.1'); console.log('Isolated UI fixture API: http://127.0.0.1:3103/api; credentials in ignored .quality-preview.json. Auto-closes after 10 minutes.');
  const close = async () => { await app.close(); if (fs.existsSync(credentialFile)) fs.unlinkSync(credentialFile); process.exitCode = 0; };
  const timer = setTimeout(close,600000);
  process.once('SIGINT',async () => { clearTimeout(timer); await close(); });
  process.once('SIGTERM',async () => { clearTimeout(timer); await close(); });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
