import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
  const remaining = await prisma.user.count();

  console.log('Deleted users via TRUNCATE CASCADE');
  console.log(`Remaining users: ${remaining}`);
}

main()
  .catch((error) => {
    console.error('Failed to delete users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
