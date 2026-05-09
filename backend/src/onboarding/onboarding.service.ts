import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOWED_SERVICE_MODELS } from '../restaurant/restaurant.constants';
import { MailService } from '../mail/mail.service';

type MissingStep = 'business' | 'serviceModel' | 'emailVerification';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly lastReminderSent = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private async getTenantContext(userId: string, restaurantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        restaurantId,
      },
      select: {
        id: true,
        emailVerified: true,
        onboardingCompleted: true,
        email: true,
        fullName: true,
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
        businessType: true,
        abn: true,
        streetAddress: true,
        suburb: true,
        state: true,
        postcode: true,
        phone: true,
        contactEmail: true,
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

  private getMissingSteps(
    restaurant: {
      onboardingCompleted: boolean;
      name: string;
      businessType: string;
      abn: string | null;
      streetAddress: string;
      suburb: string;
      state: string;
      postcode: string;
      phone: string | null;
      contactEmail: string | null;
    },
    user: {
      emailVerified: boolean;
    },
    hasOutletServiceModels: boolean,
  ): MissingStep[] {
    const missingSteps: MissingStep[] = [];
    const hasBusinessFields =
      !!restaurant.name?.trim() &&
      !!restaurant.businessType?.trim() &&
      !!restaurant.abn?.trim() &&
      !!restaurant.streetAddress?.trim() &&
      !!restaurant.suburb?.trim() &&
      !!restaurant.state?.trim() &&
      !!restaurant.postcode?.trim() &&
      !!restaurant.phone?.trim() &&
      !!restaurant.contactEmail?.trim();

    if (!hasBusinessFields) {
      missingSteps.push('business');
    }

    if (!hasOutletServiceModels) {
      missingSteps.push('serviceModel');
    }

    if (!user.emailVerified) {
      missingSteps.push('emailVerification');
    }

    return missingSteps;
  }

  async getStatus(userId: string, restaurantId: string) {
    this.logger.debug(
      `Onboarding status requested for user=${userId} restaurant=${restaurantId}`,
    );

    const { user, restaurant } = await this.getTenantContext(
      userId,
      restaurantId,
    );

    // Fetch primary outlet to verify its service models configurations
    const primaryOutlet = await this.prisma.outlet.findFirst({
      where: { restaurantId, isPrimary: true },
      select: { serviceModels: true },
    });
    const hasOutletServiceModels =
      !!primaryOutlet && primaryOutlet.serviceModels.length > 0;

    const missingSteps = this.getMissingSteps(
      restaurant,
      user,
      hasOutletServiceModels,
    );
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

    if (missingSteps.includes('business')) {
      void this.triggerOnboardingReminderEmail(user.email, user.fullName, {
        id: restaurant.id,
        name: restaurant.name,
      });
    }

    return {
      onboardingCompleted,
      missingSteps,
    };
  }

  private async triggerOnboardingReminderEmail(
    userEmail: string,
    userName: string,
    restaurant: { id: string; name: string },
  ) {
    const now = Date.now();
    const lastSent = this.lastReminderSent.get(restaurant.id) || 0;
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    if (now - lastSent < TWELVE_HOURS) {
      return; // Throttled
    }

    this.lastReminderSent.set(restaurant.id, now);

    const recipient = userEmail.trim().toLowerCase();
    const subject =
      'Action Required: Complete your TillCloud Business Profile Setup';
    const text = `Hi ${userName},\n\nYour TillCloud Business Profile setup is incomplete. Please complete your setup to access the TillCloud POS workspace and features.\n\nBest regards,\nThe TillCloud Team`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0c1424; margin-bottom: 24px;">Complete your TillCloud Setup</h2>
        <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">It looks like your **TillCloud Business Profile** details are incomplete. To unlock your full billing counter and management workspace, please make sure to fill out your business profile details.</p>
        <div style="margin: 32px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/onboarding" style="display: inline-block; background-color: #0b1b3d; color: white; padding: 12px 28px; border-radius: 9999px; font-weight: bold; text-decoration: none; font-size: 14px;">Complete Onboarding Setup</a>
        </div>
        <p style="font-size: 14px; color: #718096;">If you have any questions, feel free to reply to this email.</p>
        <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">&copy; 2026 TillCloud POS. All rights reserved.</p>
      </div>
    `;

    try {
      await this.mailService.sendMail(recipient, subject, text, html);
      this.logger.log(
        `Onboarding reminder email sent to ${recipient} for restaurant ${restaurant.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send onboarding reminder email to ${recipient}`,
        err.stack,
      );
    }
  }

  async complete(userId: string, restaurantId: string) {
    this.logger.log(
      `Onboarding completion triggered for user=${userId} restaurant=${restaurantId}`,
    );

    const { user, restaurant } = await this.getTenantContext(
      userId,
      restaurantId,
    );

    const primaryOutlet = await this.prisma.outlet.findFirst({
      where: { restaurantId, isPrimary: true },
      select: { serviceModels: true },
    });
    const hasOutletServiceModels =
      !!primaryOutlet && primaryOutlet.serviceModels.length > 0;

    const missingSteps = this.getMissingSteps(
      restaurant,
      user,
      hasOutletServiceModels,
    );

    if (missingSteps.length > 0) {
      const details = {
        business:
          !restaurant.name ||
          !restaurant.businessType ||
          !restaurant.abn ||
          !restaurant.streetAddress ||
          !restaurant.suburb ||
          !restaurant.state ||
          !restaurant.postcode ||
          !restaurant.phone ||
          !restaurant.contactEmail,
        serviceModel: !hasOutletServiceModels,
        emailVerification: !user.emailVerified,
      };

      this.logger.warn(
        `Onboarding COMPLETION BLOCKED for user=${userId} restaurant=${restaurantId}. Missing Steps: [${missingSteps.join(', ')}]. ` +
          `Details: ${JSON.stringify(details)}`,
      );

      throw new BadRequestException({
        message: 'Mandatory onboarding steps are incomplete',
        missingSteps,
        details,
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
