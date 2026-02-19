import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, CheckCircle2, Clock, Shield } from "lucide-react";
import { useAuth } from "@v1/contexts/AuthContext";
import { supabase } from "@v1/lib/supabase";

// function Redirect() {
//   const { userRole, loading, session } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [progress, setProgress] = useState(0);
//   const [redirecting, setRedirecting] = useState(false);
//   const [targetPath, setTargetPath] = useState("/dashboard");
//   const [statusText, setStatusText] = useState("Verifying your identity");
//   const [showCheckIcon, setShowCheckIcon] = useState(false);
//   const [errorType, setErrorType] = useState<'expired' | 'invalid' | 'timeout' | null>(null);
//   const [retryCount, setRetryCount] = useState(0);

//   // Check for error parameters in URL
//   useEffect(() => {
//     const searchParams = new URLSearchParams(location.search);
//     const errorParam = searchParams.get('error');
//     const errorDescription = searchParams.get('error_description');

//     if (errorParam || errorDescription) {
//       if (errorDescription?.includes('expired') || errorParam === 'expired') {
//         setErrorType('expired');
//         setStatusText("Link has expired");
//       } else if (errorParam === 'invalid') {
//         setErrorType('invalid');
//         setStatusText("Invalid link");
//       }

//       // Redirect to login after 4 seconds
//       setTimeout(() => {
//         navigate(`/login`, { replace: true });
//       }, 4000);
//     }
//   }, [location, navigate]);

//   // Progress animation
//   useEffect(() => {
//     if (!redirecting && !errorType) {
//       const timer = setInterval(() => {
//         setProgress((prev) => {
//           if (prev >= 100) {
//             clearInterval(timer);
//             return 100;
//           }
//           return prev + 1;
//         });
//       }, 25);

//       return () => clearInterval(timer);
//     }
//   }, [redirecting, errorType]);

//   // Update status text based on progress
//   useEffect(() => {
//     if (redirecting || errorType) return;

//     if (progress < 25) {
//       setStatusText("Verifying your identity");
//     } else if (progress < 50) {
//       setStatusText("Validating session");
//       if (progress === 25) {
//         showCheckIconAnimation();
//       }
//     } else if (progress < 75) {
//       setStatusText("Loading permissions");
//       if (progress === 50) {
//         showCheckIconAnimation();
//       }
//     } else if (progress < 100) {
//       setStatusText("Preparing dashboard");
//       if (progress === 75) {
//         showCheckIconAnimation();
//       }
//     } else if (progress === 100) {
//       setStatusText("Finalizing");
//       showCheckIconAnimation();
//     }
//   }, [progress, redirecting, errorType]);

//   const showCheckIconAnimation = () => {
//     setShowCheckIcon(true);
//     setTimeout(() => {
//       setShowCheckIcon(false);
//     }, 500);
//   };

//   // Handle timeout for authentication
//   useEffect(() => {
//     if (loading || errorType) return;

//     const authTimeout = setTimeout(() => {
//       if (!session && !redirecting) {
//         setErrorType('timeout');
//         setStatusText("Taking longer");

//         setTimeout(() => {
//           navigate(`/login`, { replace: true });
//         }, 4000);
//       }
//     }, 8000);

//     return () => clearTimeout(authTimeout);
//   }, [loading, session, redirecting, navigate, errorType]);

//   useEffect(() => {
//     if (loading || errorType) return;

//     if (!session && location.pathname === '/') {
//       navigate('/login', { replace: true });
//       return;
//     }

//     if (session && userRole.roles.length > 0) {
//       setRedirecting(true);
//       setProgress(100);
//       setStatusText("Finalizing");

//       const searchParams = new URLSearchParams(window.location.search);
//       const redirectParam = searchParams.get('redirect');
//       const redirectPath = redirectParam || '/dashboard';
//       setTargetPath(redirectPath);

//       setTimeout(() => {
//         navigate(redirectPath, { replace: true });
//       }, 1200);
//       return;
//     }

//     if (session && userRole.roles.length === 0) {
//       const retryTimer = setTimeout(() => {
//         if (retryCount < 2) {
//           setRetryCount(prev => prev + 1);
//         } else {
//           setTimeout(() => {
//             navigate(`/login`, { replace: true });
//           }, 4000);
//         }
//       }, 2500);

//       return () => clearTimeout(retryTimer);
//     }

