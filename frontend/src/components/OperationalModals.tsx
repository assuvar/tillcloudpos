import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Clock, Play, AlertTriangle } from "lucide-react";
import { formatDuration } from "../utils/dateUtils";

interface OperationalModalsProps {
  onSessionChange?: () => void;
  forceClockOutOpen?: boolean;
  onClockOutClose?: () => void;
}

export const OperationalModals: React.FC<OperationalModalsProps> = ({
  forceClockOutOpen = false,
  onClockOutClose,
}) => {
  const {
    user,
    activeAttendance,
    clockIn,
    clockOut,
    refreshSessions,
  } = useAuth();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(forceClockOutOpen);

  // Sync state with props
  useEffect(() => {
    setShowClockOutModal(forceClockOutOpen);
  }, [forceClockOutOpen]);

  // Clock In Handle
  const handleClockIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await clockIn();
      await refreshSessions();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to Clock In.");
    } finally {
      setLoading(false);
    }
  };

  // Clock Out Handle
  const handleClockOut = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await clockOut();
      await refreshSessions();
      if (onClockOutClose) {
        onClockOutClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to clock out.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Mandatory Shift/Clock-In Check
  if (!activeAttendance) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#060b13]/85 backdrop-blur-md" />
        <div className="bg-gradient-to-b from-[#111927] to-[#0b101b] border border-[#1f2d42] rounded-[32px] p-8 shadow-2xl max-w-md w-full relative z-[1001] animate-in fade-in zoom-in-95 duration-250 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20 mb-6">
            <Clock size={32} />
          </div>

          <h3 className="text-2xl font-[1000] text-white">Start Shift / Clock-In</h3>
          <p className="text-[13px] text-slate-400 font-medium mt-2 leading-relaxed">
            You must Clock-In to start your shift before accessing orders, payments, tables, and other terminal services.
          </p>

          <div className="bg-[#182335]/50 border border-[#263750] rounded-2xl p-4 mt-6">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-400">Employee Details</span>
            <div className="flex items-center gap-3 mt-2">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-800">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "Staff")}&background=0284c7&color=fff`}
                  className="h-full w-full object-cover"
                  alt="Staff avatar"
                />
              </div>
              <div>
                <h4 className="font-bold text-[14px] text-white leading-tight">{user?.fullName}</h4>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{user?.role}</p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3.5 flex gap-2.5 text-xs">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleClockIn}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold text-sm uppercase tracking-widest transition-all mt-6 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Processing..." : (
              <>
                <Play size={16} fill="currentColor" />
                Clock-In & Start Shift
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 2. Manual / Triggered Clock Out Modal
  if (showClockOutModal && activeAttendance) {
    const elapsedMs = Date.now() - new Date(activeAttendance.clockInTime).getTime();

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#060b13]/85 backdrop-blur-md" />
        <div className="bg-gradient-to-b from-[#111927] to-[#0b101b] border border-[#1f2d42] rounded-[32px] p-8 shadow-2xl max-w-md w-full relative z-[1001] animate-in fade-in zoom-in-95 duration-250 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20 mb-6">
            <Clock size={32} />
          </div>

          <h3 className="text-2xl font-[1000] text-white">End Shift / Clock-Out</h3>
          <p className="text-[13px] text-slate-400 font-medium mt-2 leading-relaxed">
            Are you ready to clock out and finalize your shift attendance session?
          </p>

          <div className="bg-[#182335]/50 border border-[#263750] rounded-2xl p-4 mt-6 space-y-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-400 block mb-1">
              Active Shift Summary
            </span>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Clock-In Time:</span>
              <span className="font-bold text-slate-200">
                {new Date(activeAttendance.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total Shift Duration:</span>
              <span className="font-bold text-sky-400">{formatDuration(elapsedMs, 'ms')}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3.5 flex gap-2.5 text-xs">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                if (onClockOutClose) onClockOutClose();
              }}
              className="flex-1 h-14 rounded-2xl border border-[#263750] text-slate-400 font-extrabold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="flex-1 h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? "Clocking out..." : (
                <>
                  <Clock size={14} />
                  Clock-Out & End
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
export default OperationalModals;
