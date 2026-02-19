import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import { useAuth } from "../contexts/AuthContext";
import InternetStatusStripAdvanced from "../components/InternetStatusStripAdvanced";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from '../lib/supabase';

function ProtectedLayout() {
  const { session, loading, userRole, rolesError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [statusText, setStatusText] = useState("Verifying your identity");
  const [showCheckIcon, setShowCheckIcon] = useState(false);
  const [step, setStep] = useState(0);

  // Step progression
  useEffect(() => {
    if (!loading && userRole?.display_name) return;

    const steps = [
      "Verifying your identity",
      "Loading your workspace",
      "Preparing your interface",
      "Securing your session"
    ];

    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [loading, userRole?.display_name]);

  // Update status text based on step
  useEffect(() => {
    if (!loading && userRole?.display_name) return;

    const steps = [
      "Verifying your identity",
      "Loading your workspace",
      "Preparing your interface",
      "Securing your session"
    ];

    if (step < steps.length) {
      setStatusText(steps[step]);
      if (step > 0) {
        showCheckIconAnimation();
      }
    }
  }, [step, loading, userRole?.display_name]);

  // Complete when done
  useEffect(() => {
    if (!loading && userRole?.display_name) {
      setStatusText("Ready");
      showCheckIconAnimation();
    }
  }, [loading, userRole?.display_name]);

  const showCheckIconAnimation = () => {
    setShowCheckIcon(true);
    setTimeout(() => {
      setShowCheckIcon(false);
    }, 500);
  };

useEffect(() => {
  // Don't do anything while still loading
  if (loading) return;

  // If session exists but userRole failed to load (likely 401)
  if (session && rolesError) {
    console.log('User roles failed to load, signing out...');
    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      const redirectPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}&error=session_expired`, { 
        replace: true 
      });
    }, 1000);
    return () => clearTimeout(timer);
  }

  // If no session after loading is complete, redirect to login
  if (!session) {
    const redirectPath = location.pathname + location.search;
    navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { 
      replace: true 
    });
  }
}, [loading, session, rolesError, navigate, location.pathname, location.search]);
  if (loading || (session && !userRole?.display_name)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 overflow-hidden bg-gray-50">
        <div className="w-full max-w-sm text-center">
          {/* Logo section */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative mb-8">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-15 -inset-2"></div>
              
              {/* Logo container */}
              <div className="relative">
                <img 
                  src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png" 
                  alt="ORG Logo"
                  className="relative z-10 w-24 h-24 p-2 bg-white rounded-full"
                />
                {/* Thicker spinning ring */}
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
              </div>
            </div>
            
            {/* Title and subtitle */}
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              ORG Portal
            </h1>
            <p className="mb-2 text-sm text-gray-600">
              Secure Staff Management Platform
            </p>
          </div>

          {/* Status indicator - Now the main focus without progress bar */}
          <div className="inline-flex items-center px-5 py-3 text-sm text-gray-600 bg-gray-100 rounded-full shadow-sm">
            <div className="mr-3">
              {showCheckIcon ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-scaleIn" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
            </div>
            <span className="font-medium">{statusText}</span>
          </div>

          {/* Optional: Subtle step indicators (dots) */}
          <div className="flex justify-center mt-8 space-x-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= step
                    ? index === step
                      ? 'bg-blue-500 scale-125'
                      : 'bg-blue-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If loading is complete and still no session, redirect will happen via useEffect
  // Return null briefly while redirect is happening
  if (!session) {
    return null;
  }

  // Main layout - only render when we have both session and userRole
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex flex-col flex-1 w-full overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
      <InternetStatusStripAdvanced />
    </div>
  );
}

export default ProtectedLayout;