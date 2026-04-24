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
  buildPermissionMap,
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

    const dbUser = (await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isActive: true,
        permissions: true,
        staffPermissions: {
          select: {
            code: true,
          },
        },
      },
    })) as any;

    if (!dbUser?.isActive || dbUser.restaurantId !== user.restaurantId) {
      return false;
    }

    const staffPermissionCodes = dbUser.staffPermissions.map(
      (sp: any) => sp.code,
    );
    const sanitizedUserPermissions = sanitizePermissionMap(dbUser.permissions);

    let granted: PermissionCode[] = [];

    if (staffPermissionCodes.length > 0) {
      granted = resolveRolePermissionCodes(
        dbUser.role as UserRole,
        buildPermissionMap(staffPermissionCodes),
      );
    } else if (Object.keys(sanitizedUserPermissions).length > 0) {
      granted = resolveRolePermissionCodes(
        dbUser.role as UserRole,
        sanitizedUserPermissions,
      );
    } else {
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

      const sanitizedRole = sanitizePermissionMap(rolePermission?.permissions);
      const effectiveRoleMap =
        Object.keys(sanitizedRole).length > 0
          ? sanitizedRole
          : getDefaultPermissionMapForRole(dbUser.role as UserRole);

      granted = resolveRolePermissionCodes(
        dbUser.role as UserRole,
        effectiveRoleMap,
      );
    }

    return requiredPermissions.every((permission) =>
      hasPermissionCode(granted, permission as PermissionCode),
    );
  }
}
