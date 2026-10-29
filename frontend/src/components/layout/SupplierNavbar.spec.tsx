import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Navbar } from './Navbar';
import SupplierLayout from '@/app/[locale]/dashboard/supplier/layout';

let mockRole: string | null = 'supplier';
let mockLocale = 'id';
const mockReplace = jest.fn();
const mockLogout = jest.fn();
jest.mock('@/i18n/routing', () => ({
  usePathname: () => '/dashboard/supplier/inventory',
  useRouter: () => ({ replace: mockReplace, prefetch: jest.fn() }),
  Link: ({ children, prefetch, onPointerDown, ...props }: React.ComponentProps<'a'> & { prefetch?: boolean }) => <a {...props}>{children}</a>,
}));
jest.mock('next-intl', () => ({ useLocale: () => mockLocale, useTranslations: () => (key: string) => key }));
jest.mock('@/components/providers/AuthProvider', () => ({ useAuthContext: () => ({ role: mockRole, email: 'supplier@navigation.test', logout: mockLogout, isAuthenticated: !!mockRole }) }));
jest.mock('@/components/providers/CartProvider', () => ({ useCart: () => ({ totalItems: 0 }) }));
jest.mock('@/components/layout/useFastNav', () => ({ useFastNav: () => ({ onNavClick: jest.fn(), onNavPointerDown: jest.fn() }) }));
jest.mock('@/components/auth/RouteGuard', () => ({ RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
// Keep dropdown contents inspectable; menu primitives have their own library behavior.
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuItem: ({ children, onClick, asChild }: any) => asChild ? children : <button onClick={onClick}>{children}</button>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

beforeEach(() => { mockRole = 'supplier'; mockLocale = 'id'; mockReplace.mockClear(); localStorage.clear(); });

it.each([['id', 'Dashboard Supplier', 'Navigasi utama pemasok'], ['en', 'Supplier Dashboard', 'Supplier main navigation']])('shows a static supplier dashboard label in both responsive headers in %s', (locale, label, navigation) => {
  mockLocale = locale;
  render(<Navbar />);
  expect(screen.getAllByRole('banner')).toHaveLength(2);
  const nav = screen.getByRole('navigation', { name: navigation });
  expect(within(nav).queryByRole('link')).not.toBeInTheDocument();
  expect(within(nav).queryByRole('button')).not.toBeInTheDocument();
  expect(within(nav).getByText(label)).toBeInTheDocument();
  const labels = screen.getAllByText(label);
  expect(labels).toHaveLength(2);
  for (const element of labels) {
    expect(element.closest('a, button, [role="button"], [tabindex]')).toBeNull();
    fireEvent.click(element);
  }
  expect(mockReplace).not.toHaveBeenCalled();
  expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
  for (const path of ['/marketplace', '/matching', '/chat', '/insights', '/cart', '/profile']) expect(document.querySelector(`a[href="${path}"]`)).toBeNull();
  expect(screen.getByRole('button', { name: locale === 'id' ? 'Menu akun pemasok' : 'Supplier account menu' })).toBeInTheDocument();
});

it('keeps locale switching on the current supplier page', () => {
  render(<Navbar />);
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(mockReplace).toHaveBeenCalledWith('/dashboard/supplier/inventory', { locale: 'en' });
});

it('keeps supplier feature and profile links in the sidebar and its mobile equivalent', () => {
  render(<SupplierLayout><p>Supplier content</p></SupplierLayout>);
  for (const navigation of ['Menu pemasok', 'Menu pemasok seluler']) {
    const nav = screen.getByRole('navigation', { name: navigation });
    expect(within(nav).getByRole('link', { name: 'Inventori' })).toHaveAttribute('href', '/dashboard/supplier/inventory');
    expect(within(nav).getByRole('link', { name: 'Pengaturan Profil' })).toHaveAttribute('href', '/dashboard/supplier/settings');
    expect(within(nav).getByRole('link', { name: 'Pengujian & Hasil' })).toBeInTheDocument();
  }
  expect(screen.getByRole('navigation', { name: 'Navigasi utama pemasok' })).toBeInTheDocument();
});

it('preserves catalogue and matching navigation for buyers', () => {
  mockRole = 'buyer';
  render(<Navbar />);
  expect(screen.getAllByRole('link', { name: 'Katalog' }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole('link', { name: 'SmartMatching' }).length).toBeGreaterThan(0);
  expect(screen.queryByRole('navigation', { name: 'Navigasi utama pemasok' })).not.toBeInTheDocument();
});
