import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

async function main() {
  console.log('Resetting database...');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    // 1. Delete all restaurants (this should cascade to users, roles, menu items, etc.)
    const deletedRestaurants = await prisma.restaurant.deleteMany();
    console.log(`Deleted restaurants: ${deletedRestaurants.count}`);

    // 2. Delete all OTPs (not linked to restaurant)
    const deletedOtps = await prisma.otp.deleteMany();
    console.log(`Deleted OTPs: ${deletedOtps.count}`);

    // 3. Delete all PinAuditLogs (cascade should have handled it, but let's be sure)
    const deletedPinLogs = await prisma.pinAuditLog.deleteMany();
    console.log(`Deleted PinAuditLogs: ${deletedPinLogs.count}`);

    // 4. Double check users
    const remainingUsers = await prisma.user.count();
    console.log(`Remaining users: ${remainingUsers}`);

    if (remainingUsers > 0) {
        console.log('Cleaning up remaining users...');
        await prisma.user.deleteMany();
    }

    console.log('Database reset successfully.');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
