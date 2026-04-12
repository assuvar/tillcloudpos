import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EDITABLE_PERMISSION_ROLES,
  getDefaultPermissionMapForRole,
  PERMISSION_CATALOG,
  PERMISSION_ROLES,
  PermissionMap,
  sanitizePermissionMap,
  UserRole,
} from '../auth/permissions/permissions.constants';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  getCatalog() {
    return {
      roles: {
        editable: EDITABLE_PERMISSION_ROLES,
        readOnly: PERMISSION_ROLES.filter(
          (role) => !EDITABLE_PERMISSION_ROLES.includes(role),
        ),
      },
      groups: PERMISSION_CATALOG,
    };
  }

  private ensureValidRole(role: string): UserRole {
    if (!PERMISSION_ROLES.includes(role as UserRole)) {
      throw new BadRequestException('Invalid role');
    }
    return role as UserRole;
  }

  private ensureEditableRole(role: UserRole) {
    if (!EDITABLE_PERMISSION_ROLES.includes(role)) {
      throw new BadRequestException('This role is read-only');
    }
  }

  async getRolePermissions(restaurantId: string, roleInput: string) {
    const role = this.ensureValidRole(roleInput);

    const persisted = await this.prisma.rolePermission.findUnique({
      where: {
        restaurantId_role: {
          restaurantId,
          role,
        },
      },
      select: {
        permissions: true,
        updatedAt: true,
      },
    });

    const effectivePermissions = sanitizePermissionMap(
      (persisted?.permissions as PermissionMap | undefined) ||
        getDefaultPermissionMapForRole(role),
    );

    return {
      role,
      editable: EDITABLE_PERMISSION_ROLES.includes(role),
      permissions: effectivePermissions,
      updatedAt: persisted?.updatedAt || null,
    };
  }

  async updateRolePermissions(
    restaurantId: string,
    roleInput: string,
    payload: Record<string, string[]>,
  ) {
    const role = this.ensureValidRole(roleInput);
    this.ensureEditableRole(role);

    const sanitized = sanitizePermissionMap(payload);

    const updated = await this.prisma.rolePermission.upsert({
      where: {
        restaurantId_role: {
          restaurantId,
          role,
        },
      },
      create: {
        restaurantId,
        role,
        permissions: sanitized,
      },
      update: {
        permissions: sanitized,
      },
      select: {
        role: true,
        permissions: true,
        updatedAt: true,
      },
    });

    return {
      role: updated.role,
      editable: true,
      permissions: sanitizePermissionMap(updated.permissions),
      updatedAt: updated.updatedAt,
    };
  }
}
