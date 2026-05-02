import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePrinterSettingsDto,
  UpdatePrinterSettingsDto,
} from './dto/printer-settings.dto';
import { UpdateKotSettingsDto } from './dto/kot-settings.dto';
import { UpdateBillSettingsDto } from './dto/bill-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Printer Settings
  async getPrinters(restaurantId: string) {
    return this.prisma.printerSettings.findMany({
      where: { restaurantId },
    });
  }

  async addPrinter(restaurantId: string, dto: CreatePrinterSettingsDto) {
    return this.prisma.printerSettings.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async updatePrinter(
    id: string,
    restaurantId: string,
    dto: UpdatePrinterSettingsDto,
  ) {
    const printer = await this.prisma.printerSettings.findFirst({
      where: { id, restaurantId },
    });
    if (!printer) throw new NotFoundException('Printer not found');

    return this.prisma.printerSettings.update({
      where: { id },
      data: dto,
    });
  }

  async deletePrinter(id: string, restaurantId: string) {
    const printer = await this.prisma.printerSettings.findFirst({
      where: { id, restaurantId },
    });
    if (!printer) throw new NotFoundException('Printer not found');

    return this.prisma.printerSettings.delete({
      where: { id },
    });
  }

  // KOT Settings
  async getKotSettings(restaurantId: string) {
    let settings = await this.prisma.kotSettings.findUnique({
      where: { restaurantId },
    });

    if (!settings) {
      settings = await this.prisma.kotSettings.create({
        data: { restaurantId },
      });
    }

    return settings;
  }

  async updateKotSettings(restaurantId: string, dto: UpdateKotSettingsDto) {
    return this.prisma.kotSettings.upsert({
      where: { restaurantId },
      update: dto,
      create: { ...dto, restaurantId },
    });
  }

  // Bill Settings
  async getBillSettings(restaurantId: string) {
    let settings = await this.prisma.billSettings.findUnique({
      where: { restaurantId },
    });

    if (!settings) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      settings = await this.prisma.billSettings.create({
        data: {
          restaurantId,
          restaurantName: restaurant?.name || 'My Restaurant',
          address: `${restaurant?.streetAddress || ''}, ${restaurant?.suburb || ''}, ${restaurant?.state || ''} ${restaurant?.postcode || ''}`,
          contactNumber: restaurant?.phone || '',
          logoUrl: restaurant?.logoUrl || null,
        },
      });
    }

    return settings;
  }

  async updateBillSettings(restaurantId: string, dto: UpdateBillSettingsDto) {
    return this.prisma.billSettings.upsert({
      where: { restaurantId },
      update: dto,
      create: {
        ...dto,
        restaurantId,
        restaurantName: dto.restaurantName || 'My Restaurant',
        address: dto.address || '',
      },
    });
  }
}
