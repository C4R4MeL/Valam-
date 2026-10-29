import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/[locale]/(auth)/login/page';

const mockLogin = jest.fn();
const mockToast = jest.fn();
jest.mock('@/i18n/routing', () => ({
  Link: ({ children, href }: React.ComponentProps<'a'>) => <a href={href}>{children}</a>,
}));
jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/components/providers/AuthProvider', () => ({ useAuthContext: () => ({ login: mockLogin }) }));

it('cannot log in or infer an admin role when the login API is unavailable', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network unavailable'));
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText('Email Perusahaan'), { target: { value: 'admin@demo.test' } });
  fireEvent.change(screen.getByLabelText('Kata Sandi'), { target: { value: 'admin' } });
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }));
  await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Login Gagal', variant: 'destructive' })));
  expect(mockLogin).not.toHaveBeenCalled();
});
