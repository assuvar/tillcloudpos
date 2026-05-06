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
  console.log('--- Updating Restaurant Name ---');
  try {
    // 1. Find all restaurants
    const restaurants = await prisma.restaurant.findMany();
    console.log(`Found ${restaurants.length} restaurants.`);

    for (const r of restaurants) {
      console.log(`Restaurant ID: ${r.id}, Current Name: "${r.name}"`);
      if (r.name.toLowerCase() === 'tillcloud') {
        const updated = await prisma.restaurant.update({
          where: { id: r.id },
          data: { name: 'Overviewlabs' },
        });
        console.log(`Updated Restaurant ID: ${r.id} to "Overviewlabs"`);
      }
    }

    // Also update any bill_settings restaurantName or similar if exists
    const billSettings = await prisma.billSettings.findMany();
    for (const bs of billSettings) {
      if (bs.restaurantName.toLowerCase() === 'tillcloud') {
        await prisma.billSettings.update({
          where: { id: bs.id },
          data: { restaurantName: 'Overviewlabs' },
        });
        console.log(`Updated BillSettings ID: ${bs.id} to "Overviewlabs"`);
      }
    }

    console.log('Update finished successfully.');
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
