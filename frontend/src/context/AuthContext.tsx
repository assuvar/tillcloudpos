import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api, { configureApiAuthHandlers } from '../services/api';
import {
  canAccess as canAccessPermission,
  hasPermissionCode,
  isGroupEnabled,
  getLandingPage,
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
  permissions: string[];
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
  ) => Promise<PermissionMap | null>;
  logout: (skipApiLogout?: boolean) => Promise<void>;
  isLoading: boolean;
  updateOnboardingStatus: (status: boolean) => void;
  refreshAccessToken: () => Promise<string | null>;
  refreshPermissions: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  canAccess: (module: string, action: string) => boolean;
  hasModuleAccess: (group: PermissionGroup) => boolean;
  getLandingRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'user';
const MODE_KEY = 'auth_mode';
const POS_SESSION_KEY = 'pos_session_token';
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
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const isNetworkError = (error: unknown): boolean => {
    const axiosLikeError = error as { response?: unknown; code?: string } | undefined;
    return !axiosLikeError?.response;
  };

  const fetchCurrentUser = async (
    tokenOverride?: string,
  ): Promise<{ user: User } | null> => {
    try {
      console.log('[Auth] Fetching /auth/me to sync permissions and status');
      const response = await api.get('/auth/me', {
        headers: tokenOverride
          ? { Authorization: `Bearer ${tokenOverride}` }
          : undefined,
      });

      return response.data;
    } catch (err: any) {
      console.error('[Auth] Token refresh failed:', err?.response?.status === 401 ? 'Unauthorized (401)' : err.message);
      if (err?.response?.status === 401) {
        await logout(true);
      }
      return null;
    }
  };

  const fetchOnboardingStatus = async (
    tokenOverride?: string,
  ): Promise<boolean | null> => {
    try {
      const response = await api.get('/onboarding/status', {
        headers: tokenOverride
          ? { Authorization: `Bearer ${tokenOverride}` }
          : undefined,
      });

      return Boolean(response.data?.onboardingCompleted);
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
    localStorage.removeItem(PERMISSIONS_KEY);
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const currentMode = (localStorage.getItem(MODE_KEY) as AuthMode | null) || mode;
      const posSessionToken = localStorage.getItem(POS_SESSION_KEY);

      if (currentMode === 'pos' && posSessionToken && isTokenExpired(posSessionToken)) {
        await logout(true);
        return null;
      }

      const response = await api.post('/auth/refresh', {
        posSessionToken: currentMode === 'pos' ? posSessionToken : undefined,
      });
      
      const nextToken = response.data.access_token as string;
      setAccessToken(nextToken);
      
      const sessionData = await fetchCurrentUser(nextToken);
      if (!sessionData) {
        throw new Error('Could not refresh session data');
      }

      const { user: refreshedUser } = sessionData;
      setUser(refreshedUser);
      setMode(currentMode || 'dashboard');
      
      localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
      if (currentMode) {
        localStorage.setItem(MODE_KEY, currentMode);
      }

      setPermissions(refreshedUser.permissions || []);
      if (refreshedUser.permissions) {
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(refreshedUser.permissions));
      }
      
      return nextToken;
    } catch (error: unknown) {
      if (isNetworkError(error)) {
        return null;
      }
      await logout(true);
      return null;
    }
  };

  useEffect(() => {
    configureApiAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      refreshAccessToken,
      onLogout: () => {
        void logout(true);
      },
    });
  }, []);

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
          setPermissions(JSON.parse(storedPermissions) as string[]);
        } catch {
          localStorage.removeItem(PERMISSIONS_KEY);
        }
      }

      await refreshAccessToken();
      setIsLoading(false);
    };

    void hydrateAuth();
  }, []);

  const location = useLocation();
  const lastRefreshRef = useRef<number>(0);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Refresh permissions on navigation to ensure real-time propagation
    // Throttle to once every 10 seconds to avoid spamming the server
    if (isAuthenticated && Date.now() - lastRefreshRef.current > 10000) {
      console.log(`[Auth] Navigation detected to ${location.pathname}, refreshing metadata`);
      lastRefreshRef.current = Date.now();
      void (async () => {
        const sessionData = await fetchCurrentUser(accessToken || undefined);
        if (sessionData?.user) {
          setUser(sessionData.user);
          setPermissions(sessionData.user.permissions || []);
          localStorage.setItem(USER_KEY, JSON.stringify(sessionData.user));
          localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(sessionData.user.permissions));
        }
      })();
    }
  }, [location.pathname, isAuthenticated, accessToken]);

  const login = async (
    token: string,
    userData: User,
    loginMode: AuthMode = 'dashboard',
    posSessionToken?: string,
  ): Promise<any> => {
    setAccessToken(token);
    
    // Get full user profile including permissions
    const sessionData = await fetchCurrentUser(token);
    const resolvedUser = sessionData?.user || userData;

    setUser(resolvedUser);
    setMode(loginMode);
    localStorage.setItem(USER_KEY, JSON.stringify(resolvedUser));
    localStorage.setItem(MODE_KEY, loginMode);

    if (loginMode === 'pos' && posSessionToken) {
      localStorage.setItem(POS_SESSION_KEY, posSessionToken);
    } else {
      localStorage.removeItem(POS_SESSION_KEY);
    }

    setPermissions(resolvedUser.permissions || []);
    if (resolvedUser.permissions) {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(resolvedUser.permissions));
    }

    console.log(`[Auth] Logged in user ${resolvedUser.email} with ${resolvedUser.permissions?.length} permissions`);

    return resolvedUser.permissions;
  };

  const updateOnboardingStatus = (status: boolean) => {
    if (user) {
      const updatedUser = { ...user, onboardingCompleted: status };
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (code: string) => {
    return hasPermissionCode(permissions, code);
  };

  const canAccess = (module: string, action: string) => {
    return canAccessPermission(permissions, module, action);
  };

  const hasModuleAccess = (group: PermissionGroup) => {
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
        refreshPermissions: async () => {
          if (!accessToken) return;
          console.log('[Auth] Manually refreshing permissions');
          try {
            const sessionData = await fetchCurrentUser(accessToken);
            if (sessionData?.user) {
              const fetchedPerms = sessionData.user.permissions || [];
              console.log(`[Auth] Sync successful. Permissions (${fetchedPerms.length}):`, fetchedPerms);
              setUser(sessionData.user);
              setPermissions(fetchedPerms);
              localStorage.setItem(USER_KEY, JSON.stringify(sessionData.user));
              localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(sessionData.user.permissions));
            }
          } catch (err: any) {
            console.error('[Auth] Permission sync failed:', err?.response?.status || err.message);
            if (err?.response?.status === 401) {
              console.warn('[Auth] Session invalid during sync, logging out...');
              await logout(true);
            }
          }
        },
        hasPermission,
        canAccess,
        hasModuleAccess,
        getLandingRoute: () => {
          if (user && !user.onboardingCompleted) {
            return '/onboarding';
          }
          return getLandingPage(permissions, user?.role);
        },
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
