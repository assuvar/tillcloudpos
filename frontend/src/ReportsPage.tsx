import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Download,
  FileText,
  LayoutGrid,
  Package,
  PieChart,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  reportsService,
  type AnalyticsResponse,
  type SummaryResponse,
  type TrendPoint,
} from "./services/reportsService";

type ReportType =
  | "daily"
  | "monthly"
  | "item"
  | "category"
  | "payment"
  | "inventory";

const navItems = [
  {
    id: "daily",
    label: "Daily Sales Report",
    icon: FileText,
    group: "SALES REPORTS",
  },
  {
    id: "monthly",
    label: "Monthly Sales Report",
    icon: Calendar,
    group: "SALES REPORTS",
  },
  {
    id: "item",
    label: "Item-wise Sales Report",
    icon: LayoutGrid,
    group: "SALES REPORTS",
  },
  {
    id: "category",
    label: "Category-wise Sales Report",
    icon: PieChart,
    group: "SALES REPORTS",
  },
  {
    id: "payment",
    label: "Payment Method Summary",
    icon: Wallet,
    group: "FINANCIALS",
  },
  {
    id: "inventory",
    label: "Inventory Stock Report",
    icon: Package,
    group: "FINANCIALS",
  },
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

function DataCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {title}
      </div>
      <div className="mt-3 text-[30px] font-black text-[#0c1424] leading-none">
        {value}
      </div>
      {subtitle ? (
        <div className="mt-2 text-[12px] font-bold text-slate-400">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function TrendBars({ title, points }: { title: string; points: TrendPoint[] }) {
  const maxValue = Math.max(
    ...points.map((point) => Number(point.value || 0)),
    0,
  );

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
      <h3 className="text-lg font-black text-[#0c1424]">{title}</h3>
      {points.length === 0 ? (
        <p className="mt-6 text-[13px] font-medium text-slate-500">
          No data available
        </p>
      ) : (
        <div className="mt-8 flex h-[220px] items-end gap-3">
          {points.map((point) => {
            const label = new Date(point.date)
              .toLocaleDateString("en-US", { weekday: "short" })
              .toUpperCase();
            const normalized =
              maxValue > 0
                ? Math.max(
                    10,
                    Math.round((Number(point.value || 0) / maxValue) * 100),
                  )
                : 10;
            return (
              <div
                key={`${title}_${point.date}`}
                className="flex-1 flex flex-col items-center gap-3"
              >
                <div
                  className="w-full rounded-xl bg-[#e2e8f0]"
                  style={{ height: `${normalized}%` }}
                />
                <div className="text-[10px] font-black text-slate-400 tracking-wider">
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TableBlock({
  title,
  columns,
  rows,
  emptyLabel,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  emptyLabel: string;
}) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50">
        <h3 className="text-lg font-black text-[#0c1424]">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="px-8 py-6 text-[13px] font-medium text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {columns.map((col) => (
                <th key={col} className="text-left py-4 px-6">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, idx) => (
              <tr
                key={`${title}_${idx}`}
                className="text-[13px] hover:bg-slate-50/40"
              >
                {row.map((cell, index) => (
                  <td
                    key={`${title}_${idx}_${index}`}
                    className="py-4 px-6 font-semibold text-[#0c1424]"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("daily");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      const [summaryResponse, analyticsResponse] = await Promise.all([
        reportsService.getSummary(),
        reportsService.getAnalytics(),
      ]);

      setSummary(summaryResponse);
      setAnalytics(analyticsResponse);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response
          ?.data?.message === "string"
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to load reports"
          : "Failed to load reports";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const timer = window.setInterval(() => {
      void loadData(true);
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadData]);

  const topItemsRows = useMemo(
    () =>
      (analytics?.topItems || []).map((item) => [
        item.name,
        item.quantity,
        "-",
      ]),
    [analytics],
  );

  const categoryRows = useMemo(
    () =>
      (analytics?.categorySales || []).map((item) => [
        item.category,
        formatCurrency(item.value),
      ]),
    [analytics],
  );

  const paymentRows = useMemo(
    () =>
      [
        [
          "Total Orders",
          summary?.totalOrders ?? 0,
          formatCurrency(summary?.totalRevenue ?? 0),
        ],
        [
          "Average Order Value",
          "-",
          formatCurrency(summary?.averageOrderValue ?? 0),
        ],
      ] as Array<Array<string | number>>,
    [summary],
  );

  const inventoryRows = useMemo(
    () =>
      [
        ["Top Items", analytics?.topItems?.length ?? 0],
        ["Categories", analytics?.categorySales?.length ?? 0],
      ] as Array<Array<string | number>>,
    [analytics],
  );

  const content = (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
          Live Reports
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadData()}
            className="h-10 px-4 rounded-xl bg-white border border-slate-100 text-[12px] font-bold text-slate-600 flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={async () => {
              try {
                setIsExporting(true);
                const blob = await reportsService.exportReport();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `report-${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
            className="h-10 px-4 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={14} /> {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <DataCard
          title="Revenue"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
        />
        <DataCard title="Orders" value={String(summary?.totalOrders ?? 0)} />
        <DataCard
          title="Avg Order Value"
          value={formatCurrency(summary?.averageOrderValue ?? 0)}
        />
      </div>

      {isLoading ? (
        <div className="rounded-[32px] border border-slate-100 bg-white px-8 py-6 text-[13px] font-semibold text-slate-500">
          Loading reports...
        </div>
      ) : null}

      {!isLoading &&
      (activeReport === "daily" || activeReport === "monthly") ? (
        <div className="space-y-8">
          <TrendBars
            title="Revenue Trend"
            points={analytics?.revenueTrend || []}
          />
          <TrendBars
            title="Orders Trend"
            points={analytics?.ordersTrend || []}
          />
        </div>
      ) : null}

      {!isLoading && activeReport === "item" ? (
        <TableBlock
          title="Top Items"
          columns={["Item", "Quantity", "Revenue"]}
          rows={topItemsRows}
          emptyLabel="No data available"
        />
      ) : null}

      {!isLoading && activeReport === "category" ? (
        <TableBlock
          title="Category Sales"
          columns={["Category", "Revenue"]}
          rows={categoryRows}
          emptyLabel="No data available"
        />
      ) : null}

      {!isLoading && activeReport === "payment" ? (
        <TableBlock
          title="Payment Summary"
          columns={["Metric", "Count", "Amount"]}
          rows={paymentRows}
          emptyLabel="No data available"
        />
      ) : null}

      {!isLoading && activeReport === "inventory" ? (
        <TableBlock
          title="Inventory Summary"
          columns={["Metric", "Value"]}
          rows={inventoryRows}
          emptyLabel="No data available"
        />
      ) : null}
    </>
  );

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-[#f8fafc] shadow-sm lg:-m-8 lg:h-[calc(100vh-140px)] lg:flex-row">
      <div className="flex flex-col border-r border-slate-100 bg-white pt-6 lg:w-[300px] lg:pt-10">
        <div className="px-8 flex flex-col gap-10">
          {["SALES REPORTS", "FINANCIALS"].map((group) => (
            <div key={group} className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4">
                {group}
              </h3>
              <div className="space-y-1">
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveReport(item.id as ReportType)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${activeReport === item.id ? "bg-blue-50 text-[#5dc7ec] shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-[#0c1424]"}`}
                    >
                      <item.icon
                        size={18}
                        strokeWidth={activeReport === item.id ? 2.5 : 2}
                      />
                      <span className="text-[13px] font-bold text-left">
                        {item.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-5 sm:p-8 lg:p-12">
        <div className="mx-auto max-w-[1200px]">{content}</div>
      </div>
    </div>
  );
}
