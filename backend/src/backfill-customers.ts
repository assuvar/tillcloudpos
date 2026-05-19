import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const bills = await prisma.bill.findMany({
    where: {
      customerId: null,
      OR: [
        { customerPhone: { not: null } },
        { deliveryPhone: { not: null } },
        { pickupPhone: { not: null } },
      ],
    },
  });

  console.log(`Found ${bills.length} bills missing customer linkage.`);

  for (const bill of bills) {
    const phoneToUse =
      bill.customerPhone || bill.pickupPhone || bill.deliveryPhone;
    const nameToUse = bill.customerName || bill.pickupName || bill.deliveryName;

    if (!phoneToUse) continue;

    let customer = await prisma.customer.findFirst({
      where: { restaurantId: bill.restaurantId, phone: phoneToUse },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          restaurantId: bill.restaurantId,
          phone: phoneToUse,
          name: nameToUse || null,
        },
      });
      console.log(`Created new customer ${phoneToUse}`);
    }

    await prisma.bill.update({
      where: { id: bill.id },
      data: { customerId: customer.id },
    });

    // Retroactively update customer stats if paid
    if (bill.status === 'PAID') {
      const earnPoints = Math.floor((bill.totalCents || 0) * 0.1);
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalVisits: customer.totalVisits + 1,
          totalSpentCents: customer.totalSpentCents + (bill.totalCents || 0),
          lastVisitAt: bill.paidAt || bill.createdAt,
          loyaltyPoints: customer.loyaltyPoints + earnPoints,
        },
      });
      console.log(
        `Linked and updated stats for ${phoneToUse} (Bill ${bill.orderNumber})`,
      );
    }
  }

  await app.close();
}

bootstrap().catch(console.error);
