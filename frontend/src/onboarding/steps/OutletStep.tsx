import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Store,
  Utensils,
  ShoppingBag,
  Truck,
  MapPin,
  Loader2,
  ShieldAlert,
  Grid,
  Car,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";

interface OutletStepProps {
  onBack: () => void;
  onNext: () => void;
  businessProfile: any;
}

interface OutletData {
  id: string;
  outletNumber: string;
  name: string;
  slug: string | null;
  phone: string | null;
  contactEmail: string | null;
  abn: string | null;
  logoUrl: string | null;
  streetAddress: string | null;
  suburb: string | null;
  state: string;
  postcode: string | null;
  isPrimary: boolean;
  serviceModels: string[];
}

const SERVICE_MODEL_OPTIONS = [
  { id: "DINE_IN", label: "Dine-In", icon: Utensils, desc: "Table-service dining" },
  { id: "IN_STORE", label: "In-Store", icon: Store, desc: "Counter service checkout" },
  { id: "TAKEAWAY", label: "Takeaway", icon: ShoppingBag, desc: "Quick packaging to go" },
  { id: "DELIVERY", label: "Delivery", icon: Truck, desc: "Driver route planning" },
  { id: "PICKUP", label: "Pickup", icon: Grid, desc: "Curbside or counter collection" },
  { id: "DRIVE_THROUGH", label: "Drive-Thru", icon: Car, desc: "Quick vehicle ordering" },
  { id: "QR_ORDERING", label: "QR Order", icon: QrCode, desc: "Self-serve tableside QR" },
];

