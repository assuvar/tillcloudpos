import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Wallet, 
  Filter, 
  Download, 
  Edit2, 
  Trash2, 
  Plus,
  LockKeyhole,
} from 'lucide-react';
import InviteStaffModal from './InviteStaffModal';
import { useAuth } from './context/AuthContext';
import api from './services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

function StatCard({ title, value, subValue, icon, isActive }: StatCardProps) {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
           <span className="text-[28px] font-black text-[#0c1424] tracking-tight">{value}</span>
           {isActive && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-2" />}
        </div>
        {subValue && (
          <div className="text-[11px] font-bold text-[#5dc7ec] mt-1">{subValue}</div>
        )}
      </div>
    </div>
  );
}

type StaffRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
  isActive: boolean;
  lastLoginAt?: string | null;
};

type StaffFormPayload = {
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
};

type PinAuditLog = {
  id: string;
  actorUserId: string;
  actorName: string;
  staffUserId: string;
  staffName: string;
  action: 'VIEW' | 'RESET';
  status: 'SUCCESS' | 'FAILED';
  reason?: string | null;
  createdAt: string;
};

const formatLastLogin = (value?: string | null) => {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleString();
};

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffData, setStaffData] = useState<StaffRecord[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [latestStaffPin, setLatestStaffPin] = useState<{
    staffId: string;
    staffName: string;
    staffRole: StaffRecord['role'];
    pin: string;
  } | null>(null);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinResetTarget, setPinResetTarget] = useState<StaffRecord | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [pinResetError, setPinResetError] = useState<string | null>(null);
  const [pinAuditLogs, setPinAuditLogs] = useState<PinAuditLog[]>([]);
  const [pinAuditLoading, setPinAuditLoading] = useState(false);
  const [pinAuditError, setPinAuditError] = useState<string | null>(null);

  const fetchStaffData = async () => {
    if (!user?.restaurantId || !user?.id) {
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await api.get('/staff');
      const records = response.data;

      if (!Array.isArray(records)) {
        throw new Error('Invalid response from server');
      }

      setStaffData(records);
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      const message = err?.response?.data?.message;
      setFetchError(
        Array.isArray(message) ? message.join(', ') : message || 'Failed to load staff data',
      );
      setStaffData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaffData();
  }, [user?.restaurantId]);

  const staffRows = useMemo(
    () =>
      staffData.map((s) => ({
        ...s,
        status: s.isActive ? 'Active' : 'Inactive',
        lastLogin: formatLastLogin(s.lastLoginAt),
        initials: s.name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      })),
    [staffData],
  );

  const totalMembers = staffRows.length;
  const activeMembers = staffRows.filter((s) => s.isActive).length;
  const adminCount = staffRows.filter((s) => s.role === 'ADMIN').length;
  const cashierCount = staffRows.filter((s) => s.role === 'CASHIER').length;

  const extractErrorMessage = (err: any, fallback: string) => {
    const message = err?.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message || fallback;
  };

  const fetchPinAuditLogs = async () => {
    if (!user?.restaurantId || user.role !== 'ADMIN') {
      setPinAuditLogs([]);
      setPinAuditError(null);
      return;
    }

    setPinAuditLoading(true);
    setPinAuditError(null);
    try {
      const response = await api.get('/staff/pin-audit-logs', {
        params: { limit: 20 },
      });
      const records = response?.data;
      if (!Array.isArray(records)) {
        throw new Error('Invalid audit log response');
      }
      setPinAuditLogs(records);
    } catch (err: any) {
      setPinAuditError(extractErrorMessage(err, 'Failed to load PIN audit logs'));
      setPinAuditLogs([]);
    } finally {
      setPinAuditLoading(false);
    }
  };

  useEffect(() => {
    void fetchPinAuditLogs();
  }, [user?.restaurantId, user?.role]);

  const handleCreateStaff = async (payload: StaffFormPayload) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post('/staff', payload);
      await fetchStaffData();
      setIsInviteModalOpen(false);
      const pin = response?.data?.generatedPin;
      const createdStaff = response?.data?.staff;
      if (pin && createdStaff) {
        setLatestStaffPin({
          staffId: createdStaff.id,
          staffName: createdStaff.name,
          staffRole: createdStaff.role,
          pin,
        });
        setPinVisible(true);
      }
    } catch (err: any) {
      setSubmitError(extractErrorMessage(err, 'Failed to create staff member'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = async (payload: StaffFormPayload) => {
    if (!selectedStaff) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.patch(`/staff/${selectedStaff.id}`, payload);
      await fetchStaffData();
      setIsEditModalOpen(false);
      setSelectedStaff(null);
    } catch (err: any) {
      setSubmitError(extractErrorMessage(err, 'Failed to update staff member'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const performRowAction = async (
    staffId: string,
    action: () => Promise<void>,
    fallbackMessage: string,
  ) => {
    setActionLoadingId(staffId);
    try {
      await action();
      await fetchStaffData();
    } catch (err: any) {
      window.alert(extractErrorMessage(err, fallbackMessage));
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (staff: StaffRecord) => {
    if (staff.role === 'ADMIN') {
      window.alert('Admin account cannot be edited here.');
      return;
    }
    setSelectedStaff(staff);
    setSubmitError(null);
    setIsEditModalOpen(true);
  };

  const openPinResetModal = (staff: StaffRecord) => {
    if (user?.role !== 'ADMIN') {
      window.alert('Only admins can view or reset staff PINs.');
      return;
    }
    if (staff.role === 'ADMIN') {
      window.alert('Admin PIN reset is restricted.');
      return;
    }
    setPinResetTarget(staff);
    setAdminPassword('');
    setPinResetError(null);
  };

  const closePinResetModal = () => {
    if (actionLoadingId) {
      return;
    }
    setPinResetTarget(null);
    setAdminPassword('');
    setPinResetError(null);
  };

  const confirmPinReset = async () => {
    if (!pinResetTarget) {
      return;
    }

    if (!adminPassword.trim()) {
      setPinResetError('Admin password is required to reset a PIN.');
      return;
    }

    setPinResetError(null);
    setActionLoadingId(pinResetTarget.id);
    try {
      const response = await api.post(`/staff/${pinResetTarget.id}/pin/reset`, {
        adminPassword,
      });
      const pin = response?.data?.generatedPin;
      if (pin) {
        setLatestStaffPin({
          staffId: pinResetTarget.id,
          staffName: pinResetTarget.name,
          staffRole: pinResetTarget.role,
          pin,
        });
        setPinVisible(true);
      }
      setPinResetTarget(null);
      setAdminPassword('');
      await fetchStaffData();
      await fetchPinAuditLogs();
    } catch (err: any) {
      setPinResetError(extractErrorMessage(err, 'Failed to reset PIN'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmViewPin = async () => {
    if (!pinResetTarget) {
      return;
    }

    if (!adminPassword.trim()) {
      setPinResetError('Admin password is required to view a PIN.');
      return;
    }

    setPinResetError(null);
    setActionLoadingId(pinResetTarget.id);
    try {
      const response = await api.post(`/staff/${pinResetTarget.id}/pin/reveal`, {
        adminPassword,
      });

      const pin = response?.data?.pin;
      if (pin) {
        setLatestStaffPin({
          staffId: pinResetTarget.id,
          staffName: pinResetTarget.name,
          staffRole: pinResetTarget.role,
          pin,
        });
        setPinVisible(true);
      } else {
        setPinResetError(
          response?.data?.message ||
            'PIN is not available for this staff member. Use Reset PIN to create a new one.',
        );
        return;
      }
      setPinResetTarget(null);
      setAdminPassword('');
      await fetchPinAuditLogs();
    } catch (err: any) {
      setPinResetError(
        extractErrorMessage(
          err,
          'Failed to view PIN. Make sure backend is restarted with the latest staff PIN reveal route.',
        ),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
        <div>
          <h1 className="text-3xl font-black leading-none tracking-tight text-[#0c1424] sm:text-[34px]">Staff Management</h1>
          <p className="mt-3 font-medium text-slate-500">Manage your team, roles, and access to the system.</p>
        </div>
        
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#0c1424] px-8 text-[14px] font-black uppercase tracking-widest text-white shadow-xl shadow-black/20 transition-all hover:bg-black md:w-auto"
        >
          <div className="bg-white/20 rounded-lg p-1">
            <Plus size={16} />
          </div>
          Invite Staff
        </button>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="flex flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-50 bg-slate-50/30 px-4 py-5 sm:px-8">
            <h2 className="text-lg font-black text-[#0c1424]">PIN Audit History</h2>
            <p className="mt-1 text-[12px] font-semibold text-slate-500">
              Recent staff PIN view and reset activity.
            </p>
          </div>
          <div className="overflow-x-auto">
            {pinAuditError && (
              <div className="mx-4 mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600 sm:mx-8">
                {pinAuditError}
              </div>
            )}
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/10">
                  <th className="text-left py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</th>
                  <th className="text-left py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pinAuditLoading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-8 text-center text-[13px] font-semibold text-slate-400">
                      Loading PIN audit logs...
                    </td>
                  </tr>
                ) : pinAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-8 text-center text-[13px] font-semibold text-slate-400">
                      No PIN audit records yet.
                    </td>
                  </tr>
                ) : (
                  pinAuditLogs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-8 text-[12px] font-semibold text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-[12px] font-black text-[#0c1424]">{entry.action}</td>
                      <td className="py-4 px-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${entry.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[12px] font-semibold text-slate-500">{entry.actorName}</td>
                      <td className="py-4 px-4 text-[12px] font-semibold text-slate-500">{entry.staffName}</td>
                      <td className="py-4 px-8 text-[12px] font-semibold text-slate-400">{entry.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Members" value={totalMembers} icon={<Users size={20} />} />
        <StatCard title="Active Now" value={activeMembers} icon={<UserCheck size={20} />} isActive />
        <StatCard title="Admin Roles" value={adminCount} icon={<ShieldCheck size={20} />} />
        <StatCard title="Cashiers" value={cashierCount} icon={<Wallet size={20} />} />
      </div>

      {latestStaffPin && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Staff credentials</p>
              <p className="text-[14px] font-bold text-amber-900 mt-1">
                {latestStaffPin.staffName} ({latestStaffPin.staffRole})
              </p>
              <p className="text-[13px] font-semibold text-amber-800 mt-1">
                PIN: {pinVisible ? latestStaffPin.pin : '••••'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPinVisible((prev) => !prev)}
                className="h-10 rounded-xl border border-amber-300 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-amber-800"
              >
                {pinVisible ? 'Hide PIN' : 'Show PIN'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(latestStaffPin.pin);
                }}
                className="h-10 rounded-xl border border-amber-300 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-amber-800"
              >
                Copy PIN
              </button>
              <button
                type="button"
                onClick={() => setLatestStaffPin(null)}
                className="h-10 rounded-xl border border-amber-300 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-amber-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Directory Table */}
      <div className="flex flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
        {/* Table Toolbar */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-50 bg-slate-50/30 p-4 sm:flex-row sm:items-center sm:p-8">
          <h2 className="text-lg font-black text-[#0c1424]">Staff Directory</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
             <button className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
               <Filter size={14} />
               Filter
             </button>
             <button className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
               <Download size={14} />
               Staff Export
             </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {fetchError && (
            <div className="mx-4 mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600 sm:mx-8">
              {fetchError}
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/10">
                <th className="text-left py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Login</th>
                <th className="text-right py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-[14px] font-semibold text-slate-400">
                    Loading staff data...
                  </td>
                </tr>
              ) : staffRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-[14px] font-semibold text-slate-400">
                    No staff members yet. Add your first staff member to start assigning roles and PIN access.
                  </td>
                </tr>
              ) : (
              staffRows.map((staff) => (
                <tr key={staff.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-6 px-4 sm:px-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[18px] bg-[#0c1424] flex items-center justify-center text-[13px] font-black text-white shadow-lg overflow-hidden border-2 border-white">
                        {staff.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#0c1424]">{staff.name}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Staff ID: {staff.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <span className="text-[14px] font-bold text-slate-500">{staff.email}</span>
                  </td>
                  <td className="py-6 px-4">
                    <span className="bg-blue-50 text-[10px] font-black text-[#5dc7ec] px-3 py-1 rounded-full uppercase tracking-widest">
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-2">
                       <div className={`h-2 w-2 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                       <span className={`text-[13px] font-bold ${staff.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {staff.status}
                       </span>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <span className="text-[13px] font-bold text-slate-500">{staff.lastLogin}</span>
                  </td>
                  <td className="py-6 px-4 sm:px-8">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(staff)}
                        disabled={actionLoadingId === staff.id || staff.role === 'ADMIN'}
                        className="h-10 w-10 rounded-xl text-slate-300 hover:text-[#0c1424] hover:bg-slate-50 transition-all flex items-center justify-center disabled:opacity-40"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (staff.role === 'ADMIN') {
                            window.alert('Admin account cannot be deleted here.');
                            return;
                          }
                          if (!window.confirm(`Delete ${staff.name}? This action cannot be undone.`)) {
                            return;
                          }
                          void performRowAction(
                            staff.id,
                            async () => {
                              await api.delete(`/staff/${staff.id}`);
                            },
                            'Failed to delete staff member',
                          );
                        }}
                        disabled={actionLoadingId === staff.id || staff.role === 'ADMIN'}
                        className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (staff.role === 'ADMIN') {
                            window.alert('Admin account cannot be updated here.');
                            return;
                          }
                          const nextAction = staff.isActive ? 'deactivate' : 'activate';
                          if (!window.confirm(`Are you sure you want to ${nextAction} ${staff.name}?`)) {
                            return;
                          }
                          void performRowAction(
                            staff.id,
                            async () => {
                              await api.patch(
                                `/staff/${staff.id}/${staff.isActive ? 'deactivate' : 'activate'}`,
                              );
                            },
                            `Failed to ${nextAction} staff member`,
                          );
                        }}
                        disabled={actionLoadingId === staff.id || staff.role === 'ADMIN'}
                        className="h-10 px-3 rounded-xl text-slate-300 hover:text-[#0c1424] hover:bg-slate-50 transition-all flex items-center justify-center text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
                      >
                        {staff.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          openPinResetModal(staff);
                        }}
                        disabled={
                          actionLoadingId === staff.id ||
                          staff.role === 'ADMIN' ||
                          user?.role !== 'ADMIN'
                        }
                        className="h-10 w-10 rounded-xl text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-all flex items-center justify-center disabled:opacity-40"
                      >
                        <LockKeyhole size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 p-4 sm:p-8">
           <span className="text-[12px] font-bold text-slate-400">
             {totalMembers === 0
               ? 'No staff records found'
               : `Showing ${totalMembers} staff member${totalMembers > 1 ? 's' : ''}`}
           </span>
        </div>
      </div>

      {pinResetTarget && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-[calc(100vw-1rem)] rounded-[28px] bg-white p-5 shadow-2xl sm:max-w-[440px] sm:p-8">
            <h3 className="text-[20px] font-black text-[#0c1424]">Manage Staff PIN</h3>
            <p className="mt-2 text-[13px] font-semibold text-slate-500">
              Enter your admin password to view or reset PIN for {pinResetTarget.name}.
            </p>
            <div className="mt-5 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                disabled={actionLoadingId === pinResetTarget.id}
                className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-[14px] font-bold text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-[#0c1424]/10"
                placeholder="Enter your current password"
              />
            </div>

            {pinResetError && (
              <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">
                {pinResetError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void confirmViewPin()}
                disabled={actionLoadingId === pinResetTarget.id}
                className="h-12 w-full rounded-2xl border border-[#0c1424] bg-white text-[12px] font-black uppercase tracking-widest text-[#0c1424] disabled:opacity-50"
              >
                {actionLoadingId === pinResetTarget.id ? 'Loading...' : 'View PIN'}
              </button>
              <button
                type="button"
                onClick={() => void confirmPinReset()}
                disabled={actionLoadingId === pinResetTarget.id}
                className="h-12 w-full rounded-2xl bg-[#0c1424] text-[12px] font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                {actionLoadingId === pinResetTarget.id ? 'Resetting...' : 'Reset PIN'}
              </button>
              <button
                type="button"
                onClick={closePinResetModal}
                disabled={actionLoadingId === pinResetTarget.id}
                className="h-12 w-full rounded-2xl border border-slate-200 text-[12px] font-black uppercase tracking-widest text-slate-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <InviteStaffModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        mode="create"
        onInvite={handleCreateStaff}
        submitError={submitError}
        isSubmitting={isSubmitting}
      />

      <InviteStaffModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStaff(null);
        }}
        mode="edit"
        initialValues={
          selectedStaff
            ? {
                name: selectedStaff.name,
                email: selectedStaff.email,
                phone: selectedStaff.phone || '',
                role: selectedStaff.role,
              }
            : undefined
        }
        onInvite={handleEditStaff}
        submitError={submitError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
