import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-0">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="text-xl font-black tracking-tight text-[#0b1b3d] sm:text-2xl cursor-pointer"
            onClick={() => navigate("/")}
          >
            TILLCLOUD
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-bold text-slate-600 sm:gap-x-10 sm:text-[15px]">
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
          <div className="flex items-center justify-between gap-4 text-[14px] font-bold sm:gap-6 sm:text-[15px]">
            <button
              onClick={() => navigate("/login")}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-[#0b1b3d] text-white px-7 py-2.5 rounded-full hover:bg-[#152a55] transition-all shadow-lg shadow-blue-900/10"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="overflow-hidden bg-white pt-36 pb-20 sm:pt-40"
      >
        <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6">
          <h1 className="mb-6 text-4xl font-[950] tracking-[-0.04em] leading-[1.08] text-[#0b1b3d] sm:text-5xl md:text-[84px]">
            Modern Billing for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4fc3f7] to-[#0ea5e9]">
              Australian Restaurants
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 sm:text-xl">
            Manage orders, billing, kitchen and tables — all in one powerful
            system designed for the speed of modern hospitality.
          </p>

          <div className="mt-10 rounded-[2rem] border border-slate-100 bg-white p-8 text-left shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)] sm:mt-14 sm:p-10">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4fc3f7]">
                  POS
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                  Fast billing, split payments, and table-aware checkout.
                </p>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4fc3f7]">
                  Kitchen
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                  Live order flow from cashier to kitchen display.
                </p>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4fc3f7]">
                  Reports
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                  Track sales, inventory, and staff activity from the real
                  system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#f8fafc] py-20 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="mb-16 text-center sm:mb-20">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-[#0b1b3d] sm:text-4xl lg:text-5xl">
              Built for Every Interaction
            </h2>
            <p className="text-base font-medium text-slate-500 sm:text-lg">
              One ecosystem to rule your whole restaurant business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group lg:col-span-2">
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">
                Billing & POS
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                High-performance point of sale with multi-terminal support,
                split billing, and fast-pay features. Designed to keep the line
                moving even during peak hours.
              </p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">KDS</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Keep your kitchen staff organized with real-time order tracking
                and priority alerts.
              </p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">
                Online & Mobile Order
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Take direct orders through your own branded website with zero
                commission fees.
              </p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <h3 className="text-2xl font-black text-[#0b1b3d] mb-4">
                Inventory Tracking
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Real-time stock monitoring with automatic alerts for low
                inventory levels.
              </p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
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
      <section className="bg-white py-20 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6">
          <h2 className="mb-14 text-3xl font-[950] tracking-tight text-[#0b1b3d] sm:mb-20 sm:text-4xl">
            Simplify Your Operations
          </h2>
          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-16">
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

      {/* Detail Sections */}
      <section className="bg-[#f8fafc] py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] space-y-24 px-4 sm:space-y-40 sm:px-6">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-20">
            <div className="lg:w-1/2">
              <h2 className="mb-6 text-3xl font-[950] tracking-tight leading-[1.1] text-[#0b1b3d] sm:mb-8 sm:text-4xl lg:text-5xl">
                Powerful Table Management
              </h2>
              <p className="mb-8 text-base font-medium leading-relaxed text-slate-500 sm:mb-10 sm:text-lg">
                Design your floor plan exactly how it looks in real life.
                Monitor status, handle reservations, and optimize your seating
                rotations instantly.
              </p>
              <ul className="space-y-4 sm:space-y-6">
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
            <div className="w-full lg:w-1/2 rounded-[2rem] bg-white p-3 shadow-2xl shadow-blue-900/5 rotate-0 sm:rounded-[3rem] sm:p-4 lg:rotate-1">
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-100">
                <div className="bg-slate-50 h-80 flex items-center justify-center text-slate-200 text-sm font-semibold uppercase tracking-[0.2em]">
                  No demo data
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-10 lg:flex-row-reverse lg:gap-20">
            <div className="lg:w-1/2">
              <h2 className="mb-6 text-3xl font-[950] tracking-tight leading-[1.1] text-[#0b1b3d] sm:mb-8 sm:text-4xl lg:text-5xl">
                Master Your Data
              </h2>
              <p className="mb-8 text-base font-medium leading-relaxed text-slate-500 sm:mb-10 sm:text-lg">
                Turn your daily operations into powerful insights. Our reporting
                suite gives you the clarity to make data-driven decisions that
                actually matter.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
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
            <div className="w-full lg:w-1/2 rounded-[2rem] bg-white p-3 shadow-2xl shadow-blue-900/5 rotate-0 sm:rounded-[3rem] sm:p-4 lg:-rotate-1">
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-100">
                <div className="bg-slate-50 h-80 flex items-center justify-center text-slate-200 text-sm font-semibold uppercase tracking-[0.2em]">
                  No demo data
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="relative overflow-hidden bg-white py-20 sm:py-32"
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="mb-16 text-center sm:mb-20">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-[#0b1b3d] sm:text-4xl lg:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base font-medium text-slate-500 sm:text-lg">
              No hidden fees. Every plan includes 24/7 support.
            </p>
          </div>

          <div className="flex flex-col items-stretch justify-center gap-6 lg:flex-row lg:gap-8">
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
              <button
                onClick={() => navigate("/register")}
                className="w-full py-4 rounded-full border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
              >
                Start Free Plan
              </button>
            </div>

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
              <button
                onClick={() => navigate("/register")}
                className="w-full py-4 rounded-full bg-[#4fc3f7] text-white font-bold hover:bg-[#3db0e4] transition-colors shadow-lg shadow-blue-400/20"
              >
                Get Basic Plan
              </button>
            </div>

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
              <button
                onClick={() => navigate("/register")}
                className="w-full py-4 rounded-full border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
              >
                Get Premium Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0b1b3d] p-10 text-center text-white shadow-3xl shadow-blue-900/30 sm:rounded-[4rem] sm:p-16 md:p-24">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4fc3f7] opacity-10 blur-[100px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4fc3f7] opacity-10 blur-[100px] -ml-32 -mb-32"></div>
            <h2 className="mb-8 text-3xl font-[950] tracking-tight sm:text-4xl md:text-6xl text-white">
              Start managing your restaurant
              <br />
              smarter today
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-base font-medium text-blue-200/60 sm:mb-12 sm:text-lg">
              Join the 500+ restaurants that have already scaled their
              operations with our powerful billing platform.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
              <button
                onClick={() => navigate("/register")}
                className="bg-white text-[#0b1b3d] px-12 py-5 rounded-full font-black text-lg hover:bg-white/90 transition-all shadow-xl shadow-black/20"
              >
                Get Started Now
              </button>
            </div>
            <div className="mt-8 text-blue-300/40 text-[10px] font-black uppercase tracking-[0.2em]">
              No credit card required • setup in minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="border-t border-slate-100 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="mb-16 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5 sm:mb-20 sm:gap-12">
            <div className="col-span-2">
              <div
                className="text-2xl font-black tracking-tight text-[#0b1b3d] mb-6 cursor-pointer"
                onClick={() => navigate("/")}
              >
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
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-50 pt-10 text-center md:flex-row md:text-left">
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
