import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

async function main() {
  console.log('Removing all orders (bills)...');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    // Delete in order of dependencies (foreign key relationships)
    
    // 1. Delete all payments (linked to bills)
    const deletedPayments = await prisma.payment.deleteMany();
    console.log(`Deleted payments: ${deletedPayments.count}`);

    // 2. Delete all kitchen orders (linked to bills)
    const deletedKitchenOrders = await prisma.kitchenOrder.deleteMany();
    console.log(`Deleted kitchen orders: ${deletedKitchenOrders.count}`);

    // 3. Delete all bill items (linked to bills)
    const deletedBillItems = await prisma.billItem.deleteMany();
    console.log(`Deleted bill items: ${deletedBillItems.count}`);

    // 4. Delete all SMS logs (linked to bills)
    const deletedSmsLogs = await prisma.smsLog.deleteMany({
      where: { billId: { not: null } }
    });
    console.log(`Deleted SMS logs: ${deletedSmsLogs.count}`);

    // 5. Delete all loyalty transactions (linked to bills)
    const deletedLoyaltyTransactions = await prisma.loyaltyTransaction.deleteMany({
      where: { billId: { not: null } }
    });
    console.log(`Deleted loyalty transactions: ${deletedLoyaltyTransactions.count}`);

    // 6. Delete all inventory movements (linked to bills)
    const deletedInventoryMovements = await prisma.inventoryMovement.deleteMany({
      where: { billId: { not: null } }
    });
    console.log(`Deleted inventory movements: ${deletedInventoryMovements.count}`);

    // 7. Delete all reservations
    const deletedReservations = await prisma.reservation.deleteMany();
    console.log(`Deleted reservations: ${deletedReservations.count}`);

    // 8. Delete all bills
    const deletedBills = await prisma.bill.deleteMany();
    console.log(`Deleted bills: ${deletedBills.count}`);

    // 9. Reset all tables to AVAILABLE
    const updatedTables = await prisma.table.updateMany({
      data: {
        status: 'AVAILABLE',
        activeBillId: null,
        currentOrderId: null,
        startedAt: null,
      }
    });
    console.log(`Reset ${updatedTables.count} tables to AVAILABLE.`);

    console.log('All orders and reservations removed, tables reset successfully.');
  } catch (error) {
    console.error('Failed to remove orders:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
