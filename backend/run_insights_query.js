const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    INSERT INTO insights_market_prices (grade, price_per_kg, currency, updated_at)
    VALUES
      ('A', 850000, 'IDR', now()),
      ('B', 780000, 'IDR', now()),
      ('C', 680000, 'IDR', now())
    ON CONFLICT (grade) DO UPDATE SET
      price_per_kg = EXCLUDED.price_per_kg,
      updated_at = now();
  `);
  console.log('Update result:', result);

  const rows = await prisma.$queryRawUnsafe(`
    SELECT grade, price_per_kg, currency, updated_at FROM insights_market_prices ORDER BY grade;
  `);
  console.log('Current data:', rows);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
