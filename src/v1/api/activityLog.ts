import { request } from "../lib/apiRequest";

export interface ActivityLog {
  id: number;
  action: string;
  auditable_type: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const response = await request("user-logs");
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result.data || [];
}
