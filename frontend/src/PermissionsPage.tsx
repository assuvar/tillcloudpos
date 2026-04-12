import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  BadgeDollarSign,
  Banknote,
  ReceiptText,
  ChefHat,
  Users,
  MenuSquare,
  Boxes,
  BarChart3,
  UserCog,
  Settings,
} from 'lucide-react';
import api from './services/api';

type RoleKey = 'MANAGER' | 'CASHIER';

type CatalogAction = {
  key: string;
  label: string;
};

type CatalogGroup = {
  label: string;
  description?: string;
  actions: CatalogAction[];
};

type CatalogResponse = {
  roles: {
    editable: string[];
    readOnly: string[];
  };
  groups: Record<string, CatalogGroup>;
};

type RolePermissionsResponse = {
  role: string;
  editable: boolean;
  permissions: Record<string, string[]>;
  updatedAt: string | null;
};

const groupIcons: Record<
  string,
  ComponentType<{ size?: string | number; className?: string }>
> = {
  BILLING: BadgeDollarSign,
  PAYMENTS: Banknote,
  RECEIPTS: ReceiptText,
  KITCHEN: ChefHat,
  CUSTOMERS: Users,
  MENU: MenuSquare,
  INVENTORY: Boxes,
  REPORTS: BarChart3,
  STAFF: UserCog,
  SETTINGS: Settings,
};

const roleTabs: Array<{ label: string; value: RoleKey }> = [
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Cashier', value: 'CASHIER' },
];

const toMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return message || fallback;
};

