import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const customers = await prisma.customer.findMany();
  console.log('--- CUSTOMERS ---');
  console.dir(customers, { depth: null });

  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      orderType: true,
      status: true,
      customerId: true,
      customerPhone: true,
      deliveryPhone: true,
      totalCents: true,
      createdAt: true
    }
  });
  console.log('--- RECENT BILLS ---');
  console.dir(bills, { depth: null });

  await app.close();
}

bootstrap().catch(console.error);
