const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() { 
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "supplier_profiles" 
      ADD COLUMN IF NOT EXISTS "luas_lahan" double precision,
      ADD COLUMN IF NOT EXISTS "estimasi_panen" double precision,
      ADD COLUMN IF NOT EXISTS "punya_alat_suling" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "koperasi_pembina_id" uuid;
    `);

    // Add foreign key for koperasi_pembina_id if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_profiles_koperasi_pembina_id_fkey') THEN
          ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_koperasi_pembina_id_fkey" FOREIGN KEY ("koperasi_pembina_id") REFERENCES "supplier_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log("Migration successful!");
  } catch (err) {
    console.error('Prisma Error:', err);
  }
} 
run().finally(() => prisma.$disconnect());
