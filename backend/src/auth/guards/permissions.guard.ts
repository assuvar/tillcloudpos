import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  getDefaultPermissionMapForRole,
  PermissionCode,
  resolveRolePermissionCodes,
  sanitizePermissionMap,
  UserRole,
} from '../permissions/permissions.constants';

type RequestUser = {
  userId: string;
  role: UserRole;
  restaurantId: string;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user?.userId || !user.role || !user.restaurantId) {
      return false;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        role: true,
        restaurantId: true,
        isActive: true,
      },
    });

    if (!dbUser?.isActive || dbUser.restaurantId !== user.restaurantId) {
      return false;
    }

    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        restaurantId_role: {
          restaurantId: user.restaurantId,
          role: dbUser.role,
        },
      },
      select: {
        permissions: true,
      },
    });

    const stored = sanitizePermissionMap(
      rolePermission?.permissions || getDefaultPermissionMapForRole(dbUser.role as UserRole),
    );

    const granted = resolveRolePermissionCodes(
      dbUser.role as UserRole,
      sanitizePermissionMap(stored),
    );

    return requiredPermissions.every((permission) =>
      granted.includes(permission as PermissionCode),
    );
  }
}
