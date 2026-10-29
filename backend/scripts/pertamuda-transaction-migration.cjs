const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { testEnvironment, assertTestEnvironment } = require('./pertamuda-env.cjs');

async function main() {
  const env = testEnvironment();
  assertTestEnvironment(env);
  const prisma = new PrismaClient({ datasourceUrl: env.DIRECT_URL });
  try {
    const schema = await prisma.$queryRaw`SELECT current_schema() AS name`;
    if (schema[0]?.name !== 'pertamuda_test') throw new Error('Unexpected schema');
    // Reviewed additive SQL only. A duplicate unique reference makes the transaction
    // fail and roll back; this never accepts data loss or deletes financial rows.
    const migration = process.argv[2] === 'rfq' ? '20261025_rfq_agreement' : '20261025_transaction_integrity';
    const source = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'migrations', migration, 'migration.sql'), 'utf8');
    const statements = source.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
    await prisma.$transaction(async tx => {
      for (const sql of statements) await tx.$executeRawUnsafe(sql);
    }, { timeout: 30000 });
    console.log('Additive transaction migration applied only to pertamuda_test.');
  } finally { await prisma.$disconnect(); }
}
main().catch(error => { console.error('Test migration failed:', error.code || error.name); process.exitCode = 1; });
