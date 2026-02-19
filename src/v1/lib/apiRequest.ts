import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function request(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  try {
    // Get current session and refresh if needed
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      throw sessionError;
    }

    if (!session) {
      console.error("No session available");
      // Return a 401 response to trigger logout
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "No active session",
        }),
        {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");

    // IMPORTANT: Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Add the authorization token
    headers.set("Authorization", `Bearer ${session.access_token}`);

    // console.log(`Making request to: ${API_BASE_URL}/${path}`);
    // console.log(`Token available: ${!!session.access_token}`);

    const response = await fetch(`${API_BASE_URL}/${path}`, {
      ...options,
      headers,
    });

    // Handle 401 responses - token might be expired
    if (response.status === 401) {
      console.log("Received 401, attempting to refresh token...");

      // Try to refresh the session
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError || !refreshedSession) {
        console.error("Failed to refresh session:", refreshError);
        // Force sign out
        await supabase.auth.signOut();
        return response; // Return original 401
      }

      // Retry the request with new token
      headers.set("Authorization", `Bearer ${refreshedSession.access_token}`);
      return await fetch(`${API_BASE_URL}/${path}`, {
        ...options,
        headers,
      });
    }

    return response;
  } catch (error) {
    console.error("Request error:", error);
    throw new Error("Something went wrong, Please try again later");
  }
}
