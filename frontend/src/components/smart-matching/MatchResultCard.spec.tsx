import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchResultCard } from './MatchResultCard';

jest.mock('@/i18n/routing', () => ({ Link: ({ children, href }: React.ComponentProps<'a'>) => <a href={href}>{children}</a> }));

it('labels an alternative and its gaps without giving it a best-match badge or invented QC values', () => {
  render(<MatchResultCard product={{ id: 'batch-2', batch_code: 'DEMO-BATCH-2', supplier_id: 'supplier-2', supplier_name: 'DEMONSTRASI',
    available_volume_kg: 10, pa_percentage: null, moisture: null, price_per_kg: 100, match_score: null,
    is_eligible: false, met_requirements: ['Harga dalam anggaran'], unmet_requirements: ['Stok tidak mencukupi'], explanation: 'Mutu belum dievaluasi' }}
    idx={0} locale="id" checked={false} onCompareToggle={jest.fn()} onRfqClick={jest.fn()} isAuthenticated={true} role="buyer"
    criteria={{ volume_kg: 100, min_pa: 30, max_budget: 100, max_moisture: 3 }}
    translations={{ matchScore: 'Skor relatif', stock: 'Stok', pa: 'PA', moisture: 'Air', priceLabel: 'Penawaran', btnDetail: 'Detail', btnRfq: 'RFQ', bestMatch: 'HASIL TERBAIK' }} />);
  expect(screen.getByText(/Alternatif dengan syarat/)).toBeInTheDocument();
  expect(screen.getByText(/Stok tidak mencukupi/)).toBeInTheDocument();
  expect(screen.queryByText('HASIL TERBAIK')).not.toBeInTheDocument();
  expect(screen.getAllByText('Belum tersedia')).toHaveLength(2);
});
