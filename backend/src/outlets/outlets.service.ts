import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto, UpdateOutletDto } from './dto/create-outlet.dto';
import { ServiceModel } from '../../generated/prisma';

@Injectable()
export class OutletsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateServiceModels(models?: string[]): ServiceModel[] {
    if (!models) return [ServiceModel.DINE_IN];
    const validModels = Object.values(ServiceModel);
    const result: ServiceModel[] = [];

    for (const m of models) {
      const upper = m.trim().toUpperCase() as ServiceModel;
      if (validModels.includes(upper)) {
        result.push(upper);
      } else {
        throw new BadRequestException(`Invalid Service Model: ${m}`);
      }
    }

    if (result.length === 0) {
      result.push(ServiceModel.DINE_IN);
    }

    return result;
  }

  async list(restaurantId: string) {
    const outlets = await this.prisma.outlet.findMany({
      where: { restaurantId },
      orderBy: { outletNumber: 'asc' },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { abn: true, logoUrl: true, timezone: true },
    });

    // Handle optional property inheritance/fallback
    return outlets.map((outlet) => ({
      ...outlet,
      abn: outlet.abn || restaurant?.abn || null,
      logoUrl: outlet.logoUrl || restaurant?.logoUrl || null,
      timezone: outlet.timezone || restaurant?.timezone || 'Australia/Sydney',
    }));
  }

  async findOne(restaurantId: string, id: string) {
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, restaurantId },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { abn: true, logoUrl: true, timezone: true },
    });

    return {
      ...outlet,
      abn: outlet.abn || restaurant?.abn || null,
      logoUrl: outlet.logoUrl || restaurant?.logoUrl || null,
      timezone: outlet.timezone || restaurant?.timezone || 'Australia/Sydney',
    };
  }

  async create(restaurantId: string, dto: CreateOutletDto) {
    // Check subscription limits
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { allowedOutlets: true },
    });

    const allowed = restaurant?.allowedOutlets || 1;
    const count = await this.prisma.outlet.count({
      where: { restaurantId },
    });

    if (count >= allowed) {
      throw new BadRequestException(
        `Outlet creation limit reached. Your subscription allows up to ${allowed} outlets.`,
      );
    }

    // Uniqueness validations per tenant
    const duplicateNumber = await this.prisma.outlet.findFirst({
      where: { restaurantId, outletNumber: dto.outletNumber.trim() },
    });
    if (duplicateNumber) {
      throw new BadRequestException(`An outlet with number "${dto.outletNumber}" already exists.`);
    }

    const duplicateName = await this.prisma.outlet.findFirst({
      where: { restaurantId, name: { equals: dto.name.trim(), mode: 'insensitive' } },
    });
    if (duplicateName) {
      throw new BadRequestException(`An outlet with name "${dto.name}" already exists.`);
    }

    if (dto.slug?.trim()) {
      const duplicateSlug = await this.prisma.outlet.findFirst({
        where: { restaurantId, slug: { equals: dto.slug.trim(), mode: 'insensitive' } },
      });
      if (duplicateSlug) {
        throw new BadRequestException(`An outlet with slug "${dto.slug}" already exists.`);
      }
    }

    // Set first outlet as primary automatically if no other outlet exists
    const isPrimary = count === 0 ? true : !!dto.isPrimary;

    if (isPrimary) {
      // Unset previous primary outlets
      await this.prisma.outlet.updateMany({
        where: { restaurantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const serviceModels = this.validateServiceModels(dto.serviceModels);

    return this.prisma.outlet.create({
      data: {
        restaurantId,
        outletNumber: dto.outletNumber.trim(),
        name: dto.name.trim(),
        slug: dto.slug?.trim() || null,
        phone: dto.phone?.trim() || null,
        contactEmail: dto.contactEmail?.trim() || null,
        abn: dto.abn?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
        streetAddress: dto.streetAddress?.trim() || null,
        suburb: dto.suburb?.trim() || null,
        state: dto.state?.trim() || 'NSW',
        postcode: dto.postcode?.trim() || null,
        timezone: dto.timezone?.trim() || null,
        currency: dto.currency?.trim() || 'AUD',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        isPrimary,
        serviceModels,
      },
    });
  }

  async update(restaurantId: string, id: string, dto: UpdateOutletDto) {
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, restaurantId },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    // Uniqueness validations per tenant (excluding self)
    if (dto.outletNumber && dto.outletNumber.trim() !== outlet.outletNumber) {
      const duplicateNumber = await this.prisma.outlet.findFirst({
        where: { restaurantId, outletNumber: dto.outletNumber.trim(), id: { not: id } },
      });
      if (duplicateNumber) {
        throw new BadRequestException(`An outlet with number "${dto.outletNumber}" already exists.`);
      }
    }

    if (dto.name && dto.name.trim().toLowerCase() !== outlet.name.toLowerCase()) {
      const duplicateName = await this.prisma.outlet.findFirst({
        where: { restaurantId, name: { equals: dto.name.trim(), mode: 'insensitive' }, id: { not: id } },
      });
      if (duplicateName) {
        throw new BadRequestException(`An outlet with name "${dto.name}" already exists.`);
      }
    }

    if (dto.slug && dto.slug.trim().toLowerCase() !== (outlet.slug || '').toLowerCase()) {
      const duplicateSlug = await this.prisma.outlet.findFirst({
        where: { restaurantId, slug: { equals: dto.slug.trim(), mode: 'insensitive' }, id: { not: id } },
      });
      if (duplicateSlug) {
        throw new BadRequestException(`An outlet with slug "${dto.slug}" already exists.`);
      }
    }

    const isPrimary = dto.isPrimary !== undefined ? dto.isPrimary : outlet.isPrimary;

    if (isPrimary && !outlet.isPrimary) {
      // Unset previous primary outlets
      await this.prisma.outlet.updateMany({
        where: { restaurantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const serviceModels = dto.serviceModels 
      ? this.validateServiceModels(dto.serviceModels)
      : undefined;

    return this.prisma.outlet.update({
      where: { id },
      data: {
        ...(dto.outletNumber ? { outletNumber: dto.outletNumber.trim() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug?.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail?.trim() || null } : {}),
        ...(dto.abn !== undefined ? { abn: dto.abn?.trim() || null } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl?.trim() || null } : {}),
        ...(dto.streetAddress !== undefined ? { streetAddress: dto.streetAddress?.trim() || null } : {}),
        ...(dto.suburb !== undefined ? { suburb: dto.suburb?.trim() || null } : {}),
        ...(dto.state !== undefined ? { state: dto.state?.trim() || 'NSW' } : {}),
        ...(dto.postcode !== undefined ? { postcode: dto.postcode?.trim() || null } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone?.trim() || null } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency?.trim() || 'AUD' } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isPrimary !== undefined ? { isPrimary } : {}),
        ...(serviceModels !== undefined ? { serviceModels } : {}),
      },
    });
  }

  async updateServiceModels(restaurantId: string, id: string, serviceModels: string[]) {
    const models = this.validateServiceModels(serviceModels);

    const outlet = await this.prisma.outlet.findFirst({
      where: { id, restaurantId },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    return this.prisma.outlet.update({
      where: { id },
      data: { serviceModels: models },
    });
  }

  async delete(restaurantId: string, id: string) {
    const outlet = await this.prisma.outlet.findFirst({
      where: { id, restaurantId },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    if (outlet.isPrimary) {
      throw new BadRequestException('Cannot delete the primary outlet.');
    }

    await this.prisma.outlet.delete({
      where: { id },
    });

    return { success: true };
  }
}
