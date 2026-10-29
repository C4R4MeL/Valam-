import { sampleRequestUrl, whatsappNumber } from './supplier-contact';

it('does not use a placeholder contact when supplier contact is absent or invalid', () => {
  expect(whatsappNumber(null)).toBeNull();
  expect(sampleRequestUrl('', 'DEMO-BATCH', 'https://example.test/batch')).toBeNull();
  expect(whatsappNumber('not-a-phone')).toBeNull();
});

it('links the actual normalized supplier contact and exact batch source in the sample request', () => {
  const url = new URL(sampleRequestUrl('+62 811 222 333', 'DEMO-BATCH-002', 'https://example.test/id/katalog/real-batch-id')!);
  expect(url.pathname).toBe('/62811222333');
  expect(url.searchParams.get('text')).toContain('DEMO-BATCH-002');
  expect(url.searchParams.get('text')).toContain('https://example.test/id/katalog/real-batch-id');
});
