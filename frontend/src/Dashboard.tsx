import {
  ClipboardList,
  Cloud,
  FileText,
  RefreshCw,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import { FRONTEND_PERMISSIONS } from "./permissions";
import {
  reportsService,
  type InventoryItem,
  type TrendPoint,
  type SummaryResponse,
  type Order,
} from "./services/reportsService";
import MenuManagement from "./MenuManagement";
import StaffManagementPage from "./StaffManagementPage";
import StockListPage from "./StockListPage";
import CustomersPage from "./CustomersPage";
import ReportsPage from "./ReportsPage";
import SettingsPage from "./SettingsPage";
import AccessDenied from "./components/AccessDenied";
import UnifiedLayout from "./components/UnifiedLayout";
import OrderEntryScreen from "./OrderEntryScreen";
import POSEntryScreen from "./POSEntryScreen";
import POSTablesScreen from "./POSTablesScreen";
import {
  type DashboardViewId,
  getAccessibleDashboardViews,
} from "./dashboardNavigation";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  statusLabel?: string;
  statusType?: "success" | "warning" | "error" | "info";
}

function StatCard({
  title,
  value,
  icon,
  trend,
  statusLabel,
  statusType = "success",
}: StatCardProps) {
  const getStatusStyles = () => {
    switch (statusType) {
      case "success":
        return "bg-emerald-50 text-emerald-600";
      case "error":
        return "bg-rose-50 text-rose-600";
      case "warning":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-blue-50 text-blue-600";
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1424] group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        {trend && (
          <div
            className={`px-2 py-1 rounded-full text-[11px] font-bold ${getStatusStyles()}`}
          >
            {trend}
          </div>
        )}
        {statusLabel && (
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyles()}`}
          >
            {statusLabel}
          </div>
        )}
      </div>
      <div>
        <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="text-[28px] font-black text-[#0c1424] mt-1 tracking-tight">
          {value}
        </div>
      </div>
    </div>
  );
}


type DashboardTrendPoint = {
  day: string;
  value: number;
  active?: boolean;
};

type RecentOrderView = Order & {
  createdAt: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const response = error as { response?: { data?: { message?: unknown } } };
    const message = response.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export default function Dashboard({ defaultView = 'home' }: { defaultView?: DashboardViewId }) {
  const { user, hasModuleAccess, hasPermission, permissionsLoading, refreshPermissions } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<DashboardViewId>(
    (location.state as any)?.currentView || defaultView
  );
  const [, setSalesData] = useState<DashboardTrendPoint[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderView[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const canUseReports = hasPermission(FRONTEND_PERMISSIONS.REPORTS_VIEW);
  const canExportReports = hasPermission(FRONTEND_PERMISSIONS.REPORTS_EXPORT);
  const canViewDashboard = hasPermission(FRONTEND_PERMISSIONS.DASHBOARD_VIEW);

  const isAdmin = user?.role === 'ADMIN';
  const isCashier = user?.role === 'CASHIER';
  const canLoadDashboardData = !isCashier && canViewDashboard && canUseReports;

  useEffect(() => {
    if (defaultView) {
      setCurrentView(defaultView);
    }
  }, [defaultView]);

  const loadDashboardData = async (silent = false) => {
    if (!canLoadDashboardData) {
      return;
    }

    try {
      if (!silent) {
        setIsDashboardLoading(true);
      }
      setDashboardError(null);

      // We use allSettled so if one resource (like inventory) is restricted (403),
      // the others (like sales) can still load.
      const results = await Promise.allSettled([
        // Summary
        hasPermission(FRONTEND_PERMISSIONS.REPORTS_VIEW) 
          ? reportsService.getSummary() 
          : Promise.reject(new Error('No permission for summary')),
        
        // Analytics
        hasPermission(FRONTEND_PERMISSIONS.REPORTS_VIEW)
          ? reportsService.getAnalytics()
          : Promise.reject(new Error('No permission for analytics')),
        
        // Recent Orders
        hasPermission(FRONTEND_PERMISSIONS.REPORTS_VIEW)
          ? reportsService.getRecentOrders()
          : Promise.reject(new Error('No permission for orders')),
        
        // Low Stock
        hasPermission(FRONTEND_PERMISSIONS.INVENTORY_VIEW_LOW_STOCK)
          ? reportsService.getLowStock()
          : Promise.reject(new Error('No permission for low stock')),
      ]);

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Dashboard resource ${index} load failed:`, result.reason);
        }
      });

      // Summary result
      if (results[0].status === 'fulfilled') {
        setSummary(results[0].value);
      }

      // Analytics result
      if (results[1].status === 'fulfilled') {
        const analyticsResponse = results[1].value;
        const revenueTrend: TrendPoint[] = analyticsResponse.revenueTrend;

        const maxRevenue = Math.max(
          ...revenueTrend.map((entry: TrendPoint) => Number(entry.value || 0)),
          0,
        );
        const activeIndex = revenueTrend.reduce(
          (bestIndex: number, entry: TrendPoint, index: number, arr: TrendPoint[]) =>
            Number(entry.value || 0) > Number(arr[bestIndex]?.value || 0)
              ? index
              : bestIndex,
          0,
        );

        if (revenueTrend.length > 0) {
          setSalesData(
            revenueTrend.map((entry: TrendPoint, index: number) => {
              const date = new Date(entry.date);
              const day = Number.isNaN(date.getTime())
                ? String(entry.date || '').slice(5, 10)
                : date
                    .toLocaleDateString('en-US', { weekday: 'short' })
                    .toUpperCase();

              return {
                day,
                value:
                  maxRevenue > 0
                    ? Math.max(8, Math.round((Number(entry.value || 0) / maxRevenue) * 100))
                    : 8,
                active: index === activeIndex && maxRevenue > 0,
              };
            }),
          );
        }
      }

      // Recent Orders result
      if (results[2].status === 'fulfilled') {
        setRecentOrders(results[2].value);
      }

      // Low Stock result
      if (results[3].status === 'fulfilled') {
        setLowStockItems(results[3].value);
      }

      setLastUpdatedAt(new Date().toISOString());
    } catch (err: unknown) {
      setDashboardError(getErrorMessage(err, 'Failed to load dashboard data'));
      console.error('Dashboard load error:', err);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    void refreshPermissions();
    if (canLoadDashboardData) {
      void loadDashboardData();
    }
  }, [user?.restaurantId, canLoadDashboardData]);

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  const handleOpenRecentOrder = (billId: string) => {
    navigate(`/pos/order-entry?billId=${billId}`);
  };

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      const blob = await reportsService.exportReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloseDay = async () => {
    try {
      setIsClosingDay(true);
      await reportsService.closeDay();
      await handleRefresh();
    } catch (err) {
      console.error('Close day failed', err);
    } finally {
      setIsClosingDay(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(Number(amount || 0));

  const outOfStockCount = lowStockItems.filter(
    (item) => Number(item.currentStock || 0) <= 0,
  ).length;

  const accessibleViews = getAccessibleDashboardViews(user?.role, hasModuleAccess);

  return (
    <UnifiedLayout 
      currentView={currentView} 
      onViewChange={(view) => setCurrentView(view as DashboardViewId)}
      fullScreen={currentView === 'orders' || currentView === 'tables'}
    >
      {currentView === 'home' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isCashier ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
              <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-[#0c1424] to-[#1e293b] text-[#5dc7ec] flex items-center justify-center shadow-2xl mb-8">
                <Cloud size={48} strokeWidth={2.5} />
              </div>
              <h1 className="text-[42px] font-[1000] text-[#0c1424] leading-none tracking-tighter mb-4">
                Home
              </h1>
              <p className="text-slate-500 text-xl font-medium">
                Welcome to Cloud POS Software. You are signed in as a Cashier.
              </p>
            </div>
          ) : canViewDashboard ? (
            <>
              {/* Dash Title */}
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
                <div>
                  <h1 className="text-[34px] font-[1000] text-[#0c1424] leading-none tracking-tight">
                    {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
                  </h1>
                  <p className="text-slate-500 mt-3 font-medium text-[15px]">
                    Welcome back, <span className="text-[#0c1424] font-bold">{user?.fullName?.split(" ")[0]}</span>. Here's
                    the performance overview for today.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleRefresh()}
                    className="h-11 px-6 rounded-full bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                  <button
                    onClick={() => void handleExportReport()}
                    disabled={!canExportReports || isExporting}
                    className="h-11 px-6 rounded-full bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileText size={14} />
                    {isExporting ? 'Exporting...' : 'Export Report'}
                  </button>
                  <button
                    onClick={() => void handleCloseDay()}
                    disabled={!canExportReports || isClosingDay}
                    className="h-11 px-6 rounded-full bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {isClosingDay ? 'Closing...' : 'Close Day'}
                  </button>
                </div>
              </div>

              {dashboardError && (
                <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-[13px] font-semibold text-rose-700 flex items-center justify-between">
                  <span>{dashboardError}</span>
                  <button onClick={() => void handleRefresh()} className="underline underline-offset-2 hover:text-rose-800 transition-colors">Retry</button>
                </div>
              )}

              {!canUseReports && (
                <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-[13px] font-semibold text-amber-700">
                  You can access Home, but dashboard analytics are disabled for your role.
                </div>
              )}

              {/* Stats Grid */}
              {canUseReports && (
              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Orders Today"
                  value={String(summary?.totalOrders ?? 0)}
                  icon={<FileText size={20} />}
                  trend={lastUpdatedAt ? 'Live' : undefined}
                  statusType="success"
                />
                <StatCard
                  title="Revenue Today"
                  value={formatCurrency(summary?.totalRevenue ?? 0)}
                  icon={<Wallet size={20} />}
                  trend={lastUpdatedAt ? 'Live' : undefined}
                  statusType="success"
                />
                <StatCard
                  title="Avg Order Value"
                  value={formatCurrency(summary?.averageOrderValue ?? 0)}
                  icon={<ShoppingBag size={20} />}
                  statusLabel="Today"
                  statusType="info"
                />
                <StatCard
                  title="Low Stock Alerts"
                  value={String(lowStockItems.length)}
                  icon={<ClipboardList size={20} />}
                  statusLabel="Critical"
                  statusType="error"
                />
              </div>
              )}

              {canUseReports && (
              <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#0c1424]">Recent Orders</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last 15</span>
                  </div>
                  {recentOrders.length === 0 ? (
                    <p className="text-[13px] font-medium text-slate-500">No recent orders</p>
                  ) : (
                    <div className="space-y-2">
                      {recentOrders.map((order) => (
                        <button
                          key={order.id}
                          onClick={() => handleOpenRecentOrder(order.id)}
                          className="w-full rounded-xl border border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-black text-[#0c1424]">
                              #{String(order.billNumber || '').padStart(3, '0')}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">{order.status}</span>
                          </div>
                          <div className="mt-1 text-[12px] font-medium text-slate-500">
                            {formatCurrency(Number(order.total || 0))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#0c1424]">Inventory Alerts</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
                  </div>
                  {lowStockItems.length === 0 ? (
                    <p className="text-[13px] font-medium text-slate-500">All items in stock</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[12px] font-bold text-rose-600">
                        Out of stock: {outOfStockCount}
                      </div>
                      {lowStockItems.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-100 px-4 py-3">
                          <div className="text-[13px] font-black text-[#0c1424]">{item.name}</div>
                          <div className="text-[12px] font-medium text-slate-500">
                            {Number(item.currentStock || 0)} / threshold {Number(item.minStock || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}
            </>
          ) : (
            <AccessDenied moduleName="Home" onBack={() => setCurrentView('orders')} />
          )}
        </div>
      )}

      {currentView === 'orders' && (
        <>
          {location.pathname === '/pos/order-entry' ? (
            <OrderEntryScreen />
          ) : (
            <POSEntryScreen />
          )}
        </>
      )}

      {currentView === 'tables' && (
        <POSTablesScreen />
      )}

      {currentView === 'menu' && hasModuleAccess('MENU') && (
        <MenuManagement />
      )}
      {currentView === 'menu' && !hasModuleAccess('MENU') && (
        <AccessDenied moduleName="Menu" onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'staff' && hasModuleAccess('STAFF') && (
        <StaffManagementPage />
      )}
      {currentView === 'staff' && !hasModuleAccess('STAFF') && (
        <AccessDenied moduleName="Staff" onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'inventory' && hasModuleAccess('INVENTORY') && (
        <StockListPage />
      )}
      {currentView === 'inventory' && !hasModuleAccess('INVENTORY') && (
        <AccessDenied moduleName="Inventory" onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'customers' && hasModuleAccess('CUSTOMERS') && (
        <CustomersPage />
      )}
      {currentView === 'customers' && !hasModuleAccess('CUSTOMERS') && (
        <AccessDenied moduleName="Customers" onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'reports' && hasModuleAccess('REPORTS') && (
        <ReportsPage />
      )}
      {currentView === 'reports' && !hasModuleAccess('REPORTS') && (
        <AccessDenied moduleName="Reports" onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'settings' && hasModuleAccess('SETTINGS') && (
        <SettingsPage />
      )}
      {currentView === 'settings' && !hasModuleAccess('SETTINGS') && (
        <AccessDenied moduleName="Settings" onBack={() => setCurrentView('home')} />
      )}

      {!permissionsLoading && accessibleViews.length === 0 && (
        <div className="rounded-[28px] border border-slate-100 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-black text-[#0c1424]">No modules enabled</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Your role currently has no enabled modules. Contact an admin to update role permissions.
          </p>
        </div>
      )}
    </UnifiedLayout>
  );
}
