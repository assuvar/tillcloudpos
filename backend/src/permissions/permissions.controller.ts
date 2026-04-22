import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import {
  RoleParamDto,
  UpdateRolePermissionsDto,
} from './dto/update-role-permissions.dto';
import { PermissionsService } from './permissions.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
    restaurantId: string;
  };
};

@Controller('permissions')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('me')
  getMyPermissions(@Req() req: AuthenticatedRequest) {
    return this.permissionsService.getMyPermissions(
      req.user.restaurantId,
      req.user.userId,
    );
  }

  @Get('catalog')
  @RequirePermissions(PERMISSIONS.SETTINGS_CONFIGURE_PERMISSIONS)
  getCatalog() {
    return this.permissionsService.getCatalog();
  }

  @Get(':role')
  getRolePermissions(
    @Req() req: AuthenticatedRequest,
    @Param() params: RoleParamDto,
  ) {
    const requesterRole = req.user.role;
    const isOwnRole = requesterRole === params.role;
    const canReadOtherRoles =
      requesterRole === 'ADMIN' || requesterRole === 'MANAGER';

    if (!isOwnRole && !canReadOtherRoles) {
      throw new ForbiddenException(
        'You can only access permissions for your role',
      );
    }

    return this.permissionsService.getRolePermissions(
      req.user.restaurantId,
      params.role,
    );
  }

  @Patch(':role')
  @RequirePermissions(PERMISSIONS.SETTINGS_CONFIGURE_PERMISSIONS)
  updateRolePermissions(
    @Req() req: AuthenticatedRequest,
    @Param() params: RoleParamDto,
    @Body() body: UpdateRolePermissionsDto,
  ) {
    return this.permissionsService.updateRolePermissions(
      req.user.restaurantId,
      params.role,
      body.permissions,
    );
  }
}
