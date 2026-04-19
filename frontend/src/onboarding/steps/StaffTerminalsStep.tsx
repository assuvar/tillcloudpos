import { ArrowLeft, BriefcaseBusiness, Copy } from "lucide-react";
import { useState } from "react";
import api from "../../services/api";

interface StaffTerminalsStepProps {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

type StaffRole = 'MANAGER' | 'CASHIER' | 'KITCHEN';

type CreatedStaff = {
  id: string;
  name: string;
  role: StaffRole;
  pin?: string | null;
  generatedPin?: string | null;
};

const roleOptions: Array<{ label: string; value: StaffRole }> = [
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Cashier', value: 'CASHIER' },
  { label: 'Kitchen', value: 'KITCHEN' },
];

export function StaffTerminalsStep({
  onBack,
  onNext,
  onSkip,
  isSubmitting,
}: StaffTerminalsStepProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'' | StaffRole>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdStaff, setCreatedStaff] = useState<CreatedStaff | null>(null);

  const generatedPin = createdStaff?.pin || createdStaff?.generatedPin || '';

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('');
  };

  const handleCreateStaff = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !role) {
      setError('Name, email, and role are required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setError('Enter a valid staff email.');
      return;
    }

    setIsCreating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/staff', {
        name: trimmedName,
        email: trimmedEmail,
        role,
      });

      const created = response.data?.staff as CreatedStaff | undefined;
      const pin = response.data?.pin || response.data?.generatedPin || created?.pin || created?.generatedPin;

      if (!created || !created.id) {
        throw new Error('Invalid staff creation response');
      }

      setCreatedStaff({
        ...created,
        pin,
      });
      setSuccessMessage('Staff created successfully');
      resetForm();
    } catch (createError) {
      console.error('Failed to create staff', createError);
      setError('Failed to create staff member. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyPin = async () => {
    if (!generatedPin) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPin);
      setSuccessMessage('PIN copied to clipboard');
    } catch {
      setError('Could not copy PIN. Please copy it manually.');
    }
  };

  return (
    <section>
      <h1 className="text-[34px] sm:text-[52px] font-extrabold text-[#0b1324] leading-[1.05] tracking-[-0.02em]">
        Set up your staff
      </h1>
      <p className="text-slate-600 mt-3 text-[15px]">
        Create a staff member now or skip this step and continue onboarding.
      </p>

      <div className="mt-8 rounded-[10px] border border-slate-200 bg-white overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <BriefcaseBusiness size={16} className="text-[#59c9ef]" />
            <h2 className="text-[20px] font-bold text-[#111827]">Create Staff Member</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_220px_auto]">
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              placeholder="e.g. Alex Rivera"
              className="h-11 rounded-md border border-slate-200 bg-[#f8fafc] px-3 text-[13px]"
              aria-label="Staff name"
            />

            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              placeholder="e.g. alex@yourrestaurant.com"
              className="h-11 rounded-md border border-slate-200 bg-[#f8fafc] px-3 text-[13px]"
              aria-label="Staff email"
            />

            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as StaffRole | '');
                setError('');
              }}
              className="h-11 rounded-md border border-slate-200 bg-[#f8fafc] px-3 text-[13px]"
              aria-label="Staff role"
            >
              <option value="">Select Role</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isCreating || isSubmitting}
              onClick={() => {
                void handleCreateStaff();
              }}
              className="h-11 rounded-full bg-[#07142a] px-5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Staff'}
            </button>
          </div>

          {error ? (
            <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-[12px] font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {generatedPin ? (
            <div className="mt-4 rounded-[10px] border border-[#b6e5f6] bg-[#e9f7fc] p-4">
              <div className="text-[12px] font-bold uppercase tracking-widest text-[#0c607b]">
                PIN: {generatedPin}
              </div>
              <p className="mt-2 text-[12px] font-medium text-[#0c607b]">
                Save this PIN. It will not be shown again.
              </p>
              <button
                type="button"
                onClick={() => {
                  void copyPin();
                }}
                className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#0c607b] hover:text-[#09556d]"
              >
                <Copy size={14} />
                Copy PIN
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex items-center gap-5">
          <button type="button" onClick={onSkip} className="text-[13px] text-slate-700 font-medium">
            Skip for now
          </button>
          <button
            type="button"
            onClick={onNext}
            className="h-11 px-8 rounded-full bg-[#07142a] text-white text-[13px] font-semibold shadow-xl shadow-black/20"
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
