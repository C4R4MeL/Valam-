const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  try {
    // We add the column and enum manually because db push failed due to Supabase auth schema
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "SupplierSubtype" AS ENUM ('PETANI', 'PENYULING', 'KOPERASI');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "supplier_profiles" 
      ADD COLUMN IF NOT EXISTS "supplier_subtype" "SupplierSubtype" NOT NULL DEFAULT 'KOPERASI';
    `);

    console.log("Migration successful!");
  } catch (err) {
    console.error('Prisma Error:', err);
  }
} 
run().finally(() => prisma.$disconnect());
