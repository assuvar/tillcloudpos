import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";
import { getLandingPage } from "./permissions";

interface LoginProps {
  loginType?: "admin" | "cashier" | "manager" | "kitchen" | "default";
}

export default function Login({ loginType = "default" }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      let endpoint = "/auth/login";
      let payload: any = { email, password };
      
      if (loginType === "admin" || loginType === "default") {
        endpoint = "/auth/admin-login";
      } else if (loginType === "cashier") {
        endpoint = "/auth/pos-login";
        payload = { pin, password };
      } else if (loginType === "manager") {
        endpoint = "/auth/manager-login";
        payload = { pin, password };
      } else if (loginType === "kitchen") {
        endpoint = "/auth/kitchen-login";
        payload = { pin, password };
      }

      const response = await api.post(endpoint, payload);
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
            {loginType === "admin" || loginType === "default"
              ? "Admin Login"
              : loginType === "cashier"
                ? "Cashier Login"
                : loginType === "manager"
                  ? "Manager Login"
                  : loginType === "kitchen"
                    ? "Kitchen Login"
                    : "Login to your Billing"}
          </h1>
          <p className="text-xs font-semibold text-slate-400 sm:text-sm">
            {loginType === "admin" || loginType === "default"
              ? "Access the admin dashboard"
              : ["cashier", "manager", "kitchen"].includes(loginType)
                ? "Enter your PIN and Password to continue"
                : "Welcome back! Access your workspace"}
          </p>
        </div>

        <div className="relative w-full max-w-[420px] rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_50px_rgba(11,27,61,0.04)] sm:p-7">
          <div className="absolute -inset-4 bg-sky-400/5 blur-[40px] -z-10 rounded-[3rem]"></div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold mb-6 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handlePasswordLogin}>
            {["admin", "default"].includes(loginType) && (
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
            )}

            {["cashier", "manager", "kitchen"].includes(loginType) && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
                  Staff PIN <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full h-11 px-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all tracking-widest text-center text-lg font-black"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-0.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Password <span className="text-rose-500">*</span>
                </label>
                {["admin", "default"].includes(loginType) && (
                  <Link
                    to="/forgot"
                    className="text-[10px] text-[#0ea5e9] font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all tracking-widest font-black"
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
                ["cashier", "manager", "kitchen"].includes(loginType)
                  ? "LOGIN TO PORTAL"
                  : "LOGIN TO DASHBOARD"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

