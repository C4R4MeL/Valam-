const { execSync } = require('child_process');
require('dotenv').config();

try {
  execSync(`npx prisma migrate diff --from-url "${process.env.DATABASE_URL}" --to-schema-datamodel prisma/schema.prisma --script > diff.sql`, { stdio: 'inherit', shell: true });
  console.log("Diff generated");
} catch (e) {
  console.error(e.message);
}
