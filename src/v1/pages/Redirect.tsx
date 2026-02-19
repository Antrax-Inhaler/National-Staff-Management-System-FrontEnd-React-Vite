import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@v1/contexts/AuthContext";

function Redirect() {
  const { userRole, loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [targetPath, setTargetPath] = useState("/dashboard");
  const [statusText, setStatusText] = useState("Checking authentication");
  const [showCheckIcon, setShowCheckIcon] = useState(false);

  // Progress animation
  useEffect(() => {
    if (!redirecting) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 1;
        });
      }, 25);

      return () => clearInterval(timer);
    }
  }, [redirecting]);

  // Update status text based on progress
  useEffect(() => {
    if (redirecting) return;

    if (progress < 25) {
      setStatusText("Verifying your identity");
    } else if (progress < 50) {
      setStatusText("Validating session");
      if (progress === 25) {
        showCheckIconAnimation();
      }
    } else if (progress < 75) {
      setStatusText("Loading permissions");
      if (progress === 50) {
        showCheckIconAnimation();
      }
    } else if (progress < 100) {
      setStatusText("Preparing dashboard");
      if (progress === 75) {
        showCheckIconAnimation();
      }
    } else if (progress === 100) {
      setStatusText("Finalizing");
      showCheckIconAnimation();
    }
  }, [progress, redirecting]);

  const showCheckIconAnimation = () => {
    setShowCheckIcon(true);
    setTimeout(() => {
      setShowCheckIcon(false);
    }, 500);
  };

  // Get target description
  const getTargetDescription = () => {
    if (targetPath.includes("/members/")) return "member profile";
    if (targetPath === "/dashboard") return "dashboard";
    if (targetPath.includes("/affiliates/")) return "affiliate";
    return "page";
  };

  useEffect(() => {
    // Wait for loading to complete before making any decisions
    if (loading) return;

    const searchParams = new URLSearchParams(window.location.search);
    const redirectParam = searchParams.get("redirect");

    // Case 1: User has session and roles - redirect to intended destination
    if (session && userRole && userRole.roles.length > 0) {
      // Only redirect if we're on the redirect page itself (path is "/" or "/redirect")
      if (location.pathname === "/" || location.pathname === "/redirect") {
        setRedirecting(true);
        setProgress(100);
        setStatusText("Finalizing");

        const redirectPath = redirectParam || "/dashboard";
        setTargetPath(redirectPath);

        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1200);
      }
      // If we're on any other page, don't redirect - user is already where they need to be
      return;
    }

    // Case 2: No session - redirect to login
    if (!session) {
      const loginPath = redirectParam
        ? `/login?redirect=${encodeURIComponent(redirectParam)}`
        : "/login";
      navigate(loginPath, { replace: true });
      return;
    }

    // Case 3: Has session but no roles yet - wait for roles to load
    // (This is handled by showing the loading screen)
  }, [loading, session, userRole, navigate, location.pathname]);

  // Show loading screen only when actually loading or redirecting from the redirect page
  if (
    loading ||
    (redirecting &&
      (location.pathname === "/" || location.pathname === "/redirect"))
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 overflow-hidden bg-gray-50">
        <div className="w-full max-w-sm text-center">
          {/* Logo section - Same design as ProtectedLayout */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative mb-6">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-15 -inset-2"></div>

              {/* Logo container */}
              <div className="relative">
                <img
                  src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png"
                  alt="ORG Logo"
                  className="relative z-10 w-20 h-20 p-2 bg-white rounded-full"
                />
                {/* Thicker spinning ring */}
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
              </div>
            </div>

            {/* Title and subtitle - Using same pattern as ProtectedLayout */}
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              {redirecting ? "Almost There!" : "Welcome Back"}
            </h1>
            <p className="text-sm text-gray-600">
              {redirecting
                ? `Taking you to your ${getTargetDescription()}`
                : progress < 50
                  ? "Verifying your identity"
                  : "Loading your workspace"}
            </p>
          </div>

          {/* Progress bar - Same design as ProtectedLayout */}
          <div className="w-1/2 mx-auto mb-2">
            <div className="flex justify-between mb-2 text-xs text-gray-500">
              <span>Loading</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="relative h-full transition-all duration-300 ease-out bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Status indicator - Same design */}
          <div className="inline-flex items-center text-sm text-gray-600 bg-gray-100 px-4 py-2.5 rounded-full">
            <div className="mr-2">
              {showCheckIcon ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scaleIn" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              )}
            </div>
            <span>{statusText}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default case - render nothing (page will be handled by route protection)
  return null;
}

export default Redirect;
