const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertTestEnvironment } = require('./pertamuda-env.cjs');
const valid = () => ({ NODE_ENV: 'test', PERTAMUDA_TEST_MODE: 'true',
  DATABASE_URL: 'postgresql://test:dummy@localhost/test?schema=pertamuda_test',
  DIRECT_URL: 'postgresql://test:dummy@localhost/test?schema=pertamuda_test',
  MIDTRANS_IS_PRODUCTION: 'false', BITESHIP_ENV: 'sandbox' });

test('accepts only an explicit isolated test target', () => assert.doesNotThrow(() => assertTestEnvironment(valid())));
for (const [key, value] of [
  ['NODE_ENV', 'production'], ['PERTAMUDA_TEST_MODE', 'false'],
  ['DATABASE_URL', 'postgresql://test:dummy@localhost/test'],
  ['DIRECT_URL', 'postgresql://test:dummy@localhost/test?schema=public'],
  ['DATABASE_URL', 'postgresql://test:dummy@localhost/test?schema=pertamuda_test&schema=public'],
  ['DIRECT_URL', 'postgresql://test:dummy@localhost/test?schema=pertamuda_test&options=-csearch_path%3Dpublic'],
  ['MIDTRANS_IS_PRODUCTION', 'true'], ['BITESHIP_ENV', 'production'],
]) test(`rejects unsafe ${key} configuration: ${value}`, () => assert.throws(() => assertTestEnvironment({ ...valid(), [key]: value })));

test('derived runner uses isolated session connection, a bounded race-capable pool and disabled integrations', () => {
  const { testEnvironment } = require('./pertamuda-env.cjs');
  const source = { DATABASE_URL: 'postgresql://test:dummy@localhost:6543/test?pgbouncer=true',
    DIRECT_URL: 'postgresql://test:dummy@localhost:5432/test?options=-csearch_path%3Dpublic',
    MIDTRANS_SERVER_KEY: 'source-not-used', GROK_API_KEY: 'source-not-used' };
  const env = testEnvironment(source);
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const url = new URL(env[key]);
    assert.equal(url.port, '5432');
    assert.equal(url.searchParams.get('schema'), 'pertamuda_test');
    assert.equal(url.searchParams.get('connection_limit'), '3');
    assert.equal(url.searchParams.has('options'), false);
  }
  assert.equal(env.MIDTRANS_SERVER_KEY, '');
  assert.equal(env.GROK_API_KEY, '');
  assert.equal(env.JWT_SECRET.length >= 32, true);
  assert.equal(source.DIRECT_URL.includes('schema='), false, 'source config is unchanged');
});
