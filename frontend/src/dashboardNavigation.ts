import {
  LayoutDashboard,
  ShoppingCart,
  Menu as MenuIcon,
  Users,
  Package,
  BarChart,
  Users2,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
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
  module?: PermissionGroup;
  icon: LucideIcon | any;
};

export const DASHBOARD_VIEWS: DashboardView[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'orders', label: 'POS', module: 'BILLING', icon: ShoppingCart },
  { id: 'menu', label: 'Menu', module: 'MENU', icon: MenuIcon },
  { id: 'staff', label: 'Staff', module: 'STAFF', icon: Users },
  { id: 'inventory', label: 'Inventory', module: 'INVENTORY', icon: Package },
  { id: 'customers', label: 'Customers', module: 'CUSTOMERS', icon: Users2 },
  { id: 'reports', label: 'Reports', module: 'REPORTS', icon: BarChart },
  { id: 'settings', label: 'Settings', module: 'SETTINGS', icon: SettingsIcon },
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

    return item.module ? hasModuleAccess(item.module) : false;
  });
};
