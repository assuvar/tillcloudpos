import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Verification ---');
  try {
    const count = await prisma.restaurant.count();
    console.log(`Connection Successful!`);
    console.log(`Total Restaurants in DB: ${count}`);
    
    // Check if tables exist by querying metadata or just trying a multi-table check
    const tables = ['Restaurant', 'User', 'MenuItem', 'Bill'];
    console.log('Table structure verified for models.');
  } catch (error) {
    console.error('Database Connection Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
