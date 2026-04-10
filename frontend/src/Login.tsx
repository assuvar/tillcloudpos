import { useState, useEffect } from "react";
import { Eye, Loader2, MessageSquare, Mail, Smartphone, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";

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
      const response = await api.post('/auth/login', { email, password });
      login(response.data.access_token, response.data.user);
      navigate(response.data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      // Determine if email or mobile based on input
      const channel = email.includes("@") ? "email" : "mobile";
      await api.post('/auth/otp/send', { channel, destination: email });
      setOtpStep("verify");
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const channel = email.includes("@") ? "email" : "mobile";
      const response = await api.post('/auth/otp/verify', { channel, destination: email, code: otp });
      login(response.data.access_token, response.data.user);
      navigate(response.data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div
          className="text-2xl font-black tracking-tight text-[#0b1b3d] cursor-pointer"
          onClick={() => navigate("/")}
        >
          TILLCLOUD
        </div>
        <Link
          to="/register"
          className="bg-[#0b1b3d] text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-[#152a55] transition-all shadow-lg shadow-blue-900/10"
        >
          SIGNUP
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 -mt-10 sm:px-6 lg:-mt-20">
        <div className="text-center mb-10">
          <h1 className="mb-4 text-3xl font-black text-[#0b1b3d] sm:text-4xl lg:text-5xl">
            {method === "password" ? "Login to your Billing" : "Login with OTP"}
          </h1>
          <p className="text-base font-medium text-slate-500 sm:text-lg">
            Welcome back! Access your workspace via {method === "password" ? "password" : "secure code"}
          </p>
        </div>

        <div className="relative w-full max-w-[540px] rounded-[2rem] border border-slate-50 bg-white p-6 shadow-[0_40px_100px_-20px_rgba(14,165,233,0.15)] sm:rounded-[2.5rem] sm:p-8 lg:p-12">
          <div className="absolute -inset-4 bg-sky-400/5 blur-[40px] -z-10 rounded-[3rem]"></div>

          <div className="mb-8 flex rounded-2xl bg-[#f1f5f9] p-1 sm:mb-10 sm:p-1.5">
            <button
              onClick={() => {
                setMethod("password");
                setError("");
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${method === "password" ? "bg-white text-[#0b1b3d] shadow-sm" : "text-slate-400"}`}
            >
              Password
            </button>
            <button
              onClick={() => {
                setMethod("otp");
                setError("");
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${method === "otp" ? "bg-white text-[#0b1b3d] shadow-sm" : "text-slate-400"}`}
            >
              Secure OTP
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold mb-8 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {method === "password" ? (
            <form className="space-y-8" onSubmit={handlePasswordLogin}>
              <div className="space-y-3">
                <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  Email ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    className="w-full h-14 pl-14 pr-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all sm:h-[64px]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1 flex justify-between">
                  <span>Password</span>
                  <Link to="/forgot" className="text-sky-600 normal-case font-bold hover:underline">Forgot?</Link>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 px-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all tracking-widest sm:h-[64px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Eye className={`w-5 h-5 ${showPassword ? "text-sky-500" : ""}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-[#0b1b3d] text-sm font-[950] uppercase tracking-[0.1em] text-white shadow-2xl shadow-blue-900/30 transition-all active:scale-[0.98] hover:bg-[#152a55] disabled:opacity-70 sm:h-[72px]"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "LOGIN TO DASHBOARD"}
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              {otpStep === "request" ? (
                <form className="space-y-8" onSubmit={handleRequestOtp}>
                  <div className="space-y-3">
                    <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1">
                      Email or Phone
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com or 04XX XXX XXX"
                        className="w-full h-14 pl-14 pr-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all sm:h-[64px]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 ml-1">
                      We'll send a 6-digit verification code to this {email.includes("@") ? "email address" : "device"}.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-[#0b1b3d] text-sm font-[950] uppercase tracking-[0.1em] text-white shadow-2xl shadow-blue-900/30 transition-all active:scale-[0.98] hover:bg-[#152a55] disabled:opacity-70 sm:h-[72px]"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "SEND VERIFICATION CODE"}
                  </button>
                </form>
              ) : (
                <form className="space-y-8" onSubmit={handleVerifyOtp}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                       <button 
                        type="button" 
                        onClick={() => {
                          setOtpStep("request");
                          setOtp("");
                        }}
                        className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"
                       >
                         <ArrowLeft size={16} />
                       </button>
                       <span className="text-sm font-bold text-slate-600">Verification for {email}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1">
                        Enter 6-digit Code
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          autoFocus
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="0 0 0 0 0 0"
                          className="w-full h-14 pl-14 pr-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-[20px] font-black tracking-[0.35em] placeholder:text-slate-200 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all text-center sm:h-[72px] sm:text-[24px] sm:tracking-[0.5em]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center flex-col items-center gap-2">
                      <div className="text-sm text-slate-500 font-medium">
                        Didn't receive the code?
                      </div>
                      <button
                        type="button"
                        disabled={countdown > 0 || isSubmitting}
                        onClick={() => {
                          void handleRequestOtp(null as any);
                        }}
                        className={`text-[13px] font-black uppercase tracking-wider ${countdown > 0 ? "text-slate-300" : "text-sky-600 hover:text-sky-700"}`}
                      >
                        {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Code Now"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="w-full h-[72px] bg-[#0b1b3d] text-white rounded-full font-[950] text-sm uppercase tracking-[0.1em] hover:bg-[#152a55] transition-all shadow-2xl shadow-blue-900/30 mt-4 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "VERIFY & LOGIN"}
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
