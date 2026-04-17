import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import api from './services/api';
import { 
  ShieldCheck, 
  ChevronRight, 
  Delete, 
  Check, 
  HelpCircle, 
  Globe,
  UserCog,
  CreditCard,
  ChefHat,
} from 'lucide-react';

type PosRole = 'MANAGER' | 'CASHIER' | 'KITCHEN';

export default function PosLogin() {
  const [role, setRole] = useState<PosRole>('CASHIER');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [rememberIdentifier, setRememberIdentifier] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isPinFocused, setIsPinFocused] = useState(false);
  const pinInputRef = useRef<HTMLInputElement | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedIdentifier = localStorage.getItem('pos_last_identifier');
    if (storedIdentifier) {
      setIdentifier(storedIdentifier);
      setRememberIdentifier(true);
    }
  }, []);

  const handlePinClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinContainerClick = () => {
    pinInputRef.current?.focus();
  };

  const handlePinInputChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
    setPin(digitsOnly);
  };

  const onSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (!identifier.trim() || pin.length !== 4) {
      setError('Enter staff ID or email and a valid 4-digit PIN.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/auth/pin-login', {
        role,
        identifier: identifier.trim(),
        pin,
      });

      await login(
        response.data.access_token,
        response.data.user,
        role === 'KITCHEN' ? 'kitchen' : 'pos',
        response.data.pos_session_token,
      );

      if (rememberIdentifier) {
        localStorage.setItem('pos_last_identifier', identifier.trim());
      } else {
        localStorage.removeItem('pos_last_identifier');
      }

      navigate(role === 'KITCHEN' ? '/kitchen' : '/pos');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'POS login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Background patterns/images could go here as absolute positioning */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Left Column */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-16 relative z-10">
        <div className="flex items-center justify-between lg:justify-start">
          <div className="text-xl font-black tracking-tighter text-[#0b1b3d]">TILLCLOUD</div>
          <div className="flex items-center gap-4 lg:hidden">
            <HelpCircle size={20} className="text-slate-400" />
            <Globe size={20} className="text-slate-400" />
          </div>
        </div>

        <div className="max-w-md mt-20 lg:mt-0">
          <h1 className="text-5xl font-black text-[#0b1b3d] tracking-tight mb-4">
            POS Login
          </h1>
          <p className="text-slate-500 text-xl font-medium mb-12">
            Sign in to start taking orders
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-[#eff6ff]/50 border border-[#dbeafe] p-4 rounded-2xl">
              <div className="bg-[#0b1b3d] p-2 rounded-lg text-white">
                <CreditCard size={18} />
              </div>
              <span className="font-bold text-[#0b1b3d]">Secure Role-based POS Access</span>
            </div>
            <div className="flex items-center gap-4 bg-[#eff6ff]/50 border border-[#dbeafe] p-4 rounded-2xl">
              <div className="bg-[#0b1b3d] p-2 rounded-lg text-white">
                <ShieldCheck size={18} />
              </div>
              <span className="font-bold text-[#0b1b3d]">PIN Verification with Hashed Storage</span>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <HelpCircle size={22} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
          <Globe size={22} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-white/40 lg:bg-transparent relative z-10">
        <div className="w-full max-w-[500px] bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 p-8 lg:p-10">
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-8">
            <div className="rounded-xl bg-slate-100 p-1 flex gap-1">
              <button
                type="button"
                onClick={() => setRole('MANAGER')}
                className={`flex-1 h-11 rounded-lg text-[13px] font-black tracking-wide transition-all ${role === 'MANAGER' ? 'bg-white text-[#0b1b3d] shadow-sm' : 'text-slate-500 hover:text-[#0b1b3d]'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <UserCog size={14} /> Manager Login
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole('CASHIER')}
                className={`flex-1 h-11 rounded-lg text-[13px] font-black tracking-wide transition-all ${role === 'CASHIER' ? 'bg-white text-[#0b1b3d] shadow-sm' : 'text-slate-500 hover:text-[#0b1b3d]'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <CreditCard size={14} /> Cashier Login
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole('KITCHEN')}
                className={`flex-1 h-11 rounded-lg text-[13px] font-black tracking-wide transition-all ${role === 'KITCHEN' ? 'bg-white text-[#0b1b3d] shadow-sm' : 'text-slate-500 hover:text-[#0b1b3d]'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <ChefHat size={14} /> Kitchen Login
                </span>
              </button>
            </div>

            {/* Staff identifier field */}
            <div>
              <label className="block text-[13px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                Staff ID or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'MANAGER' ? 'manager@restaurant.com' : role === 'KITCHEN' ? 'kitchen staff id or email' : 'staff-id or cashier@email.com'}
                className="w-full h-16 px-6 rounded-2xl bg-[#f0f7ff] border-none focus:ring-2 focus:ring-[#5899ff]/30 text-lg font-bold placeholder:text-slate-300 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2 md:col-start-4">
                <label className="block text-[13px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                  4 digit PIN
                </label>
                <div
                  onClick={handlePinContainerClick}
                  className={`h-14 flex items-center justify-center gap-2 rounded-2xl border-2 transition-all ${isPinFocused ? 'border-[#5899ff]/60 bg-[#eaf3ff]' : 'border-transparent bg-[#f0f7ff]'}`}
                >
                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={pin}
                    onFocus={() => setIsPinFocused(true)}
                    onBlur={() => setIsPinFocused(false)}
                    onChange={(e) => handlePinInputChange(e.target.value)}
                    className="sr-only"
                    aria-label="PIN"
                  />
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-[#0b1b3d] scale-110' : 'bg-slate-300'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinClick(num.toString())}
                  className="h-16 rounded-2xl bg-[#f0f7ff] hover:bg-[#e2efff] text-2xl font-black text-[#0b1b3d] transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="h-16 rounded-2xl bg-[#f0f7ff] hover:bg-[#ffe2e2] text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all active:scale-95"
              >
                <Delete size={24} />
              </button>
              <button
                type="button"
                onClick={() => handlePinClick('0')}
                className="h-16 rounded-2xl bg-[#f0f7ff] hover:bg-[#e2efff] text-2xl font-black text-[#0b1b3d] transition-all active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => pin.length === 4 && onSubmit()}
                disabled={pin.length !== 4}
                className={`h-16 rounded-2xl text-white flex items-center justify-center transition-all active:scale-95 ${pin.length === 4 ? 'bg-[#10b981] shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-300'}`}
              >
                <Check size={28} />
              </button>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between text-sm font-bold px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberIdentifier}
                    onChange={(e) => setRememberIdentifier(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${rememberIdentifier ? 'bg-[#0b1b3d] border-[#0b1b3d]' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                    {rememberIdentifier && <Check size={14} className="text-white" />}
                  </div>
                </div>
                <span className="text-slate-500">Remember ID</span>
              </label>
              <span className="text-[#0b1b3d] text-xs font-bold uppercase tracking-wider">{role}</span>
            </div>

            {/* Login Button */}
            <button
              onClick={() => onSubmit()}
              disabled={submitting || pin.length !== 4}
              className="w-full h-16 mt-4 rounded-2xl bg-[#0b1b3d] text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-[#152a53] transition-all shadow-2xl shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? 'Authenticating...' : (
                <>
                  Login <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

