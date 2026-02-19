// src/components/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/api/check-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.exists;
    }
    return false;
  } catch (error) {
    coOrganizationle.error("Error checking user:", error);
    return false;
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [clockWarning, setClockWarning] = useState(false);
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const checkUserMutation = useMutation({
    mutationFn: checkUserExists,
  });

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "auth_failed")
      setMessage("Authentication failed. Please try again.");

    if (session && !authLoading) {
      const timer = setTimeout(
        () => navigate("/dashboard", { replace: true }),
        100
      );
      return () => clearTimeout(timer);
    }
  }, [session, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const exists = await checkUserMutation.mutateAsync(email);
    if (!exists) {
      setMessage("❌ No account found for that email.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (
        error.message.includes("future") ||
        error.message.includes("clock") ||
        error.message.includes("skew")
      ) {
        setClockWarning(true);
        setMessage(
          "⚠️ Clock synchronization issue detected. Please check your device's time settings."
        );
      } else {
        setMessage(`❌ ${error.message}`);
      }
    } else {
      setMessage("✅ Check your email for the magic login link.");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-gray-900 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <img
              src="https://organization.org/wp-content/uploads/Organization-logo-round_500-400x400.png"
              alt="Organization Logo"
              className="object-contain w-20 h-20 md:w-24 md:h-24"
            />
          </div>
          <div className="text-center">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">
              Organization Member Portal
            </h1>
            <p className="text-sm text-gray-600">
              Enter your email to receive a magic link
            </p>
          </div>
        </div>

        {clockWarning && (
          <div className="p-3 mb-4 border border-yellow-200 rounded-md bg-yellow-50">
            <p className="text-sm text-yellow-800">
              ⚠️ Clock synchronization issue detected. Please check your
              device's time settings.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email" // Add name attribute
              autoComplete="email" // Add autocomplete attribute
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-md text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              message.startsWith("✅")
                ? "bg-green-50 text-green-700 border border-green-200"
                : message.startsWith("⚠️")
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-xs text-center text-gray-500">
          By continuing, you agree to our{" "}
          <a href="#" className="font-medium text-gray-900 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="font-medium text-gray-900 hover:underline">
            Privacy Policy
          </a>
          .
        </div>

        {/* Powered by OMP Footer */}
        <div className="pt-4 mt-8 text-center border-t border-gray-200">
          <a 
            href="https://organizemypeople.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-500 transition-colors hover:text-gray-700"
          >
            Powered by OMP
          </a>
        </div>
      </div>
    </div>
  );
}