export function OutletStep({ onBack, onNext, businessProfile }: OutletStepProps) {
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fields for adding a new outlet modal/form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOutletNumber, setNewOutletNumber] = useState("");
  const [newOutletName, setNewOutletName] = useState("");
  const [useBusinessDetails, setUseBusinessDetails] = useState(true);

  // Address lookup suggestions for adding new outlets
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchTimeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom details for new outlets
  const [customPhone, setCustomPhone] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customAbn, setCustomAbn] = useState("");
  const [customStreet, setCustomStreet] = useState("");
  const [customSuburb, setCustomSuburb] = useState("");
  const [customState, setCustomState] = useState("NSW");
  const [customPostcode, setCustomPostcode] = useState("");

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId) || null;

  const fetchOutlets = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<OutletData[]>("/outlets");
      setOutlets(response.data);
      if (response.data.length > 0) {
        setSelectedOutletId(response.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load outlets", err);
      setError("Failed to retrieve configured outlets. Please check server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOutlets();
  }, []);

  const handleToggleServiceModel = async (modelId: string) => {
    if (!activeOutlet) return;

    let nextModels = [...activeOutlet.serviceModels];
    if (nextModels.includes(modelId)) {
      // Keep at least one active service model
      if (nextModels.length <= 1) {
        return;
      }
      nextModels = nextModels.filter((m) => m !== modelId);
    } else {
      nextModels.push(modelId);
    }

    // Optimistically update UI
    setOutlets((prev) =>
      prev.map((o) =>
        o.id === activeOutlet.id ? { ...o, serviceModels: nextModels } : o
      )
    );

    try {
      await api.patch(`/outlets/${activeOutlet.id}/service-models`, {
        serviceModels: nextModels,
      });
    } catch (err) {
      console.error("Failed to update service models", err);
      // Revert optimism on error
      void fetchOutlets();
    }
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletNumber.trim() || !newOutletName.trim()) {
      setError("Please fill out all mandatory fields.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      outletNumber: newOutletNumber.trim(),
      name: newOutletName.trim(),
      phone: useBusinessDetails ? businessProfile.phone : customPhone,
      contactEmail: useBusinessDetails ? businessProfile.contactEmail : customEmail,
      abn: useBusinessDetails ? businessProfile.abn : customAbn,
      streetAddress: useBusinessDetails ? businessProfile.streetAddress : customStreet,
      suburb: useBusinessDetails ? businessProfile.suburb : customSuburb,
      state: useBusinessDetails ? businessProfile.state : customState,
      postcode: useBusinessDetails ? businessProfile.postcode : customPostcode,
      serviceModels: ["DINE_IN"],
    };

    try {
      const res = await api.post<OutletData>("/outlets", payload);
      setOutlets((prev) => [...prev, res.data]);
      setSelectedOutletId(res.data.id);
      setShowAddForm(false);
      // Reset form fields
      setNewOutletNumber("");
      setNewOutletName("");
      setCustomPhone("");
      setCustomEmail("");
      setCustomAbn("");
      setCustomStreet("");
      setCustomSuburb("");
      setCustomState("NSW");
      setCustomPostcode("");
    } catch (err: any) {
      console.error("Failed to create outlet", err);
      setError(err?.response?.data?.message || "Failed to create outlet. Duplicate number?");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOutlet = async (id: string) => {
    const toDelete = outlets.find((o) => o.id === id);
    if (!toDelete) return;

    if (toDelete.isPrimary) {
      setError("Primary outlet cannot be deleted.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${toDelete.name}?`)) {
      return;
    }

    try {
      await api.delete(`/outlets/${id}`);
      setOutlets((prev) => prev.filter((o) => o.id !== id));
      if (selectedOutletId === id) {
        const remaining = outlets.filter((o) => o.id !== id);
        if (remaining.length > 0) {
          setSelectedOutletId(remaining[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete outlet", err);
      setError("Failed to delete outlet.");
    }
  };

  // Address Autocomplete for custom outlet addresses
  const fetchAddressSuggestions = (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchQuery = customState 
          ? `${query}, ${customState}, Australia` 
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
        console.error("Address suggestions error", err);
      }
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setCustomStreet(suggestion.streetAddress);
    setCustomSuburb(suggestion.suburb || customSuburb);
    setCustomPostcode(suggestion.postcode || customPostcode);
    setSuggestions([]);
  };

  if (loading) {
    return (
      <div className="flex h-[350px] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-[#0c1424]" size={32} />
        <p className="text-slate-500 font-medium">Fetching outlet settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step Heading */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-teal-600">
          Step 2 of 6: Outlets & Service Models
        </span>
        <h1 className="text-2xl font-black text-[#0c1424]">
          Configure your POS outlets
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Define your operating locations and active order channels. We've auto-created your first outlet with the business parameters from step 1!
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center gap-3">
          <ShieldAlert size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Main Outlet Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Outlets List Sidebar (Left Column) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-[#0c1424] uppercase tracking-wider">
              YOUR OUTLETS ({outlets.length})
            </h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-all"
              >
                <Plus size={14} /> Add Outlet
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
            {outlets.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  if (!showAddForm) {
                    setSelectedOutletId(o.id);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex items-center justify-between ${
                  selectedOutletId === o.id && !showAddForm
                    ? "bg-[#0c1424] text-white border-[#0c1424] shadow-lg shadow-black/20"
                    : "bg-white text-slate-800 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                        selectedOutletId === o.id && !showAddForm
                          ? "bg-white/15 text-[#5dc7ec]"
                          : "bg-slate-100 text-[#0c1424]"
                      }`}
                    >
                      #{o.outletNumber}
                    </span>
                    <span className="font-bold text-sm truncate max-w-[120px]">
                      {o.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs truncate max-w-[180px] ${
                      selectedOutletId === o.id && !showAddForm
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {o.streetAddress ? `${o.streetAddress}, ${o.suburb}` : "Incomplete address"}
                  </span>
                </div>

                {!o.isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteOutlet(o.id);
                    }}
                    className={`p-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition-colors ${
                      selectedOutletId === o.id && !showAddForm
                        ? "text-slate-400 group-hover:block lg:hidden"
                        : "text-slate-400 group-hover:block lg:hidden"
                    }`}
                    title="Delete Outlet"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {o.isPrimary && (
                  <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500">
                    PRIMARY
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Context Panel (Right Column) */}
        <div className="col-span-1 lg:col-span-8">
          
          {/* Add New Outlet Form */}
          {showAddForm ? (
            <form onSubmit={void handleCreateOutlet} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-black/5 flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-black text-lg text-[#0c1424]">Add New Outlet Profile</h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Outlet Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 02"
                    value={newOutletNumber}
                    onChange={(e) => setNewOutletNumber(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-100 shadow-inner bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0c1424] text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Outlet Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Darling Harbour Branch"
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-100 shadow-inner bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0c1424] text-sm"
                  />
                </div>
              </div>

              {/* Inheritance Toggle Switch */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100/50 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-black text-teal-800">Use main business parameters</span>
                  <span className="text-[11px] text-teal-600">Inherit ABN, contacts, and state address details</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseBusinessDetails(!useBusinessDetails)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                    useBusinessDetails ? "bg-teal-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                </button>
              </div>

              {!useBusinessDetails && (
                <div className="flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">ABN Override</label>
                      <input
                        type="text"
                        placeholder="11-digit ABN"
                        value={customAbn}
                        onChange={(e) => setCustomAbn(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-100 text-xs focus:ring-2 focus:ring-[#0c1424]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">Phone Override</label>
                      <input
                        type="text"
                        placeholder="Outlet phone"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-100 text-xs focus:ring-2 focus:ring-[#0c1424]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">Email Override</label>
                      <input
                        type="email"
                        placeholder="Outlet contact email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-100 text-xs focus:ring-2 focus:ring-[#0c1424]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">State</label>
                      <select
                        value={customState}
                        onChange={(e) => setCustomState(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-100 text-xs focus:ring-2 focus:ring-[#0c1424]"
                      >
                        {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-9 flex flex-col gap-1.5 relative" ref={containerRef}>
                      <label className="text-xs font-semibold text-slate-600">Street Address</label>
                      <input
                        type="text"
                        placeholder="Start typing street address..."
                        value={customStreet}
                        onChange={(e) => {
                          setCustomStreet(e.target.value);
                          fetchAddressSuggestions(e.target.value);
                        }}
                        className="h-10 px-3 rounded-lg border border-slate-100 text-xs focus:ring-2 focus:ring-[#0c1424]"
                      />
                      {suggestions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 bg-white border border-slate-100 shadow-xl rounded-xl mt-1 max-h-[180px] overflow-y-auto">
                          {suggestions.map((s, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectSuggestion(s)}
                              className="p-3 text-xs border-b border-slate-50 hover:bg-slate-50 cursor-pointer text-[#0c1424]"
                            >
                              {s.displayName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">Suburb</label>
                      <input
                        type="text"
                        placeholder="Suburb name"
                        value={customSuburb}
                        onChange={(e) => setCustomSuburb(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-100 text-xs focus:ring-2 focus:ring-[#0c1424]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600">Postcode</label>
                      <input
                        type="text"
                        placeholder="Postcode"
                        value={customPostcode}
                        onChange={(e) => setCustomPostcode(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-100 text-xs focus:ring-2 focus:ring-[#0c1424]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all text-sm disabled:opacity-50 shadow-lg shadow-teal-600/10"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Creating Outlet...
                  </>
                ) : (
                  "Create Outlet Profile"
                )}
              </button>
            </form>
          ) : (
            /* Configure Selected Outlet (Service Models & Info Card) */
            <div className="flex flex-col gap-6">
              
              {/* Outlet Info Summary Card */}
              {activeOutlet && (
                <div className="p-5 rounded-2xl bg-[#0c1424]/5 border border-[#0c1424]/5 flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[#0c1424] text-[#5dc7ec] flex items-center justify-center shadow-lg shadow-black/10">
                    <Store size={22} />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0c1424]">{activeOutlet.name}</span>
                      {activeOutlet.isPrimary && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-600 font-bold uppercase">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {activeOutlet.streetAddress || "No Address override"}, {activeOutlet.suburb || ""}, {activeOutlet.state}
                      </span>
                      <span>•</span>
                      <span>ABN: {activeOutlet.abn || businessProfile.abn || "Inherited"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Models Selections */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-sm text-[#0c1424] uppercase tracking-wider">
                    ACTIVE SERVICE MODELS
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    Configure operational flows for {activeOutlet?.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SERVICE_MODEL_OPTIONS.map((option) => {
                    const isChecked = activeOutlet?.serviceModels.includes(option.id) || false;
                    const Icon = option.icon;

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleToggleServiceModel(option.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                          isChecked
                            ? "bg-white border-teal-500 shadow-md ring-2 ring-teal-500/5"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-teal-50 text-teal-600"
                              : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col gap-0.5 pr-6">
                          <span className={`font-bold text-sm ${isChecked ? "text-teal-900" : "text-slate-800"}`}>
                            {option.label}
                          </span>
                          <span className="text-xs text-slate-400 leading-relaxed">
                            {option.desc}
                          </span>
                        </div>

                        {isChecked && (
                          <div className="absolute top-4 right-4 text-teal-600 animate-in zoom-in-50 duration-200">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          onClick={onNext}
          disabled={outlets.length === 0 || showAddForm}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#0c1424] text-white hover:bg-slate-800 transition-all font-bold text-sm disabled:opacity-50"
        >
          Next Step <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
