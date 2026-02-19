import AccessGuard from "@v1/components/AccessGuard";
import { AuthProvider } from "@v1/contexts/AuthContext";
import Login from "@v1/pages/authentication/Login";
import Redirect from "@v1/pages/Redirect";
import type { AppRoute } from "@v1/types/AppRoute";
import { Toaster } from "react-hot-toast";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import AuthCallback from "@v1/pages/authentication/AuthCallback";
import ProtectedLayout from "@v1/layout/ProtectedLayout";
import { AppRoutes } from "@v1/routes";
import NotFound from "@v1/pages/errors/NotFound";

const renderRoutes = (routes: AppRoute[]): React.ReactNode =>
  routes.map((route) => (
    <Route
      key={route.path || Math.random()}
      {...(route.index ? { index: true } : { path: route.path })}
      element={
        <AccessGuard
          roles={route.roles}
          permissions={route.permissions}
          positions={route.positions}
          redirectTo="/"
        >
          {route.element}
        </AccessGuard>
      }
    >
      {route.children && renderRoutes(route.children)}
    </Route>
  ));

function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          {/* Public routes */}
          <Route index path="/" element={<Redirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route element={<ProtectedLayout />}>{renderRoutes(AppRoutes)}</Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default AppRouter;
