import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  hasPermissionCode,
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
        id: true,
        role: true,
        restaurantId: true,
        isActive: true,
        permissions: true,
      },
    });

    if (!dbUser?.isActive || dbUser.restaurantId !== user.restaurantId) {
      return false;
    }

    const sanitizedUserPermissions = sanitizePermissionMap(dbUser.permissions);

    let stored = sanitizedUserPermissions;
    if (Object.keys(stored).length === 0) {
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

      const sanitizedStored = sanitizePermissionMap(
        rolePermission?.permissions,
      );
      stored =
        Object.keys(sanitizedStored).length > 0
          ? sanitizedStored
          : getDefaultPermissionMapForRole(dbUser.role as UserRole);
    }

    const granted = resolveRolePermissionCodes(
      dbUser.role as UserRole,
      sanitizePermissionMap(stored),
    );

    return requiredPermissions.every((permission) =>
      hasPermissionCode(granted, permission as PermissionCode),
    );
  }
}
