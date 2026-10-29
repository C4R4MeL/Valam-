const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dotenv = require('dotenv');

const TEST_SCHEMA = 'pertamuda_test';

function assertTestEnvironment(env) {
  if (env.NODE_ENV !== 'test' || env.PERTAMUDA_TEST_MODE !== 'true') {
    throw new Error('Pertamuda tools require an explicit test environment.');
  }
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const url = new URL(env[key]);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        url.searchParams.getAll('schema').length !== 1 ||
        url.searchParams.get('schema') !== TEST_SCHEMA ||
        url.searchParams.has('options')) {
      throw new Error(`${key} must target only the isolated pertamuda_test schema.`);
    }
  }
  if (env.MIDTRANS_IS_PRODUCTION !== 'false' || env.BITESHIP_ENV !== 'sandbox') {
    throw new Error('Production integrations are forbidden in Pertamuda tools.');
  }
}

function testEnvironment(source = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', '.env')))) {
  // Never rewrite .env. Retain credentials only in the child process environment.
  const env = { ...process.env, ...source };
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const url = new URL(source.DIRECT_URL || source.DATABASE_URL);
    url.searchParams.set('schema', TEST_SCHEMA);
    url.searchParams.set('connect_timeout', '10');
    // Persistent integration scenarios use the supplied session/direct connection.
    // Keep the shared remote database footprint bounded, including race tests.
    url.searchParams.set('connection_limit', '3');
    url.searchParams.set('pool_timeout', '10');
    url.searchParams.delete('options');
    env[key] = url.toString();
  }
  Object.assign(env, {
    NODE_ENV: 'test', PERTAMUDA_TEST_MODE: 'true',
    MIDTRANS_IS_PRODUCTION: 'false', BITESHIP_ENV: 'sandbox',
    // No gateway, shipping or LLM requests from database tooling or automated tests.
    MIDTRANS_SERVER_KEY: '', MIDTRANS_CLIENT_KEY: '', BITESHIP_API_KEY: '',
    GROK_API_KEY: '', SUPABASE_URL: 'http://127.0.0.1:54321',
    SUPABASE_KEY: 'pertamuda-local-test-only',
    JWT_SECRET: process.env.PERTAMUDA_JWT_SECRET || crypto.randomBytes(48).toString('hex'),
  });
  assertTestEnvironment(env);
  return env;
}

module.exports = { TEST_SCHEMA, assertTestEnvironment, testEnvironment };
