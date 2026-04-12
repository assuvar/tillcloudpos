export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';

export const PERMISSION_ROLES: UserRole[] = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'KITCHEN',
];

export const EDITABLE_PERMISSION_ROLES: UserRole[] = ['MANAGER', 'CASHIER'];

export const PERMISSION_CATALOG = {
  BILLING: {
    label: 'Billing',
    description: 'Bill creation and billing controls.',
    actions: [
      { key: 'CREATE_BILL', label: 'Create bill' },
      { key: 'VOID_BILL', label: 'Void bill' },
      { key: 'APPLY_MANUAL_DISCOUNT', label: 'Apply manual discount' },
      { key: 'VIEW_ALL_OPEN_BILLS', label: 'View all open bills' },
    ],
  },
  PAYMENTS: {
    label: 'Payments',
    description: 'Payment method and settlement controls.',
    actions: [
      { key: 'CASH', label: 'Cash' },
      { key: 'CARD', label: 'Card' },
      { key: 'SPLIT', label: 'Split' },
      { key: 'MARK_DELIVERY_AS_PAID', label: 'Mark delivery as paid' },
    ],
  },
  RECEIPTS: {
    label: 'Receipts',
    description: 'Receipt and reprint controls.',
    actions: [
      { key: 'PRINT_RECEIPT', label: 'Print receipt' },
      { key: 'SEND_SMS_RECEIPT', label: 'Send SMS receipt' },
    ],
  },
  KITCHEN: {
    label: 'Kitchen',
    description: 'Kitchen workflow and dashboard controls.',
    actions: [
      { key: 'SAVE_AND_SEND_TO_KITCHEN', label: 'Save & send to kitchen' },
      { key: 'VIEW_KITCHEN_DASHBOARD', label: 'View kitchen dashboard' },
      { key: 'MARK_READY', label: 'Mark ready' },
      { key: 'BUMP', label: 'Bump' },
      { key: 'RECALL', label: 'Recall' },
    ],
  },
  CUSTOMERS: {
    label: 'Customers',
    description: 'Customer lookup and loyalty controls.',
    actions: [
      { key: 'LOOK_UP_CUSTOMER', label: 'Look up customer' },
      { key: 'VIEW_CUSTOMER_PROFILES', label: 'View customer profiles' },
      { key: 'VIEW_PURCHASE_HISTORY', label: 'View purchase history' },
      {
        key: 'ADJUST_LOYALTY_POINTS_MANUALLY',
        label: 'Adjust loyalty points manually',
      },
    ],
  },
  MENU: {
    label: 'Menu',
    description: 'Menu and category management controls.',
    actions: [
      { key: 'ADD_EDIT_ITEMS', label: 'Add/edit items' },
      { key: 'DELETE_ITEMS', label: 'Delete items' },
      { key: 'ADD_EDIT_CATEGORIES', label: 'Add/edit categories' },
      { key: 'DELETE_CATEGORIES', label: 'Delete categories' },
      { key: 'HIDE_SHOW_ITEMS', label: 'Hide/show items' },
    ],
  },
  INVENTORY: {
    label: 'Inventory',
    description: 'Stock visibility and adjustments.',
    actions: [
      { key: 'VIEW_STOCK', label: 'View stock' },
      { key: 'MANUALLY_ADJUST_STOCK', label: 'Manually adjust stock' },
      { key: 'VIEW_LOW_STOCK_ALERTS', label: 'View low stock alerts' },
    ],
  },
  REPORTS: {
    label: 'Reports',
    description: 'Reporting and exports.',
    actions: [
      { key: 'VIEW_REPORTS', label: 'View reports' },
      { key: 'EXPORT_REPORTS', label: 'Export reports' },
    ],
  },
  STAFF: {
    label: 'Staff',
    description: 'Staff lifecycle management.',
    actions: [
      { key: 'INVITE_STAFF', label: 'Invite staff' },
      { key: 'EDIT_STAFF', label: 'Edit staff' },
      { key: 'DEACTIVATE_STAFF', label: 'Deactivate staff' },
      { key: 'DELETE_STAFF', label: 'Delete staff' },
    ],
  },
  SETTINGS: {
    label: 'Settings',
    description: 'Restaurant and platform configuration.',
    actions: [
      { key: 'VIEW_SETTINGS', label: 'View settings' },
      { key: 'EDIT_RESTAURANT_PROFILE', label: 'Edit restaurant profile' },
      { key: 'EDIT_TAX', label: 'Edit tax' },
      { key: 'EDIT_LOYALTY', label: 'Edit loyalty' },
      { key: 'SET_UP_TYRO', label: 'Set up Tyro' },
      { key: 'PURCHASE_SMS_CREDITS', label: 'Purchase SMS credits' },
      { key: 'MANAGE_TERMINALS', label: 'Manage terminals' },
      {
        key: 'CONFIGURE_ROLE_PERMISSIONS',
        label: 'Configure role permissions',
      },
    ],
  },
} as const;

