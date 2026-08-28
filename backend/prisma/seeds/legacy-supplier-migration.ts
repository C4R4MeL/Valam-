/**
 * Legacy Supplier Migration Script
 *
 * Migrates existing active suppliers to the new verification system.
 * Sets status = LEGACY_VERIFIED, is_legacy = true, legacy_deadline = now + 30 days.
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 * Suppliers already marked as legacy (is_legacy = true) are skipped.
 *
 * Usage:
 *   npx ts-node prisma/seeds/legacy-supplier-migration.ts
 */

import { PrismaClient, SupplierStatus, AksiVerifikasi } from '@prisma/client';

const prisma = new PrismaClient();

const DEADLINE_DAYS = 30;
const SYSTEM_ADMIN_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  console.log('=== Legacy Supplier Migration ===\n');

  // Find all supplier profiles that are NOT yet marked as legacy
  // and are currently in TERDAFTAR or any non-TERVERIFIKASI status
  const suppliers = await prisma.supplierProfile.findMany({
    where: {
      is_legacy: false,
      status: {
        notIn: [SupplierStatus.TERVERIFIKASI, SupplierStatus.LEGACY_VERIFIED],
      },
    },
    include: {
      user: { select: { email: true } },
    },
  });

  if (suppliers.length === 0) {
    console.log('✓ No suppliers to migrate. All suppliers are already processed.');
    return;
  }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + DEADLINE_DAYS);

  console.log(`Found ${suppliers.length} supplier(s) to migrate.`);
  console.log(`Deadline: ${deadline.toISOString().split('T')[0]} (${DEADLINE_DAYS} days from now)\n`);

  let migrated = 0;
  let errors = 0;

  for (const supplier of suppliers) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update supplier profile
        await tx.supplierProfile.update({
          where: { id: supplier.id },
          data: {
            status: SupplierStatus.LEGACY_VERIFIED,
            is_legacy: true,
            legacy_deadline: deadline,
          },
        });

        // Create audit log
        await tx.verificationLog.create({
          data: {
            supplier_id: supplier.id,
            admin_id: SYSTEM_ADMIN_ID,
            aksi: AksiVerifikasi.LEGACY_REMINDER_SENT,
            catatan: `Supplier lama dimigrasikan ke sistem verifikasi baru. Batas waktu melengkapi dokumen: ${deadline.toISOString().split('T')[0]}`,
          },
        });
      });

      console.log(`  ✓ ${supplier.nama_koperasi} (${supplier.user?.email || 'no email'}) → LEGACY_VERIFIED`);
      migrated++;
    } catch (err: any) {
      console.error(`  ✗ ${supplier.nama_koperasi}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Errors:   ${errors}`);
  console.log(`  Skipped:  ${suppliers.length - migrated - errors}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
