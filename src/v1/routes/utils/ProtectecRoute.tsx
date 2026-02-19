import { useAuth } from "@v1/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

function ProtectecRoute() {
  const { session, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-gray-900 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">
            "Verifying login link and fetching roles..."
          </p>
        </div>
      </div>
    );

  if (!session) return <Navigate to={"/"} />;

  return <Outlet />;
}

export default ProtectecRoute;
