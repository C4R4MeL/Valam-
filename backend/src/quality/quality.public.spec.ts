import { publicQuality } from './quality.public';
describe('Public result units and missing source data', () => {
  const record = (unit?: string) => ({
    is_demo: false,
    lab_reports: [
      {
        issuer_snapshot: { name: 'TEST FIXTURE' },
        parameters: [{ name: 'Moisture', value: '0', unit }],
      },
    ],
  });
  it('preserves measured zero percent', () => {
    expect(publicQuality(record('%')).moisture).toBe(0);
  });
  it('does not reinterpret other or missing units as percentages', () => {
    expect(publicQuality(record('mg/kg')).moisture).toBeNull();
    expect(publicQuality(record()).moisture).toBeNull();
  });
  it('does not expose legacy or demonstration values as reviewed measurements', () => {
    expect(
      publicQuality({ is_demo: false, qc_result: { moisture: 1 } }),
    ).toMatchObject({
      moisture: null,
      lab_verified: false,
      document_review_status: 'NEEDS_REVIEW',
    });
    expect(publicQuality({ ...record('%'), is_demo: true })).toMatchObject({
      moisture: null,
      lab_verified: false,
    });
  });
});
