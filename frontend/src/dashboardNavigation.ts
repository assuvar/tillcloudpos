import type { PermissionGroup } from './permissions';

export type DashboardViewId =
  | 'home'
  | 'orders'
  | 'menu'
  | 'staff'
  | 'inventory'
  | 'customers'
  | 'reports'
  | 'settings';

export type DashboardView = {
  id: DashboardViewId;
  label: string;
  permissionGroup?: PermissionGroup;
};

export const DASHBOARD_VIEWS: DashboardView[] = [
  { id: 'home', label: 'Home' },
  { id: 'orders', label: 'POS', permissionGroup: 'BILLING' },
  { id: 'menu', label: 'Menu', permissionGroup: 'MENU' },
  { id: 'staff', label: 'Staff', permissionGroup: 'STAFF' },
  { id: 'inventory', label: 'Inventory', permissionGroup: 'INVENTORY' },
  { id: 'customers', label: 'Customers', permissionGroup: 'CUSTOMERS' },
  { id: 'reports', label: 'Reports', permissionGroup: 'REPORTS' },
  { id: 'settings', label: 'Settings', permissionGroup: 'SETTINGS' },
];

export const getAccessibleDashboardViews = (
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | undefined,
  hasModuleAccess: (group: PermissionGroup) => boolean,
): DashboardView[] => {
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';

  return DASHBOARD_VIEWS.filter((item) => {
    if (isAdmin) {
      return true;
    }

    if (item.id === 'home') {
      return isManager && hasModuleAccess('REPORTS');
    }

    return item.permissionGroup ? hasModuleAccess(item.permissionGroup) : false;
  });
};
