import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':restaurantId')
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(restaurantId, createUserDto);
  }

  @Get(':restaurantId')
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.usersService.findAll(restaurantId);
  }

  @Get('user/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('user/:id')
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
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
