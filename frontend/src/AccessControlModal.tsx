import React, { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
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
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import api from './services/api';
import { useAuth } from './context/AuthContext';

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

type StaffPermissionsResponse = {
  staffId: string;
  role: string;
  inheritedFromRole: boolean;
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

const toMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return message || fallback;
};

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  staffRole: string;
}

export default function AccessControlModal({
  isOpen,
  onClose,
  staffId,
  staffName,
  staffRole,
}: AccessControlModalProps) {
  const { refreshPermissions, user: currentUser } = useAuth();
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [savedPermissions, setSavedPermissions] = useState<Record<string, string[]>>({});
  const [draftPermissions, setDraftPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!catalog?.groups) {
      return [];
    }
    return Object.entries(catalog.groups);
  }, [catalog]);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const [catalogRes, permissionsRes] = await Promise.all([
          api.get('/permissions/catalog'),
          api.get(`/users/${staffId}/permissions`),
        ]);
        
        setCatalog(catalogRes.data as CatalogResponse);
        const data = permissionsRes.data as StaffPermissionsResponse;
        setSavedPermissions(data.permissions || {});
        setDraftPermissions(data.permissions || {});
      } catch (err: any) {
        setError(toMessage(err, 'Failed to load access control data'));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [isOpen, staffId]);

  const savePermissions = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Flatten PermissionMap Record<string, string[]> to string[] ["module:action"]
      const flatPermissions: string[] = [];
      Object.entries(draftPermissions).forEach(([module, actions]) => {
        actions.forEach(action => {
          flatPermissions.push(`${module}:${action}`);
        });
      });

      console.log(`[Permissions] Saving updated permissions for ${staffId}:`, flatPermissions);
      
      await api.patch(`/users/${staffId}/permissions`, { 
        permissions: flatPermissions 
      });

      setSavedPermissions(draftPermissions);
      
      // Always refresh permissions to ensure local state is synced
      // If the admin edited their own permissions, this is critical
      await refreshPermissions();
      
      setSuccess('Permissions updated successfully');
      setTimeout(() => setSuccess(null), 3000);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex h-full max-h-[90vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-[32px] bg-[#f8fafc] shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0c1424]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0c1424]">Access Control Panel</h2>
              <p className="text-[13px] font-medium text-slate-500">
                Managing permissions for <span className="font-bold text-[#0c1424]">{staffName}</span> 
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-400">
                  {staffRole}
                </span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-[#0c1424] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-[13px] font-semibold text-rose-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-[13px] font-bold text-emerald-600">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0c1424]" />
              <p className="text-sm font-bold text-slate-400">Loading catalog and permissions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-8 py-6">
          <p className="text-[12px] font-medium text-slate-400">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-2 text-amber-500 font-bold">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                You have unsaved changes
              </span>
            ) : (
              'Changes saved'
            )}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={discardChanges}
              disabled={!hasUnsavedChanges || saving}
              className="h-12 px-8 rounded-2xl border border-slate-200 bg-white text-[12px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => void savePermissions()}
              disabled={!hasUnsavedChanges || saving}
              className="h-12 px-8 rounded-2xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-black/20 hover:bg-black transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Updating...' : 'Save Permissions'}
            </button>
          </div>
        </div>
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
    <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div className="h-12 w-12 rounded-[18px] bg-slate-50 text-[#0c1424] flex items-center justify-center border border-slate-100">
          {icon}
        </div>
        <button
          type="button"
          onClick={() => onToggleGroup(!isGroupEnabled)}
          disabled={disabled}
          className={`relative inline-flex h-7 w-12 rounded-full transition-all ${groupPartial ? 'bg-amber-400' : isGroupEnabled ? 'bg-[#0c1424]' : 'bg-slate-200'} disabled:opacity-50`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-1 ${isGroupEnabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
          {groupPartial && (
            <span className="absolute left-1/2 top-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900/40" />
          )}
        </button>
      </div>

      <div className="mb-4">
        <div className="text-[15px] font-black text-[#0c1424]">{title}</div>
        <p className="text-[12px] font-medium text-slate-500 leading-relaxed mt-1 line-clamp-2 h-9">
          {description}
        </p>
      </div>

      <div className={`space-y-3 pt-4 border-t border-slate-50 transition-opacity ${!isGroupEnabled ? 'opacity-40' : 'opacity-100'}`}>
        {actions.map((action) => {
          const checked = selected.includes(action.key);
          return (
            <label 
              key={action.key} 
              className={`flex items-center gap-3 text-[13px] font-bold p-2 rounded-xl transition-colors ${checked ? 'text-[#0c1424] bg-slate-50' : 'text-slate-400 hover:bg-slate-50/50'} cursor-pointer`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!isGroupEnabled || disabled}
                onChange={(event) => onToggleAction(action.key, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0c1424] focus:ring-[#0c1424]"
              />
              <span>{action.label}</span>
            </label>
          );
        })}
      </div>

      {groupPartial && (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
            Partially Enabled
          </span>
        </div>
      )}
    </div>
  );
}
