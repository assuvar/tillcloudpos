import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Mail,
  Smartphone,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";
import { getLandingPage } from "./permissions";

type LoginMethod = "password" | "otp";
type OtpStep = "request" | "verify";

export default function Login() {
  const [method, setMethod] = useState<LoginMethod>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("request");

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      await login(response.data.access_token, response.data.user);
      navigate(
        response.data.user.onboardingCompleted
          ? getLandingPage(null, response.data.user.role)
          : "/onboarding",
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await api.post("/auth/otp/send", { email });
      setOtpStep("verify");
      setCountdown(60);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/verify-otp", { email, otp });
      if (response.data?.access_token && response.data?.user) {
        await login(response.data.access_token, response.data.user);
        navigate(
          response.data.user.onboardingCompleted
            ? getLandingPage(null, response.data.user.role)
            : "/onboarding",
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div
          className="flex items-center gap-2 text-xl font-[950] tracking-tighter text-[#0b1b3d] cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src="/logo.png" alt="TillCloud Logo" className="w-8 h-8 object-contain" />
          TILLCLOUD
        </div>
        <Link
          to="/register"
          className="bg-[#0b1b3d] text-white px-5 py-2 rounded-full font-bold text-xs hover:bg-[#152a55] transition-all shadow-md shadow-blue-900/5"
        >
          SIGNUP
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="mb-1.5 text-xl font-black text-[#0b1b3d] sm:text-2xl">
            {method === "password" ? "Login to your Billing" : "Login with OTP"}
          </h1>
          <p className="text-xs font-semibold text-slate-400 sm:text-sm">
            Welcome back! Access your workspace via{" "}
            {method === "password" ? "password" : "secure code"}
          </p>
        </div>

        <div className="relative w-full max-w-[420px] rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_50px_rgba(11,27,61,0.04)] sm:p-7">
          <div className="absolute -inset-4 bg-sky-400/5 blur-[40px] -z-10 rounded-[3rem]"></div>

          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => {
                setMethod("password");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${method === "password" ? "bg-white text-[#0b1b3d] shadow-sm" : "text-slate-400"}`}
            >
              Password
            </button>
            <button
              onClick={() => {
                setMethod("otp");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${method === "otp" ? "bg-white text-[#0b1b3d] shadow-sm" : "text-slate-400"}`}
            >
              Secure OTP
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold mb-6 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {method === "password" ? (
            <form className="space-y-5" onSubmit={handlePasswordLogin}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
                  Email ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    className="w-full h-11 pl-11 pr-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-0.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/forgot"
                    className="text-[10px] text-[#0ea5e9] font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-all flex items-center justify-center"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[#0b1b3d] text-xs font-bold uppercase tracking-[0.1em] text-white shadow-md hover:bg-[#152a55] transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "LOGIN TO DASHBOARD"
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {otpStep === "request" ? (
                <form className="space-y-5" onSubmit={handleRequestOtp}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
                      Email or Phone <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        required
                        value={email}
                        autoFocus
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com or 04XX XXX XXX"
                        className="w-full h-11 pl-11 pr-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 ml-0.5 font-medium">
                      We'll send a 6-digit verification code to this{" "}
                      {email.includes("@") ? "email address" : "device"}.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[#0b1b3d] text-xs font-bold uppercase tracking-[0.1em] text-white shadow-md hover:bg-[#152a55] transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "SEND VERIFICATION CODE"
                    )}
                  </button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("request");
                          setOtp("");
                        }}
                        className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <span className="text-[11px] font-bold text-slate-500 truncate max-w-[200px]">
                        Verify {email}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
                        Enter 6-digit Code <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          autoFocus
                          onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, ""));
                            setError("");
                          }}
                          placeholder="0 0 0 0 0 0"
                          className="w-full h-11 pl-11 pr-4 bg-slate-50/50 border border-slate-100 rounded-xl text-[16px] font-black tracking-[0.25em] text-center placeholder:text-slate-200 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center flex-col items-center gap-1.5">
                      <div className="text-[11px] text-slate-400 font-medium">
                        Didn't receive the code?
                      </div>
                      <button
                        type="button"
                        disabled={countdown > 0 || isSubmitting}
                        onClick={() => {
                          void handleRequestOtp(null as any);
                        }}
                        className={`text-[10px] font-bold uppercase tracking-wider ${countdown > 0 ? "text-slate-300" : "text-[#0ea5e9] hover:text-[#0ea5e9]/80"}`}
                      >
                        {countdown > 0
                          ? `Resend Code in ${countdown}s`
                          : "Resend Code Now"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="w-full h-11 bg-[#0b1b3d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.1em] hover:bg-[#152a55] transition-all shadow-md mt-2 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "VERIFY & LOGIN"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
