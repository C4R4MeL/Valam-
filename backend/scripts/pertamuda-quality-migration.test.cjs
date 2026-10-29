const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { additiveStatements } = require('./pertamuda-quality-migration.cjs');

test('reuses the full reviewed migration while allowing safe repeated preparation', () => {
  const source = fs.readFileSync(
    path.join(
      __dirname,
      '../prisma/migrations/20261027_quality_partnership/migration.sql',
    ),
    'utf8',
  );
  const statements = additiveStatements(source);
  assert.equal(
    statements.filter((sql) => sql.startsWith('CREATE TABLE IF NOT EXISTS'))
      .length,
    5,
  );
  assert.equal(
    statements.filter((sql) => sql.startsWith('DO $quality_migration$')).length,
    17,
  );
  assert.ok(
    statements.some((sql) =>
      /ADD COLUMN IF NOT EXISTS\s+"review_status"/.test(sql),
    ),
  );
  assert.ok(
    statements.some((sql) => sql.includes('ON CONFLICT (id) DO NOTHING')),
  );
  for (const sql of statements.filter((sql) =>
    sql.startsWith('DO $quality_migration$'),
  ))
    assert.ok(sql.includes('n.nspname = current_schema()'));
});
test('rejects destructive or unexpected SQL instead of accepting data loss', () => {
  for (const sql of [
    'DROP TABLE products;',
    'TRUNCATE users;',
    'DELETE FROM certificates;',
    "UPDATE products SET status = 'VERIFIED';",
  ])
    assert.throws(() => additiveStatements(sql), /Unsupported statement/);
});
