import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from './AuthProvider';

function Session() {
  const { isAuthenticated, logout } = useAuthContext();
  return <><span>{isAuthenticated ? 'signed-in' : 'signed-out'}</span><button onClick={logout}>Logout</button></>;
}
const token = (expiry: number) => `test.${btoa(JSON.stringify({ exp: expiry }))}.test`;

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
});

it('clears expired sessions on hydration', async () => {
  localStorage.setItem('valam_token', token(Date.now() / 1000 - 10));
  render(<AuthProvider><Session /></AuthProvider>);
  expect(await screen.findByText('signed-out')).toBeInTheDocument();
  expect(localStorage.getItem('valam_token')).toBeNull();
});

it('clears auth locally and requests server revocation on logout', async () => {
  const jwt = token(Date.now() / 1000 + 3600);
  localStorage.setItem('valam_token', jwt);
  localStorage.setItem('valam_role', 'buyer');
  render(<AuthProvider><Session /></AuthProvider>);
  expect(await screen.findByText('signed-in')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Logout'));
  await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument());
  expect(localStorage.getItem('valam_token')).toBeNull();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.objectContaining({ method: 'POST', headers: { Authorization: `Bearer ${jwt}` } }));
});

it('removes the session when server reports revocation or expiration', async () => {
  localStorage.setItem('valam_token', token(Date.now() / 1000 + 3600));
  localStorage.setItem('valam_role', 'buyer');
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });
  render(<AuthProvider><Session /></AuthProvider>);
  await waitFor(() => expect(localStorage.getItem('valam_token')).toBeNull());
  expect(screen.getByText('signed-out')).toBeInTheDocument();
});
