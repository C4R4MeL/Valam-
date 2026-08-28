import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  const supplierRole = await prisma.role.upsert({
    where: { name: 'supplier' },
    update: {},
    create: { name: 'supplier' },
  });

  const buyerRole = await prisma.role.upsert({
    where: { name: 'buyer' },
    update: {},
    create: { name: 'buyer' },
  });

  // 1. Create Users (Supplier & Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@valam.id' },
    update: {
      password: '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.',
    },
    create: {
      email: 'admin@valam.id',
      password: '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.',
      role_id: adminRole.id,
      status: 'active',
    },
  });

  const supplier1 = await prisma.user.upsert({
    where: { email: 'supplier1@example.com' },
    update: {
      password: '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.',
    },
    create: {
      email: 'supplier1@example.com',
      password: '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.',
      role_id: supplierRole.id,
      status: 'active',
      profile: {
        create: {
          contact_person: 'Budi Santoso',
          company_name: 'Koperasi Nilam Jaya',
          phone: '+6281234567890',
        },
      },
    },
    include: { profile: true },
  });

  const supplier2 = await prisma.user.upsert({
    where: { email: 'supplier2@example.com' },
    update: {
      password: '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.',
    },
    create: {
      email: 'supplier2@example.com',
      password: '$2b$10$NiiUH5CcPLDb/67rR5c16.NYNrW9xzNSCMqmrFQYB33fqKiNxi9C.',
      role_id: supplierRole.id,
      status: 'pending',
      profile: {
        create: {
          contact_person: 'Siti Rahma',
          company_name: 'KUD Makmur Sejahtera',
          phone: '+6281234567891',
        },
      },
    },
    include: { profile: true },
  });

  // 2. Create Products (Batches)
  const batch1 = await prisma.product.upsert({
    where: { batch_code: 'VAL-ACEH-001' },
    update: {},
    create: {
      supplier_id: supplier1.id,
      batch_code: 'VAL-ACEH-001',
      origin_district: 'Aceh Barat',
      total_volume_kg: 500,
      available_volume_kg: 500,
      price_per_kg: 800000,
      status: 'IN_LAB', // Waiting for QC
    },
  });

  const batch2 = await prisma.product.upsert({
    where: { batch_code: 'VAL-ACEH-002' },
    update: {},
    create: {
      supplier_id: supplier1.id,
      batch_code: 'VAL-ACEH-002',
      origin_district: 'Aceh Jaya',
      total_volume_kg: 200,
      available_volume_kg: 200,
      price_per_kg: 750000,
      status: 'VERIFIED',
    },
  });

  // 3. Create QC Result & Certificate for Batch 2
  // We check if it exists first because we are using upsert for other things.
  // We'll just try/catch to avoid unique constraint if re-running
  try {
    const qcResult = await prisma.qcResult.create({
      data: {
        product_id: batch2.id,
        admin_id: admin.id,
        pa_percentage: 32.5,
        moisture: 1.2,
        specific_gravity: 0.965,
        refractive_index: 1.51,
        optical_rotation: -52,
        overall_status: 'pass',
      },
    });

    await prisma.certificate.create({
      data: {
        product_id: batch2.id,
        qc_result_id: qcResult.id,
        certificate_number: 'COA-VAL-ACEH-002-123',
        admin_name: 'Dr. Iskandar',
      },
    });

    // 4. Create Trace Logs
    await prisma.traceLog.createMany({
      data: [
        {
          product_id: batch2.id,
          event_type: 'HARVESTED',
          location_name: 'Kebun Aceh Jaya',
          description: 'Panen daun nilam segar',
        },
        {
          product_id: batch2.id,
          event_type: 'DISTILLED',
          location_name: 'Fasilitas Destilasi Koperasi',
          description: 'Penyulingan daun nilam kering selama 8 jam',
        },
        {
          product_id: batch2.id,
          event_type: 'LAB_VERIFIED',
          location_name: 'Valam Central QC Hub',
          description: 'Produk lulus uji lab',
        },
      ],
    });
  } catch (e) {
    console.log("QC and Trace logs might already exist for batch2");
  }

  // 5. Create Circular Products
  console.log('Seeding circular products...');
  try {
    await prisma.circularProduct.upsert({
      where: { id: '30000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '30000000-0000-0000-0000-000000000001',
        supplier_id: supplier1.id,
        name: 'Organic Compost - Super Patchouli Residuals',
        category: 'Organic Compost',
        price: 2500,
        stock: 5000,
        unit: 'Sack',
        image: '/images/compost.png',
        benefit: 'Meningkatkan kesuburan tanah secara organik dan alami untuk perkebunan kelapa sawit dan sayuran.',
        description: 'Kompos organik kualitas premium yang diproduksi dari fermentasi ampas daun dan batang nilam hasil penyulingan, diproses menggunakan dekomposer bio-aktif selama 30 hari.',
        status: 'APPROVED',
      },
    });

    await prisma.circularProduct.upsert({
      where: { id: '30000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '30000000-0000-0000-0000-000000000002',
        supplier_id: supplier1.id,
        name: 'Biochar Active Charcoal',
        category: 'Biochar',
        price: 4500,
        stock: 3000,
        unit: 'Sack',
        image: '/images/biochar.png',
        benefit: 'Memperbaiki aerasi tanah, menahan unsur hara dan air lebih lama dalam tanah berpasir.',
        description: 'Biochar karbon aktif tinggi hasil proses pirolisis lambat (slow pyrolysis) dari sisa ranting penyulingan minyak nilam pada suhu 450 derajat Celsius.',
        status: 'APPROVED',
      },
    });

    await prisma.circularProduct.upsert({
      where: { id: '30000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '30000000-0000-0000-0000-000000000003',
        supplier_id: supplier2.id,
        name: 'Patchouli Hydrosol Water Extract',
        category: 'Patchouli Hydrosol',
        price: 15000,
        stock: 1500,
        unit: 'Jerigen',
        image: '/images/hydrosol.png',
        benefit: 'Bahan baku kosmetik alami, sabun organik, toner antiseptik, dan aromaterapi.',
        description: 'Air destilasi (hydrosol) murni dari proses penyulingan uap minyak nilam, mengandung sisa molekul minyak aktif dan aroma khas nilam yang menenangkan.',
        status: 'APPROVED',
      },
    });
  } catch (err) {
    console.error("Error seeding circular products:", err);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
