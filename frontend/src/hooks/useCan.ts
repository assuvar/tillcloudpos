import { hasPermissionCode } from "../permissions";
import { usePermissions } from "../context/PermissionProvider";

/**
 * Hook to check if the current user has a specific permission.
 * Usage: 
 *   const can = useCan();
 *   if (can("pos:create")) { ... }
 */
export const useCan = () => {
  const { permissions } = usePermissions();

  return (code: string): boolean => {
    return hasPermissionCode(permissions, code);
  };
};
