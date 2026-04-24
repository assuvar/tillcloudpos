export type PermissionMap = Record<string, string[]>;

export const buildPermissionMap = (codes: string[] | null | undefined): PermissionMap => {
  const grouped: PermissionMap = {};
  if (!codes || !Array.isArray(codes)) return grouped;

  for (const code of codes) {
    const [module, action] = code.split(':');
    if (!module || !action) continue;
    
    grouped[module] = grouped[module] || [];
    if (!grouped[module].includes(action)) {
      grouped[module].push(action);
    }
  }

  return grouped;
};

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';

export const ROLE_DEFAULT_CODES: Record<UserRole, string[]> = {
  ADMIN: [], // Handled by backend as full_access
  MANAGER: [
    'dashboard:view',
    'pos:view',
    'pos:create',
    'pos:edit',
    'kitchen:view',
    'menu:view',
    'menu:create',
    'menu:edit',
    'inventory:view',
    'inventory:edit',
    'customers:view',
    'customers:edit',
    'reports:view',
    'staff:view',
    'staff:edit',
    'settings:view',
  ],
  CASHIER: ['pos:view', 'pos:create', 'customers:view'],
  KITCHEN: ['kitchen:view', 'kitchen:edit'],
};

export const flattenPermissionMap = (
  map: PermissionMap | null | undefined,
): string[] => {
  if (!map) return [];
  const output: string[] = [];
  for (const [module, actions] of Object.entries(map)) {
    if (Array.isArray(actions)) {
      for (const action of actions) {
        output.push(`${module}:${action}`);
      }
    }
  }
  return Array.from(new Set(output));
};

export const resolveRolePermissionCodes = (
  role: UserRole,
  storedMap?: PermissionMap | null,
): string[] => {
  if (role === 'ADMIN') {
    return []; // Admin typically gets full_access codes from backend
  }

  const base = flattenPermissionMap(storedMap);

  if (!base || base.length === 0) {
    return ROLE_DEFAULT_CODES[role] || [];
  }

  return base;
};

export type PermissionGroup =
  | 'BILLING'
  | 'PAYMENTS'
  | 'RECEIPTS'
  | 'KITCHEN'
  | 'CUSTOMERS'
  | 'MENU'
  | 'INVENTORY'
  | 'REPORTS'
  | 'STAFF'
  | 'SETTINGS';

export const FRONTEND_PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',

  BILLING_CREATE: 'pos:create',
  BILLING_VOID: 'pos:delete',
  BILLING_DISCOUNT: 'pos:edit',
  BILLING_VIEW_OPEN: 'pos:view',

  PAYMENTS_CASH: 'pos:edit',
  PAYMENTS_CARD: 'pos:edit',
  PAYMENTS_SPLIT: 'pos:edit',
  PAYMENTS_DELIVERY_PAID: 'pos:edit',

  RECEIPTS_PRINT: 'pos:view',
  RECEIPTS_SMS: 'pos:edit',

  KITCHEN_SEND: 'kitchen:edit',
  KITCHEN_VIEW: 'kitchen:view',
  KITCHEN_MARK_READY: 'kitchen:edit',
  KITCHEN_BUMP: 'kitchen:edit',
  KITCHEN_RECALL: 'kitchen:edit',

  CUSTOMERS_LOOKUP: 'customers:view',
  CUSTOMERS_VIEW_PROFILES: 'customers:view',
  CUSTOMERS_VIEW_HISTORY: 'customers:view',
  CUSTOMERS_ADJUST_LOYALTY: 'customers:edit',

  MENU_ADD_EDIT_ITEMS: 'menu:edit',
  MENU_DELETE_ITEMS: 'menu:delete',
  MENU_ADD_EDIT_CATEGORIES: 'menu:edit',
  MENU_DELETE_CATEGORIES: 'menu:delete',
  MENU_HIDE_SHOW_ITEMS: 'menu:view',

  INVENTORY_VIEW_STOCK: 'inventory:view',
  INVENTORY_ADJUST_STOCK: 'inventory:edit',
  INVENTORY_VIEW_LOW_STOCK: 'inventory:view',

  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:create',

  STAFF_INVITE: 'staff:create',
  STAFF_VIEW: 'staff:view',
  STAFF_EDIT: 'staff:edit',
  STAFF_DEACTIVATE: 'staff:edit',
  STAFF_DELETE: 'staff:delete',

  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT_PROFILE: 'settings:edit',
  SETTINGS_EDIT_TAX: 'settings:edit',
  SETTINGS_EDIT_LOYALTY: 'settings:edit',
  SETTINGS_TYRO: 'settings:edit',
  SETTINGS_SMS_CREDITS: 'settings:edit',
  SETTINGS_TERMINALS: 'settings:edit',
  SETTINGS_CONFIGURE_PERMISSIONS: 'staff:full_access',
} as const;

export const getLandingPage = (
  _permissions: PermissionMap | string[] | null,
  role?: string,
): string => {
  if (role === 'KITCHEN') {
    return '/kitchen';
  }

  return '/dashboard';
};

const GROUP_TO_MODULE: Record<PermissionGroup, string> = {
  BILLING: 'pos',
  PAYMENTS: 'pos',
  RECEIPTS: 'pos',
  KITCHEN: 'kitchen',
  CUSTOMERS: 'customers',
  MENU: 'menu',
  INVENTORY: 'inventory',
  REPORTS: 'reports',
  STAFF: 'staff',
  SETTINGS: 'settings',
};

export const hasPermissionCode = (
  permissions: PermissionMap | string[] | null | undefined,
  code: string,
): boolean => {
  if (!permissions) return false;
  
  if (Array.isArray(permissions)) {
    if (permissions.includes(code)) return true;
    const [module] = code.split(':');
    return permissions.includes(`${module}:full_access`);
  }

  const [module, action] = code.split(':');
  if (!module || !action) {
    return false;
  }

  return canAccess(permissions, module, action);
};

export const canAccess = (
  permissions: PermissionMap | string[] | null | undefined,
  module: string,
  action: string,
): boolean => {
  if (!permissions) {
    return false;
  }

  if (Array.isArray(permissions)) {
    return permissions.includes(`${module}:${action}`) || permissions.includes(`${module}:full_access`);
  }

  const modulePermissions = permissions[module] || [];
  return (
    modulePermissions.includes('full_access') ||
    modulePermissions.includes(action)
  );
};

export const isGroupEnabled = (
  permissions: PermissionMap | string[] | null | undefined,
  group: PermissionGroup,
): boolean => {
  if (!permissions) {
    return false;
  }

  const moduleKey = GROUP_TO_MODULE[group];

  // Handle case where permissions are a string array (e.g. from Admin role)
  if (Array.isArray(permissions)) {
    return (
      permissions.includes(`${moduleKey}:view`) ||
      permissions.includes(`${moduleKey}:full_access`)
    );
  }

  // Handle case where permissions are a PermissionMap object
  const actions = permissions[moduleKey] || [];
  return actions.includes('view') || actions.includes('full_access') || actions.length > 0;
};

export const getPosExitRoute = (role?: string): string => {
  return role === 'KITCHEN' ? '/kitchen' : '/dashboard';
};
