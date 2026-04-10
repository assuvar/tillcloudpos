import { 
  Building2, 
  ChevronDown, 
  ShieldCheck, 
  UserCog, 
  UtensilsCrossed, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Mail
} from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import { calculatePasswordStrength, isValidEmail, isValidPhone } from './onboarding/validation';
import { OTP_LENGTH, verifyStaticOtp } from './onboarding/otpMock';

const registrationSteps = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Admin Account', icon: UserCog },
  { id: 3, label: 'Restaurant Type', icon: UtensilsCrossed },
  { id: 4, label: 'Verification', icon: ShieldCheck },
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [adminAcceptedTerms, setAdminAcceptedTerms] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedComms, setAcceptedComms] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailResendCountdown, setEmailResendCountdown] = useState(60);
  const [emailOtp, setEmailOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpMessage, setEmailOtpMessage] = useState('');
  const [emailOtpError, setEmailOtpError] = useState('');
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const emailOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [formData, setFormData] = useState({
    businessName: '',
    country: '',
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    outlets: '',
    serviceModels: [] as string[],
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'mobile') {
      if (!value) {
        setMobileError('');
      } else if (!isValidPhone(value)) {
        setMobileError('Enter a valid mobile number.');
      } else {
        setMobileError('');
      }
    }

    if (name === 'password') {
      if (!value) {
        setPasswordError('');
      } else if (value.length < 8) {
        setPasswordError('Password must be at least 8 characters.');
      } else {
        setPasswordError('');
      }

      if (formData.confirmPassword && formData.confirmPassword !== value) {
        setConfirmPasswordError('Passwords do not match.');
      } else if (formData.confirmPassword) {
        setConfirmPasswordError('');
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        setConfirmPasswordError('');
      } else if (value !== formData.password) {
        setConfirmPasswordError('Passwords do not match.');
      } else {
        setConfirmPasswordError('');
      }
    }

    if (name === 'email') {
      setEmailError('');
    }
  };

  const simulateEmailExists = async (email: string) => {
    const blockedEmails = ['admin@tillcloud.com', 'owner@restaurant.com'];
    await new Promise((resolve) => setTimeout(resolve, 500));
    return blockedEmails.includes(email.trim().toLowerCase());
  };

  const handleEmailBlur = async () => {
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError('Email is required.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setEmailChecking(true);
    try {
      const simulatedExists = await simulateEmailExists(normalizedEmail);
      if (simulatedExists) {
        setEmailError('Email already exists. Please use another email.');
        return;
      }

      const availability = await api.post('/auth/check-email', {
        email: normalizedEmail,
      });

      if (!availability.data?.available) {
        setEmailError('Email already exists. Please use another email.');
      } else {
        setEmailError('');
      }
    } finally {
      setEmailChecking(false);
    }
  };

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password],
  );

  const isBusinessInfoValid = useMemo(() => {
    return formData.businessName.trim() !== '' && formData.country.trim() !== '';
  }, [formData.businessName, formData.country]);

  const isAdminStepValid = useMemo(() => {
    const hasRequiredFields =
      formData.fullName.trim() &&
      formData.mobile.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.confirmPassword;

    const valuesValid =
      isValidPhone(formData.mobile) &&
      isValidEmail(formData.email) &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword &&
      !emailError;

    return Boolean(hasRequiredFields && valuesValid && adminAcceptedTerms);
  }, [formData, emailError, adminAcceptedTerms]);

  const safeEmailDestination = formData.email.trim().toLowerCase();

  function sendOtp() {
    setEmailOtpVerified(false);
    setEmailOtpMessage('OTP resent successfully');
    setEmailOtpError('');
  }

  async function verifyOtp() {
    const code = emailOtp.join('');
    if (code.length !== OTP_LENGTH) {
      setEmailOtpError(`Enter all ${OTP_LENGTH} OTP digits.`);
      return;
    }

    setIsVerifyingEmailOtp(true);

    try {
      const isValid = verifyStaticOtp(code);

      if (!isValid) {
        setEmailOtpError('Invalid OTP');
        return;
      }

      setEmailOtpVerified(true);
      setEmailOtpError('');
      setEmailOtpMessage('Email OTP verified');
    } catch {
      setEmailOtpError('Invalid OTP');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  }

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      const nextArray = [...emailOtp];
      nextArray[index] = '';
      setEmailOtp(nextArray);
      setEmailOtpError('');
      return;
    }

    const nextArray = [...emailOtp];

    for (let i = 0; i < digits.length && index + i < nextArray.length; i += 1) {
      nextArray[index + i] = digits[i];
    }

    setEmailOtp(nextArray);
    setEmailOtpError('');

    const nextFocusIndex = Math.min(index + digits.length, nextArray.length - 1);
    emailOtpRefs.current[nextFocusIndex]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    const refs = emailOtpRefs;
    const currentArray = emailOtp;

    if (event.key === 'Backspace' && currentArray[index] === '' && index > 0) {
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === 'ArrowRight' && index < currentArray.length - 1) {
      refs.current[index + 1]?.focus();
      return;
    }

    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleOtpPaste = (index: number, pastedText: string) => {
    const digits = pastedText.replace(/\D/g, '');
    if (!digits) {
      return;
    }

    const nextArray = [...emailOtp];
    for (let i = 0; i < digits.length && index + i < nextArray.length; i += 1) {
      nextArray[index + i] = digits[i];
    }

    const focusIndex = Math.min(index + digits.length, nextArray.length - 1);

    setEmailOtp(nextArray);
    setEmailOtpError('');

    emailOtpRefs.current[focusIndex]?.focus();
  };

  useEffect(() => {
    if (currentStep !== 4) {
      return;
    }

    setEmailResendCountdown(60);
    setEmailOtp(Array(OTP_LENGTH).fill(''));
    setEmailOtpError('');
    setEmailOtpMessage(`Use ${OTP_LENGTH}-digit dev OTP`);
    setEmailOtpVerified(false);
    setAcceptedTerms(false);
    setAcceptedComms(false);

    window.setTimeout(() => {
      emailOtpRefs.current[0]?.focus();
    }, 0);

    sendOtp();

    const interval = window.setInterval(() => {
      setEmailResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentStep, formData.email]);

  useEffect(() => {
    setError('');
  }, [currentStep]);

  const handleCheckboxChange = (model: string) => {
    setFormData(prev => ({
      ...prev,
      serviceModels: prev.serviceModels.includes(model)
        ? prev.serviceModels.filter(m => m !== model)
        : [...prev.serviceModels, model]
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!emailOtpVerified) {
      setError('Please verify your email OTP before finishing registration.');
      return;
    }

    if (!acceptedTerms || !acceptedComms) {
      setError('Please accept both checkboxes before finishing registration.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setCurrentStep(2);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        businessName: formData.businessName,
        country: formData.country,
        fullName: formData.fullName,
        mobile: formData.mobile,
        email: formData.email,
        password: formData.password,
        businessType: formData.businessType,
        outlets: formData.outlets,
        serviceModels: formData.serviceModels
      });
      
      login(response.data.access_token, response.data.user);
      navigate('/onboarding');
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      const normalizedMessage = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;
      const finalMessage = normalizedMessage || "Registration failed. Please try again.";
      setError(finalMessage);

      if (typeof finalMessage === 'string' && finalMessage.toLowerCase().includes('already exists')) {
        setEmailError('Email already exists. Please use another email.');
        setCurrentStep(2);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef4f8] text-slate-900 font-sans">
      <main className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="min-h-[calc(100vh-24px)] border border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-[280px_1fr] sm:min-h-[calc(100vh-32px)]">
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
                      <form
                        className="space-y-8"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!isBusinessInfoValid) {
                            setError('Please complete business name and country.');
                            return;
                          }
                          setError('');
                          nextStep();
                        }}
                      >
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">
                            Business Name
                          </label>
                          <input
                            type="text"
                            name="businessName"
                            required
                            value={formData.businessName}
                            onChange={handleInputChange}
                            placeholder="e.g. The Sapphire Bistro"
                            className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">
                            Country of Operation
                          </label>
                          <div className="relative group">
                            <select 
                              name="country"
                              required
                              value={formData.country}
                              onChange={handleInputChange}
                              className="h-14 w-full appearance-none rounded-2xl border border-slate-100 bg-slate-50 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all font-medium cursor-pointer"
                            >
                              <option value="">Select your country</option>
                              <option value="AU">Australia</option>
                              <option value="NZ">New Zealand</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-slate-400" />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!isBusinessInfoValid}
                          className="h-14 w-full rounded-full bg-[#020c24] text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-[#0d1b3f] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <form
                        className="space-y-8"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!isAdminStepValid) {
                            setError('Please fix all required fields before continuing.');
                            return;
                          }
                          setError('');
                          nextStep();
                        }}
                      >
                        {error && (
                          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold mb-6">
                            {error}
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Owner Name</label>
                            <input
                              type="text"
                              name="fullName"
                              required
                              value={formData.fullName}
                              onChange={handleInputChange}
                              placeholder="Alexander Reed"
                              className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Owner Mobile Number</label>
                            <input
                              type="tel"
                              name="mobile"
                              required
                              value={formData.mobile}
                              onChange={handleInputChange}
                              onBlur={() => {
                                if (formData.mobile && !isValidPhone(formData.mobile)) {
                                  setMobileError('Enter a valid mobile number.');
                                }
                              }}
                              placeholder="+91 9874563210"
                              className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all"
                            />
                            {mobileError && <p className="text-xs font-semibold text-rose-600">{mobileError}</p>}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Email ID</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleEmailBlur}
                            placeholder="owner@restaurant.com"
                            className="h-14 w-full rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all"
                          />
                          {emailChecking && <p className="text-xs font-semibold text-slate-500">Checking email...</p>}
                          {emailError && <p className="text-xs font-semibold text-rose-600">{emailError}</p>}
                        </div>

                        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Enter Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
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
                            {passwordError && <p className="text-xs font-semibold text-rose-600">{passwordError}</p>}
                            {!!formData.password && (
                              <p className="text-xs font-semibold text-slate-500" aria-live="polite">
                                Password strength: <span className="text-slate-700">{passwordStrength}</span>
                              </p>
                            )}
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Confirm Password</label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
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
                            {confirmPasswordError && <p className="text-xs font-semibold text-rose-600">{confirmPasswordError}</p>}
                          </div>
                          <p className="absolute -bottom-6 left-1 text-[10px] text-slate-400 font-medium">Must contain 8 characters, one special symbol</p>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={adminAcceptedTerms}
                            onChange={(event) => setAdminAcceptedTerms(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                            aria-label="Agree to registration terms"
                          />
                          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">
                            I agree to the terms and confirm all registration details are correct.
                          </span>
                        </label>

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
                            disabled={!isAdminStepValid}
                            className="h-14 px-12 rounded-full bg-[#0b1731] text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-[#162a4d] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <form
                        className="space-y-8"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const isStep3Valid =
                            formData.businessType.trim() !== '' &&
                            formData.outlets.trim() !== '';

                          if (!isStep3Valid) {
                            setError('Please select business type and number of outlets.');
                            return;
                          }
                          setError('');
                          nextStep();
                        }}
                      >
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 ml-1">Business Type</label>
                          <div className="relative group">
                            <select 
                              name="businessType"
                              required
                              value={formData.businessType}
                              onChange={handleInputChange}
                              className="h-14 w-full appearance-none rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all font-medium cursor-pointer"
                            >
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
                            <select 
                              name="outlets"
                              required
                              value={formData.outlets}
                              onChange={handleInputChange}
                              className="h-14 w-full appearance-none rounded-2xl border border-slate-50 bg-slate-50/50 px-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all font-medium cursor-pointer"
                            >
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
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {['Dine-In', 'Takeaway', 'Delivery', 'Table Ordering'].map((model) => (
                              <label key={model} className="flex items-center gap-3 p-4 rounded-xl border border-slate-50 bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-colors group">
                                <div className="relative flex items-center">
                                  <input 
                                    type="checkbox" 
                                    checked={formData.serviceModels.includes(model)}
                                    onChange={() => handleCheckboxChange(model)}
                                    className="peer w-5 h-5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer" 
                                  />
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
                            disabled={formData.businessType.trim() === '' || formData.outlets.trim() === ''}
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
                      Complete the final security check to activate your TILLCLOUD dashboard. We've sent a code to your registered email.
                    </p>

                    {error && (
                      <div className="mt-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold">
                        {error}
                      </div>
                    )}

                    <div className="mt-10 max-w-[520px] mx-auto">
                      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] flex flex-col items-center">
                        <div className="flex items-center gap-3 w-full mb-6">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Mail size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#0b1731]">Email OTP</p>
                            <p className="text-[10px] text-slate-400 font-medium">Enter the {OTP_LENGTH}-digit code sent to {safeEmailDestination || 'your email'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-6">
                          {emailOtp.map((digit, index) => (
                            <input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              ref={(element) => {
                                emailOtpRefs.current[index] = element;
                              }}
                              onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                              onKeyDown={(event) => handleOtpKeyDown(index, event)}
                              onPaste={(event) => {
                                event.preventDefault();
                                handleOtpPaste(index, event.clipboardData.getData('text'));
                              }}
                              className="w-10 h-12 rounded-xl bg-[#f0f7ff] border-none text-center font-bold text-[#0b1731] focus:ring-2 focus:ring-cyan-300 focus:bg-white transition-all shadow-inner"
                            />
                          ))}
                        </div>
                        <div className="w-full flex items-center justify-between mb-3">
                          <button
                            type="button"
                            disabled={isVerifyingEmailOtp || emailOtpVerified || emailOtp.join('').length !== OTP_LENGTH}
                            onClick={() => {
                              void verifyOtp();
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              emailOtpVerified 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-[#0b1731] text-white hover:bg-[#162a4d] shadow-sm'
                            } disabled:opacity-50`}
                          >
                            {emailOtpVerified ? '✓ Email Verified' : isVerifyingEmailOtp ? 'Verifying...' : 'Verify Email OTP'}
                          </button>
                          {emailOtpMessage && <span className="text-[10px] font-semibold text-emerald-600">{emailOtpMessage}</span>}
                        </div>
                        {emailOtpError && <p className="w-full text-[10px] font-semibold text-rose-600 mb-2">{emailOtpError}</p>}
                        <button
                          type="button"
                          disabled={emailResendCountdown > 0}
                          onClick={() => {
                            setEmailResendCountdown(60);
                            sendOtp();
                          }}
                          className="text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors uppercase tracking-wider ml-auto disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          {emailResendCountdown > 0 ? `Resend in ${emailResendCountdown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center space-y-4">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(event) => setAcceptedTerms(event.target.checked)}
                            className="peer w-5 h-5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer"
                          />
                          <div className="absolute inset-0 bg-[#0b1731] rounded opacity-0 peer-checked:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">I agree to the Terms of Service and Privacy Policy</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={acceptedComms}
                            onChange={(event) => setAcceptedComms(event.target.checked)}
                            className="peer w-5 h-5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer"
                          />
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
                        disabled={isSubmitting || !emailOtpVerified || !acceptedTerms || !acceptedComms}
                        onClick={handleSubmit}
                        className="h-14 px-12 rounded-full bg-[#0b1731] text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-[#162a4d] transition-all shadow-2xl shadow-blue-900/30 active:scale-[0.98] flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <span>Finish Registration</span>
                            <span className="text-lg">→</span>
                          </>
                        )}
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


