// src/components/DebugAuth.tsx
import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const { user, roles, affiliateId, userType, hasRoles } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <div className="font-bold mb-2">Auth Debug Info:</div>
      <div>Email: {user.email}</div>
      <div>User ID: {user.id}</div>
      <div>Has Roles: {hasRoles ? 'Yes' : 'No'}</div>
      <div>Roles: {roles.join(', ') || 'None'}</div>
      <div>Affiliate ID: {affiliateId || 'None'}</div>
      <div>User Type: {userType || 'None'}</div>
      <div>Full Metadata: {JSON.stringify(user.user_metadata)}</div>
    </div>
  );
}