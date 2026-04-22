import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    return (this.prisma as any).restaurant.update({
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
}
