import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOWED_SERVICE_MODELS } from '../restaurant/restaurant.constants';

type MissingStep = 'business' | 'serviceModel';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getTenantContext(userId: string, restaurantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        restaurantId,
      },
      select: {
        id: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found in restaurant context');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        onboardingCompleted: true,
        name: true,
        streetAddress: true,
        suburb: true,
        state: true,
        postcode: true,
        phone: true,
        serviceModels: true,
      },
    });

    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }

    return { user, restaurant };
  }

  private normalizeAndValidateServiceModels(
    serviceModels: unknown[],
    options?: { throwOnInvalid?: boolean },
  ) {
    const normalized = Array.from(
      new Set(
        serviceModels
          .map((value) => String(value).trim().toUpperCase())
          .filter((value) => value.length > 0),
      ),
    );

    const invalid = normalized.filter(
      (value) => !ALLOWED_SERVICE_MODELS.includes(value as any),
    );

    if (invalid.length > 0 && options?.throwOnInvalid) {
      throw new BadRequestException(
        `Invalid serviceModels: ${invalid.join(', ')}. Allowed values: ${ALLOWED_SERVICE_MODELS.join(', ')}`,
      );
    }

    return normalized.filter((value) =>
      ALLOWED_SERVICE_MODELS.includes(value as any),
    );
  }

  private getMissingSteps(restaurant: {
    onboardingCompleted: boolean;
    name: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
    phone: string | null;
    serviceModels: string[];
  }): MissingStep[] {
    const missingSteps: MissingStep[] = [];
    const hasBusinessFields =
      !!restaurant.name?.trim() &&
      !!restaurant.streetAddress?.trim() &&
      !!restaurant.phone?.trim();

    if (!hasBusinessFields) {
      missingSteps.push('business');
    }

    const hasServiceModelArray = Array.isArray(restaurant.serviceModels);
    const normalizedServiceModels = hasServiceModelArray
      ? this.normalizeAndValidateServiceModels(restaurant.serviceModels, {
          throwOnInvalid: false,
        })
      : [];
    const hasServiceModels = normalizedServiceModels.length > 0;

    if (!hasServiceModels) {
      missingSteps.push('serviceModel');
    }

    return missingSteps;
  }

  async getStatus(userId: string, restaurantId: string) {
    this.logger.debug(
      `Onboarding status requested for user=${userId} restaurant=${restaurantId}`,
    );

    const { user, restaurant } = await this.getTenantContext(userId, restaurantId);
    const missingSteps = this.getMissingSteps(restaurant);
    const onboardingCompleted =
      restaurant.onboardingCompleted && missingSteps.length === 0;

    if (restaurant.onboardingCompleted !== onboardingCompleted) {
      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { onboardingCompleted },
      });
    }

    if (user.onboardingCompleted !== onboardingCompleted) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompleted },
      });
    }

    return {
      onboardingCompleted,
      missingSteps,
    };
  }

  async complete(userId: string, restaurantId: string) {
    this.logger.log(
      `Onboarding completion triggered for user=${userId} restaurant=${restaurantId}`,
    );

    const { user, restaurant } = await this.getTenantContext(userId, restaurantId);
    this.normalizeAndValidateServiceModels(restaurant.serviceModels || [], {
      throwOnInvalid: true,
    });
    const missingSteps = this.getMissingSteps(restaurant);

    if (missingSteps.length > 0) {
      this.logger.warn(
        `Onboarding completion validation failed for user=${userId} restaurant=${restaurantId} missingSteps=${missingSteps.join(',')}`,
      );
      throw new BadRequestException({
        message: 'Mandatory onboarding steps are incomplete',
        missingSteps,
      });
    }

    await this.prisma.$transaction([
      this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { onboardingCompleted: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true },
      }),
    ]);

    return {
      onboardingCompleted: true,
      missingSteps: [],
    };
  }
}