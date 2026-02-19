// AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
const handleAuthCallback = async () => {
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const redirectParam = searchParams.get('redirect');

  console.log('AuthCallback - Code:', !!code);
  console.log('AuthCallback - Redirect param:', redirectParam);

  if (error) {
    setError(errorDescription || 'Authentication failed');
    setLoading(false);
    navigate('/login?error=auth_failed', { replace: true });
    return;
  }

  if (!code) {
    setError('No authentication code provided');
    setLoading(false);
    navigate('/login', { replace: true });
    return;
  }

  try {
    // Exchange the code for a session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(authError.message);
    }

    if (session) {
      console.log('AuthCallback - Session created successfully');
      console.log('AuthCallback - User ID:', session.user.id);
      
      // IMPORTANT: Wait for Supabase to fully initialize the session
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a refresh to ensure session is properly loaded
      await supabase.auth.refreshSession();
      
      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to the intended destination or dashboard
      const redirectPath = redirectParam || '/dashboard';
      console.log('AuthCallback - Redirecting to:', redirectPath);
      
      // Use navigate instead of window.location for better SPA experience
      navigate(redirectPath, { replace: true });
    } else {
      throw new Error('No session created');
    }
  } catch (err: any) {
    console.error('Auth callback error:', err);
    setError(err.message || 'Authentication failed');
    navigate('/login?error=auth_failed', { replace: true });
  } finally {
    setLoading(false);
  }
};

    handleAuthCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 text-4xl text-red-600">❌</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Authentication Error</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}