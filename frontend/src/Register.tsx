import {
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./services/api";
import { useAuth } from "./context/AuthContext";
import {
  calculatePasswordStrength,
  isValidEmail,
  isValidPhone,
} from "./onboarding/validation";

const OTP_LENGTH = 6;

const registrationSteps = [
  { id: 1, label: "Business Setup", icon: Building2 },
  { id: 2, label: "Verification", icon: ShieldCheck },
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedComms, setAcceptedComms] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailResendCountdown, setEmailResendCountdown] = useState(60);
  const [emailOtp, setEmailOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpMessage, setEmailOtpMessage] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const emailOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [formData, setFormData] = useState({
    businessName: "",
    country: "AU", // defaulted to Australia to preserve backend validation
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    outlets: "",
    serviceModels: [] as string[],
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "mobile") {
      if (!value) {
        setMobileError("");
      } else if (!isValidPhone(value)) {
        setMobileError("Enter a valid mobile number.");
      } else {
        setMobileError("");
      }
    }

    if (name === "password") {
      if (!value) {
        setPasswordError("");
      } else if (value.length < 8) {
        setPasswordError("Password must be at least 8 characters.");
      } else {
        setPasswordError("");
      }

      if (formData.confirmPassword && formData.confirmPassword !== value) {
        setConfirmPasswordError("Passwords do not match.");
      } else if (formData.confirmPassword) {
        setConfirmPasswordError("");
      }
    }

    if (name === "confirmPassword") {
      if (!value) {
        setConfirmPasswordError("");
      } else if (value !== formData.password) {
        setConfirmPasswordError("Passwords do not match.");
      } else {
        setConfirmPasswordError("");
      }
    }

    if (name === "email") {
      setEmailError("");
    }
  };

  const handleEmailBlur = async () => {
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError("Email is required.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailChecking(true);
    try {
      const availability = await api.post("/auth/check-email", {
        email: normalizedEmail,
      });

      if (!availability.data?.available) {
        setEmailError("Email already exists. Please use another email.");
      } else {
        setEmailError("");
      }
    } finally {
      setEmailChecking(false);
    }
  };

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password],
  );

  const isStep1Valid = useMemo(() => {
    // 1. Business Profile
    const hasBusinessName = formData.businessName.trim() !== "";

    // 2. Owner Details
    const hasOwnerFields =
      formData.fullName.trim() &&
      formData.mobile.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.confirmPassword;

    const ownerFieldsValid =
      isValidPhone(formData.mobile) &&
      isValidEmail(formData.email) &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword &&
      !emailError;

    return Boolean(
      hasBusinessName &&
      hasOwnerFields &&
      ownerFieldsValid
    );
  }, [formData, emailError]);

  const safeEmailDestination = formData.email.trim().toLowerCase();

  async function sendOtp() {
    const email = formData.email.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      setEmailOtpError("Enter a valid email before requesting OTP.");
      return;
    }

    if (emailError) {
      setEmailOtpError("Fix email error before requesting OTP.");
      return;
    }

    try {
      const res = await api.post("/auth/otp/send", {
        email: email,
      });

      console.log("OTP SENT:", res.data);

      setEmailOtpVerified(false);
      setEmailOtpMessage("OTP sent successfully");
      setEmailOtpError("");
    } catch (err: any) {
      console.error("OTP ERROR:", err?.response?.data || err.message);

      setEmailOtpError(
        err?.response?.data?.message || "Failed to send OTP. Check backend.",
      );
    }
  }

  async function verifyOtp() {
    const code = emailOtp.join("");
    const email = formData.email.trim().toLowerCase();

    if (code.length !== OTP_LENGTH) {
      setEmailOtpError(`Enter all ${OTP_LENGTH} OTP digits.`);
      return;
    }

    setIsVerifyingEmailOtp(true);

    try {
      const res = await api.post("/auth/verify-otp", {
        email: email,
        otp: code,
      });

      console.log("VERIFY RESPONSE:", res.data);

      setEmailOtpVerified(true);
      setEmailOtpError("");
      setEmailOtpMessage("Email OTP verified");
    } catch (err: any) {
      console.error("VERIFY ERROR:", err?.response?.data || err.message);

      setEmailOtpError(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  }

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      const nextArray = [...emailOtp];
      nextArray[index] = "";
      setEmailOtp(nextArray);
      setEmailOtpError("");
      return;
    }

    const nextArray = [...emailOtp];

    for (let i = 0; i < digits.length && index + i < nextArray.length; i += 1) {
      nextArray[index + i] = digits[i];
    }

    setEmailOtp(nextArray);
    setEmailOtpError("");

    const nextFocusIndex = Math.min(
      index + digits.length,
      nextArray.length - 1,
    );
    emailOtpRefs.current[nextFocusIndex]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    const refs = emailOtpRefs;
    const currentArray = emailOtp;

    if (event.key === "Backspace" && currentArray[index] === "" && index > 0) {
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < currentArray.length - 1) {
      refs.current[index + 1]?.focus();
      return;
    }

    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleOtpPaste = (index: number, pastedText: string) => {
    const digits = pastedText.replace(/\D/g, "");
    if (!digits) {
      return;
    }

    const nextArray = [...emailOtp];
    for (let i = 0; i < digits.length && index + i < nextArray.length; i += 1) {
      nextArray[index + i] = digits[i];
    }

    const focusIndex = Math.min(index + digits.length, nextArray.length - 1);

    setEmailOtp(nextArray);
    setEmailOtpError("");

    emailOtpRefs.current[focusIndex]?.focus();
  };

  useEffect(() => {
    if (currentStep !== 2) {
      return;
    }

    setEmailResendCountdown(60);
    setEmailOtp(Array(OTP_LENGTH).fill(""));
    setEmailOtpError("");
    setEmailOtpMessage("");
    setEmailOtpVerified(false);
    setAcceptedTerms(false);
    setAcceptedComms(false);

    window.setTimeout(() => {
      emailOtpRefs.current[0]?.focus();
    }, 0);

    void sendOtp();

    const interval = window.setInterval(() => {
      setEmailResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentStep, formData.email]);

  useEffect(() => {
    setError("");
  }, [currentStep]);


  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!emailOtpVerified) {
      setError("Please verify your email OTP before finishing registration.");
      return;
    }

    if (!acceptedTerms || !acceptedComms) {
      setError("Please accept both checkboxes before finishing registration.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setCurrentStep(1);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/register", {
        businessName: formData.businessName,
        country: formData.country,
        fullName: formData.fullName,
        mobile: formData.mobile,
        email: formData.email,
        password: formData.password,
        businessType: formData.businessType,
        outlets: formData.outlets,
        serviceModels: formData.serviceModels,
      });

      await login(response.data.access_token, response.data.user);
      navigate("/onboarding");
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      const normalizedMessage = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage;
      const finalMessage =
        normalizedMessage || "Registration failed. Please try again.";
      setError(finalMessage);

      if (
        typeof finalMessage === "string" &&
        finalMessage.toLowerCase().includes("already exists")
      ) {
        setEmailError("Email already exists. Please use another email.");
        setCurrentStep(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen bg-[#eef4f8] text-slate-900 font-sans lg:overflow-hidden">
      <main className="px-3 py-3 sm:px-4 sm:py-4 lg:h-full">
        <div className="min-h-[calc(100vh-24px)] border border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-[280px_1fr] sm:min-h-[calc(100vh-32px)] lg:h-full">
          {/* Constant Left Sidebar (Desktop Only) */}
          <aside className="border-r border-slate-200 bg-white hidden lg:block flex-shrink-0 h-full">
            <div className="px-6 py-5 text-[30px] font-black tracking-tight text-[#0b1731] flex items-center gap-2.5">
              <img src="/logo.png" alt="TillCloud Logo" className="w-8 h-8 object-contain" />
              TILLCLOUD
            </div>

            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <p className="text-2xl font-black text-[#0b1731]">Registration</p>
              <p className="text-sm text-slate-500 mt-1">
                Step {currentStep} of 2
              </p>
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
                        ? "bg-[#f3f6fb] text-[#0b1731] border-r-2 border-r-cyan-400"
                        : isCompleted
                          ? "text-cyan-600"
                          : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full border ${isActive ? "border-cyan-400" : isCompleted ? "bg-cyan-400 border-cyan-400 text-white" : "border-slate-200"}`}
                    >
                      {isCompleted ? (
                        <span className="text-[10px]">✓</span>
                      ) : (
                        <Icon className="h-3 w-3" />
                      )}
                    </div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Form Content Panel */}
          <section className="relative overflow-hidden flex flex-col lg:h-full">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-[#f4fbff] to-[#edf5fa]" />

            <div className="relative flex-1 px-6 py-6 sm:px-10 sm:py-8 lg:px-16 lg:py-10 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-5 flex-shrink-0">
                <div className="flex items-center gap-2.5 lg:hidden text-2xl font-[950] tracking-tighter text-[#0b1731]">
                  <img src="/logo.png" alt="TillCloud Logo" className="w-8 h-8 object-contain" />
                  TILLCLOUD
                </div>
                {/* Mobile Hamburger menu */}
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(true)}
                  className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-[#0b1731] transition-all flex items-center justify-center shadow-sm"
                  aria-label="Toggle Steps Menu"
                >
                  <Menu size={20} />
                </button>
              </div>

              {/* Title & Description Stuck to the Top (Pinned / Constant) */}
              <div className="mx-auto max-w-[1200px] w-full flex-shrink-0 mb-4">
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight text-[#0b1731] tracking-tight">
                      Register your Business
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-[640px]">
                      Enter your business profile, administrator account, and venue setup to get started with TILLCLOUD.
                    </p>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight text-[#0b1731] tracking-tight">
                      Verify Identity
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-[560px]">
                      Complete the final security check to activate your TILLCLOUD dashboard. We've sent a code to your registered email.
                    </p>
                  </div>
                )}
              </div>

              {/* Independently Scrollable Form viewport */}
              <div className="mx-auto max-w-[1200px] w-full flex-1 lg:overflow-y-auto lg:pr-2 min-h-0 flex flex-col">
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] mb-4">
                      <form
                        className="space-y-6"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!isStep1Valid) {
                            setError(
                              "Please complete all mandatory fields and fix errors before continuing.",
                            );
                            return;
                          }
                          setError("");
                          nextStep();
                        }}
                      >
                        {error && (
                          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-lg text-xs font-bold">
                            {error}
                          </div>
                        )}

                        {/* SECTION 1: BUSINESS PROFILE */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-[#0b1731] border-b border-slate-100 pb-1.5 flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-[#f0f7ff] text-[#0b1731] text-[10px] font-black">
                              1
                            </span>
                            Business Profile
                          </h3>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-0.5">
                              Business Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="businessName"
                              required
                              value={formData.businessName}
                              onChange={handleInputChange}
                              placeholder="e.g. The Sapphire Bistro"
                              className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all text-xs font-medium"
                            />
                          </div>
                        </div>

                        {/* SECTION 2: OWNER DETAILS */}
                        <div className="space-y-3 pt-2">
                          <h3 className="text-sm font-bold text-[#0b1731] border-b border-slate-100 pb-1.5 flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-[#f0f7ff] text-[#0b1731] text-[10px] font-black">
                              2
                            </span>
                            Administrator Profile
                          </h3>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-0.5">
                                Owner Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Alexander Reed"
                                className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all text-xs font-medium"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-0.5">
                                Owner Mobile Number <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="tel"
                                name="mobile"
                                required
                                value={formData.mobile}
                                onChange={handleInputChange}
                                onBlur={() => {
                                  if (
                                    formData.mobile &&
                                    !isValidPhone(formData.mobile)
                                  ) {
                                    setMobileError(
                                      "Enter a valid mobile number.",
                                    );
                                  }
                                }}
                                placeholder="+61 400 000 000"
                                className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all text-xs font-medium"
                              />
                              {mobileError && (
                                <p className="text-[10px] font-semibold text-rose-600 mt-1">
                                  {mobileError}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-0.5">
                              Email ID <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="email"
                              name="email"
                              required
                              value={formData.email}
                              onChange={handleInputChange}
                              onBlur={handleEmailBlur}
                              placeholder="owner@restaurant.com"
                              className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all text-xs font-medium"
                            />
                            {emailChecking && (
                              <p className="text-[10px] font-semibold text-slate-400 mt-1 animate-pulse">
                                Checking email...
                              </p>
                            )}
                            {emailError && (
                              <p className="text-[10px] font-semibold text-rose-600 mt-1">
                                {emailError}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-0.5">
                                Enter Password <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  name="password"
                                  required
                                  value={formData.password}
                                  onChange={handleInputChange}
                                  placeholder="••••••••"
                                  className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all text-xs font-medium tracking-wider"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 p-1 rounded-md transition-all duration-200 shadow-sm flex items-center justify-center"
                                  aria-label="Toggle password visibility"
                                >
                                  {showPassword ? (
                                    <EyeOff size={14} />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                              </div>
                              {passwordError && (
                                <p className="text-[10px] font-semibold text-rose-600 mt-1">
                                  {passwordError}
                                </p>
                              )}
                              {!!formData.password && (
                                <p className="text-[10px] font-semibold text-slate-500 mt-1">
                                  Strength:{" "}
                                  <span className="text-slate-700 font-bold">
                                    {passwordStrength}
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-0.5">
                                Confirm Password <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  name="confirmPassword"
                                  required
                                  value={formData.confirmPassword}
                                  onChange={handleInputChange}
                                  placeholder="••••••••"
                                  className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:bg-white transition-all text-xs font-medium tracking-wider"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 p-1 rounded-md transition-all duration-200 shadow-sm flex items-center justify-center"
                                  aria-label="Toggle confirm password visibility"
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff size={14} />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                              </div>
                              {confirmPasswordError && (
                                <p className="text-[10px] font-semibold text-rose-600 mt-1">
                                  {confirmPasswordError}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium">
                            Must contain 8 characters, one special symbol.
                          </p>
                        </div>



                        {/* Continue Button */}
                        <div className="pt-4 flex flex-col gap-3">
                          <button
                            type="submit"
                            disabled={!isStep1Valid}
                            className="h-11 w-full rounded-xl bg-[#0b1731] text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-[#162a4d] transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Continue to Verification
                          </button>

                          {/* Exit Button below registration form */}
                          <button
                            type="button"
                            onClick={() => {
                              navigate("/");
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                          >
                            <span>Do it Later / Exit Registration</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {error && (
                      <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-lg text-xs font-bold">
                        {error}
                      </div>
                    )}

                    <div className="max-w-[480px] mx-auto">
                      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] flex flex-col items-center">
                        <div className="flex items-center gap-3 w-full mb-4">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Mail size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#0b1731]">
                              Email OTP
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Enter the {OTP_LENGTH}-digit code sent to{" "}
                              {safeEmailDestination || "your email"}
                            </p>
                          </div>
                        </div>
                        <p className="w-full text-[10px] font-semibold text-slate-400 -mt-2 mb-3">
                          Check your email inbox for the verification code.
                        </p>
                        <div className="flex gap-2 mb-4">
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
                              onChange={(event) =>
                                handleOtpDigitChange(index, event.target.value)
                              }
                              onKeyDown={(event) =>
                                handleOtpKeyDown(index, event)
                              }
                              onPaste={(event) => {
                                event.preventDefault();
                                handleOtpPaste(
                                  index,
                                  event.clipboardData.getData("text"),
                                );
                              }}
                              onFocus={() => setEmailOtpError("")}
                              className="w-9 h-11 rounded-lg bg-[#f0f7ff] border-none text-center font-bold text-[#0b1731] focus:ring-2 focus:ring-cyan-300 focus:bg-white transition-all shadow-inner"
                            />
                          ))}
                        </div>
                        <div className="w-full flex items-center justify-between mb-3">
                          <button
                            type="button"
                            disabled={
                              isVerifyingEmailOtp ||
                              emailOtpVerified ||
                              emailOtp.join("").length !== OTP_LENGTH
                            }
                            onClick={() => {
                              void verifyOtp();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              emailOtpVerified
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-[#0b1731] text-white hover:bg-[#162a4d] shadow-sm"
                            } disabled:opacity-50`}
                          >
                            {emailOtpVerified
                              ? "✓ Email Verified"
                              : isVerifyingEmailOtp
                                ? "Verifying..."
                                : "Verify Email OTP"}
                          </button>
                          {emailOtpMessage && (
                            <span className="text-[9px] font-semibold text-emerald-600">
                              {emailOtpMessage}
                            </span>
                          )}
                        </div>
                        {emailOtpError && (
                          <p className="w-full text-[9px] font-semibold text-rose-600 mb-2">
                            {emailOtpError}
                          </p>
                        )}
                        <button
                          type="button"
                          disabled={emailResendCountdown > 0}
                          onClick={() => {
                            setEmailResendCountdown(60);
                            sendOtp();
                          }}
                          className="text-[10px] font-bold text-cyan-500 hover:text-cyan-600 transition-colors uppercase tracking-wider ml-auto disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          {emailResendCountdown > 0
                            ? `Resend in ${emailResendCountdown}s`
                            : "Resend OTP"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(event) =>
                              setAcceptedTerms(event.target.checked)
                            }
                            className="peer w-4.5 h-4.5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer"
                          />
                          <div className="absolute inset-0 bg-[#0b1731] rounded opacity-0 peer-checked:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <span className="text-white text-[8px] font-black">✓</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">
                          I agree to the Terms of Service and Privacy Policy
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={acceptedComms}
                            onChange={(event) =>
                              setAcceptedComms(event.target.checked)
                            }
                            className="peer w-4.5 h-4.5 rounded border-slate-200 text-[#0b1731] focus:ring-0 cursor-pointer"
                          />
                          <div className="absolute inset-0 bg-[#0b1731] rounded opacity-0 peer-checked:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <span className="text-white text-[8px] font-black">✓</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">
                          I consent to receiving electronic communications regarding my account
                        </span>
                      </label>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center gap-4 w-full">
                        <button
                          type="button"
                          onClick={prevStep}
                          className="h-11 px-6 rounded-xl border border-slate-100 bg-[#f4faff] text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5 group"
                        >
                          <ArrowLeft
                            size={14}
                            className="transition-transform group-hover:-translate-x-0.5"
                          />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          disabled={
                            isSubmitting ||
                            !emailOtpVerified ||
                            !acceptedTerms ||
                            !acceptedComms
                          }
                          onClick={handleSubmit}
                          className="h-11 px-8 rounded-xl bg-[#0b1731] text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-[#162a4d] transition-all shadow-md active:scale-[0.99] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Finish Registration</span>
                              <span className="text-sm">→</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigate("/");
                        }}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mt-1"
                      >
                        Verify Later & Exit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Sidebar Slide-Over Drawer Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Sidebar Slide-over Panel */}
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-2xl font-[950] tracking-tighter text-[#0b1731]">
                <img src="/logo.png" alt="TillCloud Logo" className="w-8 h-8 object-contain" />
                TILLCLOUD
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all"
                aria-label="Close Steps Menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6 border-b border-slate-100">
              <p className="text-xl font-black text-[#0b1731]">Registration</p>
              <p className="text-xs text-slate-500 mt-1">
                Step {currentStep} of 2
              </p>
            </div>

            <nav className="py-2 flex-1">
              {registrationSteps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[#f3f6fb] text-[#0b1731] border-r-2 border-r-cyan-400"
                        : isCompleted
                          ? "text-cyan-600"
                          : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full border ${isActive ? "border-cyan-400" : isCompleted ? "bg-cyan-400 border-cyan-400 text-white" : "border-slate-200"}`}
                    >
                      {isCompleted ? (
                        <span className="text-[10px]">✓</span>
                      ) : (
                        <Icon className="h-3 w-3" />
                      )}
                    </div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </nav>

            <div className="p-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  navigate("/");
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all text-center uppercase tracking-wider"
              >
                Exit Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
