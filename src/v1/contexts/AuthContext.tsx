import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useRef,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { request } from "../lib/apiRequest";
import { useQuery } from "@tanstack/react-query";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  userRole: userRoles | undefined;
  rolesError: any; // Add this line
  signIn: any;
  signOut: any;
  logoutReason: string | null;
  remainingTime: number;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  userRole: undefined,
  signIn: () => {},
  signOut: () => {},
  logoutReason: null,
  remainingTime: 0,
  rolesError: null,
});

type userRoles = {
  display_name: string;
  roles: string[];
  permissions: string[];
  position: string[];
  affiliate_id: number | null;
  affiliate_name: string | null;
  affiliate_uid: string | null;
};

// Inactivity timeout in milliseconds - CORRECTED TO 1 HOUR
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes (1 hour)
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes before logout

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [logoutReason, setLogoutReason] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] =
    useState<number>(INACTIVITY_TIMEOUT);
  const [showWarning, setShowWarning] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());

  const {
    data: userRole,
    isLoading: rolesLoading,
    isFetching: refetching,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery<userRoles>({
    queryKey: ["user-details"],
    queryFn: async () => {
      // console.log('Fetching user roles...');
      const response = await request("user/roles-permissions");
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          console.log("401 response, signing out...");
          // Wait a bit and sign out
          setTimeout(() => signOut("unauthorized"), 1000);
          throw new Error("Unauthorized");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return result;
    },
    staleTime: 30 * 60 * 1000,
    enabled: session !== null,
    retry: false, // Don't retry on 401
    refetchOnWindowFocus: false,
  });

  // Update the loading calculation to include error state
  const loading =
    sessionLoading || (session !== null && rolesLoading && !rolesError);
  const signIn = async (email: string, redirectTo?: string) => {
    const redirectPath = redirectTo || "/dashboard";

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error };
    }
    return { success: true, data };
  };

  const signOut = useCallback(async (reason: string = "manual") => {
    console.log(`Signing out due to: ${reason}`);
    setLogoutReason(reason);

    clearAllTimers();

    setShowWarning(false);
    setRemainingTime(INACTIVITY_TIMEOUT);

    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign out error:", error);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    // Update last activity time
    lastActivityTimeRef.current = Date.now();
    setRemainingTime(INACTIVITY_TIMEOUT);
    setShowWarning(false);

    // Clear existing timers
    clearAllTimers();

    // Set warning timer (55 minutes from now - shows warning 5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      if (session) {
        setShowWarning(true);
        // Start countdown when warning shows
        startCountdown();
      }
    }, INACTIVITY_TIMEOUT - WARNING_TIMEOUT); // 55 minutes

    // Set main logout timer (60 minutes from now)
    inactivityTimerRef.current = setTimeout(() => {
      if (session) {
        signOut("inactivity");
      }
    }, INACTIVITY_TIMEOUT); // 60 minutes
  }, [session, signOut, clearAllTimers]);

  const startCountdown = useCallback(() => {
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Start countdown from 5 minutes
    const countdownStartTime = Date.now();
    const countdownDuration = WARNING_TIMEOUT;

    countdownIntervalRef.current = setInterval(() => {
      if (!session) {
        clearAllTimers();
        return;
      }

      const elapsed = Date.now() - countdownStartTime;
      const timeRemaining = Math.max(0, countdownDuration - elapsed);

      setRemainingTime(timeRemaining);

      // Stop countdown when time is up
      if (timeRemaining <= 0) {
        clearAllTimers();
      }
    }, 1000);
  }, [session, clearAllTimers]);

  // Set up activity listeners
  useEffect(() => {
    if (!session) {
      clearAllTimers();
      setShowWarning(false);
      setRemainingTime(INACTIVITY_TIMEOUT);
      return;
    }

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Listen to various user activities
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "wheel",
      "input",
      "focus",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [session, resetInactivityTimer, clearAllTimers]);

  // Initialize auth session
  useEffect(() => {
    const init = async () => {
      // console.log("Initializing session...");
      setSessionLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // console.log("Session loaded:", session ? "exists" : "null");
      setSession(session);
      setSessionLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // console.log("Auth state changed:", _event, session ? "exists" : "null");
        setSession(session);

        if (!session) {
          setShowWarning(false);
          setRemainingTime(INACTIVITY_TIMEOUT);
          setLogoutReason(null);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Show inactivity warning modal
  const renderWarningModal = () => {
    if (!showWarning || !session) return null;

    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-w-md p-6 mx-4 bg-white rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-yellow-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Session Timeout Warning
            </h3>
          </div>
          <p className="mb-4 text-gray-600">
            Your session will expire in {minutes}:
            {seconds.toString().padStart(2, "0")} due to inactivity. Click
            anywhere or perform any action to stay logged in.
          </p>
          <div className="w-full h-2 mb-4 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all duration-1000 bg-blue-600 rounded-full"
              style={{ width: `${(remainingTime / WARNING_TIMEOUT) * 100}%` }}
            />
          </div>
          <button
            onClick={() => resetInactivityTimer()}
            className="w-full px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    );
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        userRole,
        signIn,
        signOut,
        logoutReason,
        remainingTime,
      }}
    >
      {children}
      {renderWarningModal()}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
