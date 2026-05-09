import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRestaurantDto,
  validateServiceModelsOrThrow,
} from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

const ALLOWED_TAX_MODES = ['INCLUSIVE', 'EXCLUSIVE', 'NONE'] as const;

@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeServiceModels(serviceModels?: string[]) {
    if (!serviceModels) {
      return undefined;
    }

    const unique = Array.from(
      new Set(serviceModels.map((value) => value.trim().toUpperCase())),
    );

    try {
      validateServiceModelsOrThrow(unique);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    return unique;
  }

  async getCurrentRestaurant(restaurantId: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return {
      ...restaurant,
      serviceModels: Array.isArray(restaurant.serviceModels)
        ? restaurant.serviceModels
        : ['DINE_IN'],
    };
  }

  async createOrUpdateCurrentRestaurant(
    restaurantId: string,
    dto: CreateRestaurantDto,
  ) {
    const nextServiceModels = this.normalizeServiceModels(dto.serviceModels);

    const existing = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Restaurant not found');
    }

    return (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(nextServiceModels ? { serviceModels: nextServiceModels } : {}),
      },
    });
  }

  async updateCurrentRestaurant(
    restaurantId: string,
    dto: UpdateRestaurantDto,
  ) {
    const nextServiceModels = this.normalizeServiceModels(dto.serviceModels);

    const nextName = dto.name?.trim();
    const nextStreetAddress = dto.streetAddress?.trim();
    const nextSuburb = dto.suburb?.trim();
    const nextState = dto.state?.trim();
    const nextPostcode = dto.postcode?.trim();
    const nextPhone = dto.phone?.trim();
    const nextBusinessType = dto.businessType?.trim();
    const nextAbn = dto.abn?.trim();
    const nextGstNumber = dto.gstNumber?.trim();
    const nextTaxNumber = dto.taxNumber?.trim();
    const nextContactEmail = dto.contactEmail?.trim();

    // Note: We remove the strict multi-field check here.
    // Data completeness is validated by OnboardingService.getMissingSteps()
    // before allowing the onboarding to be marked as 'complete'.

    if (dto.taxMode && !ALLOWED_TAX_MODES.includes(dto.taxMode as any)) {
      throw new BadRequestException(
        `Invalid taxMode. Allowed values: ${ALLOWED_TAX_MODES.join(', ')}`,
      );
    }

    if (dto.taxRate !== undefined && Number(dto.taxRate) < 0) {
      throw new BadRequestException(
        'taxRate must be greater than or equal to 0',
      );
    }

    const updatedRestaurant = await (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(nextStreetAddress !== undefined
          ? { streetAddress: nextStreetAddress }
          : {}),
        ...(nextSuburb !== undefined ? { suburb: nextSuburb } : {}),
        ...(nextState !== undefined ? { state: nextState } : {}),
        ...(nextPostcode !== undefined ? { postcode: nextPostcode } : {}),
        ...(nextPhone !== undefined ? { phone: nextPhone } : {}),
        ...(nextBusinessType !== undefined
          ? { businessType: nextBusinessType }
          : {}),
        ...(nextAbn !== undefined ? { abn: nextAbn } : {}),
        ...(nextGstNumber !== undefined ? { gstNumber: nextGstNumber } : {}),
        ...(nextTaxNumber !== undefined ? { taxNumber: nextTaxNumber } : {}),
        ...(nextContactEmail !== undefined
          ? { contactEmail: nextContactEmail }
          : {}),
        ...(dto.logoUrl !== undefined
          ? { logoUrl: dto.logoUrl?.trim() || null }
          : {}),
        ...(dto.taxMode !== undefined ? { taxMode: dto.taxMode } : {}),
        ...(dto.taxRate !== undefined ? { taxRate: dto.taxRate } : {}),
        ...(nextServiceModels !== undefined
          ? { serviceModels: nextServiceModels }
          : {}),
      },
    });

    // Check if any outlets exist for this tenant
    const primaryOutlet = await this.prisma.outlet.findFirst({
      where: { restaurantId, isPrimary: true },
    });

    if (!primaryOutlet) {
      // Auto-create initial primary outlet
      await this.prisma.outlet.create({
        data: {
          restaurantId,
          outletNumber: '01',
          name: nextName || 'Main Outlet',
          phone: nextPhone || null,
          contactEmail: nextContactEmail || null,
          abn: nextAbn || null,
          logoUrl: dto.logoUrl?.trim() || null,
          streetAddress: nextStreetAddress || null,
          suburb: nextSuburb || null,
          state: nextState || 'NSW',
          postcode: nextPostcode || null,
          isPrimary: true,
          isActive: true,
          serviceModels: (nextServiceModels as any) || ['DINE_IN'],
        },
      });
    } else {
      // Sync parent updates with primary outlet if it hasn't been individually overridden
      await this.prisma.outlet.update({
        where: { id: primaryOutlet.id },
        data: {
          ...(nextName !== undefined && primaryOutlet.name === 'Main Outlet'
            ? { name: nextName }
            : {}),
          ...(nextPhone !== undefined && !primaryOutlet.phone
            ? { phone: nextPhone }
            : {}),
          ...(nextContactEmail !== undefined && !primaryOutlet.contactEmail
            ? { contactEmail: nextContactEmail }
            : {}),
          ...(nextAbn !== undefined && !primaryOutlet.abn
            ? { abn: nextAbn }
            : {}),
          ...(dto.logoUrl !== undefined && !primaryOutlet.logoUrl
            ? { logoUrl: dto.logoUrl.trim() || null }
            : {}),
          ...(nextStreetAddress !== undefined && !primaryOutlet.streetAddress
            ? { streetAddress: nextStreetAddress }
            : {}),
          ...(nextSuburb !== undefined && !primaryOutlet.suburb
            ? { suburb: nextSuburb }
            : {}),
          ...(nextState !== undefined && primaryOutlet.state === 'NSW'
            ? { state: nextState }
            : {}),
          ...(nextPostcode !== undefined && !primaryOutlet.postcode
            ? { postcode: nextPostcode }
            : {}),
        },
      });
    }

    return updatedRestaurant;
  }

  async updateServiceModels(restaurantId: string, serviceModels?: string[]) {
    const nextServiceModels = this.normalizeServiceModels(serviceModels);
    if (!nextServiceModels || nextServiceModels.length === 0) {
      throw new BadRequestException(
        'serviceModels must include at least one value',
      );
    }

    return (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: { serviceModels: nextServiceModels },
    });
  }

  async updateTaxSettings(
    restaurantId: string,
    dto: { taxMode?: 'INCLUSIVE' | 'EXCLUSIVE' | 'NONE'; taxRate?: number },
  ) {
    if (!dto?.taxMode || !ALLOWED_TAX_MODES.includes(dto.taxMode)) {
      throw new BadRequestException(
        `taxMode is required. Allowed values: ${ALLOWED_TAX_MODES.join(', ')}`,
      );
    }

    if (dto.taxRate !== undefined && Number(dto.taxRate) < 0) {
      throw new BadRequestException(
        'taxRate must be greater than or equal to 0',
      );
    }

    return (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: {
        taxMode: dto.taxMode,
        ...(dto.taxRate !== undefined ? { taxRate: dto.taxRate } : {}),
      },
    });
  }

  async uploadLogo(file?: any) {
    if (!file) {
      throw new BadRequestException('No logo file provided');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'logos');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${randomUUID()}${extname(file.originalname || '') || '.jpg'}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, file.buffer);

    return {
      url: `/uploads/logos/${fileName}`,
    };
  }
}
