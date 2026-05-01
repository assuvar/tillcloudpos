import {
  LayoutDashboard,
  LayoutGrid,
  Menu as MenuIcon,
  Users,
  Package,
  BarChart,
  Users2,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import type { PermissionGroup } from "./permissions";

export type DashboardViewId =
  | "home"
  | "orders"
  | "tables"
  | "menu"
  | "staff"
  | "inventory"
  | "customers"
  | "reports"
  | "settings";

export type DashboardView = {
  id: DashboardViewId;
  label: string;
  module?: PermissionGroup;
  icon: LucideIcon | any;
};

export const DASHBOARD_VIEWS: DashboardView[] = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "orders", label: "POS", module: "BILLING", icon: LayoutGrid },
  { id: "menu", label: "Menu", module: "MENU", icon: MenuIcon },
  { id: "staff", label: "Staff", module: "STAFF", icon: Users },
  { id: "inventory", label: "Inventory", module: "INVENTORY", icon: Package },
  { id: "customers", label: "Customers", module: "CUSTOMERS", icon: Users2 },
  { id: "reports", label: "Reports", module: "REPORTS", icon: BarChart },
  { id: "settings", label: "Settings", module: "SETTINGS", icon: SettingsIcon },
];

export const getAccessibleDashboardViews = (
  _role: "ADMIN" | "MANAGER" | "CASHIER" | "KITCHEN" | undefined,
  _hasModuleAccess: (group: PermissionGroup) => boolean,
): DashboardView[] => {
  // Requirement: All modules visible in navbar for all roles.
  // Access control is handled by the UI (disable/toast).
  return DASHBOARD_VIEWS;
};
