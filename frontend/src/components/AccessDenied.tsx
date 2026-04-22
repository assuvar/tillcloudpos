import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  moduleName?: string;
  onBack?: () => void;
}

export default function AccessDenied({ moduleName, onBack }: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-rose-50 text-rose-500 shadow-xl shadow-rose-500/10">
        <ShieldAlert size={48} strokeWidth={2.5} />
      </div>
      
      <h2 className="mb-3 text-[32px] font-black tracking-tight text-[#0c1424]">Access Denied</h2>
      
      <p className="mb-10 max-w-md text-sm font-semibold text-slate-400 leading-relaxed uppercase tracking-wider">
        You do not have permission to access the {moduleName ? <span className="text-[#0c1424] font-black">{moduleName}</span> : 'this'} module
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => onBack ? onBack() : navigate(-1)}
          className="flex h-14 items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white px-8 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Go Back
        </button>
        
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-14 items-center gap-3 rounded-2xl bg-[#0c1424] px-8 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-black/20 hover:bg-black transition-all active:scale-95"
        >
          <Home size={18} strokeWidth={3} />
          Dashboard Home
        </button>
      </div>
    </div>
  );
}
