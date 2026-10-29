// Review first: npm run db:audit. Explicit deployment: npm run db:release.
// Never resets the database or drops existing application/Supabase objects.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { PrismaClient, Prisma } = require('@prisma/client');
const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'prisma/migrations');
const baseline = '20260917_baseline';
const quote = value => `"${value.replaceAll('"', '""')}"`;

function connection(source, schema) {
  const url = new URL(source);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw Error('PostgreSQL required');
  if (url.searchParams.has('options')) throw Error('Remove custom search_path options before deployment');
  url.searchParams.set('schema', schema);
  url.searchParams.set('connection_limit', '2');
  url.searchParams.set('connect_timeout', '20');
  return url.toString();
}

function runPrisma(args, env) {
  const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...args], {
    cwd: root, env, encoding: 'utf8', timeout: 180000,
  });
  if (result.status !== 0) {
    const output = String(result.stderr || result.stdout || result.error?.message || '')
      .replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[database URL]');
    throw Error(`Prisma command failed: ${output}`);
  }
}

function normalize(value, schema) {
  return value == null ? null : String(value)
    .replaceAll(`${quote(schema)}.`, '').replaceAll(`${schema}.`, '')
    .replace(/\bnow\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/^(\d+)\.0+$/, '$1');
}

async function structure(db, schema, tables) {
  const columns = await db.$queryRawUnsafe(`
    SELECT c.table_name, c.column_name, c.is_nullable, c.udt_name,
      c.numeric_precision, c.numeric_scale, c.datetime_precision,
      c.character_maximum_length, c.column_default
    FROM information_schema.columns c WHERE c.table_schema = $1
    ORDER BY c.table_name, c.ordinal_position`, schema);
  const indexes = await db.$queryRawUnsafe(`
    SELECT tablename AS table_name, indexname AS name, indexdef AS definition
    FROM pg_indexes WHERE schemaname = $1 ORDER BY tablename, indexname`, schema);
  const constraints = await db.$queryRawUnsafe(`
    SELECT t.relname AS table_name, c.conname AS name, c.contype AS type,
      pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = $1 ORDER BY t.relname, c.conname`, schema);
  const enums = await db.$queryRawUnsafe(`
    SELECT t.typname AS name, e.enumlabel AS label FROM pg_type t
    JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
    WHERE n.nspname=$1 ORDER BY t.typname,e.enumsortorder`, schema);
  const security = await db.$queryRawUnsafe(`SELECT c.relname AS table_name, c.relrowsecurity AS enabled
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=$1 AND c.relkind='r'`, schema);
  const allowed = new Set(tables);
  return {
    columns: columns.filter(c => allowed.has(c.table_name)).map(c => ({ ...c, column_default: normalize(c.column_default, schema) })),
    indexes: indexes.filter(c => allowed.has(c.table_name)).map(c => ({ ...c, definition: normalize(c.definition, schema) })),
    constraints: constraints.filter(c => allowed.has(c.table_name)).map(c => ({ ...c, definition: normalize(c.definition, schema) })),
    enums,
    security: security.filter(c => allowed.has(c.table_name)),
  };
}

function differences(actual, expected, checkSecurity = true) {
  const diff = [];
  const actualColumns = new Map(actual.columns.map(c => [`${c.table_name}.${c.column_name}`, c]));
  for (const c of expected.columns) {
    const key = `${c.table_name}.${c.column_name}`, found = actualColumns.get(key);
    if (!found) diff.push({ kind: 'missing_column', key });
    else if (JSON.stringify(found) !== JSON.stringify(c)) diff.push({ kind: 'column_definition', key, actual: found, expected: c });
  }
  for (const kind of ['indexes', 'constraints']) {
    for (const item of expected[kind]) {
      if (!actual[kind].some(a => a.table_name === item.table_name && a.definition === item.definition))
        diff.push({ kind: `missing_${kind}`, key: `${item.table_name}.${item.name}`, definition: item.definition });
    }
  }
  for (const e of expected.enums) {
    if (!actual.enums.some(a => a.name === e.name && a.label === e.label)) diff.push({ kind: 'missing_enum', key: `${e.name}.${e.label}` });
  }
  if (checkSecurity) for (const s of expected.security.filter(s => s.enabled)) {
    if (!actual.security.some(a => a.table_name === s.table_name && a.enabled)) diff.push({ kind: 'missing_rls', key: s.table_name });
  }
  return diff;
}

