import { 
  Building2, 
  ChevronDown, 
  ShieldCheck, 
  UserCog, 
  UtensilsCrossed, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Smartphone,
  Mail
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const registrationSteps = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Admin Account', icon: UserCog },
  { id: 3, label: 'Restaurant Type', icon: UtensilsCrossed },
  { id: 4, label: 'Verification', icon: ShieldCheck },
];

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#eef4f8] text-slate-900 font-sans">
      <main className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="min-h-[calc(100vh-24px)] sm:min-h-[calc(100vh-32px)] border border-slate-200 bg-white grid lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="border-r border-slate-200 bg-white hidden lg:block">
            <div className="px-6 py-5 text-[30px] font-black tracking-tight text-[#0b1731]">TILLCLOUD</div>

            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <p className="text-2xl font-black text-[#0b1731]">Registration</p>
              <p className="text-sm text-slate-500 mt-1">Step {currentStep} of 4</p>
            </div>

            <nav className="py-2">
              {registrationSteps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 px-6 py-4 text-[15px] font-semibold transition-all ${
                      isActive
                        ? 'bg-[#f3f6fb] text-[#0b1731] border-r-2 border-r-cyan-400'
                        : isCompleted 
                        ? 'text-cyan-600'
                        : 'text-slate-400'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${isActive ? 'border-cyan-400' : isCompleted ? 'bg-cyan-400 border-cyan-400 text-white' : 'border-slate-200'}`}>
                      {isCompleted ? <span className="text-[10px]">✓</span> : <Icon className="h-3 w-3" />}
                    </div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Form Content */}
          <section className="relative overflow-hidden flex flex-col">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-[#f4fbff] to-[#edf5fa]" />

            <div className="relative h-full px-6 py-6 sm:px-10 sm:py-10 lg:px-16 lg:py-12 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <div className="lg:hidden text-xl font-black text-[#0b1731]">TILLCLOUD</div>
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-full bg-[#0b1731] px-8 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#162a4d] transition-colors ml-auto"
                >
                  Login
                </button>
              </div>

              <div className="mx-auto max-w-[720px] w-full flex-1">
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[#0b1731]">
                      Tell us about your
                      <br />
                      Establishment
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-[560px] leading-relaxed">
                      Start your journey with TILLCLOUD by providing the foundational details of your business.
                    </p>

                    <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">
                            Business Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. The Sapphire Bistro"
                            className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">
                            Country of Operation
                          </label>
                          <div className="relative group">
                            <select className="h-14 w-full appearance-none rounded-2xl border border-slate-100 bg-slate-50 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all font-medium cursor-pointer">
                              <option value="">Select your country</option>
                              <option value="AU">Australia</option>
                              <option value="NZ">New Zealand</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-slate-400" />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="h-14 w-full rounded-full bg-[#020c24] text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-[#0d1b3f] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
                        >
                          Next Step
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[#0b1731]">
                      Create Admin Profile
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-[560px] leading-relaxed">
                      Set up the primary administrative credentials for your restaurant's digital atrium.
                    </p>

                    <div className="mt-10 rounded-[2.5rem] border border-slate-100 bg-white p-8 sm:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
                      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Owner Name</label>
                            <input
                              type="text"
                              placeholder="Alexander Reed"
                              className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Owner Mobile Number</label>
                            <input
                              type="tel"
                              placeholder="+91 9874563210"
                              className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Email ID</label>
                          <input
                            type="email"
                            placeholder="owner@restaurant.com"
                            className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 relative">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Enter Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all tracking-widest"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Confirm Password</label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all tracking-widest"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                              >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                          <p className="absolute -bottom-6 left-1 text-[10px] text-slate-400 font-medium">Must contain 8 characters, one special symbol</p>
                        </div>

                        <div className="flex items-center justify-between pt-6">
                          <button
                            type="button"
                            onClick={prevStep}
                            className="flex items-center gap-2 text-slate-400 hover:text-[#0b1731] font-bold text-sm transition-colors group"
                          >
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            <span>Back</span>
                          </button>
                          <button
                            type="submit"
                            className="h-14 px-12 rounded-full bg-[#0b1731] text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-[#162a4d] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
                          >
                            <span>Next Step</span>
                            <span className="text-lg">→</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[#0b1731]">
                      Define your Venue
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-[560px] leading-relaxed">
                      Tell us about the structure and service model of your restaurant to help us tailor your experience.
                    </p>

                    <div className="mt-10 rounded-[2.5rem] border border-slate-100 bg-white p-8 sm:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
                      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Business Type</label>
                          <div className="relative group">
                            <select className="h-14 w-full appearance-none rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all font-medium cursor-pointer">
                              <option value="">Cafe | Restaurant</option>
                              <option value="cafe">Cafe</option>
                              <option value="restaurant">Restaurant</option>
                              <option value="bar">Bar</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 group-hover:text-slate-500" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Number of Outlets</label>
                          <div className="relative group">
                            <select className="h-14 w-full appearance-none rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all font-medium cursor-pointer">
                              <option value="">1 | 2 | 3</option>
                              <option value="1">1 Outlet</option>
                              <option value="2">2 Outlets</option>
                              <option value="3">3+ Outlets</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 group-hover:text-slate-500" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Service Model</label>
                          <div className="grid grid-cols-2 gap-4">
                            {['Dine-In', 'Takeaway', 'Delivery', 'Table Ordering'].map((model) => (
                              <label key={model} className="flex items-center gap-3 p-4 rounded-xl border border-slate-50 bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors group">
                                <div className="relative flex items-center">
                                  <input type="checkbox" className="peer w-5 h-5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer" />
                                  <div className="absolute inset-0 bg-[#0b1731] rounded opacity-0 peer-checked:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                                    <span className="text-white text-[10px]">✓</span>
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{model}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6">
                          <button
                            type="button"
                            onClick={prevStep}
                            className="flex items-center gap-2 text-slate-400 hover:text-[#0b1731] font-bold text-sm transition-colors group"
                          >
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            <span>Back</span>
                          </button>
                          <button
                            type="submit"
                            className="h-14 px-12 rounded-full bg-[#0b1731] text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-[#162a4d] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
                          >
                            <span>Next Step</span>
                            <span className="text-lg">→</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[#0b1731]">
                      Verify Identity
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-[560px] leading-relaxed">
                      Complete the final security check to activate your TILLCLOUD dashboard. We've sent codes to your registered contacts.
                    </p>

                    <div className="mt-10 grid md:grid-cols-2 gap-6">
                      {/* Mobile OTP */}
                      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] flex flex-col items-center">
                        <div className="flex items-center gap-3 w-full mb-6">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#0b1731]">Mobile OTP</p>
                            <p className="text-[10px] text-slate-400 font-medium">Enter the 6-digit code sent to +1 ••• ••• 4230</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-6">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <input
                              key={i}
                              type="text"
                              maxLength={1}
                              className="w-10 h-12 rounded-xl bg-[#f0f7ff] border-none text-center font-bold text-[#0b1731] focus:ring-2 focus:ring-cyan-300 focus:bg-white transition-all shadow-inner"
                            />
                          ))}
                        </div>
                        <button type="button" className="text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors uppercase tracking-wider ml-auto">
                          Resend OTP
                        </button>
                      </div>

                      {/* Email OTP */}
                      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] flex flex-col items-center">
                        <div className="flex items-center gap-3 w-full mb-6">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Mail size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#0b1731]">Email OTP</p>
                            <p className="text-[10px] text-slate-400 font-medium">Enter the 6-digit code sent to admin@tillcloud.com</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-6">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <input
                              key={i}
                              type="text"
                              maxLength={1}
                              className="w-10 h-12 rounded-xl bg-[#f0f7ff] border-none text-center font-bold text-[#0b1731] focus:ring-2 focus:ring-cyan-300 focus:bg-white transition-all shadow-inner"
                            />
                          ))}
                        </div>
                        <button type="button" className="text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors uppercase tracking-wider ml-auto">
                          Resend OTP
                        </button>
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center space-y-4">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" className="peer w-5 h-5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer" />
                          <div className="absolute inset-0 bg-[#0b1731] rounded opacity-0 peer-checked:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">I agree to the Terms of Service and Privacy Policy</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" className="peer w-5 h-5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer" />
                          <div className="absolute inset-0 bg-[#0b1731] rounded opacity-0 peer-checked:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">I consent to receiving electronic communications regarding my account</span>
                      </label>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="h-14 px-10 rounded-full border border-slate-100 bg-[#f4faff] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 group"
                      >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        className="h-14 px-12 rounded-full bg-[#0b1731] text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-[#162a4d] transition-all shadow-2xl shadow-blue-900/30 active:scale-[0.98] flex items-center gap-3"
                      >
                        <span>Finish Registration</span>
                        <span className="text-lg">→</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


