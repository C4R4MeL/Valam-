import { BiteshipService } from './biteship.service';

describe('Biteship webhook authentication', () => {
  const previous = {
    token: process.env.BITESHIP_WEBHOOK_TOKEN,
    env: process.env.BITESHIP_ENV,
    header: process.env.BITESHIP_WEBHOOK_SIGNATURE_KEY,
  };
  afterAll(() => {
    for (const [key, value] of Object.entries({
      BITESHIP_WEBHOOK_TOKEN: previous.token,
      BITESHIP_ENV: previous.env,
      BITESHIP_WEBHOOK_SIGNATURE_KEY: previous.header,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  it('rejects all webhook requests without a secret even in sandbox', () => {
    process.env.BITESHIP_ENV = 'sandbox';
    delete process.env.BITESHIP_WEBHOOK_TOKEN;
    expect(new BiteshipService().verifyWebhook({})).toBe(false);
  });
  it('requires the configured token and header', () => {
    process.env.BITESHIP_WEBHOOK_TOKEN = 'demo-webhook-test-secret';
    process.env.BITESHIP_WEBHOOK_SIGNATURE_KEY = 'x-biteship-signature';
    const service = new BiteshipService();
    expect(service.verifyWebhook({})).toBe(false);
    expect(service.verifyWebhook({ 'x-biteship-signature': 'invalid' })).toBe(
      false,
    );
    expect(
      service.verifyWebhook({
        'x-biteship-signature': 'demo-webhook-test-secret',
      }),
    ).toBe(true);
  });
});
