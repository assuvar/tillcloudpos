import { SetMetadata } from '@nestjs/common';

export type RequiredPermission = {
  module: string;
  action: string;
};

export const REQUIRE_PERMISSION_KEY = 'require_permission';

export const RequirePermission = (module: string, action: string) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, {
    module,
    action,
  } satisfies RequiredPermission);
