import { useState } from "react";
import { Eye, Clock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="px-10 py-8 flex items-center justify-between relative z-10">
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

      {/* Login Content */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-20 px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-[#0b1b3d] mb-4">
            Login to your Billing
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Welcome back! Access your workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[540px] bg-white rounded-[2.5rem] p-12 shadow-[0_40px_100px_-20px_rgba(14,165,233,0.15)] border border-slate-50 relative">
          <div className="absolute -inset-4 bg-sky-400/5 blur-[40px] -z-10 rounded-[3rem]"></div>

          <form className="space-y-8" onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setIsSubmitting(true);
            try {
              const response = await api.post('/auth/login', { email, password });
              login(response.data.access_token, response.data.user);
              if (response.data.user.onboardingCompleted) {
                navigate('/dashboard');
              } else {
                navigate('/onboarding');
              }
            } catch (err: any) {
              setError(err.response?.data?.message || "Invalid credentials. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
          }}>
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            {/* Role Select - Keeping visual but logic focused on email/pass for admin */}
            <div className="space-y-3 opacity-50 pointer-events-none">
              <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1">
                Role
              </label>
              <div className="relative group">
                <select className="w-full h-[64px] px-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-slate-500 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all cursor-pointer">
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email ID */}
            <div className="space-y-3">
              <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1">
                Email ID
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.com"
                className="w-full h-[64px] px-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-3">
              <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[64px] px-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all tracking-widest pl-6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Eye
                    className={`w-5 h-5 ${showPassword ? "text-sky-500" : ""}`}
                  />
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <a
                  href="/forgot"
                  className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 transition-colors text-[13px] font-medium group"
                >
                  <Clock className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span>Forgot your password?</span>
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[72px] bg-[#0b1b3d] text-white rounded-full font-[950] text-sm uppercase tracking-[0.1em] hover:bg-[#152a55] transition-all shadow-2xl shadow-blue-900/30 mt-4 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "LOGIN TO DASHBOARD"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
