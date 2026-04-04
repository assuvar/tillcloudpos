import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import OnboardingFlow from "./onboarding/OnboardingFlow";
import Dashboard from "./Dashboard";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-[#0b1b3d]">LOADING...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-[#0b1b3d]">LOADING...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-[#0b1b3d]">LOADING...</div>;

  if (isAuthenticated && user) {
    if (user.onboardingCompleted) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function Landing() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-0">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-[1240px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tight text-[#0b1b3d]">
            TILLCLOUD
          </div>
          <div className="hidden md:flex items-center space-x-10 text-[15px] font-bold text-slate-600">
            <a href="#home" className="hover:text-[#4fc3f7] transition-colors">
              Home
            </a>
            <a
              href="#pricing"
              className="hover:text-[#4fc3f7] transition-colors"
            >
              Pricing
            </a>
            <a
              href="#contact"
              className="hover:text-[#4fc3f7] transition-colors"
            >
              Contact
            </a>
          </div>
          <div className="flex items-center space-x-6 text-[15px] font-bold">
            <Link
              to="/login"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-[#0b1b3d] text-white px-7 py-2.5 rounded-full hover:bg-[#152a55] transition-all shadow-lg shadow-blue-900/10"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 bg-white overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-[84px] font-[950] tracking-[-0.04em] mb-6 leading-[1.1] text-[#0b1b3d]">
            Modern Billing for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4fc3f7] to-[#0ea5e9]">
              Australian Restaurants
            </span>
          </h1>

          <p className="mt-8 text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Manage orders, billing, kitchen and tables — all in one powerful
            system designed for the speed of modern hospitality.
          </p>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6 text-slate-400 text-[14px] font-bold uppercase tracking-widest">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#4fc3f7] rounded-full"></span>
              <span>Trusted by 500+ restaurants</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#4fc3f7] rounded-full"></span>
              <span>Designed for small businesses</span>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-20 relative px-4 md:px-0">
            <div className="absolute -inset-20 bg-blue-50/50 blur-[120px] -z-10 rounded-full opacity-50"></div>
            <div className="rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] overflow-hidden bg-white p-3 border border-slate-100/60 max-w-[1040px] mx-auto transform hover:scale-[1.01] transition-transform duration-700">
              {/* Dashboard Mockup Content (Simplified CSS) */}
              <div className="rounded-[2rem] overflow-hidden border border-slate-100 bg-[#f8fafc] h-[580px] flex flex-col relative">
                <div className="h-16 bg-white border-b border-slate-100 flex items-center px-6 justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-lg bg-[#4fc3f7]/10 flex items-center justify-center text-[#4fc3f7] font-bold text-xs ring-1 ring-[#4fc3f7]/20">
                      â˜
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="flex space-x-2">
                      <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                      <div className="h-2 w-8 bg-slate-50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50"></div>
                    <div className="w-24 h-8 rounded-lg bg-slate-50"></div>
                  </div>
                </div>
                <div className="flex flex-1">
                  <div className="w-16 border-r border-slate-100 p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg bg-slate-50"
                      ></div>
                    ))}
                  </div>
                  <div className="flex-1 p-8">
                    <div className="flex justify-between items-center mb-10">
                      <div className="h-6 w-40 bg-slate-200/50 rounded-lg"></div>
                      <div className="flex space-x-2">
                        <div className="h-10 w-24 bg-[#0b1b3d] rounded-lg"></div>
                        <div className="h-10 w-24 bg-white border border-slate-100 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-24 rounded-xl border border-slate-100 flex flex-col p-3 ${i % 3 === 0 ? "bg-emerald-50/50 border-emerald-100" : "bg-white"}`}
                        >
                          <div
                            className={`h-1.5 w-full rounded-full mb-3 ${i % 3 === 0 ? "bg-emerald-400" : "bg-slate-200"}`}
                          ></div>
                          <div className="h-4 w-10 bg-slate-100 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-[#f8fafc]">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-[#0b1b3d] tracking-tight mb-4">
              Built for Every Interaction
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              One ecosystem to rule your whole restaurant business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group lg:col-span-2">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                ðŸ‘¤
              </div>
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">
                Billing & POS
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                High-performance point of sale with multi-terminal support,
                split billing, and fast-pay features. Designed to keep the line
                moving even during peak hours.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                ðŸ“‹
              </div>
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">KDS</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Keep your kitchen staff organized with real-time order tracking
                and priority alerts.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                ðŸ“¶
              </div>
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">
                Online & Mobile Order
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Take direct orders through your own branded website with zero
                commission fees.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                ðŸ“Š
              </div>
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">
                Inventory Tracking
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Real-time stock monitoring with automatic alerts for low
                inventory levels.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                ðŸ“ˆ
              </div>
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">
                Customer Insights
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Understand your regulars with loyalty tracking and behavior
                analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operations Flow */}
      <section className="py-32 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-[950] text-[#0b1b3d] tracking-tight mb-20">
            Simplify Your Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-slate-100 -z-10"></div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-[#0b1b3d] text-white rounded-full flex items-center justify-center text-2xl font-black mb-8 shadow-2xl shadow-blue-900/20">
                01
              </div>
              <h4 className="text-xl font-black text-[#0b1b3d] mb-2">SETUP</h4>
              <p className="text-slate-500 font-medium text-sm px-6">
                Easily upload your menu and floor plan in minutes.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-[#0b1b3d] text-white rounded-full flex items-center justify-center text-2xl font-black mb-8 shadow-2xl shadow-blue-900/20">
                02
              </div>
              <h4 className="text-xl font-black text-[#0b1b3d] mb-2">MANAGE</h4>
              <p className="text-slate-500 font-medium text-sm px-6">
                Handle everything from orders to payments with ease.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-[#0b1b3d] text-white rounded-full flex items-center justify-center text-2xl font-black mb-8 shadow-2xl shadow-blue-900/20">
                03
              </div>
              <h4 className="text-xl font-black text-[#0b1b3d] mb-2">GROW</h4>
              <p className="text-slate-500 font-medium text-sm px-6">
                Use data to scale your business and increase profit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Sections (Table & Data) */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-[1240px] mx-auto px-6 space-y-40">
          {/* Table Management */}
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-5xl font-[950] text-[#0b1b3d] tracking-tight mb-8 leading-[1.1]">
                Powerful Table Management
              </h2>
              <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                Design your floor plan exactly how it looks in real life.
                Monitor status, handle reservations, and optimize your seating
                rotations instantly.
              </p>
              <ul className="space-y-6">
                <li className="flex items-center space-x-4">
                  <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[#4fc3f7] text-xs">
                    ✓
                  </span>
                  <span className="font-bold text-slate-700">
                    Real-time occupancy tracking
                  </span>
                </li>
                <li className="flex items-center space-x-4">
                  <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[#4fc3f7] text-xs">
                    ✓
                  </span>
                  <span className="font-bold text-slate-700">
                    Intuitive drag-and-drop layout
                  </span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 bg-white p-4 rounded-[3rem] shadow-2xl shadow-blue-900/5 rotate-1">
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-100">
                <div className="bg-slate-50 h-80 flex items-center justify-center text-slate-200 text-4xl font-black">
                  MOCKUP
                </div>
              </div>
            </div>
          </div>

          {/* Master Your Data */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-5xl font-[950] text-[#0b1b3d] tracking-tight mb-8 leading-[1.1]">
                Master Your Data
              </h2>
              <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                Turn your daily operations into powerful insights. Our reporting
                suite gives you the clarity to make data-driven decisions that
                actually matter.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                  <div className="text-3xl font-black text-[#4fc3f7] mb-1">
                    99%
                  </div>
                  <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    Accuracy
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                  <div className="text-3xl font-black text-[#4fc3f7] mb-1">
                    +45%
                  </div>
                  <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    Efficiency
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 bg-white p-4 rounded-[3rem] shadow-2xl shadow-blue-900/5 -rotate-1">
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-100">
                <div className="bg-slate-50 h-80 flex items-center justify-center text-slate-200 text-4xl font-black">
                  MOCKUP
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-white overflow-hidden relative">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-[#0b1b3d] tracking-tight mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              No hidden fees. Every plan includes 24/7 support.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8">
            {/* Free Tier */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center flex-1">
              <div className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] mb-8">
                Free Tier
              </div>
              <div className="text-6xl font-[950] text-[#0b1b3d] mb-2">
                $0<span className="text-lg text-slate-300">/mo</span>
              </div>
              <div className="text-slate-400 text-sm mb-10">
                Perfect for small kiosks
              </div>
              <ul className="space-y-4 mb-12 text-slate-500 font-medium text-sm">
                <li>1 Terminal Support</li>
                <li>Digital Invoicing</li>
                <li>Basic Reports</li>
              </ul>
              <button className="w-full py-4 rounded-full border border-slate-200 font-bold hover:bg-slate-50 transition-colors">
                Start Free Plan
              </button>
            </div>

            {/* Basic Plan (Active) */}
            <div className="bg-[#0b1b3d] p-12 rounded-[3.5rem] flex flex-col items-center text-center flex-1 shadow-3xl shadow-blue-900/40 relative transform scale-[1.05] z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4fc3f7] text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-8 ring-white">
                Most Popular
              </div>
              <div className="text-blue-200/50 font-black text-[11px] uppercase tracking-[0.2em] mb-8">
                Basic Plan
              </div>
              <div className="text-6xl font-[950] text-white mb-2">
                $79<span className="text-lg text-blue-500">/mo</span>
              </div>
              <div className="text-blue-300 opacity-60 text-sm mb-10">
                For growing restaurants
              </div>
              <ul className="space-y-4 mb-12 text-white/80 font-medium text-sm">
                <li>3 Terminal Support</li>
                <li>Full KDS Features</li>
                <li>Online Ordering (Web)</li>
                <li>Real-time CRM tools</li>
              </ul>
              <button className="w-full py-4 rounded-full bg-[#4fc3f7] text-white font-bold hover:bg-[#3db0e4] transition-colors shadow-lg shadow-blue-400/20">
                Get Basic Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center flex-1">
              <div className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] mb-8">
                Premium Plan
              </div>
              <div className="text-6xl font-[950] text-[#0b1b3d] mb-2">
                $149<span className="text-lg text-slate-300">/mo</span>
              </div>
              <div className="text-slate-400 text-sm mb-10">
                Maximum scale and power
              </div>
              <ul className="space-y-4 mb-12 text-slate-500 font-medium text-sm">
                <li>Unlimited Terminals</li>
                <li>White-label App Support</li>
                <li>Multi-outlet Support</li>
                <li>High Priority Support</li>
              </ul>
              <button className="w-full py-4 rounded-full border border-slate-200 font-bold hover:bg-slate-50 transition-colors">
                Get Premium Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-[#f8fafc]">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-[#0b1b3d] tracking-tight mb-4">
              Our Happy Customers
            </h2>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
              We take pride in our service and our customers' success. Here is
              what they have to say about TillCloud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-50">
              <div className="w-20 h-20 bg-slate-100 rounded-full mb-8 overflow-hidden mx-auto border-4 border-slate-50">
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  ðŸ‘©
                </div>
              </div>
              <p className="text-slate-500 font-medium text-lg text-center mb-8 leading-relaxed">
                "TillCloud has completely transformed how we handle our peak
                hour rush. The interface is so intuitive that my staff didn't
                even need training!"
              </p>
              <div className="text-center">
                <div className="font-[950] text-[#0b1b3d] uppercase tracking-widest text-xs mb-1">
                  Sarah Thompson
                </div>
                <div className="text-slate-400 font-bold text-[10px] uppercase">
                  The Rustic Table, Sydney
                </div>
              </div>
            </div>
            <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-50">
              <div className="w-20 h-20 bg-slate-100 rounded-full mb-8 overflow-hidden mx-auto border-4 border-slate-50">
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  ðŸ‘¨
                </div>
              </div>
              <p className="text-slate-500 font-medium text-lg text-center mb-8 leading-relaxed">
                "The reporting tools are a game changer. I can now track my
                inventory and sales in real-time from my phone. Best investment
                for my business."
              </p>
              <div className="text-center">
                <div className="font-[950] text-[#0b1b3d] uppercase tracking-widest text-xs mb-1">
                  David Chen
                </div>
                <div className="text-slate-400 font-bold text-[10px] uppercase">
                  Dragon City Bistro, Melbourne
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="bg-[#0b1b3d] rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-3xl shadow-blue-900/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4fc3f7] opacity-10 blur-[100px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4fc3f7] opacity-10 blur-[100px] -ml-32 -mb-32"></div>
            <h2 className="text-4xl md:text-6xl font-[950] tracking-tight mb-8">
              Start managing your restaurant
              <br />
              smarter today
            </h2>
            <p className="text-blue-200/60 font-medium text-lg mb-12 max-w-xl mx-auto">
              Join the 500+ restaurants that have already scaled their
              operations with our powerful billing platform.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link
                to="/register"
                className="bg-white text-[#0b1b3d] px-12 py-5 rounded-full font-black text-lg hover:bg-white/90 transition-all shadow-xl shadow-black/20"
              >
                Get Started Now
              </Link>
            </div>
            <div className="mt-8 text-blue-300/40 text-[10px] font-black uppercase tracking-[0.2em]">
              No credit card required • setup in minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2">
              <div className="text-2xl font-black tracking-tight text-[#0b1b3d] mb-6">
                TILLCLOUD
              </div>
              <p className="text-slate-400 font-medium text-sm max-w-xs leading-relaxed">
                Modern billing and management solutions built specifically for
                the Australian hospitality industry.
              </p>
            </div>
            <div>
              <h5 className="font-black text-[#0b1b3d] text-[11px] uppercase tracking-[0.15em] mb-6">
                Company
              </h5>
              <ul className="space-y-4 text-slate-500 font-medium text-[13px]">
                <li className="hover:text-[#4fc3f7] cursor-pointer">
                  About Us
                </li>
                <li className="hover:text-[#4fc3f7] cursor-pointer">Careers</li>
                <li className="hover:text-[#4fc3f7] cursor-pointer">Blog</li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-[#0b1b3d] text-[11px] uppercase tracking-[0.15em] mb-6">
                Product
              </h5>
              <ul className="space-y-4 text-slate-500 font-medium text-[13px]">
                <li className="hover:text-[#4fc3f7] cursor-pointer">
                  Features
                </li>
                <li className="hover:text-[#4fc3f7] cursor-pointer">Pricing</li>
                <li className="hover:text-[#4fc3f7] cursor-pointer">KDS</li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-[#0b1b3d] text-[11px] uppercase tracking-[0.15em] mb-6">
                Support
              </h5>
              <ul className="space-y-4 text-slate-500 font-medium text-[13px]">
                <li className="hover:text-[#4fc3f7] cursor-pointer">
                  Help Center
                </li>
                <li className="hover:text-[#4fc3f7] cursor-pointer">Status</li>
                <li className="hover:text-[#4fc3f7] cursor-pointer">Contact</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-50 pt-10">
            <div className="text-[11px] text-slate-400 font-bold">
              © 2026 TillCloud Billing. All rights reserved.
            </div>
            <div className="flex space-x-8 mt-6 md:mt-0 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="hover:text-[#0b1b3d] cursor-pointer">
                Privacy Policy
              </span>
              <span className="hover:text-[#0b1b3d] cursor-pointer">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          <OnboardingRoute>
            <OnboardingFlow />
          </OnboardingRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
