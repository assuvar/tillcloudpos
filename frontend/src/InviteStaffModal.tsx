import React, { useState } from 'react';
import { X, Info, ChevronDown } from 'lucide-react';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  initialValues?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  submitError?: string | null;
  isSubmitting?: boolean;
  onInvite?: (data: {
    name: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
  }) => Promise<void> | void;
}

const ROLES: Array<{
  label: string;
  value: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
}> = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Cashier', value: 'CASHIER' },
  { label: 'Kitchen', value: 'KITCHEN' },
];

export default function InviteStaffModal({
  isOpen,
  onClose,
  onInvite,
  mode = 'create',
  initialValues,
  submitError,
  isSubmitting = false,
}: InviteStaffModalProps) {
  const [fullName, setFullName] = useState(initialValues?.name || '');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [phone, setPhone] = useState(initialValues?.phone || '');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN'>(
    (initialValues?.role?.toUpperCase() as
      | 'ADMIN'
      | 'MANAGER'
      | 'CASHIER'
      | 'KITCHEN') || 'CASHIER',
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFullName(initialValues?.name || '');
      setEmail(initialValues?.email || '');
      setPhone(initialValues?.phone || '');
      setRole(
        (initialValues?.role?.toUpperCase() as
          | 'ADMIN'
          | 'MANAGER'
          | 'CASHIER'
          | 'KITCHEN') || 'CASHIER',
      );
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onInvite) {
      void onInvite({
        name: fullName,
        email,
        phone: phone || undefined,
        role,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-[24px] bg-white shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300 sm:max-w-[480px] sm:rounded-[32px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-4 sm:p-8">
          <h2 className="text-[22px] font-black text-[#0c1424] sm:text-[24px]">
            {mode === 'create' ? 'Add Staff Member' : 'Edit Staff Member'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-[#0c1424] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 pt-0 sm:p-8">
          <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
            {mode === 'create'
              ? 'Add a staff member and securely generate a PIN for POS access.'
              : 'Update staff details and role permissions.'}
          </p>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Robert Smith"
              className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-[14px] font-bold text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-[#0c1424]/5 focus:border-[#0c1424]/10 transition-all placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="r.smith@tillcloud.com"
              className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-[14px] font-bold text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-[#0c1424]/5 focus:border-[#0c1424]/10 transition-all placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Phone (Optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              placeholder="+61 400 000 000"
              className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-[14px] font-bold text-[#0c1424] focus:outline-none focus:ring-2 focus:ring-[#0c1424]/5 focus:border-[#0c1424]/10 transition-all placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>

          {/* Role Dropdown */}
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Role
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isSubmitting}
              className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[14px] font-bold text-[#0c1424] hover:bg-slate-100/50 transition-all"
            >
              <span>{ROLES.find((r) => r.value === role)?.label || role}</span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setRole(r.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-[14px] font-bold transition-colors ${role === r.value ? 'bg-slate-50 text-[#0c1424]' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">
              {submitError}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50/50 border-l-4 border-[#5dc7ec] rounded-2xl p-5 flex gap-4">
             <div className="h-6 w-6 rounded-full bg-[#5dc7ec]/10 flex items-center justify-center text-[#5dc7ec] shrink-0 mt-0.5">
               <Info size={14} />
             </div>
             <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
               Invited users will have default access to POS terminals. You can refine permissions in settings after they join.
             </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
             <button
               type="submit"
               disabled={isSubmitting}
               className="h-14 w-full rounded-2xl bg-[#0c1424] text-white font-black uppercase tracking-widest shadow-xl shadow-black/20 transition-all hover:bg-black"
             >
               {isSubmitting
                 ? mode === 'create'
                   ? 'Creating...'
                   : 'Saving...'
                 : mode === 'create'
                   ? 'Create Staff'
                   : 'Save Changes'}
             </button>
             <button
               type="button"
               onClick={onClose}
               disabled={isSubmitting}
               className="h-12 w-full font-black uppercase tracking-widest text-slate-400 transition-all hover:text-[#0c1424]"
             >
               Cancel
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
