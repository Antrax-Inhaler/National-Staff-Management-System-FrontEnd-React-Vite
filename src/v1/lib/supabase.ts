import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create a custom storage provider that handles clock skew
const customStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("LocalStorage access denied:", error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("LocalStorage access denied:", error);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("LocalStorage access denied:", error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    // Headers for development to handle clock skew
    headers: {
      "X-Client-Info": "supabase-js-web/2.0.0",
    },
  },
});

// Monkey patch the session handling to be more lenient (development only)
if (import.meta.env.DEV) {
  const originalGetSessionFromURL = (supabase.auth as any).getSessionFromURL;

  (supabase.auth as any).getSessionFromURL = async function (options: any) {
    try {
      return await originalGetSessionFromURL.call(this, options);
    } catch (error: any) {
      if (error.message.includes("future") || error.message.includes("clock")) {
        console.warn("Clock skew detected, but proceeding anyway");
        // Try to extract session from URL manually
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        return {
          data: {
            session: {
              access_token: params.get("access_token"),
              refresh_token: params.get("refresh_token"),
              expires_in: parseInt(params.get("expires_in") || "3600"),
              token_type: params.get("token_type"),
              user: null,
            },
          },
          error: null,
        };
      }
      throw error;
    }
  };
}
