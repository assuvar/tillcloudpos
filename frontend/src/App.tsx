import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import OnboardingFlow from "./onboarding/OnboardingFlow";
import Dashboard from "./Dashboard";
import Checkout from "./Checkout.tsx";
import ThermalReceiptScreen from './ThermalReceiptScreen';
import KitchenDisplay from "./KitchenDisplay.tsx";
import Landing from "./Landing";
import { FRONTEND_PERMISSIONS, getLandingPage, hasPermissionCode } from "./permissions";
import { useAuth } from "./context/AuthContext";
import { usePermissions } from "./context/PermissionProvider";
import AccessDenied from "./components/AccessDenied";

function ProtectedRoute({
  children,
  allowedRoles,
  allowedModes,
  allowedPermissions,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  allowedRoles?: Array<"ADMIN" | "MANAGER" | "CASHIER" | "KITCHEN">;
  allowedModes?: Array<"dashboard" | "pos" | "kitchen">;
  allowedPermissions?: string[];
  redirectTo?: string;
}) {
  const { isAuthenticated, user, isLoading, mode } = useAuth();
  const { permissions: livePermissions, isLoading: livePermissionsLoading } = usePermissions();
  const location = useLocation();

  // Wait until auth state (and permission state for authenticated users) is stable.
  if (isLoading || (isAuthenticated && livePermissionsLoading)) {
    return <div className="flex h-screen items-center justify-center font-bold text-[#0b1b3d]">LOADING...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  if (allowedModes && (!mode || !allowedModes.includes(mode))) {
    return <AccessDenied />;
  }

  if (allowedPermissions && allowedPermissions.length > 0) {
    const granted = allowedPermissions.some((permission) => hasPermissionCode(livePermissions, permission));
    if (!granted) {
      return <AccessDenied />;
    }
  }

  if (user && mode === "dashboard" && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-[#0b1b3d]">LOADING...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading, permissionsLoading } = useAuth();

  if (isLoading || (isAuthenticated && permissionsLoading)) return <div className="flex h-screen items-center justify-center font-bold text-[#0b1b3d]">LOADING...</div>;

  if (isAuthenticated && user) {
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return <Navigate to={getLandingPage(null, user.role)} replace />;
  }

  return <>{children}</>;
}



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route path="/pos/login" element={<Navigate to="/login" replace />} />
      <Route path="/pos-login" element={<Navigate to="/login" replace />} />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route path="/regis" element={<Navigate to="/register" replace />} />
      <Route 
        path="/onboarding" 
        element={
          <OnboardingRoute>
            <OnboardingFlow />
          </OnboardingRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute
            allowedModes={["dashboard"]}
            allowedRoles={["ADMIN", "MANAGER", "CASHIER"]}
          >
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/pos"
        element={
          <ProtectedRoute allowedModes={["pos", "dashboard"]} allowedPermissions={[FRONTEND_PERMISSIONS.BILLING_VIEW_OPEN]} redirectTo="/pos/login">
            <Dashboard defaultView="orders" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos/order-entry"
        element={
          <ProtectedRoute allowedModes={["pos", "dashboard"]} allowedPermissions={[FRONTEND_PERMISSIONS.BILLING_VIEW_OPEN]} redirectTo="/pos/login">
            <Dashboard defaultView="orders" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedModes={["pos", "dashboard"]} allowedPermissions={[FRONTEND_PERMISSIONS.PAYMENTS_CASH]} redirectTo="/pos/login">
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipt"
        element={
          <ProtectedRoute allowedModes={["pos", "dashboard"]} allowedPermissions={[FRONTEND_PERMISSIONS.PAYMENTS_CASH]} redirectTo="/pos/login">
            <ThermalReceiptScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedModes={["kitchen", "pos", "dashboard"]} allowedPermissions={[FRONTEND_PERMISSIONS.KITCHEN_VIEW]} redirectTo="/pos/login">
            <KitchenDisplay />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
