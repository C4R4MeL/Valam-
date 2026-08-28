const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { name: 'supplier' } },
    include: {
      profile: true,
      supplier_profile: true
    }
  });
  console.log('SUPPLIERS:', JSON.stringify(users.map(u => ({
    email: u.email,
    profile_phone: u.profile?.phone,
    supplier_profile_whatsapp: u.supplier_profile?.whatsapp,
    company_name: u.profile?.company_name,
    nama_koperasi: u.supplier_profile?.nama_koperasi
  })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