async function fingerprints(db, schema, columns) {
  const grouped = new Map();
  for (const c of columns) {
    if (!grouped.has(c.table_name)) grouped.set(c.table_name, []);
    grouped.get(c.table_name).push(quote(c.column_name));
  }
  const result = {};
  for (const [table, fields] of grouped) {
    const [row] = await db.$queryRawUnsafe(`SELECT count(*)::text AS rows,
      md5(COALESCE(string_agg(digest, '' ORDER BY digest), '')) AS digest
      FROM (SELECT md5(row_to_json(original)::text) AS digest
        FROM (SELECT ${fields.join(',')} FROM ${quote(schema)}.${quote(table)}) original) records`);
    result[table] = row;
  }
  return result;
}

async function main() {
  const file = path.join(root, '.env');
  const source = { ...(fs.existsSync(file) ? require('dotenv').parse(fs.readFileSync(file)) : {}), ...process.env };
  const raw = source.DIRECT_URL || source.DATABASE_URL;
  if (!raw) throw Error('DIRECT_URL or DATABASE_URL required');
  const configuredSchema = new URL(raw).searchParams.get('schema') || 'public';
  if (configuredSchema !== 'public') throw Error('Release target must be the explicitly configured public schema');
  const apply = process.argv.includes('--apply');
  const shadow = `valam_release_check_${crypto.randomBytes(6).toString('hex')}`;
  const url = connection(raw, 'public'), shadowUrl = connection(raw, shadow);
  const env = { ...source, DATABASE_URL: url, DIRECT_URL: url };
  const db = new PrismaClient({ datasourceUrl: url });
  const names = fs.readdirSync(migrationsDir).filter(n => fs.existsSync(path.join(migrationsDir, n, 'migration.sql'))).sort();
  const tables = Prisma.dmmf.datamodel.models.map(m => m.dbName || m.name);
  const report = { target: 'public', mode: apply ? 'apply' : 'audit', migrations: names };
  try {
    // A disposable, randomly named schema verifies the complete migration chain.
    runPrisma(['migrate', 'deploy'], { ...env, DATABASE_URL: shadowUrl, DIRECT_URL: shadowUrl });
    const expected = await structure(db, shadow, tables);
    const desired = new Map(Prisma.dmmf.datamodel.models.map(m => [m.dbName || m.name, m.fields.filter(f => f.kind !== 'object').map(f => f.dbName || f.name)]));
    const missingFromChain = [...desired].flatMap(([table, fields]) => fields.filter(f => !expected.columns.some(c => c.table_name === table && c.column_name === f)).map(f => `${table}.${f}`));
    if (missingFromChain.length) throw Error(`Migration chain incomplete: ${missingFromChain.join(', ')}`);
    // Also compare the deployed chain to a fresh schema made from schema.prisma.
    const modelSchema = `${shadow}_model`, modelUrl = connection(raw, modelSchema);
    try {
      runPrisma(['db', 'push', '--skip-generate'], { ...env, DATABASE_URL: modelUrl, DIRECT_URL: modelUrl });
      const model = await structure(db, modelSchema, tables);
      const chainDrift = differences(expected, model, false);
      if (chainDrift.length) throw Error(`Migration chain differs from Prisma: ${JSON.stringify(chainDrift)}`);
    } finally {
      if (!/^valam_release_check_[a-f0-9]{12}_model$/.test(modelSchema)) throw Error('Unsafe cleanup target');
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${quote(modelSchema)} CASCADE`);
    }
    const before = await structure(db, 'public', tables);
    report.before = differences(before, expected);
    const historyExists = await db.$queryRawUnsafe(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='_prisma_migrations'`);
    const history = historyExists.length ? await db.$queryRawUnsafe('SELECT migration_name, checksum, finished_at, rolled_back_at FROM public._prisma_migrations') : [];
    for (const h of history) {
      if (!h.finished_at && !h.rolled_back_at) throw Error(`Unresolved failed migration: ${h.migration_name}`);
      if (h.finished_at && !h.rolled_back_at) {
        const migrationFile = path.join(migrationsDir, h.migration_name, 'migration.sql');
        if (!fs.existsSync(migrationFile) || crypto.createHash('sha256').update(fs.readFileSync(migrationFile)).digest('hex') !== h.checksum)
          throw Error(`Migration checksum differs: ${h.migration_name}`);
      }
    }
    if (apply && report.before.length) {
      const applied = new Set(history.filter(h => h.finished_at && !h.rolled_back_at).map(h => h.migration_name));
      if (applied.size === 0 && before.columns.length === 0) throw Error('Empty public schema: use migrate deploy for a new installation');
      const pending = names.filter(n => n !== baseline && !applied.has(n));
      report.appliedNow = pending;
      await db.$transaction(async tx => {
        await tx.$executeRawUnsafe('SET LOCAL search_path = public');
        await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'UTC'");
        await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '15s'");
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(70657274618::bigint)');
        const oldTables = [...new Set(before.columns.map(c => c.table_name))];
        if (oldTables.length) await tx.$executeRawUnsafe(`LOCK TABLE ${oldTables.map(t => `public.${quote(t)}`).join(',')} IN SHARE ROW EXCLUSIVE MODE`);
        const original = await fingerprints(tx, 'public', before.columns);
        for (const name of pending) {
          const sql = fs.readFileSync(path.join(migrationsDir, name, 'migration.sql'), 'utf8');
          if (/\b(DROP\s+(TABLE|SCHEMA|COLUMN|TYPE)|TRUNCATE|DELETE\s+FROM)\b/i.test(sql.replace(/^--.*$/gm, '')))
            throw Error(`Destructive SQL rejected: ${name}`);
          for (const statement of sql.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean))
            await tx.$executeRawUnsafe(statement);
        }
        const after = await structure(tx, 'public', tables);
        const drift = differences(after, expected);
        if (drift.length) throw Error(`Schema still differs; rolling back: ${JSON.stringify(drift)}`);
        const preserved = await fingerprints(tx, 'public', before.columns);
        if (JSON.stringify(original) !== JSON.stringify(preserved)) throw Error('Existing data changed; rolling back');
        report.preserved = preserved;
      }, { timeout: 180000, maxWait: 15000 });
    }
    report.after = differences(await structure(db, 'public', tables), expected);
    if (apply && report.after.length === 0) {
      const applied = new Set(history.filter(h => h.finished_at && !h.rolled_back_at).map(h => h.migration_name));
      for (const name of names) if (!applied.has(name)) runPrisma(['migrate', 'resolve', '--applied', name], env);
      await db.$executeRawUnsafe('ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY');
      runPrisma(['migrate', 'status'], env);
      report.migrationHistoryVerified = true;
    }
    const output = path.join(root, '../artifacts/main-supabase-release.json');
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (!/^valam_release_check_[a-f0-9]{12}$/.test(shadow)) throw Error('Unsafe cleanup target');
    await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${quote(shadow)} CASCADE`);
    await db.$disconnect();
  }
}

main().catch(error => {
  // Prisma errors can contain connection strings: print only sanitized diagnostics.
  console.error(String(error.message || error.name).replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[database URL]'));
  process.exitCode = 1;
});
