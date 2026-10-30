import { render, screen } from '@testing-library/react';
import { MarketOverview } from './MarketOverview';
import { InsightsSidebar } from './InsightsSidebar';
import { PriceSection } from '@/components/landing/PriceSection';
import { InsightsTeaser } from '@/components/landing/InsightsTeaser';
import { MarketPriceWidget } from '@/app/[locale]/insights/components/MarketPriceWidget';
import { Footer } from '@/components/layout/Footer';
import { useMarketPrices } from '@/hooks/useMarketPrices';

jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
jest.mock('@/hooks/useMarketPrices', () => ({ useMarketPrices: jest.fn() }));
jest.mock('@/lib/valam-insights/insights-api', () => ({ getMarketPriceHistory: async () => [] }));
jest.mock('@/lib/supabase/client', () => ({ createClient: () => ({ rpc: async () => ({ data: null }) }) }));
jest.mock('@/i18n/routing', () => ({
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
  usePathname: () => '/', useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('framer-motion', () => ({ motion: { div: ({ children, initial, whileInView, viewport, transition, ...props }: any) => <div {...props}>{children}</div> } }));

const read = jest.mocked(useMarketPrices);
const live = (amount: number) => ({
  prices: [{ id: 'source', grade: 'A' as const, price_per_kg: amount, currency: 'IDR', updated_at: '2026-10-30T03:00:00Z', updated_by: null }],
  loading: false, fromLive: true, error: null,
});

describe.each([
  ['overview', () => <MarketOverview locale="id" />],
  ['hero overview', () => <MarketOverview locale="id" variant="hero" />],
  ['sidebar', () => <InsightsSidebar locale="id" popularArticles={[]} />],
  ['price table', () => <PriceSection />],
  ['landing teaser', () => <InsightsTeaser />],
  ['price widget', () => <MarketPriceWidget locale="id" />],
  ['footer', () => <Footer />],
] as const)('%s', (_name, component) => {
  it('displays changed source prices and handles unavailable data without invented prices', () => {
    read.mockReturnValue(live(923456));
    const view = render(component());
    expect(screen.getByText(/923.456/)).toBeInTheDocument();
    read.mockReturnValue(live(987654));
    view.rerender(component());
    expect(screen.getByText(/987.654/)).toBeInTheDocument();
    expect(screen.queryByText(/923.456/)).not.toBeInTheDocument();
    read.mockReturnValue({ prices: [], loading: false, fromLive: false, error: 'offline' });
    view.rerender(component());
    expect(screen.queryByText(/987.654/)).not.toBeInTheDocument();
    expect(screen.queryByText(/450.000|850.000|850k|780k|680k/)).not.toBeInTheDocument();
  });
});
