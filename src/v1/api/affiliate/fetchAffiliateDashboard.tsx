import { request } from "../../lib/apiRequest";

export async function fetchAffiliateDashboard() {
  try {
    const response = await request("affiliate/dashboard");

    if (!response.ok) throw new Error("Failed to fetch dashboard data");

    const result = await response.json();

    return result.data;

  } catch (err: any) {
    
    throw new Error("Failed to fetch dashboard data");
  }
}
