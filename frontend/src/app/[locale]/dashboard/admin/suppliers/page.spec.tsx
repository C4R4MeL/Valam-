import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminSuppliersPage from './page';

jest.mock('next-intl', () => ({ useLocale: () => 'id' }));
jest.mock('@/components/layout/DashboardHeader', () => ({ DashboardHeader: () => <h1>Admin</h1> }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

const profile = (koperasi = false) => ({
  id: 'demo-review', supplier_subtype: koperasi ? 'KOPERASI' : 'PETANI', punya_alat_suling: false,
  nama_pic: 'DEMONSTRASI reviewer test', nama_koperasi: null, status: 'DALAM_VERIFIKASI',
  created_at: '2026-10-26T00:00:00Z', grade_nilam: [], user: { email: 'demo@pertamuda.example.test' },
  documents: ['FOTO_FASILITAS', 'FOTO_FASILITAS', 'FOTO_FASILITAS', 'SURAT_PERNYATAAN'].map((tipe_document, index) => ({
    id: 'doc-' + index, tipe_document, status_dokumen: 'APPROVED', file_size: 1,
  })),
  documentCompleteness: [
    ...(koperasi ? [{ tipe: 'AKTA_KOPERASI', required: 1, approved: 0, approvalComplete: false, approvalIssues: [] }, { tipe: 'COA', required: 1, approved: 0, approvalComplete: false, approvalIssues: [] }] : []),
    { tipe: 'FOTO_FASILITAS', required: 3, approved: 3, approvalComplete: true, approvalIssues: [] },
    { tipe: 'SURAT_PERNYATAAN', required: 1, approved: 1, approvalComplete: true, approvalIssues: [] },
  ],
});

describe('Admin supplier review requirements (mock HTTP transport)', () => {
  const previousFetch = global.fetch;
  afterEach(() => { global.fetch = previousFetch; localStorage.clear(); });
  function prepare(supplier = profile()) {
    const fetchMock = jest.fn().mockImplementation(async (url: string) => ({ ok: true,
      json: async () => ({ data: url.includes('?status=') ? [supplier] : supplier }),
    }));
    global.fetch = fetchMock;
    render(<AdminSuppliersPage />);
    return fetchMock;
  }
  async function openReview() { fireEvent.click(await screen.findByRole('button', { name: 'Review Berkas' })); }
  it('shows only the server requirements for PETANI without equipment and allows a complete review', async () => {
    const fetchMock = prepare(); await openReview();
    expect(await screen.findByText(/Persyaratan sesuai jenis supplier: PETANI/)).toBeInTheDocument();
    expect(screen.queryByText(/Akta Pendirian Koperasi/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalisasi & Setujui Akun' })).toBeEnabled();
    expect(fetchMock.mock.calls.map(call => String(call[0])).some(url => url.endsWith('/verify'))).toBe(false);
  });
  it('shows missing Akta/COA and disables finalization for KOPERASI', async () => {
    prepare(profile(true)); await openReview();
    expect(await screen.findByText(/Akta Pendirian Koperasi: 0\/1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalisasi & Setujui Akun' })).toBeDisabled();
  });
  it('disables finalization while a document review is still being saved', async () => {
    const supplier = profile(); const fetchMock = prepare(supplier); await openReview();
    const button = await screen.findByRole('button', { name: 'Finalisasi & Setujui Akun' });
    expect(button).toBeEnabled();
    let finish = (_value: unknown) => {};
    const pending = new Promise(resolve => { finish = resolve; });
    fetchMock.mockImplementation((_url: string, options?: { method: string }) => options?.method === 'PATCH'
      ? pending : Promise.resolve({ ok: true, json: async () => ({ data: supplier }) }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Setujui Berkas' })[0]);
    expect(button).toBeDisabled();
    await act(async () => { finish({ ok: true, json: async () => ({ data: supplier }) }); });
    await waitFor(() => expect(button).toBeEnabled());
  });
});
