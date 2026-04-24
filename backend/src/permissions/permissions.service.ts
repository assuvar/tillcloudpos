import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import {
  EDITABLE_PERMISSION_ROLES,
  getDefaultPermissionMapForRole,
  PERMISSION_CATALOG,
  PERMISSION_ROLES,
  PermissionMap,
  sanitizePermissionMap,
  UserRole,
  buildPermissionMap,
  flattenPermissionMap,
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

    const sanitizedPersisted = sanitizePermissionMap(
      persisted?.permissions as PermissionMap | undefined,
    );

    const effectivePermissions =
      Object.keys(sanitizedPersisted).length > 0
        ? sanitizedPersisted
        : getDefaultPermissionMapForRole(role);

    return {
      role,
      editable: EDITABLE_PERMISSION_ROLES.includes(role),
      permissions: effectivePermissions,
      updatedAt: persisted?.updatedAt || null,
    };
  }

  async getStaffPermissions(restaurantId: string, staffId: string) {
    const staff = (await this.prisma.user.findFirst({
      where: {
        id: staffId,
        restaurantId,
      },
      select: {
        id: true,
        role: true,
        permissions: true,
        staffPermissions: {
          select: {
            code: true,
          },
        },
      },
    })) as any;

    if (!staff) {
      throw new BadRequestException('Staff member not found');
    }

    // Convert StaffPermission relation to PermissionMap format
    const staffPermissionCodes = staff.staffPermissions.map(
      (sp: any) => sp.code,
    );
    const relationalMap = buildPermissionMap(staffPermissionCodes);

    // Fallback to legacy JSON for migration safety (if relational is empty)
    const sanitizedUserPermissions = sanitizePermissionMap(
      staff.permissions as PermissionMap | undefined,
    );

    const hasUserOverride =
      staffPermissionCodes.length > 0 ||
      Object.keys(sanitizedUserPermissions).length > 0;

    let effectivePermissions: PermissionMap;
    if (staffPermissionCodes.length > 0) {
      effectivePermissions = relationalMap;
    } else if (Object.keys(sanitizedUserPermissions).length > 0) {
      effectivePermissions = sanitizedUserPermissions;
    } else {
      const rolePermission = await this.prisma.rolePermission.findUnique({
        where: {
          restaurantId_role: {
            restaurantId,
            role: staff.role,
          },
        },
        select: {
          permissions: true,
        },
      });

      const sanitizedRole = sanitizePermissionMap(
        rolePermission?.permissions as PermissionMap | undefined,
      );

      effectivePermissions =
        Object.keys(sanitizedRole).length > 0
          ? sanitizedRole
          : getDefaultPermissionMapForRole(staff.role as UserRole);
    }

    // Special Business Rule: Cashier must not have dashboard access
    if (staff.role === 'CASHIER') {
      delete effectivePermissions['dashboard'];
    }

    console.log(
      `[Permissions] Resolved permissions for ${staffId} (${staff.role}). Override: ${hasUserOverride}. Codes: ${flattenPermissionMap(effectivePermissions).length}`,
    );

    return {
      staffId,
      role: staff.role,
      inheritedFromRole: !hasUserOverride,
      permissions: effectivePermissions,
    };
  }

  async getMyPermissions(restaurantId: string, userId: string) {
    return this.getStaffPermissions(restaurantId, userId);
  }

  async updateStaffPermissions(
    restaurantId: string,
    staffId: string,
    payload: Record<string, string[]>,
  ) {
    const staff = (await this.prisma.user.findFirst({
      where: {
        id: staffId,
        restaurantId,
      },
      select: {
        id: true,
        role: true,
      },
    })) as any;

    if (!staff) {
      throw new BadRequestException('Staff member not found');
    }

    const sanitized = sanitizePermissionMap(payload);

    // Special Business Rule: Cashier must not have dashboard access
    if (staff.role === 'CASHIER') {
      delete sanitized['dashboard'];
    }

    const codes = flattenPermissionMap(sanitized);
    console.log(
      `[Permissions] Updating permissions for user ${staffId}. Codes count: ${codes.length}`,
    );

    if (codes.length === 0) {
      console.warn(
        `[Permissions] WARNING: Resulting permission list for user ${staffId} is EMPTY. This will remove ALL access if no role fallback exists.`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. DELETE existing permissions for that user (STRICT SYNC)
      await (tx as any).staffPermission.deleteMany({
        where: { userId: staffId },
      });

      // 2. INSERT new permission records
      if (codes.length > 0) {
        await (tx as any).staffPermission.createMany({
          data: codes.map((code: string) => ({
            userId: staffId,
            code,
          })),
        });
      }

      // 3. Clear legacy JSON permissions to fully migrate
      await tx.user.update({
        where: { id: staffId },
        data: { permissions: Prisma.DbNull },
      });

      return codes;
    });

    return {
      staffId: staff.id,
      role: staff.role,
      inheritedFromRole: result.length === 0,
      permissions: buildPermissionMap(result),
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
