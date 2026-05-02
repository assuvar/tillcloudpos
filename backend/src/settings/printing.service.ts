import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrintingService {
  private readonly logger = new Logger(PrintingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async triggerKotPrint(restaurantId: string, kitchenOrderId: string) {
    this.logger.log(
      `Triggering KOT Print for Order ${kitchenOrderId} in Restaurant ${restaurantId}`,
    );

    try {
      const kotSettings = await this.prisma.kotSettings.findUnique({
        where: { restaurantId },
      });

      if (!kotSettings || !kotSettings.enablePrinting) {
        this.logger.log('KOT Printing is disabled');
        return;
      }

      const kitchenOrder = await this.prisma.kitchenOrder.findUnique({
        where: { id: kitchenOrderId },
        include: {
          bill: {
            include: {
              items: true,
              table: true,
            },
          },
        },
      });

      if (!kitchenOrder) return;

      const printers = await this.prisma.printerSettings.findMany({
        where: { restaurantId, isKitchen: true, isActive: true },
      });

      if (printers.length === 0) {
        this.logger.warn('No kitchen printers configured');
        return;
      }

      for (const printer of printers) {
        this.logger.log(
          `Printing to ${printer.name} (${printer.ipAddress || printer.interface})`,
        );
        // Here you would implement ESC/POS logic for the specific printer
        // For example, if it's a network printer, you could use a library like 'escpos'
        // or just send a raw TCP stream.
      }
    } catch (error) {
      this.logger.error('Failed to trigger KOT print', error);
    }
  }

  async triggerBillPrint(restaurantId: string, billId: string) {
    this.logger.log(
      `Triggering Bill Print for Bill ${billId} in Restaurant ${restaurantId}`,
    );

    try {
      const billSettings = await this.prisma.billSettings.findUnique({
        where: { restaurantId },
      });

      const printers = await this.prisma.printerSettings.findMany({
        where: { restaurantId, isBilling: true, isActive: true },
      });

      if (printers.length === 0) {
        this.logger.warn('No billing printers configured');
        return;
      }

      for (const printer of printers) {
        this.logger.log(`Printing bill to ${printer.name}`);
        // Implement billing print logic
      }
    } catch (error) {
      this.logger.error('Failed to trigger bill print', error);
    }
  }
}
