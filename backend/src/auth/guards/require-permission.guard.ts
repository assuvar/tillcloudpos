import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  REQUIRE_PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/require-permission.decorator';
import {
  getDefaultPermissionMapForRole,
  hasPermissionCode,
  PermissionCode,
  resolveRolePermissionCodes,
  sanitizePermissionMap,
  UserRole,
} from '../permissions/permissions.constants';

type RequestUser = {
  userId: string;
  restaurantId: string;
};

/**
 * Permission-Driven Access Control Guard (PBAC)
 *
 * IMPORTANT: This guard implements PBAC where access is ONLY determined by permissions.
 * There is NO role-based blocking and NO fallback logic.
 *
 * Access rule: User can access endpoint ONLY if they have the required permission.
 */
@Injectable()
export class RequirePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permission from decorator
    const requiredPermission = this.reflector.get<
      RequiredPermission | undefined
    >(REQUIRE_PERMISSION_KEY, context.getHandler());

    // If no permission decorator, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user?.userId || !user.restaurantId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      select: {
        role: true,
        restaurantId: true,
        isActive: true,
        permissions: true,
      },
    });

    if (!dbUser?.isActive || dbUser.restaurantId !== user.restaurantId) {
      throw new ForbiddenException(
        `You do not have permission to perform ${requiredPermission.module}:${requiredPermission.action}`,
      );
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

    const requiredCode =
      `${requiredPermission.module}:${requiredPermission.action}` as PermissionCode;
    const hasPermission = hasPermissionCode(granted, requiredCode);

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to perform ${requiredPermission.module}:${requiredPermission.action}`,
      );
    }

    return true;
  }
}
