import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

async function main() {
  console.log('Clearing all kitchen screen orders...');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    // Delete all kitchen orders
    const deletedKitchenOrders = await prisma.kitchenOrder.deleteMany();
    console.log(`Cleared ${deletedKitchenOrders.count} kitchen orders.`);

    console.log('Kitchen screen orders cleared successfully.');
  } catch (error) {
    console.error('Failed to clear kitchen orders:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
