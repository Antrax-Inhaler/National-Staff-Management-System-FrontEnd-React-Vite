// src/components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType: 'national' | 'affiliate' | 'member';
}

export default function ProtectedRoute({ 
  children, 
  requiredUserType 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userType, loading, hasRoles } = useAuth();

  useEffect(() => {
    if (loading) return;

    console.log('ProtectedRoute - Required:', requiredUserType, 'UserType:', userType);

    // DEVELOPMENT MODE: Bypass for testing (remove in production)
    if (import.meta.env.DEV && user) {
      console.log('DEV MODE: Bypassing protection for development');
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }

    // If user doesn't have roles yet, wait
    if (!hasRoles) {
      console.log('Waiting for roles to load...');
      return;
    }

    // STRICT PERMISSION CHECK - userType must exactly match requiredUserType
    if (userType !== requiredUserType) {
      console.log('ACCESS DENIED: User type', userType, 'does not match required', requiredUserType);
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [user, userType, loading, hasRoles, requiredUserType, navigate, location]);

  if (loading || !hasRoles) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // FINAL SAFETY CHECK - prevent rendering if types don't match
  if (userType !== requiredUserType) {
    console.log('RENDER BLOCKED: User type mismatch');
    return null;
  }

  return <>{children}</>;
}