export type PermissionGroup = keyof typeof PERMISSION_CATALOG;

type GroupActionKey<T extends PermissionGroup> =
  (typeof PERMISSION_CATALOG)[T]['actions'][number]['key'];

export type PermissionCode = {
  [G in PermissionGroup]: `${G}:${GroupActionKey<G>}`;
}[PermissionGroup];

export type PermissionMap = Partial<Record<PermissionGroup, string[]>>;

const toCode = (group: PermissionGroup, action: string): PermissionCode =>
  `${group}:${action}` as PermissionCode;

const allPermissionCodes: PermissionCode[] = Object.entries(
  PERMISSION_CATALOG,
).flatMap(([group, config]) =>
  config.actions.map((action) => toCode(group as PermissionGroup, action.key)),
);

const managerDefaultCodes: PermissionCode[] = [...allPermissionCodes].filter(
  (code) => code !== toCode('SETTINGS', 'CONFIGURE_ROLE_PERMISSIONS'),
);

const cashierDefaultCodes: PermissionCode[] = [
  toCode('BILLING', 'CREATE_BILL'),
  toCode('BILLING', 'VIEW_ALL_OPEN_BILLS'),
  toCode('PAYMENTS', 'CASH'),
  toCode('PAYMENTS', 'CARD'),
  toCode('PAYMENTS', 'SPLIT'),
  toCode('RECEIPTS', 'PRINT_RECEIPT'),
  toCode('RECEIPTS', 'SEND_SMS_RECEIPT'),
  toCode('CUSTOMERS', 'LOOK_UP_CUSTOMER'),
  toCode('CUSTOMERS', 'VIEW_PURCHASE_HISTORY'),
];

const kitchenDefaultCodes: PermissionCode[] = [
  toCode('KITCHEN', 'SAVE_AND_SEND_TO_KITCHEN'),
  toCode('KITCHEN', 'VIEW_KITCHEN_DASHBOARD'),
  toCode('KITCHEN', 'MARK_READY'),
  toCode('KITCHEN', 'BUMP'),
  toCode('KITCHEN', 'RECALL'),
];

export const ROLE_DEFAULT_CODES: Record<UserRole, PermissionCode[]> = {
  ADMIN: allPermissionCodes,
  MANAGER: managerDefaultCodes,
  CASHIER: cashierDefaultCodes,
  KITCHEN: kitchenDefaultCodes,
};

