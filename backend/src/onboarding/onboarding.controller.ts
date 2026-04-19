import { Controller, Get, Post, Req } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    restaurantId: string;
  };
};

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  getStatus(@Req() req: AuthenticatedRequest) {
    return this.onboardingService.getStatus(
      req.user.userId,
      req.user.restaurantId,
    );
  }

  @Post('complete')
  complete(@Req() req: AuthenticatedRequest) {
    return this.onboardingService.complete(
      req.user.userId,
      req.user.restaurantId,
    );
  }
}
