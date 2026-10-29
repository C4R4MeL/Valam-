import { SupplierStorageService } from './supplier-storage.service';
jest.mock('fs', () => ({ existsSync: () => true, mkdirSync: jest.fn(), writeFileSync: jest.fn() }));
describe('Quality document bucket privacy', () => {
  const originalUrl = process.env.SUPABASE_URL, originalKey = process.env.SUPABASE_KEY;
  afterEach(() => { if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalUrl; if (originalKey === undefined) delete process.env.SUPABASE_KEY; else process.env.SUPABASE_KEY = originalKey; });
  const file = { size: 20, mimetype: 'application/pdf', originalname: 'fixture.pdf', buffer: Buffer.from('%PDF-1.4 TEST FIXTURE') } as Express.Multer.File;
  async function upload(bucket: unknown, error: unknown = null) {
    process.env.SUPABASE_URL = 'https://storage.example.test'; process.env.SUPABASE_KEY = 'test-only-private-storage-key';
    const put = jest.fn(async () => ({ error: null }));
    const from = jest.fn(() => ({ upload: put }));
    const storage = { getBucket: jest.fn(async () => ({ data: bucket, error })), from };
    const service = new SupplierStorageService({ getClient: () => ({ storage }) } as any);
    await service.uploadDocument('TEST-FIXTURE-OWNER', 'COA', file, true);
    return put;
  }
  it('does not upload private documents to a public bucket', async () => { expect(await upload({ public: true })).not.toHaveBeenCalled(); });
  it('does not upload when bucket privacy cannot be verified', async () => { expect(await upload(null, { message: 'not authorized' })).not.toHaveBeenCalled(); });
  it('uses the existing storage API when a private bucket is confirmed', async () => { expect(await upload({ public: false })).toHaveBeenCalledTimes(1); });
});
