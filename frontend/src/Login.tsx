import { useState } from "react";
import { Eye, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
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

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* Role Select */}
            <div className="space-y-3">
              <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider ml-1">
                Role
              </label>
              <div className="relative group">
                <select className="w-full h-[64px] px-6 bg-[#f8fafc] border border-slate-100 rounded-2xl text-slate-500 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:bg-white transition-all cursor-pointer">
                  <option value="">Admin | Employee | Kitchen</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                  <option value="kitchen">Kitchen</option>
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
              className="w-full h-[72px] bg-[#0b1b3d] text-white rounded-full font-[950] text-sm uppercase tracking-[0.1em] hover:bg-[#152a55] transition-all shadow-2xl shadow-blue-900/30 mt-4 active:scale-[0.98]"
            >
              LOGIN TO DASHBOARD
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
