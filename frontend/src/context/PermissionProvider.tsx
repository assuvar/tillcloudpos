import React, { createContext, useContext, useEffect, useState } from "react";
import {
  flattenPermissionMap,
  UserRole,
  PermissionMap,
} from "../permissions";
import { useAuth } from "./AuthContext";

type PermissionUser = {
  id: string;
  role: UserRole;
  permissions?: PermissionMap | string[];
};

type PermissionContextType = {
  user: PermissionUser | null;
  permissions: string[];
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
};

const PermissionContext = createContext<PermissionContextType | null>(null);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, isAuthenticated, permissions: authPermissions, isLoading: authLoading, refreshPermissions } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated && authPermissions) {
      // Flatten the PermissionMap from AuthContext into a string array
      const flattened = flattenPermissionMap(authPermissions);
      setPermissions(flattened);
    } else {
      setPermissions([]);
    }
  }, [isAuthenticated, authPermissions]);

  return (
    <PermissionContext.Provider
      value={{ 
        user: authUser as any, 
        permissions, 
        refreshPermissions,
        isLoading: authLoading
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    // Fallback if provider is missing during migration/testing
    return {
      user: null,
      permissions: [],
      refreshPermissions: async () => {},
      isLoading: false
    };
  }
  return ctx;
};
