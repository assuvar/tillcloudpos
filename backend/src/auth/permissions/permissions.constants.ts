export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';

export const PERMISSION_ROLES: UserRole[] = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'KITCHEN',
];

export const EDITABLE_PERMISSION_ROLES: UserRole[] = [
  'MANAGER',
  'CASHIER',
  'KITCHEN',
];

export const PERMISSION_MODULES = [
  'dashboard',
  'pos',
  'kitchen',
  'menu',
  'inventory',
  'customers',
  'reports',
  'staff',
  'settings',
] as const;

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'full_access',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionCode = `${PermissionModule}:${PermissionAction}`;

export type PermissionMap = Partial<
  Record<PermissionModule, PermissionAction[]>
>;

const toCode = (
  module: PermissionModule,
  action: PermissionAction,
): PermissionCode => `${module}:${action}`;

export const PERMISSION_CATALOG: Record<
  PermissionModule,
  {
    label: string;
    description: string;
    actions: Array<{ key: PermissionAction; label: string }>;
  }
> = {
  dashboard: {
    label: 'Dashboard',
    description: 'Main dashboard and overview widgets.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  pos: {
    label: 'POS',
    description: 'Billing and checkout terminal operations.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  kitchen: {
    label: 'Kitchen',
    description: 'Kitchen display and order workflow actions.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'edit', label: 'Edit' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  menu: {
    label: 'Menu',
    description: 'Menu categories, items, and visibility.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  inventory: {
    label: 'Inventory',
    description: 'Stock, movements, and low-stock visibility.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  customers: {
    label: 'Customers',
    description: 'Customer records and loyalty operations.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  reports: {
    label: 'Reports',
    description: 'Sales and analytics reports.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  staff: {
    label: 'Staff',
    description: 'Staff directory and permission administration.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
  settings: {
    label: 'Settings',
    description: 'Restaurant and system configuration.',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'edit', label: 'Edit' },
      { key: 'full_access', label: 'Full access' },
    ],
  },
};

const allPermissionCodes: PermissionCode[] = PERMISSION_MODULES.flatMap(
  (module) =>
    PERMISSION_CATALOG[module].actions.map((action) =>
      toCode(module, action.key),
    ),
);

const managerDefaultCodes: PermissionCode[] = [
  toCode('dashboard', 'view'),
  toCode('pos', 'view'),
  toCode('pos', 'create'),
  toCode('pos', 'edit'),
  toCode('kitchen', 'view'),
  toCode('menu', 'view'),
  toCode('menu', 'create'),
  toCode('menu', 'edit'),
  toCode('inventory', 'view'),
  toCode('inventory', 'edit'),
  toCode('customers', 'view'),
  toCode('customers', 'edit'),
  toCode('reports', 'view'),
  toCode('staff', 'view'),
  toCode('staff', 'edit'),
  toCode('settings', 'view'),
];

const cashierDefaultCodes: PermissionCode[] = [
  toCode('pos', 'view'),
  toCode('pos', 'create'),
  toCode('customers', 'view'),
];

const kitchenDefaultCodes: PermissionCode[] = [
  toCode('kitchen', 'view'),
  toCode('kitchen', 'edit'),
];

export const ROLE_DEFAULT_CODES: Record<UserRole, PermissionCode[]> = {
  ADMIN: PERMISSION_MODULES.map((module) => toCode(module, 'full_access')),
  MANAGER: managerDefaultCodes,
  CASHIER: cashierDefaultCodes,
  KITCHEN: kitchenDefaultCodes,
};

