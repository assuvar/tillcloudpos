import {
  BadRequestException,
  Controller,
  ForbiddenException,
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
import { PermissionsService } from '../permissions/permissions.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  PERMISSIONS,
  buildPermissionMap,
  flattenPermissionMap,
} from '../auth/permissions/permissions.constants';
import { ALLOWED_SERVICE_MODELS } from '../restaurant/restaurant.constants';

type AuthenticatedRequest = {
  user?: {
    userId: string;
    restaurantId: string;
  };
};

const getRestaurantId = (req: AuthenticatedRequest) => {
  const restaurantId = req.user?.restaurantId;
  if (!restaurantId) {
    throw new ForbiddenException('Restaurant context is required');
  }
  return restaurantId;
};

const getUserId = (req: AuthenticatedRequest) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ForbiddenException('User context is required');
  }
  return userId;
};

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post(':restaurantId')
  @RequirePermissions(PERMISSIONS.STAFF_INVITE)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(getRestaurantId(req), createUserDto);
  }

  @Get(':restaurantId')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.usersService.findAll(getRestaurantId(req));
  }

  @Get(':id/permissions')
  @RequirePermissions(PERMISSIONS.SETTINGS_CONFIGURE_PERMISSIONS)
  getUserPermissions(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.permissionsService.getStaffPermissions(
      getRestaurantId(req),
      id,
    );
  }

  @Patch(':id/permissions')
  @RequirePermissions(PERMISSIONS.SETTINGS_CONFIGURE_PERMISSIONS)
  async updateUserPermissions(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, string[]>,
  ) {
    const restaurantId = getRestaurantId(req);
    console.log(`[Permissions] Updating user ${id} in restaurant ${restaurantId}`);
    console.log(`[Permissions] Payload:`, body);

    // Handle both direct and wrapped { permissions: Map } payloads
    const permissionsData = (body as any).permissions && typeof (body as any).permissions === 'object' && !Array.isArray((body as any).permissions)
      ? (body as any).permissions
      : body;

    // Convert object format { module: ["action"] } to flat array ["module:action"]
    const flattenedPermissions = Object.entries(permissionsData).flatMap(
      ([module, actions]) =>
        Array.isArray(actions) ? actions.map((action) => `${module}:${action}`) : [],
    );

    // Convert flat array ["module:action"] to Map { module: ["action"] }
    const permissionMap = buildPermissionMap(flattenedPermissions);

    const result = await this.permissionsService.updateStaffPermissions(
      restaurantId,
      id,
      permissionMap,
    );

    console.log(
      `[Permissions] UPDATE COMPLETED for user ${id}. New codes:`,
      flattenPermissionMap(result.permissions),
    );

    console.log(
      `[Permissions] Stored permissions for ${id}:`,
      result.permissions,
    );

    return {
      userId: result.staffId,
      permissions: flattenPermissionMap(result.permissions),
    };
  }

  @Get('user/:id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const user = await this.usersService.findOneInRestaurant(
      id,
      getRestaurantId(req),
    );
    if (!user) {
      throw new BadRequestException('User not found in restaurant context');
    }
    return user;
  }

  @Patch('user/:id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateInRestaurant(
      id,
      getRestaurantId(req),
      updateUserDto,
    );
  }

  @Patch('onboarding/:id')
  async completeOnboarding(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() onboardingData: any,
  ) {
    const restaurantId = getRestaurantId(req);
    const authenticatedUserId = getUserId(req);
    if (authenticatedUserId !== id) {
      throw new ForbiddenException(
        'Cannot complete onboarding for another user',
      );
    }

    // Update user onboarding flag
    await this.usersService.updateInRestaurant(id, restaurantId, {
      onboardingCompleted: true,
      fullName: onboardingData.fullName,
    } as any);

    // Update restaurant if details provided
    const user = await this.usersService.findOneInRestaurant(id, restaurantId);
    if (user && user.restaurantId && onboardingData.restaurantData) {
      if (Array.isArray(onboardingData.restaurantData.serviceModels)) {
        const normalizedServiceModels = Array.from(
          new Set(
            onboardingData.restaurantData.serviceModels
              .map((value: unknown) => String(value).trim().toUpperCase())
              .filter((value: string) => value.length > 0),
          ),
        );

        const invalidServiceModels = normalizedServiceModels.filter(
          (value) => !ALLOWED_SERVICE_MODELS.includes(value as any),
        );

        if (invalidServiceModels.length > 0) {
          throw new BadRequestException(
            `Invalid serviceModels: ${invalidServiceModels.join(', ')}. Allowed values: ${ALLOWED_SERVICE_MODELS.join(', ')}`,
          );
        }

        onboardingData.restaurantData.serviceModels = normalizedServiceModels;
      }

      await (this.usersService as any).prisma.restaurant.update({
        where: { id: user.restaurantId },
        data: onboardingData.restaurantData,
      });
    }

    return { success: true };
  }

  @Delete('user/:id')
  @RequirePermissions(PERMISSIONS.STAFF_DELETE)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.removeInRestaurant(id, getRestaurantId(req));
  }
}
