import { IsIn, IsObject } from 'class-validator';
import { PERMISSION_ROLES } from '../../auth/permissions/permissions.constants';
import type { UserRole } from '../../auth/permissions/permissions.constants';

export class RoleParamDto {
  @IsIn(PERMISSION_ROLES)
  role!: UserRole;
}

export class UpdateRolePermissionsDto {
  @IsObject()
  permissions!: Record<string, string[]>;
}
