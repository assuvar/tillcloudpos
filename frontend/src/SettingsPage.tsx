import { useEffect, useState, useRef } from "react";
import {
  Building2,
  Receipt,
  Wallet,
  Star,
  MessageSquare,
  Monitor,
  Upload,
  Phone,
  Mail,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Plus,
  Zap,
  Info,
  CheckCircle2,
  TrendingUp,
  Bell,
  Printer,
  Lock,
  X,
  Check,
  Sliders,
  Columns,
  Minimize2,
  Maximize2,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { FRONTEND_PERMISSIONS } from "./permissions";
import api from "./services/api";
import {
  ALLOWED_SERVICE_MODELS,
  SERVICE_MODEL_LABELS,
  type ServiceModel,
} from "./serviceModels";
import PrinterDocketSettings from "./components/PrinterDocketSettings";
import ServiceModelRulesCard from "./components/ServiceModelRulesCard";

/* --- Sub-Components --- */

const isServiceModel = (value: string): value is ServiceModel =>
  ALLOWED_SERVICE_MODELS.includes(value as ServiceModel);

const RestaurantProfile = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [serviceModels, setServiceModels] = useState<ServiceModel[]>([
    "DINE_IN",
  ]);
  const [serviceModelRules, setServiceModelRules] = useState<any>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [savingModels, setSavingModels] = useState(false);
  const [modelMessage, setModelMessage] = useState("");

  // Restaurant profile fields
  const [name, setName] = useState("");
  const [abn, setAbn] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [timezone, setTimezone] = useState("Australia/Sydney");

  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRestaurant = async () => {
    try {
      const response = await api.get("/restaurant");
      const data = response.data || {};

      const models = Array.isArray(data.serviceModels)
        ? data.serviceModels.filter(
            (value: string): value is ServiceModel => isServiceModel(value),
          )
        : [];
      setServiceModels(models.length > 0 ? models : ["DINE_IN"]);

      setName(data.name || "");
      setAbn(data.abn || "");
      setStreetAddress(data.streetAddress || "");
      setSuburb(data.suburb || "");
      setState(data.state || "NSW");
      setPostcode(data.postcode || "");
      setPhone(data.phone || "");
      setContactEmail(data.contactEmail || "");
      setLogoUrl(data.logoUrl || "");
      setTimezone(data.timezone || "Australia/Sydney");
      setServiceModelRules(data.serviceModelRules || null);
    } catch (err) {
      console.error("Failed to load restaurant profile", err);
      setModelMessage("Unable to load restaurant profile details");
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    void loadRestaurant();
  }, []);

  const toggleServiceModel = (model: ServiceModel) => {
    if (!isAdmin) return;
    setModelMessage("");
    setServiceModels((prev) => {
      if (prev.includes(model)) {
        const next = prev.filter((value) => value !== model);
        return next.length > 0 ? next : prev;
      }

      return [...prev, model];
    });
  };

  const saveServiceModels = async () => {
    if (!isAdmin) return;
    setSavingModels(true);
    setModelMessage("");
    try {
      await api.patch("/restaurant", { serviceModels });
      setModelMessage("Service models updated");
    } catch {
      setModelMessage("Failed to update service models");
    } finally {
      setSavingModels(false);
    }
  };

  const saveProfileChanges = async () => {
    if (!isAdmin) return;
    setSavingProfile(true);
    setProfileMessage("");
    try {
      await api.patch("/restaurant", {
        name: name.trim(),
        abn: abn.trim() || null,
        streetAddress: streetAddress.trim(),
        suburb: suburb.trim(),
        state: state,
        postcode: postcode.trim(),
        timezone: timezone,
        logoUrl: logoUrl.trim() || null,
      });
      setProfileMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update profile", err);
      const msg = err?.response?.data?.message || "Failed to update restaurant profile";
      setProfileMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileMessage("");
    void loadRestaurant();
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage("Logo size must be under 5MB");
      return;
    }

    setLogoUploading(true);
    setProfileMessage("");

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await api.post("/restaurant/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const logoUrlPath = response.data.url;
      setLogoUrl(logoUrlPath);
      setProfileMessage("Logo uploaded successfully. Click Save to apply changes!");
    } catch (err: any) {
      console.error("Logo upload failed", err);
      setProfileMessage("Logo upload failed. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
            Restaurant Profile
          </h2>
          <p className="text-[14px] text-slate-400 font-medium mt-2">
            Manage your venue branding, localization, and general business identity.
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-2">
          <Info size={16} />
          Viewing only. Editing and saving is restricted to administrators.
        </div>
      )}

      {profileMessage && (
        <div className={`rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-wider ${
          profileMessage.includes("successfully") || profileMessage.includes("uploaded")
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
            : "bg-rose-50 text-rose-600 border border-rose-100"
        }`}>
          {profileMessage}
        </div>
      )}

      {/* Service Models Section */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-black text-[#0c1424]">
              Service Models
            </h3>
            <p className="text-[12px] text-slate-400 font-medium mt-1">
              Select the order modes enabled for this venue.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => void saveServiceModels()}
              disabled={loadingModels || savingModels}
              className="h-11 px-6 rounded-full bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-opacity-95"
            >
              {savingModels ? "Saving..." : "Save Models"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...ALLOWED_SERVICE_MODELS].map((model) => (
            <label
              key={model}
              className={`flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/40 ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <input
                type="checkbox"
                checked={serviceModels.includes(model)}
                onChange={() => toggleServiceModel(model)}
                disabled={loadingModels || !isAdmin}
                className="h-4 w-4"
              />
              <span className="text-[13px] font-bold text-[#0c1424]">
                {SERVICE_MODEL_LABELS[model]}
              </span>
            </label>
          ))}
        </div>

        {modelMessage ? (
          <p className="text-[12px] font-semibold text-slate-500">
            {modelMessage}
          </p>
        ) : null}
      </div>

      {/* Service Model Rules Section */}
      <ServiceModelRulesCard
        isAdmin={isAdmin}
        enabledModels={serviceModels}
        initialRules={serviceModelRules}
        onRefresh={() => void loadRestaurant()}
      />

      {/* Integrated Unified Business Profile Sheet */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Header of the sheet */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between gap-4 bg-slate-50/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#5dc7ec] animate-pulse" />
              <h3 className="text-[18px] font-black text-[#0c1424]">
                Business Profile Sheet
              </h3>
            </div>
            <p className="text-[12px] text-slate-400 font-medium mt-1">
              Unified business profile card containing branding and official details.
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="h-10 px-5 rounded-full border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveProfileChanges()}
                    disabled={savingProfile}
                    className="h-10 px-6 rounded-full bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md shadow-emerald-500/10 hover:bg-emerald-600 transition-all disabled:opacity-50"
                  >
                    <Check size={14} /> {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-10 px-6 rounded-full bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md shadow-[#0c1424]/5"
                >
                  <Edit3 size={14} /> Edit Details
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content of the sheet */}
        <div className="p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Left Column: Branding Logo */}
            <div className="flex flex-col items-center text-center space-y-4 lg:border-r lg:border-slate-100 lg:pr-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Logo Branding
              </span>

              <div 
                onClick={() => isEditing && isAdmin && fileInputRef.current?.click()}
                className={`relative h-40 w-40 rounded-[32px] bg-[#f8fafc] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden ${isEditing ? 'cursor-pointer hover:bg-slate-50 ring-4 ring-[#5dc7ec]/5' : 'cursor-default'}`}
              >
                {logoUrl ? (
                  <img 
                    src={logoUrl.startsWith("http") ? logoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:3100"}${logoUrl}`} 
                    alt="Business Logo" 
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300">
                      <Upload size={22} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Upload Logo
                    </span>
                  </>
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-[#0c1424]/70 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                    <Upload size={18} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Change Logo</span>
                  </div>
                )}

                {logoUploading && (
                  <div className="absolute inset-0 bg-white/95 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#5dc7ec]" />
                  </div>
                )}
              </div>

              {isEditing && logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="text-[10px] font-black uppercase text-rose-500 tracking-wider hover:underline"
                >
                  Remove Logo
                </button>
              )}

              <div className="space-y-1 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
                  Recommended size: 512x512px. Supports PNG/JPG up to 5MB.
                </p>
              </div>

              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleLogoFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Right Columns: Fields list */}
            <div className="lg:col-span-3 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Restaurant Name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Restaurant Name
                  </label>
                  {isEditing ? (
                    <div className="h-12 rounded-xl bg-slate-50 border border-slate-200/80 px-4 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none"
                      />
                    </div>
                  ) : (
                    <div className="h-12 bg-slate-50/50 rounded-xl px-4 flex items-center">
                      <span className="text-[13px] font-bold text-[#0c1424]">
                        {name || <span className="text-slate-300 italic">Not Specified</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* ABN */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    ABN (Australian Business Number)
                  </label>
                  {isEditing ? (
                    <div className="h-12 rounded-xl bg-slate-50 border border-slate-200/80 px-4 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                      <input
                        type="text"
                        placeholder="XX XXX XXX XXX"
                        value={abn}
                        onChange={(e) => setAbn(e.target.value)}
                        className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none"
                      />
                    </div>
                  ) : (
                    <div className="h-12 bg-slate-50/50 rounded-xl px-4 flex items-center">
                      <span className="text-[13px] font-bold text-[#0c1424]">
                        {abn || <span className="text-slate-300 italic">Not Specified</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Street Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Street Address
                  </label>
                  {isEditing ? (
                    <div className="h-12 rounded-xl bg-slate-50 border border-slate-200/80 px-4 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                      <input
                        type="text"
                        placeholder="e.g. 122 Harbor Way"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none"
                      />
                    </div>
                  ) : (
                    <div className="h-12 bg-slate-50/50 rounded-xl px-4 flex items-center">
                      <span className="text-[13px] font-bold text-[#0c1424]">
                        {streetAddress || <span className="text-slate-300 italic">Not Specified</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suburb */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Suburb
                  </label>
                  {isEditing ? (
                    <div className="h-12 rounded-xl bg-slate-50 border border-slate-200/80 px-4 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                      <input
                        type="text"
                        placeholder="e.g. Sydney"
                        value={suburb}
                        onChange={(e) => setSuburb(e.target.value)}
                        className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none"
                      />
                    </div>
                  ) : (
                    <div className="h-12 bg-slate-50/50 rounded-xl px-4 flex items-center">
                      <span className="text-[13px] font-bold text-[#0c1424]">
                        {suburb || <span className="text-slate-300 italic">Not Specified</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* State & Postcode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      State
                    </label>
                    {isEditing ? (
                      <div className="h-12 rounded-xl bg-slate-50 border border-slate-200/80 px-3 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none select-clean cursor-pointer"
                        >
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                          <option value="QLD">QLD</option>
                          <option value="WA">WA</option>
                          <option value="SA">SA</option>
                          <option value="TAS">TAS</option>
                          <option value="ACT">ACT</option>
                          <option value="NT">NT</option>
                        </select>
                      </div>
                    ) : (
                      <div className="h-12 bg-slate-50/50 rounded-xl px-4 flex items-center">
                        <span className="text-[13px] font-bold text-[#0c1424]">{state}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      Postcode
                    </label>
                    {isEditing ? (
                      <div className="h-12 rounded-xl bg-slate-50 border border-slate-200/80 px-4 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                        <input
                          type="text"
                          placeholder="2000"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none"
                        />
                      </div>
                    ) : (
                      <div className="h-12 bg-slate-50/50 rounded-xl px-4 flex items-center">
                        <span className="text-[13px] font-bold text-[#0c1424]">
                          {postcode || <span className="text-slate-300 italic">None</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Phone Number (Locked) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      Phone Number
                    </label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-wider">
                      <Lock size={8} /> Read Only
                    </span>
                  </div>
                  <div className="h-12 bg-slate-100/50 border border-slate-200/20 rounded-xl px-4 flex items-center gap-3 text-slate-500">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-[13px] font-bold">
                      {phone || <span className="text-slate-300 italic">Not Available</span>}
                    </span>
                  </div>
                </div>

                {/* Contact Email (Locked) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      Email Address
                    </label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-wider">
                      <Lock size={8} /> Read Only
                    </span>
                  </div>
                  <div className="h-12 bg-slate-100/50 border border-slate-200/20 rounded-xl px-4 flex items-center gap-3 text-slate-500">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-[13px] font-bold">
                      {contactEmail || <span className="text-slate-300 italic">Not Available</span>}
                    </span>
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Timezone
                  </label>
                  {isEditing ? (
                    <div className="h-12 rounded-xl bg-slate-50 border border-slate-200/80 px-3 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="bg-transparent w-full text-[13px] font-bold text-[#0c1424] outline-none select-clean cursor-pointer"
                      >
                        <option value="Australia/Sydney">(GMT+10:00) Sydney</option>
                        <option value="Australia/Melbourne">(GMT+10:00) Melbourne</option>
                        <option value="Australia/Brisbane">(GMT+10:00) Brisbane</option>
                        <option value="Australia/Adelaide">(GMT+09:30) Adelaide</option>
                        <option value="Australia/Perth">(GMT+08:00) Perth</option>
                        <option value="Australia/Hobart">(GMT+10:00) Hobart</option>
                        <option value="Australia/Darwin">(GMT+09:30) Darwin</option>
                      </select>
                    </div>
                  ) : (
                    <div className="h-12 bg-slate-50/50 rounded-xl px-4 flex items-center">
                      <span className="text-[13px] font-bold text-[#0c1424]">
                        {timezone === "Australia/Sydney" && "Sydney (GMT+10)"}
                        {timezone === "Australia/Melbourne" && "Melbourne (GMT+10)"}
                        {timezone === "Australia/Brisbane" && "Brisbane (GMT+10)"}
                        {timezone === "Australia/Adelaide" && "Adelaide (GMT+9:30)"}
                        {timezone === "Australia/Perth" && "Perth (GMT+8)"}
                        {timezone === "Australia/Hobart" && "Hobart (GMT+10)"}
                        {timezone === "Australia/Darwin" && "Darwin (GMT+9:30)"}
                        {!["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide", "Australia/Perth", "Australia/Hobart", "Australia/Darwin"].includes(timezone) && timezone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Currency
                  </label>
                  <div className="h-12 bg-slate-100/30 rounded-xl px-4 flex items-center">
                    <span className="text-[13px] font-black text-slate-400">
                      AUD ($)
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TerminalManagement = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
        Terminal Management
      </h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">
        Assign hardware, monitor transaction volume, and manage POS terminal
        accessibility across your venue.
      </p>
    </div>

    <div className="flex justify-end">
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-[11px] font-black uppercase text-[#0c1424] shadow-sm">
          <LayoutGrid size={14} /> Grid View
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase text-slate-400">
          <List size={14} /> List View
        </button>
      </div>
    </div>

    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <th className="text-left py-4 px-10">Name</th>
            <th className="text-left py-4 px-4">Device Label</th>
            <th className="text-center py-4 px-4">Status</th>
            <th className="text-center py-4 px-4">Bills Today</th>
            <th className="text-right py-4 px-10">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {[
            {
              name: "Main Bar 01",
              label: "HW-A920-7712",
              status: "Online",
              bills: 142,
              icon: Monitor,
            },
            {
              name: "Patio Express",
              label: "HW-A920-8843",
              status: "Online",
              bills: 89,
              icon: Monitor,
            },
            {
              name: "Kitchen Display 1",
              label: "HW-KDS-0012",
              status: "Idle",
              bills: "--",
              icon: Monitor,
            },
          ].map((row, i) => (
            <tr
              key={i}
              className="hover:bg-slate-50/40 transition-colors text-[13px]"
            >
              <td className="py-6 px-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#5dc7ec] flex items-center justify-center">
                    <row.icon size={18} />
                  </div>
                  <span className="font-black text-[#0c1424] text-[15px]">
                    {row.name}
                  </span>
                </div>
              </td>
              <td className="py-6 px-4 font-bold text-slate-400">
                {row.label}
              </td>
              <td className="py-6 px-4">
                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${row.status === "Online" ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"}`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${row.status === "Online" ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    {row.status}
                  </span>
                </div>
              </td>
              <td className="py-6 px-4 text-center font-black text-[#0c1424]">
                {row.bills}
              </td>
              <td className="py-6 px-10">
                <div className="flex justify-end items-center gap-3">
                  <button className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button className="h-10 w-10 rounded-xl border border-slate-100 flex items-center justify-center text-rose-300 hover:bg-rose-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-8 bg-blue-50/50 rounded-[32px] p-10 border border-blue-50 space-y-8">
        <h3 className="text-xl font-black text-[#0c1424]">
          Provision New Terminal
        </h3>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Terminal Name
            </label>
            <div className="h-14 rounded-2xl bg-white border border-slate-100 px-6 flex items-center">
              <input
                type="text"
                placeholder="e.g. Roof Terrace 01"
                className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Device Label / ID
            </label>
            <div className="h-14 rounded-2xl bg-white border border-slate-100 px-6 flex items-center">
              <input
                type="text"
                placeholder="e.g. HW-XXXX-XXXX"
                className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center gap-4">
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("switchSetting", { detail: "tax" }),
              )
            }
            className="h-12 px-8 text-[11px] font-black uppercase tracking-widest text-[#5dc7ec] bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Confirm Configuration
          </button>
          <button className="h-12 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0c1424] transition-colors">
            Discard
          </button>
          <button className="h-12 px-10 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-black/10">
            Add Terminal
          </button>
        </div>
      </div>

      <div className="col-span-4 bg-[#0c1424] rounded-[32px] p-8 text-white shadow-xl shadow-black/20 flex flex-col justify-between">
        <div>
          <div className="h-10 w-10 rounded-xl bg-[#5dc7ec]/20 flex items-center justify-center text-[#5dc7ec] mb-6">
            <LayoutGrid size={20} />
          </div>
          <h3 className="text-lg font-black mb-3">License Usage</h3>
          <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
            Your current plan includes 5 active terminals. You are using 3/5
            available slots.
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#5dc7ec]" style={{ width: "60%" }} />
          </div>
          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
            <span className="text-slate-500">60% Capacity</span>
            <span className="text-[#5dc7ec] cursor-pointer">Upgrade Plan</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TaxConfiguration = () => {
  const [taxMode, setTaxMode] = useState<"INCLUSIVE" | "EXCLUSIVE">("INCLUSIVE");
  const [taxRate, setTaxRate] = useState("10");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/restaurant");
        const raw = res.data?.taxMode as string;
        setTaxMode(raw === "EXCLUSIVE" ? "EXCLUSIVE" : "INCLUSIVE");
        setTaxRate(String(res.data?.taxRate ?? "10"));
      } catch {
        // keep defaults
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await api.patch("/restaurant", { taxMode, taxRate: parseFloat(taxRate) });
      setSaveMsg({ type: "success", text: "Tax settings saved successfully." });
    } catch {
      setSaveMsg({ type: "error", text: "Failed to save tax settings." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const rate = parseFloat(taxRate) || 0;
  const exclusiveGst = (10 * rate) / 100;
  const exclusiveTotal = 10 + exclusiveGst;

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 font-bold">Loading tax settings…</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
          Tax Configuration
        </h2>
        <p className="text-[14px] text-slate-400 font-medium mt-2">
          Control how GST is applied to your prices and receipts.
        </p>
      </div>

      {saveMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${saveMsg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
          {saveMsg.type === "success" ? <CheckCircle2 size={16} /> : <Info size={16} />}
          <span className="text-sm font-bold">{saveMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Tax Mode Selection */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
              Select Tax Mode
            </h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Option 1 — GST Included */}
              <button
                type="button"
                onClick={() => setTaxMode("INCLUSIVE")}
                className={`p-8 rounded-[32px] border-2 transition-all text-left relative flex flex-col gap-6 ${taxMode === "INCLUSIVE" ? "border-[#5dc7ec] bg-white shadow-sm" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
              >
                <div className="flex justify-between items-start">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${taxMode === "INCLUSIVE" ? "bg-blue-50 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="px-3 py-1 bg-[#0c1424] rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
                    Most Common
                  </span>
                </div>
                <div>
                  <h4 className="text-[16px] font-black text-[#0c1424] mb-2">GST Included</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    The price already includes GST. Nothing extra is added at checkout.
                  </p>
                </div>
                <div className="mt-auto bg-slate-50 rounded-2xl p-4 text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest leading-relaxed">
                  Example: $11.00 total → GST $1.00 already inside
                </div>
              </button>

              {/* Option 2 — GST Added on Top */}
              <button
                type="button"
                onClick={() => setTaxMode("EXCLUSIVE")}
                className={`p-8 rounded-[32px] border-2 transition-all text-left relative flex flex-col gap-6 ${taxMode === "EXCLUSIVE" ? "border-[#5dc7ec] bg-white shadow-sm" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${taxMode === "EXCLUSIVE" ? "bg-blue-50 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                  <Plus size={20} />
                </div>
                <div>
                  <h4 className="text-[16px] font-black text-[#0c1424] mb-2">GST Added on Top</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    GST is calculated separately and added to the price at checkout.
                  </p>
                </div>
                <div className="mt-auto bg-slate-50 rounded-2xl p-4 text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest leading-relaxed">
                  Example: $10.00 + ${(10 * rate / 100).toFixed(2)} GST ({rate}%) = ${(10 + 10 * rate / 100).toFixed(2)}
                </div>
              </button>
            </div>
          </div>

          {/* Tax Rate — only for EXCLUSIVE */}
          {taxMode === "EXCLUSIVE" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
                GST Rate (%)
              </h3>
              <div className="flex items-center gap-4 max-w-[280px]">
                <div className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 flex items-center justify-between flex-1 focus-within:border-[#5dc7ec] transition-colors">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="bg-transparent w-full text-[20px] font-black text-[#0c1424] outline-none"
                    placeholder="10"
                  />
                  <span className="text-[18px] font-black text-[#0c1424]">%</span>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 font-medium ml-1">
                Standard Australian GST is <strong>10%</strong>.
              </p>
            </div>
          )}

          {/* Compliance Note */}
          <div className="bg-[#f0f9ff] rounded-[32px] border border-blue-100 p-8 flex gap-6">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#5dc7ec] flex-shrink-0">
              <Info size={20} />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <h4 className="text-[14px] font-black text-[#0c1424]">
                  Important Compliance Warning
                </h4>
                <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                  Tax regulations vary by jurisdiction. Ensure your settings comply with local legislation.
                  Changes take effect on new bills immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-12 px-10 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-black transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save Tax Settings"}
          </button>
        </div>

        {/* Live Receipt Preview */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
            Live Receipt Preview
          </h3>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden flex flex-col p-8">
            <div className="flex flex-col items-center gap-2 mb-8">
              <h4 className="text-[15px] font-black text-[#0c1424] uppercase tracking-widest">
                TillCloud Store #42
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Sydney, NSW 2000
              </span>
            </div>

            <div className="space-y-6 pt-6 border-t border-dashed border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-400">Cloud Coffee Medium</span>
                <span className="text-[13px] font-black text-[#0c1424]">
                  {taxMode === "EXCLUSIVE" ? "$10.00" : "$11.00"}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3 pt-6 border-t border-dashed border-slate-200">
              {taxMode === "EXCLUSIVE" ? (
                <>
                  <div className="flex justify-between items-center text-[12px] font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span>$10.00</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] font-bold text-slate-400">
                    <span>GST ({rate}%)</span>
                    <span>+${exclusiveGst.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                /* INCLUSIVE: no subtotal/tax lines, just the total */
                <div className="flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#5dc7ec] bg-[#e8f9ff] px-3 py-1 rounded-full">
                    ✓ GST Included in price
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-[16px] font-black text-[#0c1424]">Total</span>
                <span className="text-[18px] font-black text-[#5dc7ec]">
                  {taxMode === "EXCLUSIVE" ? `$${exclusiveTotal.toFixed(2)}` : "$11.00"}
                </span>
              </div>
              {taxMode === "INCLUSIVE" && (
                <p className="text-[10px] text-slate-400 italic">* GST included in price</p>
              )}
            </div>

            <div className="mt-10 flex flex-col items-center gap-6">
              <div className="w-full h-8 bg-slate-50 rounded-lg flex items-center px-4 gap-1 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="h-full bg-slate-300" style={{ width: i % 3 === 0 ? "4px" : "2px", opacity: 0.4 }} />
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Thank you for your business
              </span>
            </div>
          </div>

          <div className="bg-[#0c1424] rounded-[32px] p-6 text-white">
            <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
              {taxMode === "INCLUSIVE"
                ? "GST is already inside every menu price. Customers see one clean total — no extra charges."
                : `GST at ${rate}% is calculated on the subtotal and added at checkout.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



const PaymentMethods = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
        Payment Methods
      </h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">
        Configure how your customers pay at checkout.
      </p>
    </div>

    <div className="space-y-8">
      {/* Cash */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-[#0c1424]">Cash</h3>
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">
              Always Active
            </span>
          </div>
        </div>
        <div className="h-8 w-14 bg-[#0c1424] rounded-full relative p-1 cursor-pointer">
          <div className="h-6 w-6 bg-white rounded-full absolute right-1" />
        </div>
      </div>

      {/* Tyro */}
      <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-10">
        <style>{`
          html.dark input.transparent-input {
            background-color: transparent !important;
            background: transparent !important;
            border-color: transparent !important;
            color: #0c1424 !important;
          }
          html.dark input.transparent-input::placeholder {
            color: #94a3b8 !important;
          }
        `}</style>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Monitor size={24} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-[#0c1424]">
                Tyro EFTPOS
              </h3>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                Not Connected
              </span>
            </div>
          </div>
          <button className="h-12 px-8 rounded-xl bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest shadow-xl shadow-black/10">
            Connect Tyro
          </button>
        </div>

        <div className="space-y-6 pt-10 border-t border-slate-50">
          <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest px-2">
            Integration Details
          </h4>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">
                Tyro Merchant ID
              </label>
              <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
                <input
                  type="text"
                  placeholder="e.g. 1234567"
                  className="bg-transparent transparent-input w-full text-[14px] font-bold text-[#0c1424] outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">
                Tyro Terminal ID
              </label>
              <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
                <input
                  type="text"
                  placeholder="e.g. T12345"
                  className="bg-transparent transparent-input w-full text-[14px] font-bold text-[#0c1424] outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button className="h-12 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 hover:text-[#0c1424] dark:hover:text-white transition-colors">
              Cancel
            </button>
            <button className="h-12 px-10 rounded-full bg-[#0c1424] text-white text-[12px] font-black uppercase tracking-widest">
              Connect Terminal
            </button>
          </div>
        </div>
      </div>

      {/* Methods via Tyro */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
            Methods via Tyro
          </h4>
          <span className="px-3 py-1 bg-blue-50 text-[#5dc7ec] text-[9px] font-black uppercase tracking-widest rounded-lg">
            Enabled when connected
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { id: "card", label: "Card Payments", icon: LayoutGrid },
            { id: "tap", label: "Tap to Pay", icon: Zap },
            { id: "apple", label: "Apple Pay", icon: Receipt },
            { id: "google", label: "Google Pay", icon: "GOOGLE" },
          ].map((method) => (
            <div
              key={method.id}
              className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 group cursor-not-allowed opacity-50"
            >
              <div className="h-10 w-10 mb-4 flex items-center justify-center text-slate-300">
                {method.icon === "GOOGLE" ? (
                  <span className="font-black text-lg">GOOGLE</span>
                ) : (
                  <method.icon size={24} />
                )}
              </div>
              <h5 className="text-[13px] font-black text-[#0c1424]">
                {method.label}
              </h5>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-1 block">
                Enabled via Tyro
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#5dc7ec]">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-[#0c1424]">
              Split Payment
            </h3>
            <p className="text-[12px] text-slate-400 dark:text-slate-300 font-medium">
              Allow customers to split payments across multiple methods (e.g.
              part cash, part card) for a single order.
            </p>
          </div>
        </div>
        <div className="h-8 w-14 bg-[#0c1424] rounded-full relative p-1 cursor-pointer">
          <div className="h-6 w-6 bg-white rounded-full absolute right-1" />
        </div>
      </div>

      <div className="bg-[#0c1424] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 max-w-[400px] space-y-4">
          <h3 className="text-[28px] font-black tracking-tight">
            Seamless Checkout
          </h3>
          <p className="text-slate-400 dark:text-slate-300 text-[14px] leading-relaxed font-medium">
            Integrating Tyro reduces manual entry errors and speeds up your
            service by up to 30%.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 p-12">
          <Monitor size={180} />
        </div>
        <div className="absolute top-1/2 right-12 -translate-y-1/2 space-y-4 animate-in slide-in-from-right-8 duration-700">
          <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#5dc7ec] shadow-2xl">
            <Wallet size={20} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LoyaltyProgram = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
        Loyalty Program
      </h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">
        Reward your customers and encourage repeat visits.
      </p>
    </div>

    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
      <div className="flex flex-col">
        <h3 className="text-[16px] font-black text-[#0c1424]">
          Enable Loyalty Program
        </h3>
        <p className="text-[12px] text-slate-400 font-medium mt-1">
          Turning this off disables loyalty points on POS and customer receipts.
        </p>
      </div>
      <div className="h-8 w-14 bg-[#0c1424] rounded-full relative p-1 cursor-pointer">
        <div className="h-6 w-6 bg-white rounded-full absolute right-1" />
      </div>
    </div>

    <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-10">
      <h3 className="text-[16px] font-black text-[#0c1424]">
        Program Configuration
      </h3>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            POINTS EARNED PER DOLLAR SPENT
          </label>
          <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center gap-4">
            <span className="text-[14px] font-black text-slate-400">$</span>
            <input
              type="text"
              defaultValue="0.1"
              className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none"
            />
          </div>
          <p className="text-[10px] italic text-slate-400 ml-1">
            Example: 0.1 means 1 point for every $10 spent
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            REDEMPTION UNIT (POINTS)
          </label>
          <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center">
            <input
              type="text"
              defaultValue="50"
              className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none"
            />
          </div>
          <p className="text-[10px] italic text-slate-400 ml-1">
            Number of points required per redemption step
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            REDEMPTION VALUE (AUD)
          </label>
          <div className="h-14 rounded-2xl bg-[#f0f7ff] border border-transparent px-6 flex items-center gap-4">
            <span className="text-[14px] font-black text-slate-400">$</span>
            <input
              type="text"
              defaultValue="5"
              className="bg-transparent w-full text-[14px] font-bold text-[#0c1424] outline-none"
            />
          </div>
          <p className="text-[10px] italic text-slate-400 ml-1">
            Value of each redemption step
          </p>
        </div>
      </div>
    </div>

    <div className="bg-[#0c1424] rounded-[32px] p-10 text-white shadow-xl shadow-black/20 space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-[#5dc7ec]/20 flex items-center justify-center text-[#5dc7ec]">
          <CheckCircle2 size={16} />
        </div>
        <h3 className="text-[16px] font-black">Loyalty Preview</h3>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-[24px] p-8">
        <h4 className="text-[20px] font-black text-[#5dc7ec] mb-2">
          Spend $100 = earn 10 points.
        </h4>
        <p className="text-[18px] font-black text-white/60">
          50 points = $5 discount.
        </p>
      </div>
    </div>
  </div>
);

const SMSCredits = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col">
      <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
        SMS Credits
      </h2>
      <p className="text-[14px] text-slate-400 font-medium mt-2">
        Manage your SMS balance and track usage for digital receipts. Automatic
        top-ups and detailed logs help maintain seamless customer communication.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
      <div className="bg-[#0c1424] rounded-[32px] p-8 text-white shadow-xl shadow-black/10 relative overflow-hidden flex flex-col justify-between h-48">
        <div className="flex justify-between items-start">
          <div className="text-[10px] font-black text-[#5dc7ec] uppercase tracking-widest flex items-center gap-2">
            <div className="h-5 w-5 bg-[#5dc7ec]/20 rounded-md flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-[#5dc7ec]" />
            </div>
            Current Balance
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] font-black leading-none">48</span>
            <span className="text-[16px] font-bold text-slate-400">
              Credits Remaining
            </span>
          </div>
          <p className="text-slate-500 text-[11px] font-medium mt-4">
            Each SMS receipt costs 1 credit (~$0.05 AUD). Your balance is low.
          </p>
        </div>
        <div className="flex gap-2 relative z-10 mt-6">
          <button className="h-10 px-6 rounded-full bg-[#5dc7ec] text-[#0c1424] text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
            Auto-Top Up: Off
          </button>
          <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
            <Info size={16} />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#5dc7ec]/5 rounded-full blur-3xl -mr-16 -mt-16" />
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-48">
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
          Last 30 Days Usage
        </span>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[40px] font-black text-[#0c1424]">1,240</span>
            <span className="text-rose-500 text-[14px] font-black flex items-center gap-1">
              <TrendingUp size={16} /> 12%
            </span>
          </div>
        </div>
        <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
          <div className="h-full bg-[#0c1424] w-[70%]" />
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-48">
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
          Avg. Delivery Rate
        </span>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[40px] font-black text-[#0c1424]">99.8%</span>
            <span className="text-emerald-500 text-[11px] font-black uppercase tracking-widest border border-emerald-100 rounded-full px-3 py-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Stable
            </span>
          </div>
        </div>
        <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-[99%]" />
        </div>
      </div>
    </div>

    <div className="bg-blue-50/50 rounded-[32px] p-8 border border-blue-50 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#5dc7ec]">
          <Bell size={24} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[15px] font-black text-[#0c1424]">
            Low Balance Alert
          </h3>
          <p className="text-[12px] text-slate-500 font-medium">
            Notify me when balance falls below 50 credits.
          </p>
        </div>
      </div>
      <div className="h-8 w-14 bg-[#5dc7ec] rounded-full relative p-1 cursor-pointer">
        <div className="h-6 w-6 bg-white rounded-full absolute right-1 shadow-sm" />
      </div>
    </div>

    <div className="space-y-8">
      <h3 className="text-[18px] font-black text-[#0c1424] px-2">
        Purchase Credits
      </h3>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {[
          {
            id: "starter",
            label: "Starter",
            credits: "100 Credits",
            price: "~$5 AUD",
            desc: "Best for small cafes",
            icon: MessageSquare,
          },
          {
            id: "standard",
            label: "Standard",
            credits: "500 Credits",
            price: "~$22 AUD",
            desc: "Best for regular restaurants",
            icon: Zap,
            tag: "Popular",
          },
          {
            id: "pro",
            label: "Pro",
            credits: "1000 Credits",
            price: "~$40 AUD",
            desc: "Best for high-volume businesses",
            icon: LayoutGrid,
          },
        ].map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex flex-col items-center text-center relative group hover:border-[#5dc7ec] transition-all cursor-pointer ${pkg.tag ? "ring-2 ring-[#5dc7ec]" : ""}`}
          >
            {pkg.tag && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5dc7ec] text-[#0c1424] text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Popular
              </div>
            )}
            <div
              className={`h-16 w-16 rounded-[24px] mb-8 flex items-center justify-center text-[#5dc7ec] ${pkg.tag ? "bg-[#5dc7ec]/10" : "bg-slate-50 group-hover:bg-[#5dc7ec]/10"}`}
            >
              <pkg.icon size={28} />
            </div>
            <h4 className="text-[15px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {pkg.label}
            </h4>
            <div className="text-[28px] font-black text-[#0c1424] mb-1">
              {pkg.credits}
            </div>
            <span className="text-[12px] font-black text-slate-400">
              {pkg.price}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-4 mb-10 max-w-[140px] leading-relaxed">
              {pkg.desc}
            </p>
            <button
              className={`w-full h-14 rounded-full border-2 text-[12px] font-black uppercase tracking-widest transition-all ${pkg.tag ? "bg-[#5dc7ec] border-transparent text-[#0c1424]" : "bg-white border-slate-100 text-[#0c1424] hover:border-[#0c1424]"}`}
            >
              Purchase Credits
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const VisualsSettings = () => {
  const [scale, setScale] = useState<string>("100%");
  const [softFont, setSoftFont] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>("light");
  const [showPosHeader, setShowPosHeader] = useState<boolean>(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const savedScale = localStorage.getItem("ui-scale") || "100%";
    const savedSoft = localStorage.getItem("ui-font-soft") === "true";
    const savedTheme = localStorage.getItem("ui-theme") || "light";
    const savedPosHeader = localStorage.getItem("ui-pos-header") === "true";
    setScale(savedScale);
    setSoftFont(savedSoft);
    setTheme(savedTheme);
    setShowPosHeader(savedPosHeader);
  }, []);

  const handleApplyScale = (newScale: string) => {
    setScale(newScale);
    localStorage.setItem("ui-scale", newScale);
    document.documentElement.style.setProperty("--ui-font-scale", newScale);
    
    setSaveMsg({ type: "success", text: `Interface scale adjusted to ${newScale} instantly!` });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleApplyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("ui-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("black-theme");
    } else if (newTheme === "black") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.add("black-theme");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.remove("black-theme");
    }
    
    let labelName = "Light Mode";
    if (newTheme === "dark") labelName = "Polished Midnight";
    if (newTheme === "black") labelName = "Dark Night (AMOLED)";
    setSaveMsg({ type: "success", text: `Theme changed to ${labelName} instantly!` });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleToggleSoftFont = (val: boolean) => {
    setSoftFont(val);
    localStorage.setItem("ui-font-soft", val ? "true" : "false");
    if (val) {
      document.body.classList.add("softer-typography");
    } else {
      document.body.classList.remove("softer-typography");
    }
    setSaveMsg({ type: "success", text: `Typography weights tuned successfully!` });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleTogglePosHeader = (val: boolean) => {
    setShowPosHeader(val);
    localStorage.setItem("ui-pos-header", val ? "true" : "false");
    window.dispatchEvent(new Event("ui-pos-header-change"));
    setSaveMsg({ type: "success", text: `POS Header visibility updated!` });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
          Themes and Settings
        </h2>
        <p className="text-[14px] text-slate-400 font-medium mt-2">
          Select display theme preferences, customize interface scale factor, and fine-tune typography weight.
        </p>
      </div>

      {saveMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${saveMsg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
          <CheckCircle2 size={16} />
          <span className="text-sm font-bold">{saveMsg.text}</span>
        </div>
      )}

      {/* Interface Theme Toggle */}
      <div className="space-y-6">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
          Interface Theme
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Option 1: Light Mode */}
          <button
            type="button"
            onClick={() => handleApplyTheme("light")}
            className={`p-6 rounded-[32px] border-2 transition-all text-left relative flex flex-col gap-4 justify-between ${theme === "light" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${theme === "light" ? "bg-amber-50 text-amber-500" : "text-slate-300 bg-white shadow-sm"}`}>
                <Sun size={18} />
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${theme === "light" ? "bg-[#0c1424] text-white" : "bg-slate-100 text-slate-400"}`}>
                Light Mode
              </span>
            </div>
            <div>
              <h4 className="text-[15px] font-black text-[#0c1424] mb-1">Standard Light</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Traditional high-contrast layout. Ideal for bright workspace counters.
              </p>
            </div>
          </button>

          {/* Option 2: Polished Midnight */}
          <button
            type="button"
            onClick={() => handleApplyTheme("dark")}
            className={`p-6 rounded-[32px] border-2 transition-all text-left relative flex flex-col gap-4 justify-between ${theme === "dark" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${theme === "dark" ? "bg-indigo-950 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                <Moon size={18} />
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${theme === "dark" ? "bg-[#5dc7ec] text-slate-900" : "bg-slate-100 text-slate-400"}`}>
                Midnight Blue
              </span>
            </div>
            <div>
              <h4 className="text-[15px] font-black text-[#0c1424] mb-1">Polished Midnight</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Deep, rich dark-blue-black theme. Comfortable under standard lighting shifts.
              </p>
            </div>
          </button>

          {/* Option 3: AMOLED Dark Night (Pure Black) */}
          <button
            type="button"
            onClick={() => handleApplyTheme("black")}
            className={`p-6 rounded-[32px] border-2 transition-all text-left relative flex flex-col gap-4 justify-between ${theme === "black" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${theme === "black" ? "bg-black text-amber-400 border border-slate-850" : "text-slate-300 bg-white shadow-sm"}`}>
                <Zap size={18} />
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${theme === "black" ? "bg-amber-400 text-black font-black" : "bg-slate-100 text-slate-400"}`}>
                AMOLED Black
              </span>
            </div>
            <div>
              <h4 className="text-[15px] font-black text-[#0c1424] mb-1">Dark Night (AMOLED)</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Completely black workspace theme. Outstanding visual readability and contrast.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Interface Scaling Cards */}
      <div className="space-y-6">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
          Interface Density / Scale
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {/* Option 1: Micro (75%) */}
          <button
            type="button"
            onClick={() => handleApplyScale("75%")}
            className={`p-5 rounded-[24px] border-2 transition-all text-left relative flex flex-col gap-3.5 justify-between ${scale === "75%" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${scale === "75%" ? "bg-blue-50 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                <Minimize2 size={14} />
              </div>
              <span className="px-2 py-0.5 bg-sky-900 rounded-md text-[7px] font-black text-white uppercase tracking-wider">
                Ultra-Density
              </span>
            </div>
            <div>
              <h4 className="text-[13px] font-black text-[#0c1424] mb-0.5">Micro (75%)</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Maximum layout density. Hyper-compact spacing and ultra-small text. Perfect for high-res screens.
              </p>
            </div>
          </button>

          {/* Option 2: Extra Compact (80%) */}
          <button
            type="button"
            onClick={() => handleApplyScale("80%")}
            className={`p-5 rounded-[24px] border-2 transition-all text-left relative flex flex-col gap-3.5 justify-between ${scale === "80%" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${scale === "80%" ? "bg-blue-50 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                <LayoutGrid size={14} />
              </div>
              <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[7px] font-black text-white uppercase tracking-wider">
                Super Compact
              </span>
            </div>
            <div>
              <h4 className="text-[13px] font-black text-[#0c1424] mb-0.5">Extra Compact (80%)</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Extremely tight spacing. Maximizes active viewport area for complex grids & forms on laptops.
              </p>
            </div>
          </button>

          {/* Option 3: Compact (85%) */}
          <button
            type="button"
            onClick={() => handleApplyScale("85%")}
            className={`p-5 rounded-[24px] border-2 transition-all text-left relative flex flex-col gap-3.5 justify-between ${scale === "85%" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${scale === "85%" ? "bg-blue-50 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                <Columns size={14} />
              </div>
              <span className="px-2 py-0.5 bg-[#0c1424] rounded-md text-[7px] font-black text-white uppercase tracking-wider">
                Compact
              </span>
            </div>
            <div>
              <h4 className="text-[13px] font-black text-[#0c1424] mb-0.5">Compact Mode (85%)</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Balanced workspace efficiency. Tight spacing and neat sizes, ideal for standard laptops.
              </p>
            </div>
          </button>

          {/* Option 4: Standard (100%) */}
          <button
            type="button"
            onClick={() => handleApplyScale("100%")}
            className={`p-5 rounded-[24px] border-2 transition-all text-left relative flex flex-col gap-3.5 justify-between ${scale === "100%" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${scale === "100%" ? "bg-blue-50 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                <Monitor size={14} />
              </div>
              <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[7px] font-black text-slate-400 uppercase tracking-wider">
                Default
              </span>
            </div>
            <div>
              <h4 className="text-[13px] font-black text-[#0c1424] mb-0.5">Standard Mode (100%)</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Perfect default visual balance. Recommended for standard desktop monitors or large screens.
              </p>
            </div>
          </button>

          {/* Option 5: Spacious (112%) */}
          <button
            type="button"
            onClick={() => handleApplyScale("112%")}
            className={`p-5 rounded-[24px] border-2 transition-all text-left relative flex flex-col gap-3.5 justify-between ${scale === "112%" ? "border-[#5dc7ec] bg-white shadow-md shadow-black/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
          >
            <div className="flex justify-between items-start w-full">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${scale === "112%" ? "bg-blue-50 text-[#5dc7ec]" : "text-slate-300 bg-white shadow-sm"}`}>
                <Maximize2 size={14} />
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-[#5dc7ec] rounded-md text-[7px] font-black uppercase tracking-wider">
                Large Touch
              </span>
            </div>
            <div>
              <h4 className="text-[13px] font-black text-[#0c1424] mb-0.5">Spacious Mode (112%)</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Enlarged control surfaces, generous text, and massive touch targets. Ideal for quick checkouts.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Typography Fine-Tuning */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-[16px] font-black text-[#0c1424]">
            Typography & Font Weights Limiters
          </h3>
          <p className="text-[12px] text-slate-400 font-medium mt-1">
            Tune typography thickness and reduce heavy headings to increase visual clarity.
          </p>
        </div>

        <div className="divide-y divide-slate-50">
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="text-[13px] font-black text-[#0c1424]">Softer Bold Weights</h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Reduce extreme black font weights (`font-black`/`font-[1000]`) to normal elegant bold weights.
              </p>
            </div>
            <button
              onClick={() => handleToggleSoftFont(!softFont)}
              className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${softFont ? "bg-emerald-500" : "bg-slate-200"}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${softFont ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="text-[13px] font-black text-[#0c1424]">Show POS Header</h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Display the restaurant name, admin info, time, and date at the top of the POS screens.
              </p>
            </div>
            <button
              onClick={() => handleTogglePosHeader(!showPosHeader)}
              className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${showPosHeader ? "bg-emerald-500" : "bg-slate-200"}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${showPosHeader ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Console */}
      <div className="bg-[#0c1424] rounded-[32px] p-8 text-white relative overflow-hidden">
        <h3 className="text-[16px] font-black mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#5dc7ec] animate-pulse" /> Live Element Scale Preview
        </h3>
        <p className="text-[12px] text-slate-400 leading-relaxed font-medium mb-6">
          This container simulates how key elements, headings, labels, and icons dynamically shrink and expand depending on your chosen display scale factor.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preview Heading</span>
            <h4 className="text-[20px] font-black text-white leading-tight">Gourmet Beef Burger</h4>
            <span className="text-[13px] font-extrabold text-[#5dc7ec]">$18.50</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#5dc7ec]/10 text-[#5dc7ec] flex items-center justify-center shrink-0">
              <Monitor size={18} />
            </div>
            <div>
              <h4 className="text-[13px] font-black text-white">Active Terminal</h4>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Counter 01 · Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Main Settings Module --- */

/* --- Table & Categories Management --- */

const TableLayoutManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Category (Group) creation state
  const [newGroupName, setNewGroupName] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Table creation state
  const [newTableName, setNewTableName] = useState("");
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [isSavingTable, setIsSavingTable] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get("/tables/groups");
      const fetchedGroups = res.data || [];
      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0) {
        // Retain selection if possible, otherwise choose first
        if (!activeGroupId || !fetchedGroups.some((g: any) => g.id === activeGroupId)) {
          setActiveGroupId(fetchedGroups[0].id);
        }
      } else {
        setActiveGroupId(null);
      }
    } catch (err: any) {
      console.error("Failed to load table configurations:", err);
      setError("Failed to load table configurations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (!isAdmin) {
      setError("Only administrators can perform this action.");
      return;
    }

    try {
      setIsSavingGroup(true);
      setError(null);
      const res = await api.post("/tables/groups", { name: newGroupName.trim() });
      setSuccessMsg(`Category "${newGroupName}" created successfully!`);
      setNewGroupName("");
      const fetchedGroups = [...groups, { ...res.data, tables: [] }];
      setGroups(fetchedGroups);
      if (!activeGroupId) {
        setActiveGroupId(res.data.id);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to create table category:", err);
      setError(err?.response?.data?.message || "Failed to create category.");
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteCategory = async (groupId: string, name: string) => {
    if (!isAdmin) {
      setError("Only administrators can perform this action.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the category "${name}"? All tables inside this category will be removed.`)) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/tables/groups/${groupId}`);
      setSuccessMsg(`Category "${name}" deleted.`);
      const remainingGroups = groups.filter((g) => g.id !== groupId);
      setGroups(remainingGroups);
      if (activeGroupId === groupId) {
        setActiveGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : null);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to delete table category:", err);
      setError("Failed to delete category.");
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) {
      setError("Please select or create a category first.");
      return;
    }
    if (!newTableName.trim()) {
      setError("Table number is required.");
      return;
    }
    if (!isAdmin) {
      setError("Only administrators can perform this action.");
      return;
    }

    try {
      setIsSavingTable(true);
      setError(null);
      
      const res = await api.post("/tables", {
        groupId: activeGroupId,
        name: newTableName.trim(),
        seats: Number(newTableSeats),
        floor: "GROUND",
      });

      setSuccessMsg(`Table "${newTableName}" added successfully!`);
      setNewTableName("");
      setNewTableSeats(4);
      
      // Update local state dynamically
      setGroups(prevGroups => prevGroups.map((g) => {
        if (g.id === activeGroupId) {
          return {
            ...g,
            tables: [...(g.tables || []), res.data]
          };
        }
        return g;
      }));

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to add table:", err);
      setError(err?.response?.data?.message || "Failed to add table. Note: Table numbers must be unique within sections.");
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    if (!isAdmin) {
      setError("Only administrators can perform this action.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/tables/${tableId}`);
      setSuccessMsg(`Table "${tableName}" deleted successfully.`);
      
      // Update local state dynamically
      setGroups(prevGroups => prevGroups.map((g) => {
        if (g.id === activeGroupId) {
          return {
            ...g,
            tables: g.tables.filter((t: any) => t.id !== tableId)
          };
        }
        return g;
      }));

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to delete table:", err);
      setError("Failed to delete table.");
    }
  };

  const selectedGroup = groups.find((g) => g.id === activeGroupId);
  const activeTables = selectedGroup?.tables || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        <h2 className="text-[32px] font-black text-[#0c1424] tracking-tight leading-none">
          Table & Categories Management
        </h2>
        <p className="text-[14px] text-slate-400 font-medium mt-2">
          Create seating layouts, customize table flooring sections, and manage dine-in table allocations.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-2">
          <Info size={16} />
          Viewing only. Setup of tables and categories is restricted to administrators.
        </div>
      )}

      {error && (
        <div className="rounded-2xl px-6 py-4 text-[13px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <X size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-bold">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#5dc7ec] mx-auto mb-4" />
          Loading layout configurations...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Table Categories */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-black text-[#0c1424] uppercase tracking-wider">
                  Layout Sections
                </h3>
                <span className="bg-[#f0f9ff] text-[#5dc7ec] text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                  {groups.length} Floors
                </span>
              </div>

              {/* Category creation inline */}
              {isAdmin && (
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <div className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 flex items-center flex-1 focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                    <input
                      type="text"
                      placeholder="e.g. Ground Floor, Terrace"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="bg-transparent w-full text-[12px] font-bold text-[#0c1424] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingGroup || !newGroupName.trim()}
                    className="h-11 w-11 rounded-xl bg-[#0c1424] text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-[#0c1424]/5"
                    title="Add Category"
                  >
                    <Plus size={18} />
                  </button>
                </form>
              )}

              {/* Categories list */}
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {groups.length === 0 ? (
                  <div className="py-8 text-center text-slate-300 font-medium text-[12px] italic">
                    No layout categories configured. Add one above to begin.
                  </div>
                ) : (
                  groups.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setActiveGroupId(g.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl cursor-pointer group/item transition-all border ${
                        activeGroupId === g.id
                          ? "bg-blue-50/50 border-[#5dc7ec]/30 text-[#0c1424] shadow-sm font-extrabold"
                          : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-[#0c1424]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeGroupId === g.id ? 'bg-[#5dc7ec]/10 text-[#5dc7ec]' : 'bg-slate-100 text-slate-400 group-hover/item:bg-slate-200/50'}`}>
                          <LayoutGrid size={15} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[13px] font-black">{g.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{g.tables?.length || 0} Tables</span>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteCategory(g.id, g.name);
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-colors opacity-0 group-hover/item:opacity-100"
                          title="Delete Category"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Tables Grid & Actions */}
          <div className="lg:col-span-8 space-y-6">
            {activeGroupId ? (
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-6">
                  <div>
                    <h3 className="text-[18px] font-black text-[#0c1424]">
                      {selectedGroup?.name} Layout
                    </h3>
                    <p className="text-[12px] text-slate-400 font-medium mt-1">
                      Manage layout placement and table structures for this section.
                    </p>
                  </div>
                  
                  {/* Table setup widget */}
                  {isAdmin && (
                    <form onSubmit={handleAddTable} className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-100 p-2 rounded-2xl">
                      {/* Name / Table number input - STRICT numbers constraint */}
                      <div className="h-10 w-28 rounded-xl bg-white border border-slate-200 px-3 flex items-center focus-within:ring-2 focus-within:ring-[#5dc7ec]/25 transition-all">
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="Table #"
                          value={newTableName}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d+$/.test(val)) {
                              setNewTableName(val);
                            }
                          }}
                          className="bg-transparent w-full text-[12px] font-extrabold text-[#0c1424] outline-none"
                        />
                      </div>

                      {/* Seats count spinner */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 rounded-xl h-10 select-none">
                        <button
                          type="button"
                          onClick={() => setNewTableSeats((p) => Math.max(1, p - 1))}
                          className="h-6 w-6 rounded-md hover:bg-slate-100 flex items-center justify-center font-black text-[12px] text-slate-400"
                        >
                          -
                        </button>
                        <span className="text-[12px] font-black text-[#0c1424] w-8 text-center">{newTableSeats} seats</span>
                        <button
                          type="button"
                          onClick={() => setNewTableSeats((p) => p + 1)}
                          className="h-6 w-6 rounded-md hover:bg-slate-100 flex items-center justify-center font-black text-[12px] text-slate-400"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingTable || !newTableName.trim()}
                        className="h-10 px-4 rounded-xl bg-[#0c1424] text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-850 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-[#0c1424]/5"
                      >
                        <Plus size={14} /> Add Table
                      </button>
                    </form>
                  )}
                </div>

                {/* Tables Grid */}
                {activeTables.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto border border-dashed border-slate-200">
                      <LayoutGrid size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[14px] font-bold text-[#0c1424]">This section is empty</h4>
                      <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                        Add seating coordinates and table configurations to structure your flooring layout.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {activeTables.map((table: any) => (
                      <div
                        key={table.id}
                        className="relative bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-[#5dc7ec]/30 hover:shadow-lg hover:shadow-black/5 group/card rounded-[24px] p-5 transition-all text-center flex flex-col items-center justify-center gap-3 min-h-[140px]"
                      >
                        {/* Seating cap badge */}
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 rounded-md px-2 py-0.5 select-none">
                          {table.seats} Seats
                        </span>

                        {/* Name/Number */}
                        <h4 className="text-[18px] font-black text-[#0c1424] leading-none mt-1">
                          Table {table.name}
                        </h4>

                        {/* Status badge */}
                        <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-2.5 py-0.5">
                          <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">
                            Available
                          </span>
                        </div>

                        {/* Delete action overlay */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteTable(table.id, table.name)}
                            className="absolute -top-2.5 -right-2.5 h-7 w-7 rounded-full bg-white border border-slate-150 text-slate-300 hover:text-rose-500 hover:border-rose-100 flex items-center justify-center transition-all shadow-md opacity-0 group-hover/card:opacity-100 group-hover/card:scale-105"
                            title="Delete Table"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm text-center py-20 space-y-4">
                <div className="h-20 w-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mx-auto">
                  <LayoutGrid size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-[18px] font-black text-[#0c1424]">Select a Section</h4>
                  <p className="text-[13px] text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed">
                    Highlight an active floor category or floor section from the left column to view and modify tables layout.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

/* --- Main Settings Module --- */

type SettingType =
  | "profile"
  | "tax"
  | "payment"
  | "loyalty"
  | "sms"
  | "terminals"
  | "printer"
  | "tables_mgmt"
  | "visuals";

export default function SettingsPage() {
  const [activeSetting, setActiveSetting] = useState<SettingType>("profile");
  const { user, hasPermission } = useAuth();

  // Handle cross-component navigation within settings
  useEffect(() => {
    const handleSwitch = (e: any) => setActiveSetting(e.detail);
    window.addEventListener("switchSetting", handleSwitch);
    return () => window.removeEventListener("switchSetting", handleSwitch);
  }, []);

  const navItems = [
    { id: "profile", label: "Restaurant profile", icon: Building2 },
    { id: "tax", label: "Tax Configuration", icon: Receipt },
    { id: "payment", label: "Payment methods", icon: Wallet },
    { id: "loyalty", label: "Loyalty Program", icon: Star },
    { id: "sms", label: "SMS Credits", icon: MessageSquare },
    { id: "terminals", label: "Terminals", icon: Monitor },
    { id: "tables_mgmt", label: "Table Management", icon: LayoutGrid },
    { id: "printer", label: "Printer / Docket", icon: Printer },
    { id: "visuals", label: "Themes and Settings", icon: Sliders },
  ];

  const isAdmin = user?.role === "ADMIN";
  const hasSettingsView =
    isAdmin || hasPermission(FRONTEND_PERMISSIONS.SETTINGS_VIEW);

  const visibleNavItems = navItems.filter((item) => {
    if (isAdmin) {
      return true;
    }

    if (!hasSettingsView) {
      return false;
    }

    if (item.id === "profile") {
      return hasPermission(FRONTEND_PERMISSIONS.SETTINGS_EDIT_PROFILE);
    }
    if (item.id === "tax") {
      return hasPermission(FRONTEND_PERMISSIONS.SETTINGS_EDIT_TAX);
    }
    if (item.id === "payment") {
      return hasPermission(FRONTEND_PERMISSIONS.SETTINGS_TYRO);
    }
    if (item.id === "loyalty") {
      return hasPermission(FRONTEND_PERMISSIONS.SETTINGS_EDIT_LOYALTY);
    }
    if (item.id === "sms") {
      return hasPermission(FRONTEND_PERMISSIONS.SETTINGS_SMS_CREDITS);
    }
    if (item.id === "terminals") {
      return hasPermission(FRONTEND_PERMISSIONS.SETTINGS_TERMINALS);
    }
    if (item.id === "tables_mgmt") {
      return true; // Visible to all with settings access, restricted inside
    }
    if (item.id === "printer") {
      return true; // For now allow all who can see settings, can refine later
    }
    if (item.id === "visuals") {
      return true;
    }

    return false;
  });

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.id === activeSetting)) {
      const fallbackSetting = visibleNavItems[0]?.id as SettingType | undefined;
      if (fallbackSetting) {
        setActiveSetting(fallbackSetting);
      }
    }
  }, [activeSetting, visibleNavItems]);

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-[#f8fafc] shadow-sm lg:-m-8 lg:h-[calc(100vh-140px)] lg:flex-row">
      {/* Sidebar sub-nav */}
      <div className="flex flex-col border-r border-slate-100 bg-white pt-6 lg:w-[300px] lg:pt-10">
        <div className="px-8 flex flex-col gap-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4">
               CONFIGURATION
            </h3>
            <div className="space-y-1">
              {visibleNavItems.map((item) => (
                <button
                   key={item.id}
                  onClick={() => setActiveSetting(item.id as SettingType)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${activeSetting === item.id ? "bg-blue-50 text-[#5dc7ec] shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-[#0c1424]"}`}
                >
                  <item.icon
                    size={18}
                    strokeWidth={activeSetting === item.id ? 2.5 : 2}
                  />
                  <span className="text-[13px] font-bold text-left">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-view Content */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-5 sm:p-8 lg:p-12">
        <div className="mx-auto max-w-[1200px]">
          {activeSetting === "profile" && <RestaurantProfile />}
          {activeSetting === "terminals" && <TerminalManagement />}
          {activeSetting === "tax" && <TaxConfiguration />}
          {activeSetting === "payment" && <PaymentMethods />}
          {activeSetting === "loyalty" && <LoyaltyProgram />}
          {activeSetting === "sms" && <SMSCredits />}
          {activeSetting === "tables_mgmt" && <TableLayoutManagement />}
          {activeSetting === "printer" && <PrinterDocketSettings />}
          {activeSetting === "visuals" && <VisualsSettings />}
        </div>
      </div>
    </div>
  );
}