export default function PermissionsPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>('MANAGER');
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [savedPermissions, setSavedPermissions] = useState<Record<string, string[]>>({});
  const [draftPermissions, setDraftPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!catalog?.groups) {
      return [];
    }
    return Object.entries(catalog.groups);
  }, [catalog]);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/permissions/catalog');
        setCatalog(response.data as CatalogResponse);
      } catch (err: any) {
        setError(toMessage(err, 'Failed to load permission catalog'));
      } finally {
        setLoading(false);
      }
    };

    void loadCatalog();
  }, []);

  useEffect(() => {
    const loadRolePermissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/permissions/${activeRole}`);
        const data = response.data as RolePermissionsResponse;
        setSavedPermissions(data.permissions || {});
        setDraftPermissions(data.permissions || {});
      } catch (err: any) {
        setError(toMessage(err, 'Failed to load role permissions'));
      } finally {
        setLoading(false);
      }
    };

    void loadRolePermissions();
  }, [activeRole]);

  const savePermissions = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/permissions/${activeRole}`, { permissions: draftPermissions });
      setSavedPermissions(draftPermissions);
      setToast('Permissions updated');
      window.setTimeout(() => setToast(null), 1600);
    } catch (err: any) {
      setError(toMessage(err, 'Failed to update permissions'));
    } finally {
      setSaving(false);
    }
  };

  const updateGroupActions = (group: string, actions: string[]) => {
    const next = {
      ...draftPermissions,
      [group]: actions,
    };

    setDraftPermissions(next);
  };

  const toggleGroup = (group: string, allActions: string[], enabled: boolean) => {
    updateGroupActions(group, enabled ? allActions : []);
  };

  const toggleAction = (group: string, action: string, enabled: boolean) => {
    const current = draftPermissions[group] || [];
    const next = enabled
      ? Array.from(new Set([...current, action]))
      : current.filter((item) => item !== action);
    updateGroupActions(group, next);
  };

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(savedPermissions) !== JSON.stringify(draftPermissions),
    [savedPermissions, draftPermissions],
  );

  const discardChanges = () => {
    setDraftPermissions(savedPermissions);
    setError(null);
  };

  const groupDescriptions: Record<string, string> = {
    BILLING: 'Manage invoices, subscriptions, and billing history.',
    PAYMENTS: 'Control checkout process and terminal integrations.',
    RECEIPTS: 'Customize receipt layouts and digital delivery settings.',
    KITCHEN: 'Kitchen Display System (KDS) access and routing.',
    CUSTOMERS: 'Database access and loyalty program management.',
    MENU: 'Control pricing, items, and seasonal categories.',
    INVENTORY: 'Stock counting, waste reporting, and supplier POs.',
    REPORTS: 'Access sensitive sales data and staff performance metrics.',
    STAFF: 'Manage employee profiles and role assignment.',
    SETTINGS: 'System-wide configuration and compliance settings.',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[40px] leading-none font-black text-[#0c1424] tracking-tight">Access Control</h2>
          <p className="text-[16px] text-slate-500 mt-3 max-w-[580px] font-medium">
            Define the operational boundaries for your team. Role-based permissions ensure security without friction.
          </p>
        </div>
        <div className="rounded-xl bg-slate-100 p-1 flex gap-1">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveRole(tab.value)}
              className={`h-11 px-8 rounded-lg text-[14px] font-black transition-all ${activeRole === tab.value ? 'bg-white text-[#0c1424] shadow-sm' : 'text-slate-500 hover:text-[#0c1424]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-[13px] font-bold text-emerald-600 w-fit">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[24px] border border-slate-100 bg-white px-6 py-10 text-center text-slate-400 font-semibold">
          Loading permissions...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {groups.map(([groupKey, group]) => {
            const Icon = groupIcons[groupKey] || Settings;
            const selected = draftPermissions[groupKey] || [];
            const total = group.actions.length;
            const selectedCount = selected.length;
            const groupOn = selectedCount === total;
            const groupPartial = selectedCount > 0 && selectedCount < total;

            return (
              <PermissionGroupCard
                key={groupKey}
                icon={<Icon size={18} />}
                title={group.label}
                description={group.description || groupDescriptions[groupKey] || ''}
                actions={group.actions}
                selected={selected}
                groupOn={groupOn}
                groupPartial={groupPartial}
                disabled={saving}
                onToggleGroup={(enabled) =>
                  toggleGroup(
                    groupKey,
                    group.actions.map((action) => action.key),
                    enabled,
                  )
                }
                onToggleAction={(action, enabled) =>
                  toggleAction(groupKey, action, enabled)
                }
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-4 rounded-[18px] border border-slate-100 bg-white p-3 sm:p-4">
        <button
          type="button"
          onClick={discardChanges}
          disabled={!hasUnsavedChanges || saving}
          className="h-12 px-8 rounded-xl border border-slate-200 bg-white text-[12px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-50"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={() => void savePermissions()}
          disabled={!hasUnsavedChanges || saving}
          className="h-12 px-8 rounded-xl bg-black text-white text-[12px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Permission Set'}
        </button>
      </div>
    </div>
  );
}

function PermissionGroupCard(props: {
  icon: ReactNode;
  title: string;
  description: string;
  actions: CatalogAction[];
  selected: string[];
  groupOn: boolean;
  groupPartial: boolean;
  disabled: boolean;
  onToggleGroup: (enabled: boolean) => void;
  onToggleAction: (action: string, enabled: boolean) => void;
}) {
  const {
    icon,
    title,
    description,
    actions,
    selected,
    groupOn,
    groupPartial,
    disabled,
    onToggleGroup,
    onToggleAction,
  } = props;

  const isGroupEnabled = groupOn || groupPartial;

  return (
    <div className="rounded-[14px] bg-white border border-slate-100 p-5 shadow-sm min-h-[220px]">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-blue-100 text-[#0c1424] flex items-center justify-center">
          {icon}
        </div>
        <button
          type="button"
          onClick={() => onToggleGroup(!isGroupEnabled)}
          disabled={disabled}
          aria-checked={groupPartial ? 'mixed' : isGroupEnabled}
          className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${groupPartial ? 'bg-amber-400' : isGroupEnabled ? 'bg-[#0e7aa4]' : 'bg-slate-200'} disabled:opacity-50`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition mt-1 ${isGroupEnabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
          {groupPartial && (
            <span className="absolute left-1/2 top-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900" />
          )}
        </button>
      </div>

      <div className="mb-3">
        <div className="text-[13px] font-black text-[#0c1424]">{title}</div>
        <div className="text-[12px] font-medium text-slate-500 leading-relaxed mt-1 min-h-[38px]">
          {description}
        </div>
      </div>

      <div className={`space-y-2 ${!isGroupEnabled ? 'opacity-50' : ''}`}>
        {actions.map((action) => {
          const checked = selected.includes(action.key);
          return (
            <label key={action.key} className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
              <input
                type="checkbox"
                checked={checked}
                disabled={!isGroupEnabled || disabled}
                onChange={(event) => onToggleAction(action.key, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
              />
              <span>{action.label}</span>
            </label>
          );
        })}
      </div>

      {groupPartial && (
        <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-amber-500">
          Partially Enabled
        </div>
      )}
    </div>
  );
}
