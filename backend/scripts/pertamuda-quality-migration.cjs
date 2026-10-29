const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const {
  testEnvironment,
  assertTestEnvironment,
  TEST_SCHEMA,
} = require('./pertamuda-env.cjs');

const migrationName = '20261027_quality_partnership';
const qualityTables = [
  'testing_partners',
  'testing_requests',
  'quality_files',
  'lab_reports',
  'quality_events',
];
const quote = (value) => `"${value.replaceAll('"', '""')}"`;

// The reviewed migration has no semicolons inside string literals. Reuse its SQL
// for both untouched demo schemas and schemas already prepared with db push.
function additiveStatements(source) {
  return source
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((sql) => sql.trim())
    .filter(Boolean)
    .map((sql) => {
      if (
        !/^(ALTER TABLE\s+"?\w+"?\s+ADD (CONSTRAINT|COLUMN)\b|CREATE TABLE\b|CREATE (UNIQUE )?INDEX\b|INSERT INTO testing_partners\b)/i.test(
          sql,
        )
      )
        throw Error('Unsupported statement in additive quality migration');
      const constraint = sql.match(
        /^ALTER TABLE\s+("?\w+"?)\s+ADD CONSTRAINT\s+("?\w+"?)\s/i,
      );
      if (constraint) {
        const table = constraint[1].replaceAll('"', '');
        const name = constraint[2].replaceAll('"', '');
        return `DO $quality_migration$ BEGIN IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = current_schema() AND t.relname = '${table}' AND c.conname = '${name}'
      ) THEN ${sql}; END IF; END $quality_migration$`;
      }
      return sql
        .replace(/^CREATE TABLE /i, 'CREATE TABLE IF NOT EXISTS ')
        .replace(/^CREATE UNIQUE INDEX /i, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
        .replace(/^CREATE INDEX /i, 'CREATE INDEX IF NOT EXISTS ')
        .replace(/ADD COLUMN\s+/i, 'ADD COLUMN IF NOT EXISTS ');
    });
}

async function rowCounts(tx, tables) {
  const counts = {};
  for (const table of tables) {
    const [row] = await tx.$queryRawUnsafe(
      `SELECT count(*)::text AS count FROM "pertamuda_test".${quote(table)}`,
    );
    counts[table] = row.count;
  }
  return counts;
}

async function migrateQualityDemo() {
  const env = testEnvironment();
  assertTestEnvironment(env);
  const prisma = new PrismaClient({ datasourceUrl: env.DIRECT_URL });
  const source = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      'prisma/migrations',
      migrationName,
      'migration.sql',
    ),
    'utf8',
  );
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const [schema] = await tx.$queryRaw`SELECT current_schema() AS name`;
        if (schema?.name !== TEST_SCHEMA)
          throw Error('Refusing migration outside pertamuda_test');
        await tx.$executeRawUnsafe('SET LOCAL search_path = "pertamuda_test"');
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(70657274617::bigint)`;
        const tables =
          await tx.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'`;
        const preservedTables = tables
          .map((row) => row.table_name)
          .filter((name) => !qualityTables.includes(name));
        const before = await rowCounts(tx, preservedTables);
        for (const sql of additiveStatements(source))
          await tx.$executeRawUnsafe(sql);
        const after = await rowCounts(tx, preservedTables);
        if (JSON.stringify(before) !== JSON.stringify(after))
          throw Error('Existing row counts changed; rolling back');
        return { preservedTables: preservedTables.length };
      },
      { timeout: 120000, maxWait: 15000 },
    );
    console.log(
      `Quality migration applied/verified only in pertamuda_test. Row counts preserved in ${result.preservedTables} existing tables. No reset or production migration.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module)
  migrateQualityDemo().catch((error) => {
    console.error('Demo quality migration failed:', error.code || error.name);
    if (!(error.name || '').startsWith('Prisma')) console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { additiveStatements, migrateQualityDemo };
