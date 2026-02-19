// src/App.tsx
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AuthCallback from "./components/AuthCallback";
import DashboardRedirect from "./components/DashboardRedirect";
import AffiliateDashboard from "./components/dashboards/affiliate/AffiliateDashboard";
import MemberDashboard from "./components/dashboards/member/MemberDashboard";
import NationalDashboard from "./components/dashboards/national/NationalDashboard";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleSync from "./components/RoleSync";
import Unauthorized from "./components/Unauthorized";
import { AuthProvider } from "./contexts/AuthContext";

import { useEffect } from 'react';
import { Toaster } from "react-hot-toast";
import { supabase } from '../src/v1/lib/supabase';
import DebugAuth from "./components/DebugAuth";
import InactivityTest from "./v1/components/InactivityTest";
import InactivityTracker from "./v1/components/InactivityTracker";

// import DebugAuth from './components/DebugAuth';
function App() {
    useEffect(() => {
    // Clean up stored session on app start
    const cleanupStoredSession = () => {
      const currentSession = supabase.auth.getSession();
      if (!currentSession) {
        localStorage.removeItem('supabase.auth.token');
      }
    };

    cleanupStoredSession();
  }, []);
  return (
    <AuthProvider>
      <Router>
        <RoleSync />
        {/* <InactivityTracker /> */}
        {process.env.NODE_ENV === 'development' && <InactivityTest />}
        {/* <DebugAuth />  */}
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/error"
            element={
              <div className="flex items-center justify-center min-h-screen">
                Error Page - Something went wrong
              </div>
            }
          />
          <Route
            path="/no-access"
            element={
              <div className="flex items-center justify-center min-h-screen">
                No Access - You don't have permission
              </div>
            }
          />

          {/* Protected routes with user type validation */}
          <Route
            path="/national/*"
            element={
              <ProtectedRoute requiredUserType="national">
                <NationalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/affiliate/*"
            element={
              <ProtectedRoute requiredUserType="affiliate">
                <AffiliateDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/member/*"
            element={
              <ProtectedRoute requiredUserType="member">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default route */}
          <Route path="/" element={<Login />} />

          {/* 404 route */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                404 - Page Not Found
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
