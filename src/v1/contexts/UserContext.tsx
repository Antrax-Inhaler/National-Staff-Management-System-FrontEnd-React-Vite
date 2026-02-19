import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { request } from "../lib/apiRequest";

interface UserContextType {
  roles: string[];
  permissions: string[];
  affiliate_id: number | null;
  position: string;
  // Add more user data here
  profile: any | null;
  preferences: any | null;
  loading: boolean;
  error: Error | null;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  roles: [],
  permissions: [],
  affiliate_id: null,
  position: "",
  profile: null,
  preferences: null,
  loading: true,
  error: null,
  refreshUserData: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();

  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [affiliate_id, setAffiliateId] = useState<number | null>(null);
  const [position, setPosition] = useState<string>("");
  const [profile, setProfile] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = async () => {
    if (!user) {
      // Clear data when no user
      setRoles([]);
      setPermissions([]);
      setAffiliateId(null);
      setPosition("");
      setProfile(null);
      setPreferences(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch roles and permissions
      const rolesRes = await request("api/user/roles-permissions");
      if (!rolesRes.ok) throw new Error("Failed to fetch roles/permissions");
      const rolesData = await rolesRes.json();

      setRoles(rolesData.roles || []);
      setPermissions(rolesData.permissions || []);
      setAffiliateId(rolesData.affiliate || null);
      setPosition(rolesData.position || "");

    } catch (err) {
      console.error("Failed to load user data:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    await fetchUserData();
  };

  // Fetch user data when user changes
  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only re-fetch when user ID changes

  return (
    <UserContext.Provider
      value={{
        roles,
        permissions,
        affiliate_id,
        position,
        profile,
        preferences,
        loading,
        error,
        refreshUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
