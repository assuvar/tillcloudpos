import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { configureApiAuthHandlers } from '../services/api';
import {
  canAccess as canAccessPermission,
  hasPermissionCode,
  isGroupEnabled,
  getLandingPage,
  buildPermissionMap,
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
  permissions?: string[] | PermissionMap;
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
  setMode: (mode: AuthMode) => void;
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

const normalizePermissionPayload = (payload: unknown): PermissionMap | null => {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return buildPermissionMap(payload as string[]);
  }

  if (typeof payload === 'object') {
    return payload as PermissionMap;
  }

  return null;
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
  const lastRefreshRef = useRef<number>(0);

  const location = useLocation();

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const isNetworkError = (error: unknown): boolean => {
    const axiosLikeError = error as { response?: unknown } | undefined;
    return !axiosLikeError?.response;
  };

  const savePermissions = (nextPermissions: PermissionMap | null) => {
    setPermissions(nextPermissions);
    if (nextPermissions) {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(nextPermissions));
    } else {
      localStorage.removeItem(PERMISSIONS_KEY);
    }
  };

  const fetchCurrentUser = async (
    tokenOverride?: string,
  ): Promise<{ user: User } | null> => {
    try {
      const response = await api.get('/auth/me', {
        headers: tokenOverride
          ? { Authorization: `Bearer ${tokenOverride}` }
          : undefined,
      });
      return response.data as { user: User };
    } catch {
      return null;
    }
  };

  const fetchUserPermissions = async (
    tokenOverride?: string,
  ): Promise<PermissionMap | null> => {
    try {
      const response = await api.get('/permissions/me', {
        headers: tokenOverride
          ? { Authorization: `Bearer ${tokenOverride}` }
          : undefined,
      });

      return normalizePermissionPayload(response.data?.permissions);
    } catch {
      return null;
    }
  };

  const logout = async (skipApiLogout = false) => {
    if (!skipApiLogout) {
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore logout endpoint failures and still clear local state.
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
      if (!sessionData?.user) {
        throw new Error('Could not refresh session user');
      }

      const refreshedUser = sessionData.user;
      const fetchedPermissions = await fetchUserPermissions(nextToken);
      const fallbackPermissions = normalizePermissionPayload(refreshedUser.permissions);

      setUser(refreshedUser);
      setMode(currentMode || 'dashboard');
      savePermissions(fetchedPermissions || fallbackPermissions);

      localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
      if (currentMode) {
        localStorage.setItem(MODE_KEY, currentMode);
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
          setPermissions(normalizePermissionPayload(JSON.parse(storedPermissions)));
        } catch {
          localStorage.removeItem(PERMISSIONS_KEY);
        }
      }

      await refreshAccessToken();
      setIsLoading(false);
    };

    void hydrateAuth();
  }, []);

  useEffect(() => {
    if (!user || !accessToken) {
      return;
    }

    if (Date.now() - lastRefreshRef.current <= 10000) {
      return;
    }

    lastRefreshRef.current = Date.now();

    const fetchLatest = async () => {
      setPermissionsLoading(true);
      try {
        const [sessionData, fetchedPermissions] = await Promise.all([
          fetchCurrentUser(accessToken),
          fetchUserPermissions(accessToken),
        ]);

        if (sessionData?.user) {
          setUser(sessionData.user);
          localStorage.setItem(USER_KEY, JSON.stringify(sessionData.user));

          const fallbackPermissions = normalizePermissionPayload(sessionData.user.permissions);
          savePermissions(fetchedPermissions || fallbackPermissions);
        }
      } finally {
        setPermissionsLoading(false);
      }
    };

    void fetchLatest();

    // Add polling interval for live updates
    const pollId = setInterval(fetchLatest, 30000);
    return () => clearInterval(pollId);
  }, [location.pathname, user?.id, accessToken]);

  const login = async (
    token: string,
    userData: User,
    loginMode: AuthMode = 'dashboard',
    posSessionToken?: string,
  ): Promise<PermissionMap | null> => {
    setAccessToken(token);

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

    const fetchedPermissions = await fetchUserPermissions(token);
    const fallbackPermissions = normalizePermissionPayload(resolvedUser.permissions);
    const finalPermissions = fetchedPermissions || fallbackPermissions;

    savePermissions(finalPermissions);
    return finalPermissions;
  };

  const updateOnboardingStatus = (status: boolean) => {
    if (!user) {
      return;
    }

    const updatedUser = { ...user, onboardingCompleted: status };
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const hasPermission = (code: string) => hasPermissionCode(permissions, code);

  const canAccess = (module: string, action: string) =>
    canAccessPermission(permissions, module, action);

  const hasModuleAccess = (group: PermissionGroup) =>
    isGroupEnabled(permissions, group);

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
          if (!accessToken) {
            return;
          }

          setPermissionsLoading(true);
          try {
            const [sessionData, fetchedPermissions] = await Promise.all([
              fetchCurrentUser(accessToken),
              fetchUserPermissions(accessToken),
            ]);

            if (sessionData?.user) {
              setUser(sessionData.user);
              localStorage.setItem(USER_KEY, JSON.stringify(sessionData.user));

              const fallbackPermissions = normalizePermissionPayload(sessionData.user.permissions);
              const finalPermissions = fetchedPermissions || fallbackPermissions;
              savePermissions(finalPermissions);

              console.log(
                `[Auth] Permissions refreshed at ${new Date().toLocaleTimeString()}. Codes: ${Object.values(finalPermissions || {}).flat().length}`,
              );
            }
          } catch (err) {
            console.error('[Auth] Failed to refresh permissions:', err);
          } finally {
            setPermissionsLoading(false);
          }
        },
        hasPermission,
        canAccess,
        hasModuleAccess,
        setMode: (newMode: AuthMode) => {
          setMode(newMode);
          localStorage.setItem(MODE_KEY, newMode);
        },
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
