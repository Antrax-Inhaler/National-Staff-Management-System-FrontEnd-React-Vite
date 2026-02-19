import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@v1/contexts/AuthContext";
import { checkUserExists } from "@v1/api/checkUserExists";
import { supabase } from "@v1/lib/supabase";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [clockWarning, setClockWarning] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  
  // Countdown state
  const [countdown, setCountdown] = useState(0);
  const [lastEmailSent, setLastEmailSent] = useState<number | null>(null);
  const [emailSentSuccessfully, setEmailSentSuccessfully] = useState(false);
  
  const navigate = useNavigate();
  const { session, logoutReason } = useAuth();

  // Check localStorage for last email sent time
  useEffect(() => {
    const savedTime = localStorage.getItem(`lastEmailSent_${email}`);
    if (savedTime) {
      setLastEmailSent(parseInt(savedTime, 10));
    }
  }, [email]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setEmailSentSuccessfully(false); // Reset when countdown finishes
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  // Check if user needs to wait before resending
  useEffect(() => {
    if (lastEmailSent) {
      const now = Date.now();
      const timeSinceLastEmail = Math.floor((now - lastEmailSent) / 1000);
      const cooldownPeriod = 60; // 60 seconds cooldown
      
      if (timeSinceLastEmail < cooldownPeriod) {
        setCountdown(cooldownPeriod - timeSinceLastEmail);
        setEmailSentSuccessfully(true); // Show that email was already sent
      }
    }
  }, [lastEmailSent]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: checkUserExists,
    onSuccess: async () => {
      // Get redirect parameter from URL or use dashboard as default
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get("redirect");
      const redirectUrl = redirectParam || "/dashboard";

      // Attempt to send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${
            window.location.origin
          }/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
        },
      });

      if (error) {
        // Use normalized error message
        const normalizedError = normalizeErrorMessage(error.message);
        setMessage(normalizedError);

        // Special handling for clock warning state
        if (normalizedError.includes("Clock synchronization")) {
          setClockWarning(true);
        }
      } else {
        // Store the time when email was successfully sent
        const now = Date.now();
        setLastEmailSent(now);
        localStorage.setItem(`lastEmailSent_${email}`, now.toString());
        
        // Set countdown (60 seconds cooldown)
        setCountdown(60);
        setEmailSentSuccessfully(true); // Mark email as sent successfully
        
        // Update message with countdown
        setMessage(`✅ Check your email for the magic login link. You can request a new link in 60 seconds.`);
      }
    },
    onError: (err) => {
      setMessage(`${err.message}`);
      setEmailSentSuccessfully(false); // Reset on error
    },
  });

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error === "session_expired") {
      setMessage("🔒 Your session has expired. Please log in again.");
    } else if (error === "auth_failed") {
      setMessage("Your login link has expired. Please request a new one.");
    } else if (error === "expired") {
      setMessage("🔒 Your login link has expired. Please request a new one.");
    } else if (error === "timeout") {
      setMessage("⏱️ Authentication timed out. Please try again.");
    } else if (error === "no_permissions") {
      setMessage("🚫 You don't have permission to access this portal. Please contact your administrator.");
    } else if (errorDescription) {
      setMessage(`❌ ${errorDescription}`);
    }

    if (logoutReason === "inactivity") {
      setMessage(
        "🔒 Your session has ended due to inactivity. Please log in again."
      );
    }

    if (session) {
      const timer = setTimeout(() => navigate("/", { replace: true }), 100);
      return () => clearTimeout(timer);
    }
  }, [session, navigate, logoutReason, searchParams]);

  // Update message when countdown changes
  useEffect(() => {
    if (countdown > 0 && message.startsWith("✅")) {
      setMessage(`✅ Check your email for the magic login link. You can request a new link in ${countdown} seconds.`);
    } else if (countdown === 0 && message.startsWith("✅")) {
      setMessage("✅ Check your email for the magic login link. You can now request a new link if needed.");
    }
  }, [countdown, message]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't allow changes if countdown is active or if pending
    if (countdown > 0 || isPending) return;
    
    const value = e.target.value.toLowerCase();
    setEmail(value);

    const isValid = validateEmail(value);
    setIsEmailValid(isValid);

    if (emailError) {
      setEmailError("");
    }

    if (message) {
      setMessage("");
    }
    
    // Reset clock warning when email changes
    if (clockWarning) {
      setClockWarning(false);
    }
  };

  const normalizeErrorMessage = (errorMsg: string): string => {
    if (
      !errorMsg ||
      errorMsg.toLowerCase() === "undefined" ||
      errorMsg.trim() === ""
    ) {
      return "Something went wrong. Please try again later.";
    }

    if (
      errorMsg.includes("future") ||
      errorMsg.includes("clock") ||
      errorMsg.includes("skew")
    ) {
      setClockWarning(true);
      return "⚠️ Clock synchronization issue detected. Please check your device's time settings.";
    }

    if (
      errorMsg.includes("network") ||
      errorMsg.includes("fetch") ||
      errorMsg.includes("connection")
    ) {
      return "❌ Network error. Please check your internet connection and try again.";
    }

    // Handle rate limiting errors
    if (
      errorMsg.includes("rate") ||
      errorMsg.includes("limit") ||
      errorMsg.includes("too many")
    ) {
      return "❌ Too many attempts. Please wait a moment before trying again.";
    }

    // For other errors, clean up the message
    let cleanMsg = errorMsg;

    // Remove common prefixes if present
    const prefixes = [
      "error: ",
      "Error: ",
      "ERR: ",
      "AuthApiError: ",
      "AuthError: ",
    ];
    prefixes.forEach((prefix) => {
      if (cleanMsg.startsWith(prefix)) {
        cleanMsg = cleanMsg.substring(prefix.length);
      }
    });

    // Capitalize first letter if it's lowercase
    if (cleanMsg.length > 0 && /^[a-z]/.test(cleanMsg)) {
      cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
    }

    return `❌ ${cleanMsg}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailValid) {
      setEmailError("❌ Please enter a valid email address");
      return;
    }
    
    // Check if countdown is active
    if (countdown > 0) {
      setMessage(`⏱️ Please wait ${countdown} seconds before requesting a new magic link.`);
      return;
    }
    
    setMessage("");
    setEmailError("");
    setClockWarning(false); // Reset clock warning on new attempt
    mutateAsync(email);
  };

  // Check if button should be disabled
  const isButtonDisabled = isPending || !isEmailValid;
  
  // Determine button text
  const getButtonText = () => {
    if (isPending) return "Sending...";
    return "Send Magic Link";
  };

  // Show button when:
  // 1. Not pending (not currently sending)
  // 2. Email is valid
  // 3. Email was not sent successfully (no active countdown)
  const showButton = !emailSentSuccessfully || countdown === 0;
  
  // Disable email input during countdown OR while sending
  const isEmailInputDisabled = countdown > 0 || isPending;

  return (
    <>
      {/* Main Login Content */}
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Logo and Header Section */}
          <div className="mb-6 text-center">
            {/* ORG Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png"
                alt="ORG Logo"
                className="w-20 h-20 md:w-24 md:h-24"
              />
            </div>

            <h1 className="mb-1 text-xl font-semibold text-gray-900 md:text-2xl">
              ORG Member Portal
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Enter your email to receive a magic link
            </p>
          </div>

          {clockWarning && (
            <div className="p-3 mb-4 border border-yellow-200 rounded-md bg-yellow-50">
              <p className="text-sm text-yellow-800">
                ⚠️ Clock synchronization issue detected. Please check your
                device's time settings.
              </p>
            </div>
          )}

          {/* Inactivity Logout Warning */}
          {logoutReason === "inactivity" && (
            <div className="p-3 mb-4 border border-blue-200 rounded-md bg-blue-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Session Timeout
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>
                      You were automatically logged out due to 1 hour of
                      inactivity. Please log in again to continue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm font-medium text-gray-700 md:text-base"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-1 md:text-base lowercase ${
                  isEmailInputDisabled 
                    ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed" 
                    : "border-gray-300 focus:ring-gray-800 focus:border-gray-800"
                }`}
                value={email}
                onChange={handleEmailChange}
                required
                disabled={isEmailInputDisabled}
                style={{ textTransform: "lowercase" }}
              />
              {emailError && (
                <p className="mt-1 text-xs text-justify text-red-600 md:text-sm">
                  {emailError}
                </p>
              )}
            </div>

            {/* Show button when sending OR when countdown is finished */}
            {showButton && (
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full py-2.5 px-3 rounded-md text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 disabled:cursor-not-allowed md:text-base md:py-3 transition-colors duration-200 flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  getButtonText()
                )}
              </button>
            )}
          </form>

          {message && !logoutReason && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : message.startsWith("⚠️") || message.startsWith("⏱️")
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  {message.startsWith("✅") && (
                    <svg className="w-4 h-4 mt-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {(message.startsWith("⚠️") || message.startsWith("⏱️")) && (
                    <svg className="w-4 h-4 mt-0.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {message.startsWith("❌") && (
                    <svg className="w-4 h-4 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={message.startsWith("✅") ? "text-green-800" : message.startsWith("⚠️") || message.startsWith("⏱️") ? "text-yellow-800" : "text-red-800"}>
                    {message.replace(/^[✅⚠️⏱️❌]+\s*/, "")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-xs text-center text-gray-500 md:text-sm">
            By continuing, you agree to our{" "}
            <a href="#" className="font-medium text-gray-900 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a
              href="https://organization.org/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-900 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </>
  );
}