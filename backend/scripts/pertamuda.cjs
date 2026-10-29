const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { testEnvironment, assertTestEnvironment, TEST_SCHEMA } = require('./pertamuda-env.cjs');

const root = path.join(__dirname, '..');
const action = process.argv[2];
const env = testEnvironment();

async function seed(reset) {
  assertTestEnvironment(env);
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const crypto = require('node:crypto');
  const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  try {
    const schema = await prisma.$queryRaw`SELECT current_schema() AS name`;
    if (schema[0]?.name !== TEST_SCHEMA) throw new Error('Unexpected database schema. Run demo:prepare first.');
    // Passwords are generated once and written to a local ignored file, never to stdout.
    const fs = require('node:fs');
    const credentialsPath = path.join(root, '.pertamuda-credentials.json');
    const credentials = fs.existsSync(credentialsPath)
      ? JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
      : Object.fromEntries(['buyer', 'supplier', 'admin'].map(role => [role, {
          email: `${role}@pertamuda.example.test`,
          password: crypto.randomBytes(24).toString('base64url'),
        }]));
    if (!fs.existsSync(credentialsPath)) {
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    }
    const passwords = Object.fromEntries(await Promise.all(Object.entries(credentials)
      .map(async ([role, account]) => [role, await bcrypt.hash(account.password, 12)])));
    await prisma.$transaction(async tx => {
      // Serialize seed/reset across concurrent processes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(70657274616::bigint)`;
      if (reset) {
        // Whole test-schema data only; never DROP/TRUNCATE/migrate reset.
        for (const model of ['verificationLog', 'supplierDocument', 'supplierProfile',
          'notification', 'cartItem', 'shipmentTrackingLog', 'shipment', 'payment',
          'orderItem', 'order', 'rfqResponse', 'rfqRequest', 'withdrawal',
          'walletTransaction', 'wallet', 'certificate', 'qcResult', 'traceLog',
          'productParameter', 'circularProduct', 'product', 'profile', 'authSession', 'user', 'role']) {
          await tx[model].deleteMany();
        }
      }
      const users = {};
      for (const [index, role] of ['buyer', 'supplier', 'admin'].entries()) {
        const account = credentials[role];
        const roleRow = await tx.role.upsert({ where: { name: role }, update: {}, create: { name: role } });
        users[role] = await tx.user.upsert({
          where: { email: account.email }, update: {},
          create: {
            id: `70657274-616d-4000-8000-00000000000${index + 1}`,
            email: account.email, password: passwords[role], role_id: roleRow.id,
            status: 'active', email_verified: true,
            profile: { create: {
              company_name: `DEMONSTRASI Pertamuda ${role}`,
              contact_person: `Akun DEMONSTRASI ${role}`, country: 'ID',
              address: 'Alamat simulasi demonstrasi, Aceh Barat',
              // No fabricated usable contact, identity document, or bank account.
            } },
          },
        });
      }
      const batches = [
        { code: 'DEMO-PERTAMUDA-001', volume: 500, moq: 10, price: 850000 },
        { code: 'DEMO-PERTAMUDA-002', volume: 100, moq: 5, price: 780000 },
        { code: 'DEMO-PERTAMUDA-HABIS', volume: 0, moq: 5, price: 680000 },
      ];
      for (const batch of batches) {
        await tx.product.upsert({ where: { batch_code: batch.code }, update: { is_demo: true, price_type: 'DEMONSTRATION' }, create: {
          supplier_id: users.supplier.id, batch_code: batch.code, is_demo: true, price_type: 'DEMONSTRATION',
          origin_village: 'Desa DEMONSTRASI', origin_district: 'Aceh Barat',
          origin_province: 'Aceh', total_volume_kg: batch.volume,
          available_volume_kg: batch.volume, moq_kg: batch.moq,
          price_per_kg: batch.price, status: 'DRAFT',
          trace_logs: { create: {
            event_type: 'DEMO_CREATED', location_name: 'Lingkungan pengujian Pertamuda',
            description: 'DATA DEMONSTRASI. Harga simulasi; belum ada hasil uji atau evaluasi mutu. Bukan bukti laboratorium atau identitas terverifikasi.',
          } },
        } });
      }
      await tx.wallet.upsert({ where: { user_id: users.supplier.id }, update: {},
        create: { user_id: users.supplier.id, balance: 0 } });
    }, { timeout: 60000 });
    console.log(`${reset ? 'Reset' : 'Seed'} complete in pertamuda_test. 3 demo accounts, 3 demo batches. Credentials: backend/.pertamuda-credentials.json (ignored).`);
    console.log('QC remains unevaluated; identity verification, contact and payment integrations are not fabricated.');
  } finally { await prisma.$disconnect(); }
}

async function main() {
  if (action === 'seed' || action === 'reset') return seed(action === 'reset');
  const commands = {
    prepare: ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'],
    e2e: ['node_modules/jest/bin/jest.js', '--config', 'test/jest-e2e.json', '--runInBand'],
    'test-data': ['--test', 'scripts/pertamuda-fixtures.test.cjs'],
    start: ['node_modules/ts-node/dist/bin.js', 'src/main.ts'],
  };
  if (!commands[action]) throw new Error('Use prepare, seed, reset, e2e or start.');
  if (action === 'e2e') commands.e2e.push(...process.argv.slice(3));
  const child = spawnSync(process.execPath, commands[action], { cwd: root, env, stdio: 'inherit' });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
  if (action === 'prepare' && child.status === 0) {
    await require('./pertamuda-quality-migration.cjs').migrateQualityDemo();
  }
}

main().catch(error => {
  // Database errors may contain connection details; report bounded metadata only.
  console.error('Pertamuda command failed:', error.code || error.errorCode || error.name);
  if (!(error.name || '').startsWith('Prisma')) console.error(error.message);
  process.exitCode = 1;
});
