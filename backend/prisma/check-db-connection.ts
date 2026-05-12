import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL is not set in your .env file!');
  process.exit(1);
}

async function main() {
  console.log('--- 🛡️  TILLCLOUD DB DIAGNOSTICS ---');
  console.log(`Connecting to URL: ${databaseUrl}`);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const restaurantCount = await prisma.restaurant.count();
    console.log('✅ DATABASE CONNECTION IS SUCCESSFUL!');
    console.log(`📊 Total Restaurants in database: ${restaurantCount}`);
  } catch (error: any) {
    console.error('❌ DATABASE CONNECTION CRITICAL ERROR:');
    console.error(error.message || error);
    console.log('\n--- 💡 TROUBLESHOOTING TIPS ---');
    console.log('1. Make sure your local PostgreSQL service is running (e.g., check pgAdmin or Windows Services for Postgres).');
    console.log('2. Verify the username, password, and port inside your DATABASE_URL in e:\\tillcloudpos\\backend\\.env.');
    console.log('3. Ensure the database "tillcloud_db" actually exists. If it does not, run: npx prisma db push');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