//     if (!loading && !session && location.pathname !== '/') {
//       const searchParams = new URLSearchParams(window.location.search);
//       const redirectParam = searchParams.get('redirect');
//       const loginPath = redirectParam
//         ? `/login?redirect=${encodeURIComponent(redirectParam)}`
//         : `/login`;

//       navigate(loginPath, { replace: true });
//     }
//   }, [loading, session, userRole.roles, navigate, location, retryCount, errorType]);

//   // Error/Expired Link Screen
//   if (errorType) {
//     const getErrorConfig = () => {
//       switch(errorType) {
//         case 'expired':
//           return {
//             title: "Link Expired",
//             subtitle: "For security, links expire after a certain time",
//             description: "This login link has expired for security reasons",
//             icon: <Clock className="w-5 h-5 text-blue-500" />
//           };
//         case 'invalid':
//           return {
//             title: "Invalid Link",
//             subtitle: "The link appears to be incorrect or tampered with",
//             description: "This login link appears to be invalid",
//             icon: <Shield className="w-5 h-5 text-gray-500" />
//           };
//         case 'timeout':
//           return {
//             title: "Taking a While",
//             subtitle: "We'll help you get back on track",
//             description: "Taking longer than usual to verify",
//             icon: <Clock className="w-5 h-5 text-blue-500" />
//           };
//         default:
//           return {
//             title: "Oops",
//             subtitle: "Something went wrong",
//             description: "We encountered an issue",
//             icon: <Shield className="w-5 h-5 text-gray-500" />
//           };
//       }
//     };

//     const errorConfig = getErrorConfig();

//     return (
//       <div className="flex items-center justify-center min-h-screen px-4 overflow-hidden bg-gray-50">
//         <div className="w-full max-w-sm text-center">
//           {/* Logo section - Same design */}
//           <div className="flex flex-col items-center mb-2">
//             <div className="relative mb-6">
//               {/* Glow effect - using blue for consistency */}
//               <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-15 -inset-2"></div>

//               {/* Logo container */}
//               <div className="relative">
//                 <img
//                   src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png"
//                   alt="ORG Logo"
//                   className="relative z-10 w-20 h-20 p-2 bg-white rounded-full"
//                 />
//                 {/* Spinning ring - same thickness */}
//                 <div className="absolute inset-0 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
//               </div>
//             </div>

//             {/* Title and subtitle */}
//             <h1 className="mb-2 text-xl font-bold text-gray-900">
//               {errorConfig.title}
//             </h1>
//             <p className="text-sm text-gray-600">
//               {errorConfig.subtitle}
//             </p>
//           </div>

//           {/* Error message - minimal and clean */}
//           <div className="px-4 py-3 mb-6 bg-gray-100 rounded-lg">
//             <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
//               <div>
//                 {errorConfig.icon}
//               </div>
//               <span>{errorConfig.description}</span>
//             </div>
//           </div>

//           {/* Status indicator - Same design */}
//           <div className="inline-flex items-center text-sm text-gray-600 bg-gray-100 px-4 py-2.5 rounded-full">
//             <div className="mr-2">
//               <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
//             </div>
//             <span>Redirecting to login...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Normal Loading Screen
//   if (loading || redirecting || (session && userRole.roles.length === 0)) {
//     const getTargetDescription = () => {
//       if (targetPath.includes('/members/')) return 'member profile';
//       if (targetPath === '/dashboard') return 'dashboard';
//       if (targetPath.includes('/affiliates/')) return 'affiliate';
//       return 'page';
//     };

//     return (
//       <div className="flex items-center justify-center min-h-screen px-4 overflow-hidden bg-gray-50">
//         <div className="w-full max-w-sm text-center">
//           {/* Logo section */}
//           <div className="flex flex-col items-center mb-2">
//             <div className="relative mb-6">
//               {/* Glow effect */}
//               <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-15 -inset-2"></div>

//               {/* Logo container */}
//               <div className="relative">
//                 <img
//                   src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png"
//                   alt="ORG Logo"
//                   className="relative z-10 w-20 h-20 p-2 bg-white rounded-full"
//                 />
//                 <div className="absolute inset-0 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
//               </div>
//             </div>

//             <h1 className="mb-2 text-xl font-bold text-gray-900">
//               {redirecting ? "Almost There!" : "Welcome Back"}
//             </h1>
//             <p className="text-sm text-gray-600">
//               {redirecting
//                 ? `Taking you to your ${getTargetDescription()}`
//                 : (progress < 50 ? "Verifying your identity" : "Loading your workspace")}
//             </p>
//           </div>