export const PERMISSIONS = {
  BILLING_CREATE: toCode('pos', 'create'),
  BILLING_VOID: toCode('pos', 'delete'),
  BILLING_DISCOUNT: toCode('pos', 'edit'),
  BILLING_VIEW_OPEN: toCode('pos', 'view'),
  BILLING_MANAGE: toCode('pos', 'full_access'),

  PAYMENTS_CASH: toCode('pos', 'edit'),
  PAYMENTS_CARD: toCode('pos', 'edit'),
  PAYMENTS_SPLIT: toCode('pos', 'edit'),
  PAYMENTS_MARK_DELIVERY_PAID: toCode('pos', 'edit'),

  RECEIPTS_PRINT: toCode('pos', 'view'),
  RECEIPTS_SMS: toCode('pos', 'edit'),

  KITCHEN_SEND: toCode('kitchen', 'edit'),
  KITCHEN_VIEW: toCode('kitchen', 'view'),
  KITCHEN_MARK_READY: toCode('kitchen', 'edit'),
  KITCHEN_BUMP: toCode('kitchen', 'edit'),
  KITCHEN_RECALL: toCode('kitchen', 'edit'),

  CUSTOMERS_LOOKUP: toCode('customers', 'view'),
  CUSTOMERS_VIEW_PROFILES: toCode('customers', 'view'),
  CUSTOMERS_VIEW_HISTORY: toCode('customers', 'view'),
  CUSTOMERS_ADJUST_LOYALTY: toCode('customers', 'edit'),

  MENU_VIEW: toCode('menu', 'view'),
  MENU_EDIT_ITEMS: toCode('menu', 'edit'),
  MENU_DELETE_ITEMS: toCode('menu', 'delete'),
  MENU_EDIT_CATEGORIES: toCode('menu', 'edit'),
  MENU_DELETE_CATEGORIES: toCode('menu', 'delete'),
  MENU_MANAGE: toCode('menu', 'full_access'),

  INVENTORY_VIEW: toCode('inventory', 'view'),
  INVENTORY_MANAGE: toCode('inventory', 'edit'),
  INVENTORY_VIEW_LOW_STOCK: toCode('inventory', 'view'),

  REPORTS_VIEW: toCode('reports', 'view'),
  REPORTS_EXPORT: toCode('reports', 'create'),
  REPORTS_MANAGE: toCode('reports', 'full_access'),

  STAFF_INVITE: toCode('staff', 'create'),
  STAFF_EDIT: toCode('staff', 'edit'),
  STAFF_DEACTIVATE: toCode('staff', 'edit'),
  STAFF_DELETE: toCode('staff', 'delete'),
  STAFF_VIEW: toCode('staff', 'view'),
  STAFF_MANAGE: toCode('staff', 'full_access'),

  SETTINGS_VIEW: toCode('settings', 'view'),
  SETTINGS_EDIT_PROFILE: toCode('settings', 'edit'),
  SETTINGS_EDIT_TAX: toCode('settings', 'edit'),
  SETTINGS_EDIT_LOYALTY: toCode('settings', 'edit'),
  SETTINGS_SETUP_TYRO: toCode('settings', 'edit'),
  SETTINGS_PURCHASE_SMS: toCode('settings', 'edit'),
  SETTINGS_MANAGE_TERMINALS: toCode('settings', 'edit'),
  SETTINGS_CONFIGURE_PERMISSIONS: toCode('staff', 'full_access'),
  SETTINGS_MANAGE: toCode('settings', 'full_access'),
} as const;

export const isPermissionCode = (value: string): value is PermissionCode =>
  allPermissionCodes.includes(value as PermissionCode);

export const flattenPermissionMap = (
  map: PermissionMap | undefined,
): PermissionCode[] => {
  if (!map) {
    return [];
  }

  const output: PermissionCode[] = [];

  for (const [module, actions] of Object.entries(map)) {
    if (
      !PERMISSION_MODULES.includes(module as PermissionModule) ||
      !Array.isArray(actions)
    ) {
      continue;
    }

    for (const action of actions) {
      const code = `${module}:${action}`;
      if (isPermissionCode(code)) {
        output.push(code);
      }
    }
  }

  return Array.from(new Set(output));
};

export const buildPermissionMap = (codes: string[]): PermissionMap => {
  const grouped: PermissionMap = {};

  for (const code of codes) {
    if (!isPermissionCode(code)) {
      continue;
    }

    const [module, action] = code.split(':') as [
      PermissionModule,
      PermissionAction,
    ];
    grouped[module] = grouped[module] || [];
    if (!grouped[module]?.includes(action)) {
      grouped[module]?.push(action);
    }
  }

  return grouped;
};

export const sanitizePermissionMap = (map: unknown): PermissionMap => {
  if (!map || typeof map !== 'object') {
    return {};
  }

  const result: PermissionMap = {};

  for (const [module, actions] of Object.entries(
    map as Record<string, unknown>,
  )) {
    if (
      !PERMISSION_MODULES.includes(module as PermissionModule) ||
      !Array.isArray(actions)
    ) {
      continue;
    }

    const allowedActions = new Set(
      PERMISSION_CATALOG[module as PermissionModule].actions.map(
        (action) => action.key,
      ),
    );

    const filtered = actions
      .filter((value): value is string => typeof value === 'string')
      .filter((value): value is PermissionAction =>
        allowedActions.has(value as PermissionAction),
      );

    result[module as PermissionModule] = Array.from(new Set(filtered));
  }

  return result;
};

export const getDefaultPermissionMapForRole = (role: UserRole): PermissionMap =>
  buildPermissionMap(ROLE_DEFAULT_CODES[role]);

export const resolveRolePermissionCodes = (
  role: UserRole,
  storedMap?: PermissionMap,
): PermissionCode[] => {
  if (role === 'ADMIN') {
    return ROLE_DEFAULT_CODES.ADMIN;
  }

  const base = flattenPermissionMap(storedMap);

  // Fallback only if EMPTY
  if (!base || base.length === 0) {
    return ROLE_DEFAULT_CODES[role];
  }

  return Array.from(new Set(base));
};

export const hasPermissionCode = (
  granted: PermissionCode[],
  required: PermissionCode,
): boolean => {
  if (granted.includes(required)) {
    return true;
  }

  const [requiredModule] = required.split(':') as [
    PermissionModule,
    PermissionAction,
  ];
  const wildcard = `${requiredModule}:full_access` as PermissionCode;
  return granted.includes(wildcard);
};

export const getAllPermissionCodes = () => allPermissionCodes;
