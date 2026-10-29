const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('node:fs');
const path = require('node:path');
const { assertTestEnvironment } = require('./pertamuda-env.cjs');

test('seed is idempotent; reset restores only isolated test fixtures', { timeout: 120000 }, async () => {
  assertTestEnvironment(process.env);
  const prisma = new PrismaClient();
  const run = action => {
    const result = spawnSync(process.execPath, ['scripts/pertamuda.cjs', action], {
      cwd: path.join(__dirname, '..'), env: process.env, encoding: 'utf8',
    });
    assert.equal(result.status, 0, `Demo ${action} must succeed`);
  };
  try {
    const schema = await prisma.$queryRaw`SELECT current_schema() AS name`;
    assert.equal(schema[0].name, 'pertamuda_test');
    run('seed');
    const before = { users: await prisma.user.count(), products: await prisma.product.count() };
    run('seed');
    assert.deepEqual({ users: await prisma.user.count(), products: await prisma.product.count() }, before);
    const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.pertamuda-credentials.json')));
    for (const role of ['buyer', 'supplier', 'admin']) {
      const user = await prisma.user.findUnique({ where: { email: credentials[role].email }, include: { role: true, profile: true } });
      assert.equal(user.role.name, role);
      assert.equal(user.status, 'active');
      assert.equal(await bcrypt.compare(credentials[role].password, user.password), true);
      assert.match(user.profile.company_name, /DEMONSTRASI/);
    }
    await prisma.product.update({ where: { batch_code: 'DEMO-PERTAMUDA-001' }, data: { available_volume_kg: 490 } });
    run('seed');
    assert.equal((await prisma.product.findUnique({ where: { batch_code: 'DEMO-PERTAMUDA-001' } })).available_volume_kg, 490,
      'Rerunning seed must not restore stock in an ongoing demo');
    run('reset');
    const batch = await prisma.product.findUnique({ where: { batch_code: 'DEMO-PERTAMUDA-001' }, include: { qc_result: true, certificate: true } });
    assert.equal(batch.available_volume_kg, 500);
    assert.equal(batch.moq_kg, 10);
    assert.equal(batch.price_per_kg, 850000);
    assert.equal(batch.status, 'DRAFT');
    assert.equal(batch.qc_result, null);
    assert.equal(batch.certificate, null);
    assert.equal(await prisma.user.count(), 3);
    assert.equal(await prisma.product.count(), 3);
    assert.equal(await prisma.order.count(), 0);
    assert.equal(Number((await prisma.wallet.findFirst()).balance), 0);
  } finally { await prisma.$disconnect(); }
});
