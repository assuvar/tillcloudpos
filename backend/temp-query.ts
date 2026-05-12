import { PrismaClient } from './generated/prisma';

async function main() {
  const prisma = new PrismaClient();
  const customers = await prisma.customer.findMany();
  console.log('Customers:', customers);

  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: {
      id: true,
      orderType: true,
      status: true,
      customerName: true,
      customerPhone: true,
      customerId: true,
      deliveryName: true,
      deliveryPhone: true,
    }
  });
  console.log('Recent Bills:', bills);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