export const PERMISSIONS = {
  BILLING_CREATE: toCode('BILLING', 'CREATE_BILL'),
  BILLING_VOID: toCode('BILLING', 'VOID_BILL'),
  BILLING_DISCOUNT: toCode('BILLING', 'APPLY_MANUAL_DISCOUNT'),
  BILLING_VIEW_OPEN: toCode('BILLING', 'VIEW_ALL_OPEN_BILLS'),
  BILLING_MANAGE: toCode('BILLING', 'APPLY_MANUAL_DISCOUNT'),

  PAYMENTS_CASH: toCode('PAYMENTS', 'CASH'),
  PAYMENTS_CARD: toCode('PAYMENTS', 'CARD'),
  PAYMENTS_SPLIT: toCode('PAYMENTS', 'SPLIT'),
  PAYMENTS_MARK_DELIVERY_PAID: toCode('PAYMENTS', 'MARK_DELIVERY_AS_PAID'),

  RECEIPTS_PRINT: toCode('RECEIPTS', 'PRINT_RECEIPT'),
  RECEIPTS_SMS: toCode('RECEIPTS', 'SEND_SMS_RECEIPT'),

  KITCHEN_SEND: toCode('KITCHEN', 'SAVE_AND_SEND_TO_KITCHEN'),
  KITCHEN_VIEW: toCode('KITCHEN', 'VIEW_KITCHEN_DASHBOARD'),
  KITCHEN_MARK_READY: toCode('KITCHEN', 'MARK_READY'),
  KITCHEN_BUMP: toCode('KITCHEN', 'BUMP'),
  KITCHEN_RECALL: toCode('KITCHEN', 'RECALL'),

  CUSTOMERS_LOOKUP: toCode('CUSTOMERS', 'LOOK_UP_CUSTOMER'),
  CUSTOMERS_VIEW_PROFILES: toCode('CUSTOMERS', 'VIEW_CUSTOMER_PROFILES'),
  CUSTOMERS_VIEW_HISTORY: toCode('CUSTOMERS', 'VIEW_PURCHASE_HISTORY'),
  CUSTOMERS_ADJUST_LOYALTY: toCode(
    'CUSTOMERS',
    'ADJUST_LOYALTY_POINTS_MANUALLY',
  ),

  MENU_VIEW: toCode('MENU', 'HIDE_SHOW_ITEMS'),
  MENU_EDIT_ITEMS: toCode('MENU', 'ADD_EDIT_ITEMS'),
  MENU_DELETE_ITEMS: toCode('MENU', 'DELETE_ITEMS'),
  MENU_EDIT_CATEGORIES: toCode('MENU', 'ADD_EDIT_CATEGORIES'),
  MENU_DELETE_CATEGORIES: toCode('MENU', 'DELETE_CATEGORIES'),
  MENU_MANAGE: toCode('MENU', 'ADD_EDIT_ITEMS'),

  INVENTORY_VIEW: toCode('INVENTORY', 'VIEW_STOCK'),
  INVENTORY_MANAGE: toCode('INVENTORY', 'MANUALLY_ADJUST_STOCK'),
  INVENTORY_VIEW_LOW_STOCK: toCode('INVENTORY', 'VIEW_LOW_STOCK_ALERTS'),

  REPORTS_VIEW: toCode('REPORTS', 'VIEW_REPORTS'),
  REPORTS_EXPORT: toCode('REPORTS', 'EXPORT_REPORTS'),
  REPORTS_MANAGE: toCode('REPORTS', 'EXPORT_REPORTS'),

  STAFF_INVITE: toCode('STAFF', 'INVITE_STAFF'),
  STAFF_EDIT: toCode('STAFF', 'EDIT_STAFF'),
  STAFF_DEACTIVATE: toCode('STAFF', 'DEACTIVATE_STAFF'),
  STAFF_DELETE: toCode('STAFF', 'DELETE_STAFF'),
  STAFF_VIEW: toCode('STAFF', 'EDIT_STAFF'),
  STAFF_MANAGE: toCode('STAFF', 'EDIT_STAFF'),

  SETTINGS_VIEW: toCode('SETTINGS', 'VIEW_SETTINGS'),
  SETTINGS_EDIT_PROFILE: toCode('SETTINGS', 'EDIT_RESTAURANT_PROFILE'),
  SETTINGS_EDIT_TAX: toCode('SETTINGS', 'EDIT_TAX'),
  SETTINGS_EDIT_LOYALTY: toCode('SETTINGS', 'EDIT_LOYALTY'),
  SETTINGS_SETUP_TYRO: toCode('SETTINGS', 'SET_UP_TYRO'),
  SETTINGS_PURCHASE_SMS: toCode('SETTINGS', 'PURCHASE_SMS_CREDITS'),
  SETTINGS_MANAGE_TERMINALS: toCode('SETTINGS', 'MANAGE_TERMINALS'),
  SETTINGS_CONFIGURE_PERMISSIONS: toCode(
    'SETTINGS',
    'CONFIGURE_ROLE_PERMISSIONS',
  ),
  SETTINGS_MANAGE: toCode('SETTINGS', 'CONFIGURE_ROLE_PERMISSIONS'),
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

  for (const [group, actions] of Object.entries(map)) {
    if (!(group in PERMISSION_CATALOG) || !Array.isArray(actions)) {
      continue;
    }

    for (const action of actions) {
      const code = `${group}:${action}`;
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

    const [group, action] = code.split(':') as [PermissionGroup, string];
    grouped[group] = grouped[group] || [];
    if (!grouped[group].includes(action)) {
      grouped[group].push(action);
    }
  }

  return grouped;
};

export const sanitizePermissionMap = (map: unknown): PermissionMap => {
  if (!map || typeof map !== 'object') {
    return {};
  }

  const result: PermissionMap = {};

  for (const [group, actions] of Object.entries(
    map as Record<string, unknown>,
  )) {
    if (!(group in PERMISSION_CATALOG) || !Array.isArray(actions)) {
      continue;
    }

    const allowedActions = new Set(
      PERMISSION_CATALOG[group as PermissionGroup].actions.map(
        (action) => action.key,
      ),
    );

    const filtered = actions
      .filter((value): value is string => typeof value === 'string')
      .filter((value) => allowedActions.has(value as any));

    result[group as PermissionGroup] = Array.from(new Set(filtered));
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

  const base = storedMap
    ? flattenPermissionMap(storedMap)
    : ROLE_DEFAULT_CODES[role];
  return Array.from(new Set(base));
};

export const getAllPermissionCodes = () => allPermissionCodes;
