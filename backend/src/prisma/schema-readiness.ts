import { Prisma, PrismaClient } from '@prisma/client';

type ColumnRow = {
  schema_name: string | null;
  table_name: string | null;
  column_name: string | null;
};
type SchemaReader = Pick<PrismaClient, '$queryRaw' | '$disconnect'>;

export class DatabaseSchemaMismatchError extends Error {
  constructor(
    readonly schema: string,
    readonly missingColumns: string[],
  ) {
    const shown = missingColumns.slice(0, 12).join(', ');
    const more =
      missingColumns.length > 12
        ? ` (+${missingColumns.length - 12} lainnya)`
        : '';
    const next =
      schema === 'pertamuda_test'
        ? missingColumns.every(
            (column) =>
              column === 'certificates.review_status' ||
              /^(testing_partners|testing_requests|quality_files|lab_reports|quality_events)\./.test(
                column,
              ),
          )
          ? 'Terapkan pembaruan mutu pada schema demo dengan npm run demo:migrate:quality, lalu jalankan npm run demo:start kembali. Data demo tidak di-reset.'
          : 'Siapkan schema pengujian dengan npm run demo:prepare; tinjau migration jika ada peringatan perubahan data.'
        : 'Untuk demonstrasi terisolasi, hentikan backend ini dan jalankan npm run demo:start.';
    super(
      `[DATABASE_SCHEMA_MISMATCH] Schema "${schema}" belum sesuai dengan kode VALAM.\n` +
        `Kolom/tabel yang belum tersedia: ${shown}${more}.\n` +
        next +
        '\n' +
        'Schema operasional memerlukan migrasi yang ditinjau sebelum menjalankan kode baru. Tidak ada migrasi atau perubahan data yang dijalankan otomatis.',
    );
    this.name = 'DatabaseSchemaMismatchError';
  }
}

/** Owns a short-lived reader. Checks column presence only, without DDL or writes. */
export async function assertDatabaseSchemaCompatible(
  reader: SchemaReader = new PrismaClient(),
): Promise<void> {
  try {
    const rows = await reader.$queryRaw<ColumnRow[]>`
      SELECT current_schema() AS schema_name, c.table_name, c.column_name
      FROM (SELECT 1) AS singleton
      LEFT JOIN information_schema.columns AS c
        ON c.table_schema = current_schema()
    `;
    const schema = rows[0]?.schema_name || '(schema tidak tersedia)';
    const actual = new Set(
      rows
        .filter((row) => row.table_name && row.column_name)
        .map((row) => `${row.table_name}.${row.column_name}`),
    );
    const expected = Prisma.dmmf.datamodel.models.flatMap((model) =>
      model.fields
        .filter((field) => field.kind !== 'object')
        .map(
          (field) =>
            `${model.dbName || model.name}.${field.dbName || field.name}`,
        ),
    );
    const missing = expected.filter((column) => !actual.has(column));
    if (missing.length) throw new DatabaseSchemaMismatchError(schema, missing);
  } finally {
    await reader.$disconnect();
  }
}
