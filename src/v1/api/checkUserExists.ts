// @v1/api/checkUserExists.ts
import { request } from "@v1/lib/apiRequest";

export const checkUserExists = async (email: string): Promise<boolean> => {
  // This endpoint should be accessible without auth, so we need a special request function
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const response = await fetch(`${API_BASE_URL}/check-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found. Please contact your administrator.");
    }
    if (response.status === 400) {
      throw new Error(result.message || "Invalid email address.");
    }
    throw new Error(result.message || "An unexpected error occurred. Please try again later.");
  }

  if (!result.exists) {
    throw new Error(result.message || "User not found. Please contact your administrator.");
  }

  return result.exists;
};