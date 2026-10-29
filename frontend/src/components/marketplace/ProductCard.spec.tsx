import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

// Isolate app routing and providers; render the real card with deterministic context.
jest.mock('@/i18n/routing', () => ({
  Link: ({ children, href, className }: React.ComponentProps<'a'>) =>
    <a href={href} className={className}>{children}</a>,
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
jest.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({ isAuthenticated: false }),
}));

describe('ProductCard component', () => {
  const mockProduct = {
    id: 'prod-123',
    batch_code: 'BATCH-001',
    supplier_name: 'PT. Nilam Sejahtera',
    status: 'VERIFIED',
    origin_district: 'Aceh Jaya',
    pa_percentage: 32.5,
    moisture: 1.2,
    available_volume_kg: 500,
    price_per_kg: 850000,
    images: ['/test-image.jpg']
  };

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    // Check if supplier name is rendered
    expect(screen.getByText('PT. Nilam Sejahtera')).toBeInTheDocument();
    
    // Check if location is rendered
    expect(screen.getByText(/Aceh Jaya/i)).toBeInTheDocument();
    
    // Check if PA percentage is displayed
    expect(screen.getByText('32.5')).toHaveTextContent('32.5%');
    
    // Check if volume is displayed
    expect(screen.getByText(/500 kg/i)).toBeInTheDocument();
  });

  it('displays verified badge only with explicit lab verification', () => {
    render(<ProductCard product={{ ...mockProduct, lab_verified: true }} />);
    expect(screen.getByText('Laporan uji diperiksa')).toBeInTheDocument();
  });

  it('does not interpret catalogue publication status as lab verification', () => {
    const unverifiedProduct = { ...mockProduct, status: 'VERIFIED' };
    render(<ProductCard product={unverifiedProduct} />);
    expect(screen.queryByText('Laporan uji diperiksa')).not.toBeInTheDocument();
  });
});