//           {/* Progress bar */}
//           <div className="w-1/2 mx-auto mb-2">
//             <div className="flex justify-between mb-2 text-xs text-gray-500">
//               <span>Loading</span>
//               <span>{progress}%</span>
//             </div>
//             <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
//               <div
//                 className="relative h-full transition-all duration-300 ease-out bg-blue-500 rounded-full"
//                 style={{ width: `${progress}%` }}
//               >
//                 {/* Shimmer effect */}
//                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
//               </div>
//             </div>
//           </div>

//           {/* Status indicator */}
//           <div className="inline-flex items-center text-sm text-gray-600 bg-gray-100 px-4 py-2.5 rounded-full">
//             <div className="mr-2">
//               {showCheckIcon ? (
//                 <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scaleIn" />
//               ) : (
//                 <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
//               )}
//             </div>
//             <span>{statusText}</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Default case
//   return null;
// }

// export default Redirect;

function AuthCallback() {
  const { userRole, loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [targetPath, setTargetPath] = useState("/dashboard");
  const [statusText, setStatusText] = useState("Verifying your identity");
  const [showCheckIcon, setShowCheckIcon] = useState(false);
  const [errorType, setErrorType] = useState<
    "expired" | "invalid" | "timeout" | null
  >(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);

  // Verify OTP token from URL
  useEffect(() => {
    const verifyToken = async () => {
      const searchParams = new URLSearchParams(location.search);
      const tokenHash = searchParams.get("token");
      const type = searchParams.get("type") || "email";
      const redirectParam = searchParams.get("redirect");

      // Skip if no token or already verifying or already has session
      if (!tokenHash || isVerifyingToken || session) {
        return;
      }

      setIsVerifyingToken(true);
      setStatusText("Verifying your token");

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (error) {
          console.error("Token verification error:", error);

          // Handle specific error types
          if (error.message.includes("expired")) {
            setErrorType("expired");
            setStatusText("Link has expired");
          } else if (error.message.includes("invalid")) {
            setErrorType("invalid");
            setStatusText("Invalid link");
          } else {
            setErrorType("invalid");
            setStatusText("Verification failed");
          }

          // Redirect to login after 4 seconds
          setTimeout(() => {
            navigate(`/login`, { replace: true });
          }, 4000);
        } else if (data.session) {
          // Token verified successfully
          setStatusText("Verification successful");
          showCheckIconAnimation();
          setProgress(100);
          setRedirecting(true);

          const redirectPath = redirectParam || "/dashboard";
          setTargetPath(redirectPath);

          // Brief delay for visual feedback, then redirect
          setTimeout(() => {
            navigate(redirectPath);
          }, 800);
        }
      } catch (err) {
        console.error("Unexpected error during token verification:", err);
        setErrorType("invalid");
        setStatusText("Unexpected error occurred");

        setTimeout(() => {
          navigate(`/login`, { replace: true });
        }, 4000);
      }
    };

    verifyToken();
  }, [location.search, session, isVerifyingToken, navigate]);

  // Check for error parameters in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam || errorDescription) {
      if (errorDescription?.includes("expired") || errorParam === "expired") {
        setErrorType("expired");
        setStatusText("Link has expired");
      } else if (errorParam === "invalid") {
        setErrorType("invalid");
        setStatusText("Invalid link");
      }

      // Redirect to login after 4 seconds
      setTimeout(() => {
        navigate(`/login`, { replace: true });
      }, 4000);
    }
  }, [location.search, navigate]);

  // Progress animation
  useEffect(() => {
    if (!redirecting && !errorType) {
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
  }, [redirecting, errorType]);

  // Update status text based on progress
  useEffect(() => {
    if (redirecting || errorType) return;

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
  }, [progress, redirecting, errorType]);

  const showCheckIconAnimation = () => {
    setShowCheckIcon(true);
    setTimeout(() => {
      setShowCheckIcon(false);
    }, 500);
  };

  // Handle timeout for authentication
  useEffect(() => {
    if (loading || errorType || isVerifyingToken) return;

    const authTimeout = setTimeout(() => {
      if (!session && !redirecting) {
        setErrorType("timeout");
        setStatusText("Taking longer than expected");

        setTimeout(() => {
          navigate(`/login`, { replace: true });
        }, 4000);
      }
    }, 10000); // Increased to 10 seconds to allow for token verification

    return () => clearTimeout(authTimeout);
  }, [loading, session, redirecting, navigate, errorType, isVerifyingToken]);

  // Handle navigation after successful authentication
  useEffect(() => {
    if (loading || errorType || isVerifyingToken) return;

    if (!session && location.pathname === "/") {
      navigate("/login", { replace: true });
      return;
    }

    if (session && userRole) {
      setRedirecting(true);
      setProgress(100);
      setStatusText("Finalizing");

      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get("redirect");
      const redirectPath = redirectParam || "/dashboard";
      setTargetPath(redirectPath);

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1200);
      return;
    }

    if (session && userRole) {
      const retryTimer = setTimeout(() => {
        if (retryCount < 2) {
          setRetryCount((prev) => prev + 1);
        } else {
          setTimeout(() => {
            navigate(`/login`, { replace: true });
          }, 4000);
        }
      }, 2500);

      return () => clearTimeout(retryTimer);
    }

    if (!loading && !session && location.pathname !== "/") {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get("redirect");
      const loginPath = redirectParam
        ? `/login?redirect=${encodeURIComponent(redirectParam)}`
        : `/login`;

      navigate(loginPath, { replace: true });
    }
  }, [
    loading,
    session,
    userRole,
    navigate,
    location,
    retryCount,
    errorType,
    isVerifyingToken,
  ]);

  // Error/Expired Link Screen
  if (errorType) {
    const getErrorConfig = () => {
      switch (errorType) {
        case "expired":
          return {
            title: "Link Expired",
            subtitle: "For security, links expire after a certain time",
            description: "This login link has expired for security reasons",
            icon: <Clock className="w-5 h-5 text-blue-500" />,
          };
        case "invalid":
          return {
            title: "Invalid Link",
            subtitle: "The link appears to be incorrect or tampered with",
            description: "This login link appears to be invalid",
            icon: <Shield className="w-5 h-5 text-gray-500" />,
          };
        case "timeout":
          return {
            title: "Taking a While",
            subtitle: "We'll help you get back on track",
            description: "Taking longer than usual to verify",
            icon: <Clock className="w-5 h-5 text-blue-500" />,
          };
        default:
          return {
            title: "Oops",
            subtitle: "Something went wrong",
            description: "We encountered an issue",
            icon: <Shield className="w-5 h-5 text-gray-500" />,
          };
      }
    };

    const errorConfig = getErrorConfig();

    return (
      <div className="flex items-center justify-center min-h-screen px-4 overflow-hidden bg-gray-50">
        <div className="w-full max-w-sm text-center">
          {/* Logo section - Same design */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative mb-6">
              {/* Glow effect - using blue for consistency */}
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-15 -inset-2"></div>

              {/* Logo container */}
              <div className="relative">
                <img
                  src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png"
                  alt="ORG Logo"
                  className="relative z-10 w-20 h-20 p-2 bg-white rounded-full"
                />
                {/* Spinning ring - same thickness */}
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
              </div>
            </div>

            {/* Title and subtitle */}
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              {errorConfig.title}
            </h1>
            <p className="text-sm text-gray-600">{errorConfig.subtitle}</p>
          </div>

          {/* Error message - minimal and clean */}
          <div className="px-4 py-3 mb-6 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div>{errorConfig.icon}</div>
              <span>{errorConfig.description}</span>
            </div>
          </div>

          {/* Status indicator - Same design */}
          <div className="inline-flex items-center text-sm text-gray-600 bg-gray-100 px-4 py-2.5 rounded-full">
            <div className="mr-2">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  // Normal Loading Screen
  if (
    loading ||
    redirecting ||
    isVerifyingToken ||
    (session && userRole.roles.length === 0)
  ) {
    const getTargetDescription = () => {
      if (targetPath.includes("/members/")) return "member profile";
      if (targetPath === "/dashboard") return "dashboard";
      if (targetPath.includes("/affiliates/")) return "affiliate";
      return "page";
    };

    return (
      <div className="flex items-center justify-center min-h-screen px-4 overflow-hidden bg-gray-50">
        <div className="w-full max-w-sm text-center">
          {/* Logo section */}
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
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
              </div>
            </div>

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

          {/* Progress bar */}
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

          {/* Status indicator */}
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

  // Default case
  return null;
}

export default AuthCallback;
