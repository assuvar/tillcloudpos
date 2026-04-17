import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto, validateServiceModelsOrThrow } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeServiceModels(serviceModels?: string[]) {
    if (!serviceModels) {
      return undefined;
    }

    const unique = Array.from(new Set(serviceModels.map((value) => value.trim().toUpperCase())));

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

  async updateCurrentRestaurant(restaurantId: string, dto: UpdateRestaurantDto) {
    const nextServiceModels = this.normalizeServiceModels(dto.serviceModels);

    return (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(nextServiceModels !== undefined ? { serviceModels: nextServiceModels } : {}),
      },
    });
  }
}
