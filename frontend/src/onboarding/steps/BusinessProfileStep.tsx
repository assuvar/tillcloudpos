import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronDown, Search, MapPin, Loader2, Upload, Trash2 } from "lucide-react";
import { BusinessProfileData } from "../OnboardingFlow";
import api from "../../services/api";

interface BusinessProfileStepProps {
  onBack: () => void;
  onNext: () => void;
  data: BusinessProfileData;
  onChange: (data: BusinessProfileData) => void;
}

export function BusinessProfileStep({
  onBack,
  onNext,
  data,
  onChange,
}: BusinessProfileStepProps) {
  // All fields are mandatory except logoUrl, gstNumber, and taxNumber
  const requiredReady =
    data.name.trim() !== "" &&
    data.phone.trim() !== "" &&
    data.businessType.trim() !== "" &&
    data.abn.trim() !== "" &&
    data.contactEmail.trim() !== "" &&
    data.streetAddress.trim() !== "" &&
    data.suburb.trim() !== "" &&
    data.state.trim() !== "" &&
    data.postcode.trim() !== "";

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const updateField = (field: keyof BusinessProfileData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const fetchAddressSuggestions = (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Appending selected state and country for extremely accurate geocoding suggestions
        const searchQuery = data.state 
          ? `${query}, ${data.state}, Australia` 
          : `${query}, Australia`;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5&countrycodes=au`
        );
        const results = await response.json();
        
        const mapped = (results || []).map((item: any) => {
          const addr = item.address || {};
          const houseNumber = addr.house_number || "";
          const road = addr.road || "";
          const streetAddress = houseNumber ? `${houseNumber} ${road}` : road;
          const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.village || "";
          const postcode = addr.postcode || "";
          
          return {
            displayName: item.display_name,
            streetAddress,
            suburb,
            postcode,
          };
        }).filter((item: any) => item.streetAddress);

        setSuggestions(mapped);
      } catch (err) {
        console.error("Address fetch error", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    onChange({
      ...data,
      streetAddress: suggestion.streetAddress,
      suburb: suggestion.suburb || data.suburb,
      postcode: suggestion.postcode || data.postcode,
    });
    setSuggestions([]);
  };

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Logo size must be under 5MB");
      return;
    }

    setLogoError("");
    
    // Create and set local object URL for instant, zero-latency preview
    const localUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(localUrl);
    
    setLogoUploading(true);

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await api.post("/restaurant/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const logoUrlPath = response.data.url;
      updateField("logoUrl", logoUrlPath);
    } catch (err: any) {
      console.error("Logo upload failed", err);
      let errMsg = "Logo upload failed. Please try again.";
      if (!err?.response) {
        errMsg = "Network Error: Cannot reach backend server on http://localhost:3100. Make sure the backend is running!";
      } else if (err.response?.status === 404) {
        errMsg = "Error (404): Logo upload route not found. Check if your backend code is rebuilt.";
      } else if (err.response?.status === 413) {
        errMsg = "Error (413): File is too large! Maximum allowed size is 5MB.";
      } else if (err.response?.data?.message) {
        errMsg = typeof err.response.data.message === "string" 
          ? err.response.data.message 
          : JSON.stringify(err.response.data.message);
      }
      setLogoError(errMsg);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    updateField("logoUrl", "");
    setLocalPreviewUrl("");
    setLogoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section>
      <h1 className="text-[34px] sm:text-[48px] font-extrabold text-[#0b1324] leading-[1.05] tracking-[-0.02em]">
        Setup your Business Profile
      </h1>
      <p className="text-slate-600 mt-3 text-[15px]">
        Tell us about your restaurant&apos;s location, tax setup, and business identity.
      </p>

      <div className="mt-8 rounded-[10px] border border-slate-200 bg-white p-5 sm:p-8">
        <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
          
          {/* Left Column */}
          <div className="space-y-5">
            {/* Business Type / Restaurant Type */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Business / Restaurant Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2 group">
                <select
                  value={data.businessType}
                  onChange={(event) => updateField("businessType", event.target.value)}
                  className="h-11 w-full appearance-none rounded-md bg-[#f1f5fb] px-4 text-[14px] text-slate-800 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                  aria-label="Business Type"
                >
                  <option value="">Select Business Type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Bar">Bar</option>
                  <option value="Food Truck">Food Truck</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Pizzeria">Pizzeria</option>
                  <option value="Bistro">Bistro</option>
                  <option value="Tavern">Tavern</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-cyan-50 flex items-center justify-center pointer-events-none shadow-sm transition-all group-hover:bg-cyan-100">
                  <ChevronDown className="h-3.5 w-3.5 text-cyan-600 group-hover:text-cyan-700" />
                </div>
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. TillCloud Cafe"
                value={data.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                aria-label="Business Name"
              />
            </div>

            {/* Business Number / Phone */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Business Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. +61 2 1234 5678"
                value={data.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                aria-label="Business Phone"
              />
            </div>

            {/* Business Email */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Business Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. hello@tillcloudcafe.com.au"
                value={data.contactEmail}
                onChange={(event) => updateField("contactEmail", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                aria-label="Business Email"
              />
            </div>

            {/* Australian State selection */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Australian State <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-2 group">
                <select
                  value={data.state}
                  onChange={(event) => {
                    updateField("state", event.target.value);
                    // Clear street address and suburb to let recommendations fill them
                    onChange({
                      ...data,
                      state: event.target.value,
                      streetAddress: "",
                      suburb: "",
                      postcode: "",
                    });
                  }}
                  className="h-11 w-full appearance-none rounded-md bg-[#f1f5fb] px-4 text-[14px] text-slate-800 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                  aria-label="State"
                >
                  <option value="">Select Australian State</option>
                  <option value="NSW">New South Wales (NSW)</option>
                  <option value="VIC">Victoria (VIC)</option>
                  <option value="QLD">Queensland (QLD)</option>
                  <option value="WA">Western Australia (WA)</option>
                  <option value="SA">South Australia (SA)</option>
                  <option value="TAS">Tasmania (TAS)</option>
                  <option value="ACT">Australian Capital Territory (ACT)</option>
                  <option value="NT">Northern Territory (NT)</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-cyan-50 flex items-center justify-center pointer-events-none shadow-sm transition-all group-hover:bg-cyan-100">
                  <ChevronDown className="h-3.5 w-3.5 text-cyan-600 group-hover:text-cyan-700" />
                </div>
              </div>
            </div>

            {/* Address input with real-time Nominatim recommendations */}
            <div className="relative" ref={containerRef}>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Street Address <span className="text-rose-500">*</span> {!data.state && <span className="text-rose-400 text-[10px] normal-case font-medium ml-1.5">(Select State first)</span>}
              </label>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder={data.state ? "Type to search address..." : "Select State first to search address"}
                  disabled={!data.state}
                  value={data.streetAddress}
                  onChange={(event) => {
                    updateField("streetAddress", event.target.value);
                    fetchAddressSuggestions(event.target.value);
                  }}
                  className="h-11 w-full rounded-md bg-[#f1f5fb] px-4 pr-10 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Street Address"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 text-cyan-500 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-none transition-colors flex flex-col gap-0.5"
                    >
                      <span className="font-semibold text-slate-800">{suggestion.streetAddress}</span>
                      <span className="text-[11px] text-slate-500 truncate">{suggestion.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Suburb and Postcode */}
            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div>
                <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                  Suburb <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Sydney"
                  value={data.suburb}
                  onChange={(event) => updateField("suburb", event.target.value)}
                  className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                  aria-label="Suburb"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                  Postcode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="2000"
                  value={data.postcode}
                  onChange={(event) => updateField("postcode", event.target.value)}
                  className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                  aria-label="Postcode"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* ABN Number */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                ABN (Australian Business Number) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="11-digit ABN number"
                value={data.abn}
                onChange={(event) => updateField("abn", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                aria-label="ABN"
              />
            </div>

            {/* GST Number */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                GST Number <span className="text-slate-400 font-medium normal-case ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Optional GST reference"
                value={data.gstNumber}
                onChange={(event) => updateField("gstNumber", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                aria-label="GST Number"
              />
            </div>

            {/* Tax Number */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Tax Number <span className="text-slate-400 font-medium normal-case ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Optional tax registration"
                value={data.taxNumber}
                onChange={(event) => updateField("taxNumber", event.target.value)}
                className="mt-2 h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] placeholder:text-slate-400 outline-none border border-transparent focus:border-[#5dc7ec] transition-all"
                aria-label="Tax Number"
              />
            </div>

            {/* Restaurant Logo */}
            <div>
              <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                Restaurant Logo <span className="text-slate-400 font-medium normal-case ml-1">(Optional)</span>
              </label>
              
              <div className="mt-2 flex items-center gap-5">
                {/* Logo Preview */}
                <div className="relative h-20 w-20 flex-shrink-0 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-sm">
                  {localPreviewUrl || data.logoUrl ? (
                    <img 
                      src={localPreviewUrl || (data.logoUrl.startsWith("http") ? data.logoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:3100"}${data.logoUrl}`)} 
                      alt="Logo Preview" 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="h-5 w-5 text-slate-400 mx-auto" />
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">NO LOGO</span>
                    </div>
                  )}

                  {logoUploading && (
                    <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Action Buttons */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={logoUploading}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-semibold text-slate-700 shadow-sm transition-all disabled:opacity-50"
                    >
                      <Upload size={13} />
                      Select File
                    </button>

                    {data.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={logoUploading}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-rose-100 hover:border-rose-200 bg-rose-50 hover:bg-rose-100 text-[12px] font-semibold text-rose-700 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Supports JPG, PNG, GIF (Max 5MB). Uploads securely.
                  </p>
                  
                  {logoError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      ⚠️ {logoError}
                    </p>
                  )}
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Timezone and Currency */}
            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <div>
                <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                  Timezone
                </label>
                <div className="relative mt-2 group">
                  <select
                    value={data.timezone}
                    onChange={(event) => updateField("timezone", event.target.value)}
                    className="h-11 w-full appearance-none rounded-md bg-[#f1f5fb] px-3 text-[12px] text-slate-800 outline-none pr-10 border border-transparent focus:border-[#5dc7ec] transition-all"
                  >
                    <option value="Australia/Sydney">(GMT+10:00) Sydney</option>
                    <option value="Australia/Melbourne">(GMT+10:00) Melbourne</option>
                    <option value="Australia/Brisbane">(GMT+10:00) Brisbane</option>
                    <option value="Australia/Adelaide">(GMT+09:30) Adelaide</option>
                    <option value="Australia/Perth">(GMT+08:00) Perth</option>
                    <option value="Australia/Hobart">(GMT+10:00) Hobart</option>
                    <option value="Australia/Darwin">(GMT+09:30) Darwin</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-cyan-50 flex items-center justify-center pointer-events-none shadow-sm transition-all group-hover:bg-cyan-100">
                    <ChevronDown className="h-3.5 w-3.5 text-cyan-600 group-hover:text-cyan-700" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold tracking-wide uppercase text-[#111827]">
                  Currency
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={data.currency}
                    readOnly
                    className="h-11 w-full rounded-md bg-[#f1f5fb] px-4 text-[14px] text-slate-700 outline-none border border-slate-100"
                  />
                  <Search
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Validation Message & Action Buttons */}
        <div className="mt-12 space-y-4">
          {!requiredReady ? (
            <div className="max-w-[550px] rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-[12px] font-semibold text-rose-700">
              Required: Business Type, Name, Phone, Email, ABN, State, Street Address, Suburb, and Postcode.
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-[#111827] transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!requiredReady}
              className="h-11 px-8 rounded-full bg-[#07142a] text-white text-[13px] font-semibold shadow-xl shadow-black/20 hover:bg-[#0c1b3d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-disabled={!requiredReady}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
