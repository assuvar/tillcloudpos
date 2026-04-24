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
  buildPermissionMap,
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

    const dbUser = (await this.prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      select: {
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
      throw new ForbiddenException(
        `You do not have permission to perform ${requiredPermission.module}:${requiredPermission.action}`,
      );
    }

    const staffPermissionCodes = dbUser.staffPermissions.map((sp: any) => sp.code);
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
