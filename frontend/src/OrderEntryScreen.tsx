import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Send,
  ShoppingBag,
  X,
  Eye,
  Printer,
  Search,
} from "lucide-react";
import CustomerModal from "./components/CustomerModal";
import LoyaltyModal from "./components/LoyaltyModal";
import CustomerDetailsForm from "./components/CustomerDetailsForm";
import POSModifierModal from "./components/POSModifierModal";
import POSComboBuilderModal from "./components/POSComboBuilderModal";
import { useAuth } from "./context/AuthContext";
import { usePosCart } from "./context/PosCartContext";
import { FRONTEND_PERMISSIONS } from "./permissions";
import api from "./services/api";
import { ALLOWED_SERVICE_MODELS, type ServiceModel } from "./serviceModels";
import { formatDuration } from "./utils/dateUtils";

import POSTablesScreen from "./POSTablesScreen";
import { LiveOrdersPanel } from "./components/LiveOrdersPanel";

interface CustomerData {
  name: string;
  id: string;
  phone: string;
  loyaltyPoints: number;
}

type PosOrderType = ServiceModel;

const getOrderTypeLabel = (value: PosOrderType) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char: string) => char.toUpperCase());

const getCustomOrderTypeLabel = (value: PosOrderType) => {
  if (value === "DINE_IN") return "Dine-In";
  if (value === "IN_STORE") return "In-Store";
  if (value === "DELIVERY") return "Delivery";
  if (value === "PICKUP") return "Pickup";
  return getOrderTypeLabel(value);
};
const isPosOrderType = (value: string): value is PosOrderType =>
  ALLOWED_SERVICE_MODELS.includes(value as PosOrderType);

const normalizeSellableItem = (item: any) => {
  if (!item) return null;
  const id = item.id || item._id || "";
  const name = item.name || "Unknown Item";
  
  // Normalize Price
  let price = 0;
  if (typeof item.price === "number") {
    price = item.price;
  } else if (typeof item.priceInCents === "number") {
    price = item.priceInCents / 100;
  } else if (typeof item.basePrice === "number") {
    price = item.basePrice;
  } else if (item.price) {
    price = Number(item.price);
  } else if (item.priceInCents) {
    price = Number(item.priceInCents) / 100;
  } else if (item.basePrice) {
    price = Number(item.basePrice);
  }

  // Normalize Image
  const image = item.image || item.imageUrl || null;

  return {
    ...item,
    id,
    name,
    price,
    image,
    isDeal: !!(item.isDeal || item.isCombo || (item.groups && item.groups.length > 0)),
    variationGroups: Array.isArray(item.variationGroups) ? item.variationGroups : [],
    addonGroups: Array.isArray(item.addonGroups) ? item.addonGroups : [],
    groups: Array.isArray(item.groups) ? item.groups : [],
  };
};

