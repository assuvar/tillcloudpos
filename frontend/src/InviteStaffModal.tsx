import React, { useState } from 'react';
import { X, Info, ChevronDown } from 'lucide-react';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite?: (data: { fullName: string; email: string; role: string }) => void;
}

const ROLES = ['Admin', 'Manager', 'Cashier', 'Kitchen Staff'];

export default function InviteStaffModal({ isOpen, onClose, onInvite }: InviteStaffModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Cashier');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onInvite) {
      onInvite({ fullName, email, role });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-[24px] bg-white shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300 sm:max-w-[480px] sm:rounded-[32px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-4 sm:p-8">
          <h2 className="text-[22px] font-black text-[#0c1424] sm:text-[24px]">Invite Staff</h2>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-[#0c1424] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 pt-0 sm:p-8">
          <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
            New team members will receive an email to set up their account and PIN.
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
              placeholder="r.smith@tillcloud.com"
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
              className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[14px] font-bold text-[#0c1424] hover:bg-slate-100/50 transition-all"
            >
              <span>{role}</span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-[14px] font-bold transition-colors ${role === r ? 'bg-slate-50 text-[#0c1424]' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

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
               className="h-14 w-full rounded-2xl bg-[#0c1424] text-white font-black uppercase tracking-widest shadow-xl shadow-black/20 transition-all hover:bg-black"
             >
               Send Invite
             </button>
             <button
               type="button"
               onClick={onClose}
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
