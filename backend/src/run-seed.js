const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, '../../supabase/migrations/004_insights_seed.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Reading seed file...');
  // Split statements by semicolon followed by a newline
  const statements = sql
    .split(/;\s*\r?\n/)
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`Executing ${statements.length} SQL statements sequentially...`);
  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      // Append semicolon if not present (since we split by it)
      const query = stmt.endsWith(';') ? stmt : stmt + ';';
      console.log(`Executing query ${i + 1}/${statements.length}...`);
      await prisma.$executeRawUnsafe(query);
    }
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
