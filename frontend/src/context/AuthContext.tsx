import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { configureApiAuthHandlers } from '../services/api';
import {
  hasPermissionCode,
  isGroupEnabled,
  type PermissionGroup,
  type PermissionMap,
} from '../permissions';

interface User {
  id: string;
  email: string;
  fullName: string;
  businessName?: string;
  mobile?: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
  restaurantId: string;
  onboardingCompleted: boolean;
}

export type AuthMode = 'dashboard' | 'pos' | 'kitchen';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  mode: AuthMode | null;
  permissions: PermissionMap | null;
  permissionsLoading: boolean;
  isAuthenticated: boolean;
  login: (
    token: string,
    user: User,
    mode?: AuthMode,
    posSessionToken?: string,
  ) => Promise<void>;
  logout: (skipApiLogout?: boolean) => Promise<void>;
  isLoading: boolean;
  updateOnboardingStatus: (status: boolean) => void;
  refreshAccessToken: () => Promise<string | null>;
  hasPermission: (code: string) => boolean;
  hasModuleAccess: (group: PermissionGroup) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'user';
const MODE_KEY = 'auth_mode';
const POS_SESSION_KEY = 'pos_session_token';
const KITCHEN_PAIRING_KEY = 'kitchen_pairing_token';
const PERMISSIONS_KEY = 'role_permissions';

const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return true;
    }

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp as number | undefined;
    if (!exp) {
      return true;
    }

    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydratedRef = useRef(false);

  const isNetworkError = (error: unknown): boolean => {
    const axiosLikeError = error as { response?: unknown; code?: string } | undefined;
    return !axiosLikeError?.response;
  };

  const fetchRolePermissions = async (
    role: User['role'],
    tokenOverride?: string,
  ): Promise<PermissionMap | null> => {
    if (role === 'ADMIN') {
      try {
        const response = await api.get(`/permissions/${role}`, {
          headers: tokenOverride
            ? { Authorization: `Bearer ${tokenOverride}` }
            : undefined,
        });
        return response.data?.permissions || null;
      } catch {
        return null;
      }
    }

    try {
      const response = await api.get(`/permissions/${role}`, {
        headers: tokenOverride
          ? { Authorization: `Bearer ${tokenOverride}` }
          : undefined,
      });
      return response.data?.permissions || null;
    } catch {
      return null;
    }
  };

  const logout = async (skipApiLogout = false) => {
    if (!skipApiLogout) {
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore network/logout endpoint errors and continue local cleanup.
      }
    }

    setAccessToken(null);
    setUser(null);
    setMode(null);
    setPermissions(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(POS_SESSION_KEY);
    localStorage.removeItem(KITCHEN_PAIRING_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const currentMode = (localStorage.getItem(MODE_KEY) as AuthMode | null) || mode;
      const posSessionToken = localStorage.getItem(POS_SESSION_KEY);
      const kitchenPairingToken = localStorage.getItem(KITCHEN_PAIRING_KEY);

      if (currentMode === 'pos' && posSessionToken && isTokenExpired(posSessionToken)) {
        await logout(true);
        return null;
      }

      if (currentMode === 'kitchen' && kitchenPairingToken) {
        const response = await api.post('/auth/kitchen/authorize', {
          pairingToken: kitchenPairingToken,
        });
        const nextToken = response.data.access_token as string;
        const nextUser = response.data.user as User;

        setAccessToken(nextToken);
        setUser(nextUser);
        setMode('kitchen');
        setPermissions(null);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        localStorage.setItem(MODE_KEY, 'kitchen');
        localStorage.removeItem(PERMISSIONS_KEY);

        return nextToken;
      }

      const response = await api.post('/auth/refresh', {
        posSessionToken: currentMode === 'pos' ? posSessionToken : undefined,
      });
      const nextToken = response.data.access_token as string;
      const nextUser = response.data.user as User;

      setAccessToken(nextToken);
      setUser(nextUser);
      setMode(currentMode || 'dashboard');
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      if (currentMode) {
        localStorage.setItem(MODE_KEY, currentMode);
      }

      if (nextUser.role !== 'KITCHEN') {
        setPermissionsLoading(true);
        const loadedPermissions = await fetchRolePermissions(nextUser.role, nextToken);
        setPermissions(loadedPermissions);
        if (loadedPermissions) {
          localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(loadedPermissions));
        } else {
          localStorage.removeItem(PERMISSIONS_KEY);
        }
        setPermissionsLoading(false);
      }

      return nextToken;
    } catch (error: unknown) {
      if (isNetworkError(error)) {
        // Backend is unreachable (for example not started yet). Avoid clearing local auth state.
        return null;
      }
      await logout(true);
      return null;
    }
  };

  useEffect(() => {
    configureApiAuthHandlers({
      getAccessToken: () => accessToken,
      refreshAccessToken,
      onLogout: () => {
        void logout(true);
      },
    });
  }, [accessToken]);

  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }
    hasHydratedRef.current = true;

    const hydrateAuth = async () => {
      const storedUser = localStorage.getItem(USER_KEY);
      const storedMode = localStorage.getItem(MODE_KEY) as AuthMode | null;
      const storedPermissions = localStorage.getItem(PERMISSIONS_KEY);

      if (storedUser) {
        setUser(JSON.parse(storedUser) as User);
      }

      if (storedMode) {
        setMode(storedMode);
      }

      if (storedPermissions) {
        try {
          setPermissions(JSON.parse(storedPermissions) as PermissionMap);
        } catch {
          localStorage.removeItem(PERMISSIONS_KEY);
        }
      }

      await refreshAccessToken();
      setIsLoading(false);
    };

    void hydrateAuth();
  }, []);

  const login = async (
    token: string,
    userData: User,
    loginMode: AuthMode = 'dashboard',
    posSessionToken?: string,
  ) => {
    setAccessToken(token);
    setUser(userData);
    setMode(loginMode);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(MODE_KEY, loginMode);

    if (loginMode === 'pos' && posSessionToken) {
      localStorage.setItem(POS_SESSION_KEY, posSessionToken);
    } else {
      localStorage.removeItem(POS_SESSION_KEY);
    }

    if (userData.role === 'KITCHEN') {
      setPermissions(null);
      localStorage.removeItem(PERMISSIONS_KEY);
      return;
    }

    setPermissionsLoading(true);
    const loadedPermissions = await fetchRolePermissions(userData.role, token);
    setPermissions(loadedPermissions);
    if (loadedPermissions) {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(loadedPermissions));
    } else {
      localStorage.removeItem(PERMISSIONS_KEY);
    }
    setPermissionsLoading(false);
  };

  const updateOnboardingStatus = (status: boolean) => {
    if (user) {
      const updatedUser = { ...user, onboardingCompleted: status };
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (code: string) => {
    if (user?.role === 'ADMIN') {
      return true;
    }
    return hasPermissionCode(permissions, code);
  };

  const hasModuleAccess = (group: PermissionGroup) => {
    if (user?.role === 'ADMIN') {
      return true;
    }
    return isGroupEnabled(permissions, group);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        mode,
        permissions,
        permissionsLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        logout,
        isLoading,
        updateOnboardingStatus,
        refreshAccessToken,
        hasPermission,
        hasModuleAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
