import React, { useState, useEffect } from 'react'; 
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
  ChevronLeft,
  ChevronRight
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

const STAFF_DATA = [
  {
    id: 'TC-0482',
    name: 'Marcus Kovac',
    email: 'marcus.k@tillcloud.com',
    role: 'ADMIN',
    status: 'Active',
    lastLogin: '2 mins ago',
    initials: 'MK'
  },
  {
    id: 'TC-0483',
    name: 'Sarah Chen',
    email: 's.chen@tillcloud.com',
    role: 'CASHIER',
    status: 'Active',
    lastLogin: 'Yesterday, 4:15 PM',
    initials: 'SC'
  },
  {
    id: 'TC-0332',
    name: 'Jamie Dawson',
    email: 'j.dawson@tillcloud.com',
    role: 'CASHIER',
    status: 'Inactive',
    lastLogin: 'Mar 12, 2024',
    initials: 'JD'
  }
];

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [staffData, setStaffData] = useState<any[]>([]);

  const fetchStaffData = async () => {
    if (!user?.restaurantId) {
      return;
    }

    try {
      const response = await api.get(`/users/${user.restaurantId}`);
      const users = response.data;
      
      // Validate response is an array
      if (!Array.isArray(users)) {
        throw new Error('Invalid response from server');
      }
      
      const formattedStaff = users.map((u: any) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        status: u.isActive ? 'Active' : 'Inactive',
        lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never',
        initials: u.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      }));
      
      setStaffData(formattedStaff);
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      setStaffData([]);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [user?.restaurantId]);

  // Use real data if available, fallback to mock
  const displayData = staffData.length > 0 ? staffData : STAFF_DATA;

  // Calculate stats from real data
  const totalMembers = displayData.length;
  const activeMembers = displayData.filter((s) => s.status === 'Active').length;
  const adminCount = displayData.filter((s) => s.role === 'ADMIN').length;
  const cashierCount = displayData.filter((s) => s.role === 'CASHIER').length;

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Members" value={totalMembers} icon={<Users size={20} />} />
        <StatCard title="Active Now" value={activeMembers} icon={<UserCheck size={20} />} isActive />
        <StatCard title="Admin Roles" value={adminCount} icon={<ShieldCheck size={20} />} />
        <StatCard title="Cashiers" value={cashierCount} icon={<Wallet size={20} />} />
      </div>

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
               Export CSV
             </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
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
              {displayData.map((staff) => (
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
                      <button className="h-10 w-10 rounded-xl text-slate-300 hover:text-[#0c1424] hover:bg-slate-50 transition-all flex items-center justify-center">
                        <Edit2 size={16} />
                      </button>
                      <button className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-50 p-4 sm:flex-row sm:items-center sm:p-8">
           <span className="text-[12px] font-bold text-slate-400">
             Showing 1-3 of 24 staff members
           </span>
           <div className="flex items-center gap-2 self-end sm:self-auto">
              <button className="h-9 w-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="h-9 w-9 rounded-xl bg-[#0c1424] text-white text-[12px] font-black flex items-center justify-center shadow-lg shadow-black/10">1</button>
              <button className="h-9 w-9 rounded-xl border border-slate-100 text-[#0c1424] text-[12px] font-black flex items-center justify-center hover:bg-slate-50 transition-colors">2</button>
              <button className="h-9 w-9 rounded-xl border border-slate-100 flex items-center justify-center text-[#0c1424] hover:bg-slate-50 transition-colors">
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>

      <InviteStaffModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onInvite={(data) => {
          console.log('Inviting staff:', data);
          // Here you would typically call an API
        }}
      />
    </div>
  );
}
