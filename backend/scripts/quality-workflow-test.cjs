// Creates a NEW isolated schema. Never resets or migrates public/production tables.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '..');
const source = dotenv.parse(fs.readFileSync(path.join(root, '.env')));
const schema = `quality_workflow_test_${crypto.randomBytes(6).toString('hex')}`;
const env = {
  ...process.env,
  ...source,
  NODE_ENV: 'test',
  QUALITY_TEST_SCHEMA: schema,
  JWT_SECRET: crypto.randomBytes(48).toString('hex'),
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_KEY: '',
  MIDTRANS_SERVER_KEY: '',
  BITESHIP_API_KEY: '',
  GROK_API_KEY: '',
  PUBLIC_APP_URL: 'https://quality.example.test',
};
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(source.DIRECT_URL || source.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw Error('PostgreSQL connection required');
  url.searchParams.set('schema', schema);
  url.searchParams.set('connection_limit', '3');
  url.searchParams.set('connect_timeout', '15');
  url.searchParams.delete('options');
  env[key] = url.toString();
}
const run = (script, args) => {
  const result = spawnSync(
    process.execPath,
    [require.resolve(script), ...args],
    {
      cwd: root,
      env,
      encoding: 'utf8',
      timeout: process.argv.includes('--preview') ? 900000 : 240000,
    },
  );
  const redact = (text) =>
    String(text || '')
      .replaceAll(env.DATABASE_URL, '[isolated database]')
      .replaceAll(env.DIRECT_URL, '[isolated database]')
      .replace(/postgres(?:ql)?:\/\/\S+/g, '[database URL]');
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`Command failed (${result.status})`);
};
const tempDir = path.join(root, 'prisma', schema);
fs.mkdirSync(tempDir);
const current = fs.readFileSync(
  path.join(root, 'prisma/schema.prisma'),
  'utf8',
);
let before = current
  .replace(/^\s*quality_requests TestingRequest\[\]\r?\n/m, '')
  .replace(/^\s*testing_requests\s+TestingRequest\[\]\r?\n/m, '')
  .replace(/^\s*lab_reports\s+LabReport\[\]\r?\n/m, '')
  .replace(/^\s*quality_files\s+QualityFile\[\]\r?\n/m, '')
  .replace(/^\s*review_status\s+String\s+@default\("NEEDS_REVIEW"\)\r?\n/m, '');
before =
  before.slice(0, before.indexOf('\nmodel TestingPartner {')) +
  before.slice(before.indexOf('\nmodel TraceLog {'));
const baseline = path.join(tempDir, 'before.prisma');
fs.writeFileSync(baseline, before);
const legacySql = path.join(tempDir, 'legacy.sql');
fs.writeFileSync(
  legacySql,
  `
INSERT INTO roles (id,name) VALUES ('00000000-0000-4000-8000-000000000001','migration-fixture');
INSERT INTO users (id,email,role_id,password,updated_at) VALUES ('00000000-0000-4000-8000-000000000002','legacy@quality.test','00000000-0000-4000-8000-000000000001','not-a-login',now());
INSERT INTO products (id,supplier_id,batch_code,total_volume_kg,available_volume_kg,price_per_kg,updated_at) VALUES ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','LEGACY-QUALITY-FIXTURE',1,1,1,now());
INSERT INTO qc_results (id,product_id,admin_id,overall_status) VALUES ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','pass');
INSERT INTO certificates (id,product_id,qc_result_id,certificate_number,admin_name) VALUES ('00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004','LEGACY-UNPROVEN','Unproven legacy signer');
`,
);
console.log(`Isolated test schema: ${schema}`);
try {
  run('prisma/build/index.js', [
    'db',
    'push',
    '--schema',
    baseline,
    '--skip-generate',
  ]);
  run('prisma/build/index.js', [
    'db',
    'execute',
    '--file',
    legacySql,
    '--schema',
    baseline,
  ]);
  run('prisma/build/index.js', [
    'db',
    'execute',
    '--file',
    'prisma/migrations/20261027_quality_partnership/migration.sql',
    '--schema',
    'prisma/schema.prisma',
  ]);
  run('jest/bin/jest', [
    '--config',
    'test/jest-e2e.json',
    '--runInBand',
    '--testRegex',
    'quality-workflow.integration-spec.ts$',
  ]);
  if (process.argv.includes('--preview'))
    run(path.join(root, 'scripts/quality-preview.cjs'), []);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Only the freshly generated schema is eligible for cleanup.
  if (!/^quality_workflow_test_[a-f0-9]{12}$/.test(schema))
    throw Error('Unsafe cleanup target');
  const cleanup = path.join(tempDir, 'cleanup.sql');
  fs.writeFileSync(cleanup, `DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
  try {
    run('prisma/build/index.js', [
      'db',
      'execute',
      '--file',
      cleanup,
      '--schema',
      'prisma/schema.prisma',
    ]);
  } catch {
    console.error(`Cleanup incomplete for ${schema}`);
    process.exitCode = 1;
  }
  for (const file of [baseline, legacySql, cleanup]) fs.unlinkSync(file);
  fs.rmdirSync(tempDir);
}
