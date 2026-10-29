import { Prisma } from '@prisma/client';
import {
  assertDatabaseSchemaCompatible,
  DatabaseSchemaMismatchError,
} from './schema-readiness';

const completeRows = () =>
  Prisma.dmmf.datamodel.models.flatMap((model) =>
    model.fields
      .filter((field) => field.kind !== 'object')
      .map((field) => ({
        schema_name: 'pertamuda_test',
        table_name: model.dbName || model.name,
        column_name: field.dbName || field.name,
      })),
  );
const reader = () => ({
  $queryRaw: jest.fn(),
  $disconnect: jest.fn().mockResolvedValue(undefined),
});

describe('Database startup compatibility check', () => {
  it('gives the additive demo migration command when only quality fields are missing', async () => {
    const db = reader();
    db.$queryRaw.mockResolvedValue(
      completeRows().filter(
        (row) =>
          ![
            'testing_partners',
            'testing_requests',
            'quality_files',
            'lab_reports',
            'quality_events',
          ].includes(row.table_name) &&
          `${row.table_name}.${row.column_name}` !==
            'certificates.review_status',
      ),
    );
    await expect(assertDatabaseSchemaCompatible(db)).rejects.toThrow(
      'npm run demo:migrate:quality',
    );
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    expect(db.$disconnect).toHaveBeenCalledTimes(1);
  });
  it('allows the current schema using only a metadata read, then closes its connection', async () => {
    const db = reader();
    db.$queryRaw.mockResolvedValue(completeRows());
    await expect(assertDatabaseSchemaCompatible(db)).resolves.toBeUndefined();
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    expect(db.$disconnect).toHaveBeenCalledTimes(1);
  });
  it('rejects the reported old public schema without silently ignoring required columns', async () => {
    const db = reader();
    db.$queryRaw.mockResolvedValue(
      completeRows()
        .filter(
          (row) =>
            !['products.is_demo', 'orders.stock_state'].includes(
              `${row.table_name}.${row.column_name}`,
            ),
        )
        .map((row) => ({ ...row, schema_name: 'public' })),
    );
    const readiness = assertDatabaseSchemaCompatible(db);
    await expect(readiness).rejects.toMatchObject({
      name: 'DatabaseSchemaMismatchError',
      schema: 'public',
      missingColumns: ['products.is_demo', 'orders.stock_state'],
    });
    await expect(readiness).rejects.toThrow('npm run demo:start');
    expect(db.$disconnect).toHaveBeenCalledTimes(1);
  });
  it('rejects an empty schema instead of initializing tables or falling back to public', async () => {
    const db = reader();
    db.$queryRaw.mockResolvedValue([
      { schema_name: 'pertamuda_test', table_name: null, column_name: null },
    ]);
    await expect(assertDatabaseSchemaCompatible(db)).rejects.toBeInstanceOf(
      DatabaseSchemaMismatchError,
    );
    expect(db.$disconnect).toHaveBeenCalledTimes(1);
  });
  it('propagates connection failures and closes the reader', async () => {
    const db = reader();
    const failure = new Error('Connection unavailable');
    db.$queryRaw.mockRejectedValue(failure);
    await expect(assertDatabaseSchemaCompatible(db)).rejects.toBe(failure);
    expect(db.$disconnect).toHaveBeenCalledTimes(1);
  });
});
