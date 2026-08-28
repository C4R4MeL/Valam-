import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

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
    expect(screen.getByText(/32.5%/i)).toBeInTheDocument();
    
    // Check if volume is displayed
    expect(screen.getByText(/500 kg/i)).toBeInTheDocument();
  });

  it('displays verified badge if status is VERIFIED', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Terverifikasi Lab')).toBeInTheDocument();
  });

  it('does not display verified badge if status is not VERIFIED', () => {
    const unverifiedProduct = { ...mockProduct, status: 'IN_LAB' };
    render(<ProductCard product={unverifiedProduct} />);
    expect(screen.queryByText('Terverifikasi Lab')).not.toBeInTheDocument();
  });
});
