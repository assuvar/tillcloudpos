import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';

type AuthenticatedRequest = {
  user?: {
    restaurantId: string;
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':restaurantId')
  @RequirePermissions(PERMISSIONS.STAFF_INVITE)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(
      req.user?.restaurantId || '',
      createUserDto,
    );
  }

  @Get(':restaurantId')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.usersService.findAll(req.user?.restaurantId || '');
  }

  @Get('user/:id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('user/:id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('onboarding/:id')
  async completeOnboarding(
    @Param('id') id: string,
    @Body() onboardingData: any,
  ) {
    // Update user onboarding flag
    await this.usersService.update(id, {
      onboardingCompleted: true,
      fullName: onboardingData.fullName,
    } as any);

    // Update restaurant if details provided
    const user = await this.usersService.findOne(id);
    if (user && user.restaurantId && onboardingData.restaurantData) {
      await (this.usersService as any).prisma.restaurant.update({
        where: { id: user.restaurantId },
        data: onboardingData.restaurantData,
      });
    }

    return { success: true };
  }

  @Delete('user/:id')
  @RequirePermissions(PERMISSIONS.STAFF_DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
