import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

export interface OutletRecord {
  id: string;
  restaurantId: string;
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
  timezone: string | null;
  currency: string;
  isActive: boolean;
  isPrimary: boolean;
  serviceModels: string[];
}

interface OutletContextType {
  activeOutletId: string | null;
  activeOutlet: OutletRecord | null;
  availableOutlets: OutletRecord[];
  isLoading: boolean;
  switchOutlet: (id: string) => void;
  refreshOutlets: () => Promise<void>;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

const OUTLET_STORAGE_KEY = "active_outlet_id";

export const OutletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [activeOutletId, setActiveOutletId] = useState<string | null>(null);
  const [availableOutlets, setAvailableOutlets] = useState<OutletRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshOutlets = async () => {
    if (!isAuthenticated) {
      setAvailableOutlets([]);
      setActiveOutletId(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<OutletRecord[]>("/outlets");
      const outlets = response.data;
      setAvailableOutlets(outlets);

      // Restore previously selected active outlet if valid, otherwise fallback to primary
      const storedId = localStorage.getItem(OUTLET_STORAGE_KEY);
      const isStoredValid = storedId && outlets.some((o) => o.id === storedId);

      if (isStoredValid) {
        setActiveOutletId(storedId);
      } else {
        const primary = outlets.find((o) => o.isPrimary) || outlets[0];
        if (primary) {
          setActiveOutletId(primary.id);
          localStorage.setItem(OUTLET_STORAGE_KEY, primary.id);
        } else {
          setActiveOutletId(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch outlets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshOutlets();
  }, [isAuthenticated]);

  const switchOutlet = (id: string) => {
    const exists = availableOutlets.some((o) => o.id === id);
    if (exists) {
      setActiveOutletId(id);
      localStorage.setItem(OUTLET_STORAGE_KEY, id);
    }
  };

  const activeOutlet =
    availableOutlets.find((o) => o.id === activeOutletId) || null;

  return (
    <OutletContext.Provider
      value={{
        activeOutletId,
        activeOutlet,
        availableOutlets,
        isLoading,
        switchOutlet,
        refreshOutlets,
      }}
    >
      {children}
    </OutletContext.Provider>
  );
};

export const useOutlets = () => {
  const context = useContext(OutletContext);
  if (context === undefined) {
    throw new Error("useOutlets must be used within an OutletProvider");
  }
  return context;
};
