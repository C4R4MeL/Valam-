import { mergeMarketPrices } from './market-grades';

it('does not invent prices or update timestamps when source data is absent', () => {
  expect(mergeMarketPrices([])).toEqual([]);
  expect(mergeMarketPrices(null)).toEqual([]);
});

it('keeps the source date and ignores invalid prices without filling missing grades', () => {
  const rows = mergeMarketPrices([
    { id: 'a', grade: 'A', price_per_kg: 123, currency: 'IDR', updated_at: '2026-09-01' },
    { id: 'b', grade: 'B', price_per_kg: 0, currency: 'IDR', updated_at: '' },
  ]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ price_per_kg: 123, updated_at: '2026-09-01' });
});

it('leaves an absent source date empty rather than setting today', () => {
  expect(mergeMarketPrices([{ id: 'a', grade: 'A', price_per_kg: 123, currency: 'IDR', updated_at: '' }])[0].updated_at).toBe('');
});