export default function OrderEntryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const billId = searchParams.get("billId") || "";
  const tableId = searchParams.get("tableId") || "";

  const {
    categories,
    menuItems,
    billItems,
    billTotal,
    addItemToBill,
    removeItem,
    updateQuantity,
    sendToKitchen,
    isLoading,
    error,
    loadMenuItems,
    loadBill,
    activeBill,
    createBillSession,
    clearBill,
    updateBillDetails,
    activeSubView,
    setActiveSubView,
    restaurant,
    userHasSelectedServiceModel,
    setUserHasSelectedServiceModel,
  } = usePosCart();

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [modifierItem, setModifierItem] = useState<any>(null);
  const [comboDeal, setComboDeal] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "PAY" | "KITCHEN";
    shouldCheckout?: boolean;
  } | null>(null);
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const [enabledServiceModels, setEnabledServiceModels] = useState<
    PosOrderType[]
  >([...ALLOWED_SERVICE_MODELS]);

  const [selectedServiceModel, setSelectedServiceModel] = useState<PosOrderType>(() => {
    const cached = localStorage.getItem("selectedServiceModel");
    if (cached && ALLOWED_SERVICE_MODELS.includes(cached as PosOrderType)) {
      return cached as PosOrderType;
    }
    return "DINE_IN";
  });


  const effectiveOrderType =
    activeBill?.orderType && ALLOWED_SERVICE_MODELS.includes(activeBill.orderType as any)
      ? (activeBill.orderType as PosOrderType)
      : selectedServiceModel;

  useEffect(() => {
    if (userHasSelectedServiceModel) return;
    if (enabledServiceModels.length > 0) {
      const cached = localStorage.getItem("selectedServiceModel");
      if (cached && enabledServiceModels.includes(cached as PosOrderType)) {
        setSelectedServiceModel(cached as PosOrderType);
      } else if (!enabledServiceModels.includes(selectedServiceModel)) {
        setSelectedServiceModel(enabledServiceModels[0]);
      }
    }
  }, [enabledServiceModels, userHasSelectedServiceModel]);

  useEffect(() => {
    if (activeBill?.orderType && ALLOWED_SERVICE_MODELS.includes(activeBill.orderType as any)) {
      setSelectedServiceModel(activeBill.orderType as PosOrderType);
      localStorage.setItem("selectedServiceModel", activeBill.orderType);
    }
  }, [activeBill]);

  const [showTableSelection, setShowTableSelection] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [tableGroups, setTableGroups] = useState<any[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [tableConfirmDialog, setTableConfirmDialog] = useState<any | null>(null);

  const loadTables = async () => {
    try {
      setTablesLoading(true);
      const res = await api.get("/tables/groups");
      const fetchedGroups = res.data || [];
      setTableGroups(fetchedGroups);
      
      const flatTables = fetchedGroups.reduce((acc: any[], g: any) => {
        const mapped = (g.tables || []).map((t: any) => ({
          ...t,
          floor: g.name, // compatibility floor mapping
        }));
        return [...acc, ...mapped];
      }, []);
      setTables(flatTables);
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    if (showTableSelection) {
      void loadTables();
      const dataInterval = setInterval(() => void loadTables(), 5000);
      
      // Timer sync: force re-render every second for table clocks
      const clockInterval = setInterval(() => {
        setTableGroups((prev) => [...prev]);
      }, 1000);

      return () => {
        clearInterval(dataInterval);
        clearInterval(clockInterval);
      };
    }
  }, [showTableSelection]);

  const getRunningTime = (startedAt?: string) => {
    if (!startedAt) return "";
    const start = new Date(startedAt).getTime();
    const elapsedMs = Date.now() - start;
    return formatDuration(elapsedMs, 'ms');
  };

  const handleTableClick = async (table: any) => {
    const isOccupied =
      table.status === "OCCUPIED" ||
      table.status === "BILLING" ||
      table.status === "KOT_SENT" ||
      table.status === "PREPARING";

    if (isOccupied) {
      setTableConfirmDialog(table);
    } else {
      try {
        setSelectedTable(table);
        setShowTableSelection(false);
        await createBillSession("DINE_IN", {
          tableId: table.id,
          customer: null,
        });
        showToast(`Selected Table ${table.name}`);
      } catch (err) {
        console.error("Failed to select table:", err);
        showToast("Failed to assign table. Please try again.");
      }
    }
  };

  const handleConfirmContinueOrder = async () => {
    if (!tableConfirmDialog) return;
    const table = tableConfirmDialog;
    setTableConfirmDialog(null);
    try {
      const activeId = table.activeBillId || table.currentOrderId;
      if (activeId) {
        const bill = await loadBill(activeId);
        if (bill && (bill.status === "PAID" || bill.status === "CLOSED" || bill.status === "VOIDED" || bill.status === "CANCELLED")) {
          // If paid/closed/voided/cancelled, do not resume.
          clearBill();
          showToast("Active order has already been settled.");
          return;
        }
        setSelectedTable(table);
        setShowTableSelection(false);
        showToast(`Resumed Order for Table ${table.name}`);
      } else {
        setSelectedTable(table);
        setShowTableSelection(false);
        await createBillSession("DINE_IN", {
          tableId: table.id,
          customer: null,
        });
        showToast(`Selected Table ${table.name}`);
      }
    } catch (err) {
      console.error("Failed to resume table order:", err);
      showToast("Failed to resume order.");
    }
  };

  const handleEyeIconClick = async (e: React.MouseEvent, table: any) => {
    e.stopPropagation();
    try {
      const activeId = table.activeBillId || table.currentOrderId;
      if (activeId) {
        const bill = await loadBill(activeId);
        if (bill && (bill.status === "PAID" || bill.status === "CLOSED" || bill.status === "VOIDED" || bill.status === "CANCELLED")) {
          clearBill();
          showToast("Active order has already been settled.");
          return;
        }
        setSelectedTable(table);
        setShowTableSelection(false);
        showToast(`Resumed Order for Table ${table.name}`);
      } else {
        showToast("No active order found to preview.");
      }
    } catch (err) {
      console.error("Failed to preview table order:", err);
      showToast("Failed to preview order.");
    }
  };

  // Reset selectedTable when activeBill is cleared (e.g., on clicking + NEW ORDER or checkout complete)
  useEffect(() => {
    if (!activeBill) {
      setSelectedTable(null);
    }
  }, [activeBill]);

  // Synchronize table selection state when bill or route updates
  useEffect(() => {
    if (activeBill) {
      if (activeBill.orderType === "DINE_IN") {
        if (activeBill.tableId) {
          if (!selectedTable || selectedTable.id !== activeBill.tableId) {
            setSelectedTable({
              id: activeBill.tableId,
              name: activeBill.tableNumber || `Table ${activeBill.tableNumber}`,
            });
          }
          setShowTableSelection(false);
        } else {
          setShowTableSelection(true);
          setSelectedTable(null);
        }
      } else {
        setShowTableSelection(false);
        setSelectedTable(null);
      }
    } else {
      if (effectiveOrderType === "DINE_IN" && !tableId && !billId) {
        if (selectedTable) {
          setShowTableSelection(false);
        } else {
          setShowTableSelection(true);
        }
      } else {
        setShowTableSelection(false);
        setSelectedTable(null);
      }
    }
  }, [activeBill, effectiveOrderType, tableId, billId, selectedTable]);

  const getTableStatusStyles = (table: any) => {
    const isSelected = activeBill?.tableId === table.id;
    const status = table.status || "AVAILABLE";

    let borderClass = "border-dashed border-slate-300 hover:border-slate-400";
    let bgClass = "bg-[#f3f4f6]/50 hover:bg-[#e5e7eb]/50";
    let textClass = "text-slate-600";
    let dotClass = "bg-slate-400";
    let stateLabel = "Blank Table";

    if (status === "AVAILABLE") {
      borderClass = "border-dashed border-slate-300 hover:border-slate-400";
      bgClass = "bg-[#f3f4f6]/50 hover:bg-[#e5e7eb]/50";
      textClass = "text-slate-600";
      dotClass = "bg-slate-400";
      stateLabel = "Blank Table";
    } else if (status === "OCCUPIED" || status === "KOT_SENT" || status === "PREPARING") {
      // Running Table
      borderClass = "border-yellow-200 hover:border-yellow-300";
      bgClass = "bg-[#fef9c3] hover:bg-[#fef08a]/60";
      textClass = "text-yellow-800";
      dotClass = "bg-yellow-500";
      stateLabel = "Running Table";
    } else if (status === "BILLING" || status === "PAID") {
      // Printed / Billing Table
      borderClass = "border-sky-200 hover:border-sky-300";
      bgClass = "bg-[#e0f2fe] hover:bg-[#bae6fd]/60";
      textClass = "text-sky-800";
      dotClass = "bg-sky-500";
      stateLabel = "Printed Table";
    }

    if (isSelected) {
      borderClass = "border-blue-500 ring-2 ring-blue-500/30";
    }

    return { borderClass, bgClass, textClass, dotClass, stateLabel, isSelected };
  };

  const canSendToKitchen = hasPermission(FRONTEND_PERMISSIONS.KITCHEN_SEND);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
      return;
    }

    if (
      selectedCategoryId &&
      !categories.some((category) => category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(categories[0]?.id || "");
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    const loadRestaurantServiceModels = async () => {
      try {
        const response = await api.get("/restaurant");
        const models = Array.isArray(response.data?.serviceModels)
          ? response.data.serviceModels.filter(
              (value: string): value is PosOrderType => isPosOrderType(value),
            )
          : [];

        setEnabledServiceModels(models.length > 0 ? models : ["DINE_IN"]);
      } catch {
        setEnabledServiceModels([...ALLOWED_SERVICE_MODELS]);
      }
    };

    void loadRestaurantServiceModels();
  }, []);



  const activeRules = useMemo(() => {
    const rules = restaurant?.serviceModelRules?.[effectiveOrderType];
    if (rules) {
      return {
        collectCustomerDetails: !!rules.collectCustomerDetails,
        requiredFields: Array.isArray(rules.requiredFields) ? rules.requiredFields : [],
        paymentRequiredBeforeKOT: !!rules.paymentRequiredBeforeKOT,
        allowSaveAndSendKOT: rules.allowSaveAndSendKOT !== false,
      };
    }
    return {
      collectCustomerDetails: effectiveOrderType === "DELIVERY" || effectiveOrderType === "PICKUP",
      requiredFields: effectiveOrderType === "DELIVERY"
        ? ["name", "phone", "address"]
        : effectiveOrderType === "PICKUP"
          ? ["name", "phone"]
          : [],
      paymentRequiredBeforeKOT: effectiveOrderType === "IN_STORE" || effectiveOrderType === "DELIVERY" || effectiveOrderType === "PICKUP",
      allowSaveAndSendKOT: true,
    };
  }, [restaurant, effectiveOrderType]);

  const activeBillRef = useRef(activeBill);
  useEffect(() => {
    activeBillRef.current = activeBill;
  }, [activeBill]);

  useEffect(() => {
    if (billId) {
      if (activeBill?.id !== billId) {
        void loadBill(billId);
      }
      setActiveSubView("menu");
    }
  }, [billId, activeBill, loadBill]);

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );
  const visibleItems = useMemo(() => {
    let items = menuItems;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.shortcode && item.shortcode.toLowerCase().includes(q))
      );
    } else if (selectedCategoryId) {
      items = items.filter((item) => item.categoryId === selectedCategoryId);
    }
    return items;
  }, [menuItems, selectedCategoryId, searchQuery]);

  const filteredTables = useMemo(() => {
    return tables;
  }, [tables]);

  const subtotal = activeBill ? activeBill.subtotalAmount : billTotal;
  const taxAmount = activeBill ? activeBill.taxAmount : 0;
  const totalDue = Math.max(0, (activeBill ? activeBill.totalAmount : billTotal) - loyaltyDiscount);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(value);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3500);
  };

  const handleRetryLoad = async () => {
    await loadMenuItems();
  };

  const handleCustomerSelect = (c: CustomerData) => {
    setCustomer(c);
    setShowCustomerModal(false);

    if (c.loyaltyPoints > 0) {
      setShowLoyaltyModal(true);
    }
  };

  const handleApplyDiscount = (amount: number, pointsUsed: number) => {
    setLoyaltyDiscount(amount);
    setLoyaltyPointsUsed(pointsUsed);
    setShowLoyaltyModal(false);
  };

  const handleSkipLoyalty = () => {
    setLoyaltyPointsUsed(0);
    setShowLoyaltyModal(false);
  };

  // Resume pending actions after customer data update
  useEffect(() => {
    if (pendingAction && !showCustomerForm && isCustomerDataComplete()) {
      if (pendingAction.type === "PAY") {
        setPendingAction(null);
        handlePay();
      } else if (pendingAction.type === "KITCHEN") {
        const shouldCheckout = pendingAction.shouldCheckout ?? false;
        setPendingAction(null);
        handleSendToKitchen(shouldCheckout);
      }
    }
  }, [activeBill, pendingAction, showCustomerForm]);

  const isCustomerDataComplete = () => {
    if (!activeRules.collectCustomerDetails) {
      return true;
    }

    const bill = activeBillRef.current;
    const required = activeRules.requiredFields || [];

    const hasName = bill?.customerName || bill?.pickupName || bill?.deliveryName || customer?.name;
    const hasPhone = bill?.customerPhone || bill?.pickupPhone || bill?.deliveryPhone || customer?.phone;
    const hasAddress = bill?.deliveryAddress;

    if (required.includes("name") && !hasName) return false;
    if (required.includes("phone") && !hasPhone) return false;
    if (required.includes("address") && !hasAddress) return false;

    return true;
  };

  const handleServiceModelSwitch = async (model: PosOrderType) => {
    if (model === selectedServiceModel && (model !== "DINE_IN" || !showTableSelection)) return;

    if (billItems.length > 0) {
      const confirmSwitch = window.confirm(
        "Changing the service model may clear table selection or affect customer rules. Do you want to continue?"
      );
      if (!confirmSwitch) return;
    }

    setSelectedServiceModel(model);
    localStorage.setItem("selectedServiceModel", model);

    try {
      if (model === "DINE_IN") {
        setShowTableSelection(true);
        clearBill();
        navigate("/pos");
      } else {
        setShowTableSelection(false);
        if (activeBill) {
          await updateBillDetails({ orderType: model, tableId: null, tableNumber: null });
        } else {
          await createBillSession(model, { tableId: null, customer: null });
        }
      }
    } catch (err) {
      console.error("Failed to update orderType:", err);
    }
  };

  const handleCustomerFormSubmit = async (data: any) => {
    try {
      await updateBillDetails({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        pickupName:
          effectiveOrderType === "PICKUP" ? data.customerName : undefined,
        pickupPhone:
          effectiveOrderType === "PICKUP" ? data.customerPhone : undefined,
        deliveryName:
          effectiveOrderType === "DELIVERY" ? data.customerName : undefined,
        deliveryPhone:
          effectiveOrderType === "DELIVERY" ? data.customerPhone : undefined,
        deliveryAddress:
          effectiveOrderType === "DELIVERY" ? data.customerAddress : undefined,
        paymentType:
          effectiveOrderType === "DELIVERY" ? data.paymentType : undefined,
      });
      setShowCustomerForm(false);

      // Show success feedback AFTER modal starts closing to avoid blur overlap
      setTimeout(() => {
        showToast("Customer details added successfully");
      }, 100);

      // Auto-resume is handled by useEffect to avoid stale closures
    } catch (err: any) {
      showToast(err.message || "Failed to update details");
    }
  };

  const handleItemClick = async (item: any) => {
    if (!item.isActive) {
      return;
    }

    let currentBill = activeBill;
    if (!currentBill) {
      try {
        currentBill = await createBillSession(selectedServiceModel, {
          tableId: selectedTable?.id || null,
          customer: selectedTable?.name || null,
        });
      } catch (err: any) {
        console.error("Failed to start session on item click:", err);
        showToast("Failed to initialize order session");
        return;
      }
    }

    // 1. Intercept Combo Deals
    if (item.isDeal) {
      setComboDeal(item);
      return;
    }

    // 2. Intercept Variations or Addons
    const hasVars = Array.isArray(item.variationGroups) && item.variationGroups.length > 0;
    const hasAddons = Array.isArray(item.addonGroups) && item.addonGroups.length > 0;
    if (hasVars || hasAddons) {
      setModifierItem(item);
      return;
    }

    // 3. Otherwise add directly to order
    const added = await addItemToBill(item, undefined, undefined, currentBill.id);
    if (!added) {
      showToast("Unable to add item to this bill");
      return;
    }

    showToast(`${item.name} added`);
  };

  const handleSendToKitchen = async (shouldNavigateToCheckout = true) => {
    if (billItems.length === 0 || isSendingToKitchen) {
      return;
    }

    if (!isCustomerDataComplete()) {
      setPendingAction({
        type: "KITCHEN",
        shouldCheckout: shouldNavigateToCheckout,
      });
      setShowCustomerForm(true);
      showToast("Please complete customer details first");
      return;
    }

    // Strict Rule: Require payment before sending to kitchen if configured
    if (activeRules.paymentRequiredBeforeKOT && !shouldNavigateToCheckout) {
      showToast(`${getOrderTypeLabel(effectiveOrderType)} orders require payment before sending to kitchen`);
      return;
    }

    try {
      setIsSendingToKitchen(true);
      const result = await sendToKitchen();
      if (result.success) {
        showToast("Order saved and sent to kitchen");
        if (shouldNavigateToCheckout) {
          navigate(`/checkout?billId=${result.billId || activeBill?.id || ""}`);
        } else {
          clearBill();
          setActiveSubView("live-orders");
        }
      } else {
        showToast(result.error || "Failed to send to kitchen");
      }
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  const handlePay = () => {
    // Re-check using latest ref data
    if (!isCustomerDataComplete()) {
      setPendingAction({ type: "PAY" });
      setShowCustomerForm(true);
      showToast("Please complete customer details first");
      return;
    }

    navigate("/checkout", {
      state: {
        billId: activeBill?.id,
        billItems,
        billTotal: subtotal,
        loyaltyDiscount,
        loyaltyPointsUsed,
        customer,
        taxAmount,
        totalDue,
        orderType: effectiveOrderType,
        tableDetail: activeBill?.tableNumber ? `Table ${activeBill.tableNumber}` : "",
      },
    });
  };



  if (activeSubView === "live-orders") {
    return <LiveOrdersPanel />;
  }

  if (activeSubView === "kot-board") {
    return <LiveOrdersPanel initialSubTab="kot" />;
  }
  if (activeSubView === "tables") {
    return <POSTablesScreen />;
  }

  return (
    <div className="flex h-full flex-col bg-[#f8fafc] text-[#0c1424]">
      <main className="flex min-h-0 flex-1 gap-4 overflow-hidden pt-1 px-4 pb-4">
        
        {/* ========================================================
            COLUMN 1: Category Sidebar (Left side, fixed width 220px)
            ======================================================== */}
        {!(effectiveOrderType === "DINE_IN" && showTableSelection) && (
          <aside className="custom-scrollbar min-h-0 w-[140px] lg:w-[180px] xl:w-[220px] shrink-0 overflow-y-auto rounded-[24px] border border-slate-100 bg-white p-3 xl:p-4 shadow-sm flex flex-col transition-all">
            <h3 className="mb-3 px-1 text-[10px] xl:text-xs font-black uppercase tracking-wider text-slate-400">
              Categories
            </h3>
            
            {isLoading ? (
              <div className="flex flex-col gap-2 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="h-[50px] w-full rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-400 text-center">
                No categories
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`flex h-[50px] w-full items-center gap-3 rounded-xl px-3 transition-all border ${
                      selectedCategoryId === category.id
                        ? "border-[#0c1424] bg-[#0c1424] text-white shadow-md shadow-black/10"
                        : "border-slate-50 bg-slate-50/30 text-slate-700 hover:bg-slate-100/50"
                    }`}
                  >
                    {/* Small category color indicator dot */}
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-inner"
                      style={{ backgroundColor: category.color || "#e2e8f0" }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[10px] xl:text-[12px] font-black uppercase tracking-wide break-words whitespace-normal leading-tight">
                        {category.name}
                      </div>
                      <div className={`text-[9px] xl:text-[10px] font-bold mt-1.5 leading-none ${
                        selectedCategoryId === category.id ? "text-[#5dc7ec]" : "text-slate-400"
                      }`}>
                        {category.items.length} items
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* ========================================================
            COLUMN 2: Menu Workspace & Grid (Middle, flexible remaining width)
            ======================================================== */}
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {showTableSelection ? (
            <>
              {/* Petpooja High-Fidelity Table View Header */}
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
                {/* Row 1: Title & Service Type Actions */}
                <div className="flex items-center justify-between">
                  <h3 className="text-[20px] font-[1000] tracking-tight text-slate-800 leading-none">
                    Table View
                  </h3>
                  
                  {/* Delivery & Pick Up Triggers & Add Table */}
                  <div className="flex items-center gap-2">
                    {enabledServiceModels.includes("IN_STORE") && (
                      <button
                        type="button"
                        onClick={() => {
                          clearBill();
                          setSelectedServiceModel("IN_STORE");
                          setUserHasSelectedServiceModel(true);
                          setShowTableSelection(false);
                          showToast("Started In-Store Order");
                        }}
                        className="h-9 px-5 rounded-lg bg-[#0c1424] text-white hover:bg-[#142038] font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-sm shadow-black/10 cursor-pointer"
                      >
                        In-Store
                      </button>
                    )}
                    {enabledServiceModels.includes("DELIVERY") && (
                      <button
                        type="button"
                        onClick={() => {
                          clearBill();
                          setSelectedServiceModel("DELIVERY");
                          setUserHasSelectedServiceModel(true);
                          setShowTableSelection(false);
                          showToast("Started Delivery Order");
                        }}
                        className="h-9 px-5 rounded-lg bg-[#0c1424] text-white hover:bg-[#142038] font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-sm shadow-black/10 cursor-pointer"
                      >
                        Delivery
                      </button>
                    )}
                    {enabledServiceModels.includes("PICKUP") && (
                      <button
                        type="button"
                        onClick={() => {
                          clearBill();
                          setSelectedServiceModel("PICKUP");
                          setUserHasSelectedServiceModel(true);
                          setShowTableSelection(false);
                          showToast("Started Pickup Order");
                        }}
                        className="h-9 px-5 rounded-lg bg-[#0c1424] text-white hover:bg-[#142038] font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-sm shadow-black/10 cursor-pointer"
                      >
                        Pick Up
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        showToast("Manage layouts & add tables in Restaurant Settings.");
                      }}
                      className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      + Add Table
                    </button>
                  </div>
                </div>

                {/* Row 2: Subfilters, Move Toggle, and Legend Color indicators */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left Side: Red buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showToast("Table Reservation panel opened")}
                      className="h-8 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      + Table Reservation
                    </button>
                  </div>

                  {/* Middle: Move Switch */}
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full select-none">
                    <div className="w-8 h-4 rounded-full bg-slate-300 relative flex items-center p-0.5 cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-white transition-all shadow-sm"></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                      Move KOT / Items
                    </span>
                  </div>

                  {/* Right Side: Legend of colors */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
                      <span>Blank Table</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#bae6fd] border border-sky-300" />
                      <span>Running Table</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#bbf7d0] border border-green-300" />
                      <span>Printed Table</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffedd5] border border-orange-300" />
                      <span>Paid Table</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fef08a] border border-yellow-300" />
                      <span>Running KOT Table</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grouped Table Sections */}
              <div className="custom-scrollbar flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
                {tablesLoading ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0c1424]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Loading Tables...</span>
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center">
                    <p className="text-sm font-black text-[#0c1424]">No tables found matching filters</p>
                  </div>
                ) : (
                  tableGroups.map((group) => {
                    const sectionTables = group.tables || [];
                    if (sectionTables.length === 0) return null;

                    return (
                      <div key={group.id} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {group.name}
                          </h4>
                          <div className="h-[1px] flex-1 bg-slate-100" />
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5">
                            {sectionTables.length} tables
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {sectionTables.map((table: any) => {
                            const styles = getTableStatusStyles(table);
                            const isTableActive =
                              table.status === "OCCUPIED" ||
                              table.status === "KOT_SENT" ||
                              table.status === "PREPARING" ||
                              table.status === "BILLING";

                            return (
                              <button
                                key={table.id}
                                type="button"
                                onClick={() => void handleTableClick(table)}
                                className={`group relative flex flex-col items-center justify-between p-3.5 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-h-[110px] w-full text-center ${styles.borderClass} ${styles.bgClass} shadow-sm`}
                              >
                                {isTableActive ? (
                                  <div className="flex flex-col items-center justify-between h-full w-full min-h-[85px]">
                                    {/* Top: Running Time Timer */}
                                    <div className="text-[9px] font-black tracking-wider text-slate-500/80 bg-white/50 px-2 py-0.5 rounded-full leading-none">
                                      {table.startedAt ? getRunningTime(table.startedAt) : "Just now"}
                                    </div>

                                    {/* Middle: Big Table Number */}
                                    <div className={`text-sm font-[1000] tracking-tight leading-none my-1 ${styles.textClass}`}>
                                      {table.name}
                                    </div>

                                    {/* Bottom: Active Total */}
                                    <div className="text-[10px] font-extrabold text-slate-800 leading-none">
                                      {table.currentTotal !== undefined && table.currentTotal > 0
                                        ? `₹${(table.currentTotal / 100).toFixed(0)}`
                                        : "₹0"}
                                    </div>

                                    {/* Action button beneath */}
                                    {table.status === "BILLING" || table.status === "PAID" ? (
                                      <div className="h-5 w-5 rounded-md bg-white border border-slate-200/60 flex items-center justify-center text-emerald-600 shadow-sm mt-1.5 shrink-0">
                                        <Printer size={10} strokeWidth={3} />
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => handleEyeIconClick(e, table)}
                                        className="h-5 w-5 rounded-md bg-white border border-slate-200/60 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#0c1424] transition-all shadow-sm mt-1.5 shrink-0 cursor-pointer"
                                        title="Preview active order"
                                      >
                                        <Eye size={10} strokeWidth={2.5} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full w-full min-h-[85px]">
                                    <div className="text-sm font-black text-slate-500">
                                      {table.name}
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm gap-4">
              {/* Menu Header Area */}
              <div className="flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search items by name or shortcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-[#0c1424] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c1424]/20 focus:border-[#0c1424] transition-all shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {error ? (
                    <button
                      type="button"
                      onClick={() => void handleRetryLoad()}
                      className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 shrink-0"
                    >
                      Retry load
                    </button>
                  ) : null}
                </div>
                
                {!searchQuery && (
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-[#0c1424]">
                      {selectedCategory?.name || "Menu Items"}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      {visibleItems.length} items available
                    </p>
                  </div>
                )}
                {searchQuery && (
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-[#0c1424]">
                      Search Results
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      {visibleItems.length} items found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>

              {/* Menu Items Container */}
              {isLoading ? (
                <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 overflow-y-auto pb-4 animate-pulse">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                    <div key={idx} className="h-[180px] rounded-2xl bg-slate-100/70" />
                  ))}
                </div>
              ) : (categories.length === 0 && menuItems.length === 0 && error) ? (
                <div className="flex-1 rounded-[24px] border border-rose-100 bg-rose-50/50 p-6 flex items-center justify-center">
                  <div className="max-w-md text-center">
                    <div className="text-sm font-black uppercase tracking-widest text-rose-600">
                      Menu unavailable
                    </div>
                    <p className="mt-2 text-xs font-bold text-rose-700">{error}</p>
                    <button
                      type="button"
                      onClick={() => void handleRetryLoad()}
                      className="mt-4 rounded-xl bg-[#0c1424] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black"
                    >
                      Reload menu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="custom-scrollbar grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 overflow-y-auto pr-1 pb-4">
                  {visibleItems.length === 0 ? (
                    <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 p-8 lg:p-12 text-center flex flex-col items-center justify-center">
                      <ShoppingBag size={32} className="text-slate-300" />
                      <p className="mt-3 text-sm font-black text-[#0c1424]">
                        No items available in this category.
                      </p>
                    </div>
                  ) : (
                    visibleItems.map((rawItem) => {
                      const item = normalizeSellableItem(rawItem);
                      if (!item) return null;
                      const unavailable = !item.isActive;

                      return (
                        <button
                          key={item.id}
                          onClick={() => void handleItemClick(item)}
                          disabled={unavailable}
                          className={`group relative flex flex-col justify-between h-[180px] p-3 text-left rounded-2xl border transition-all ${
                            unavailable
                              ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60 grayscale"
                              : "border-slate-100 bg-white hover:-translate-y-1 hover:border-[#0c1424] hover:shadow-lg hover:shadow-[#0c1424]/5"
                          }`}
                        >
                          {/* Optional Category Color indicator strip on left */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                            style={{ backgroundColor: item.color || "#e2e8f0" }}
                          />

                          {/* Header metadata & Thumbnail row */}
                          <div className="pl-1.5 flex gap-2 items-start justify-between w-full">
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">
                                {item.categoryName}
                              </span>
                              <h4 className="mt-1 text-[13px] font-black text-[#0c1424] leading-tight line-clamp-2">
                                {item.name}
                              </h4>
                            </div>

                            {/* Highly Compact Thumbnail (64x64px equivalent) */}
                            {item.image ? (
                              <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-14 w-14 rounded-xl bg-slate-50/50 flex items-center justify-center shrink-0 border border-dashed border-slate-200 text-slate-300">
                                <ShoppingBag size={14} />
                              </div>
                            )}
                          </div>

                          {/* Pricing & Add Trigger footer row */}
                          <div className="pl-1.5 flex items-end justify-between w-full mt-2">
                            <div>
                              <div className="text-[14px] font-[900] text-[#0c1424]">
                                {formatCurrency(item.price)}
                              </div>
                              {item.isDeal && (
                                <span className="inline-block mt-1 text-[8px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md uppercase tracking-wider leading-none">
                                  Combo Deal
                                </span>
                              )}
                            </div>
                            {!unavailable && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-50 text-[#0c1424] transition-all group-hover:bg-[#0c1424] group-hover:text-white">
                                <Plus size={14} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ========================================================
            COLUMN 3: Cart Panel (Right side, flexible width)
            ======================================================== */}
        {!(effectiveOrderType === "DINE_IN" && showTableSelection) && (
          <aside className="custom-scrollbar min-h-0 flex w-[280px] lg:w-[320px] xl:w-[380px] shrink-0 flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm transition-all">
          
          {/* Cart Header Section */}
          <div className="border-b border-slate-50 p-4">
            
            {/* Dynamic Active Service Model Display Title & Tag */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-black text-[#0c1424] flex items-center gap-1.5 truncate">
                  {getCustomOrderTypeLabel(effectiveOrderType)}
                  {effectiveOrderType === "DINE_IN" && (activeBill?.tableNumber || selectedTable?.name) ? ` • Table ${activeBill?.tableNumber || selectedTable?.name}` : ""}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {effectiveOrderType === "DINE_IN" && !activeBill?.tableId && !selectedTable ? (
                    <span className="text-[10px] font-black text-rose-500 animate-pulse leading-none">
                      Select a table to begin
                    </span>
                  ) : !activeBill ? (
                    <span className="text-[10px] font-black text-slate-400 leading-none">
                      Order not created yet
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 leading-none">
                      Order #{activeBill.orderNumber?.toString().padStart(3, "0") || "---"}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Pill Badge */}
              <div
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${
                  activeBill?.status === "READY"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : activeBill?.status === "PREPARING"
                      ? "border-orange-100 bg-orange-50 text-orange-600"
                      : activeBill?.status === "KOT_SENT"
                        ? "border-blue-100 bg-blue-50 text-blue-600"
                        : activeBill?.status === "AWAITING_PAYMENT"
                          ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                          : "border-amber-100 bg-amber-50 text-amber-500"
                }`}
              >
                {activeBill?.status === "READY"
                  ? "READY"
                  : activeBill?.status === "PREPARING"
                    ? "PREPARING"
                    : activeBill?.status === "KOT_SENT"
                      ? "SENT"
                      : activeBill?.status === "AWAITING_PAYMENT"
                        ? "BILLING"
                        : "CREATED"}
              </div>
            </div>

            {/* Compact Dynamic Service Model Switching Tabs */}
            {enabledServiceModels.length > 0 && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-50 border border-slate-100 rounded-xl mb-3 shadow-inner">
                {enabledServiceModels.map((model) => {
                  const isActive = effectiveOrderType === model;
                  return (
                    <button
                      key={model}
                      onClick={() => void handleServiceModelSwitch(model)}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all truncate ${
                        isActive
                          ? "bg-[#0c1424] text-[#5dc7ec] shadow-sm"
                          : "text-slate-400 hover:text-[#0c1424] hover:bg-slate-100"
                      }`}
                    >
                      {getCustomOrderTypeLabel(model)}
                    </button>
                  );
                })}
              </div>
            )}



            {/* Customer Capture Area */}
            {!!(customer?.name || activeBill?.customerName || activeBill?.pickupName || activeBill?.deliveryName || customer?.phone || activeBill?.pickupPhone || activeBill?.deliveryPhone) ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0c1424] font-black text-white text-[10px]">
                  {(customer?.name || activeBill?.customerName || "C")
                    .split(" ")
                    .map((value) => value[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-[#0c1424] truncate">
                    {customer?.name ||
                      activeBill?.customerName ||
                      activeBill?.pickupName ||
                      activeBill?.deliveryName}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 mt-0.5 leading-none">
                    {customer?.phone ||
                      activeBill?.pickupPhone ||
                      activeBill?.deliveryPhone}
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerForm(true)}
                  className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline px-2"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerForm(true)}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                  activeRules.collectCustomerDetails
                    ? "bg-[#0c1424] text-white hover:bg-black shadow-black/5"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Plus size={14} strokeWidth={3} />
                Add Customer Details {activeRules.collectCustomerDetails ? "*" : ""}
              </button>
            )}
          </div>

          {/* Cart Items Area */}
          <div className="custom-scrollbar flex-1 min-h-0 space-y-3 overflow-y-auto p-4">
            {billItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40 py-8 px-4">
                <ShoppingBag size={24} className="text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-500 max-w-[200px] leading-relaxed">
                  {effectiveOrderType === "DINE_IN" && !activeBill?.tableId
                    ? "Please select a table to begin ordering."
                    : "Select items from the menu to begin."}
                </p>
              </div>
            ) : (
              <>
                {billItems.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-slate-100 hover:bg-slate-50/50"
                    >
                      {/* Name & Notes Only (No Image, No Category name) */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-[#0c1424] truncate leading-tight">
                          {item.name}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-400 italic truncate mt-0.5 leading-none">
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Quantity Control Pill */}
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-0.5 shadow-sm shrink-0">
                        <button
                          onClick={() => void updateQuantity(item.id, "decrease")}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200/60 text-xs font-black text-slate-500 hover:bg-slate-100 transition-all"
                          title="Decrease quantity"
                        >
                          –
                        </button>
                        <span className="w-5 text-center text-xs font-black text-[#0c1424]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => void updateQuantity(item.id, "increase")}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0c1424] text-xs font-black text-white hover:bg-black transition-all"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Price Display */}
                      <div className="text-right min-w-[60px] shrink-0">
                        <div className="text-[13px] font-black text-[#0c1424]">
                          {formatCurrency(item.lineTotal)}
                        </div>
                      </div>

                      {/* X Remove Button on Right Side */}
                      <button
                        onClick={() => void removeItem(item.id)}
                        className="h-7 w-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shrink-0"
                        title="Remove item"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}

                {loyaltyDiscount > 0 ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-50 bg-[#f0fdf4] px-4 py-2 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                      Loyalty Reward (10%)
                    </span>
                    <span className="text-xs font-black text-emerald-600">
                      -{formatCurrency(loyaltyDiscount)}
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Cart Pricing Calculations & Footer */}
          <div className="border-t border-slate-100 bg-slate-50/10 p-4">
            <div className="space-y-2 mb-3">
              {activeBill?.taxMode === "INCLUSIVE" ? (
                <>
                  {loyaltyDiscount > 0 ? (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
                      <span>Loyalty Discount</span>
                      <span>-{formatCurrency(loyaltyDiscount)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-[#5dc7eb] bg-[#e8f9ff] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ✓ GST Inclusive
                    </span>
                  </div>
                </>
              ) : activeBill?.taxMode === "EXCLUSIVE" ? (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {loyaltyDiscount > 0 ? (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
                      <span>Loyalty Discount</span>
                      <span>-{formatCurrency(loyaltyDiscount)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>GST ({activeBill?.taxRate ?? 10}%)</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-1 text-xs font-bold text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-700">{formatCurrency(subtotal)}</span>
                  </div>
                  {loyaltyDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-500">
                      <span>Loyalty Discount</span>
                      <span>-{formatCurrency(loyaltyDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span>GST (10% Included)</span>
                    <span className="text-slate-500">
                      {formatCurrency(subtotal * 0.1)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="pt-2 flex items-end justify-between border-t border-slate-50">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block leading-none">
                    Total Due
                  </span>
                  <span className="text-2xl font-[950] tracking-tight text-[#0c1424] mt-1 block">
                    {formatCurrency(totalDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Highly Prioritized Checkout Controls (Required Only) */}
            <div className="flex flex-col gap-2">
              {/* Secondary Action: Save & Send KOT */}
              {!activeRules.paymentRequiredBeforeKOT && (
                <button
                  onClick={() => void handleSendToKitchen(false)}
                  disabled={
                    billItems.length === 0 ||
                    isSendingToKitchen ||
                    !canSendToKitchen ||
                    (effectiveOrderType === "DINE_IN" && !activeBill?.tableId && !selectedTable) ||
                    (activeRules.collectCustomerDetails && !isCustomerDataComplete())
                  }
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 font-black text-xs uppercase tracking-wider text-[#0c1424] transition-all active:scale-95 hover:bg-sky-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isSendingToKitchen ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} strokeWidth={2.5} />
                  )}
                  Save & Send KOT
                </button>
              )}

              {/* Primary Action: Save & Checkout */}
              <button
                onClick={handlePay}
                disabled={
                  billItems.length === 0 ||
                  (effectiveOrderType === "DINE_IN" && !activeBill?.tableId && !selectedTable) ||
                  (activeRules.collectCustomerDetails && !isCustomerDataComplete())
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0c1424] px-4 font-black text-xs uppercase tracking-wider text-white shadow-lg shadow-black/15 transition-all active:scale-95 hover:bg-black disabled:opacity-40 disabled:pointer-events-none"
              >
                <CreditCard size={15} strokeWidth={2.5} />
                Save & Checkout
              </button>

              {/* Dynamic helper notification text under the stack */}
              {billItems.length === 0 ? (
                <div className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 py-1">
                  Select items from the menu to begin
                </div>
              ) : effectiveOrderType === "DINE_IN" && !activeBill?.tableId && !selectedTable ? (
                <div className="text-center text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50/50 rounded-lg py-1 px-2 border border-rose-100">
                  ⚠️ Table selection required for Dine-In
                </div>
              ) : activeRules.collectCustomerDetails && !isCustomerDataComplete() ? (
                <div className="text-center text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50/50 rounded-lg py-1 px-2 border border-rose-100">
                  ⚠️ Customer Details Required
                </div>
              ) : activeRules.paymentRequiredBeforeKOT && activeBill?.status !== "PAID" ? (
                <div className="text-center text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50/50 rounded-lg py-1 px-2 border border-rose-100">
                  ⚠️ Advance payment required before KOT
                </div>
              ) : null}
            </div>
            </div>
          </aside>
        )}
      </main>

      {toastMessage ? (
        <div className="fixed left-1/2 top-28 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/5 bg-[#0c1424] px-6 py-4 text-white shadow-2xl shadow-black/20 animate-in fade-in zoom-in duration-300">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
          </div>
          <span className="whitespace-nowrap text-sm font-bold">
            {toastMessage}
          </span>
          <button
            onClick={() => setToastMessage("")}
            className="ml-2 text-white/40 transition-colors hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showCustomerForm ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
            onClick={() => setShowCustomerForm(false)}
          />
          <div className="relative w-full max-w-md">
            <CustomerDetailsForm
              orderType={effectiveOrderType}
              initialData={activeBill}
              onSubmit={handleCustomerFormSubmit}
              onCancel={() => setShowCustomerForm(false)}
            />
          </div>
        </div>
      ) : null}

      {showCustomerModal ? (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onSelect={handleCustomerSelect}
        />
      ) : null}

      {showLoyaltyModal && customer ? (
        <LoyaltyModal
          customer={customer}
          onApplyDiscount={handleApplyDiscount}
          onSkip={handleSkipLoyalty}
          onClose={() => setShowLoyaltyModal(false)}
        />
      ) : null}

      <POSModifierModal
        isOpen={modifierItem !== null}
        item={modifierItem}
        onClose={() => setModifierItem(null)}
        onConfirm={async (finalPriceInCents, notes) => {
          if (!modifierItem) return;
          const added = await addItemToBill(modifierItem, finalPriceInCents, notes);
          setModifierItem(null);
          if (added) {
            showToast(`${modifierItem.name} added!`);
          }
        }}
      />

      <POSComboBuilderModal
        isOpen={comboDeal !== null}
        deal={comboDeal}
        onClose={() => setComboDeal(null)}
        onConfirm={async (finalPriceInCents, notes) => {
          if (!comboDeal) return;
          const added = await addItemToBill(comboDeal, finalPriceInCents, notes);
          setComboDeal(null);
          if (added) {
            showToast(`${comboDeal.name} combo added!`);
          }
        }}
      />

      {/* Table Occupied Confirmation Dialog Modal */}
      {tableConfirmDialog && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c1424]/60 backdrop-blur-md"
            onClick={() => setTableConfirmDialog(null)}
          />
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl max-w-md w-full relative z-[151] animate-in fade-in zoom-in-95 duration-250">
            <h3 className="text-[19px] font-[1000] text-[#0c1424]">Table Already Has Active Order</h3>
            <p className="text-[13px] text-slate-500 font-medium mt-2 leading-relaxed">
              Table <strong>{tableConfirmDialog.name}</strong> is currently occupied with an active unpaid order. Do you want to continue this order?
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setTableConfirmDialog(null)}
                className="flex-1 h-12 rounded-xl border border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmContinueOrder}
                className="flex-1 h-12 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/15 cursor-pointer"
              >
                Continue Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
