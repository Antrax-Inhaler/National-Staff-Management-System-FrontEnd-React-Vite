import React from "react";
import { Navigate, Outlet, useOutlet } from "react-router-dom";
import Header from "./Header/Header";
import { useAuth } from "../contexts/AuthContext";
import { LoaderCircle, Settings } from "lucide-react";
import SubSidebar from "./Sidebar/SubSidebar";

function SettingLayout() {
  const { session, loading, userRole } = useAuth();
  const outlet = useOutlet();

  if (loading || !userRole.display_name)
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="text-center">
          <LoaderCircle className="w-12 h-12 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Verifying and fetching roles...</p>
        </div>
      </div>
    );

  if (!session) return <Navigate to={"/"} />;

  return (
    <div className="flex flex-1 min-h-[700px]">
      <SubSidebar />
      <div className="flex flex-col min-h-0  w-full lg:w-[85%] overflow-y-auto">
        <main className="flex-1 min-h-0 overflow-y-auto">
          {outlet ? (
            <Outlet />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 bg-zinc-100">
              <Settings className="w-16 h-16 text-gray-400 lg:w-24 lg:h-24" />
              <span className="font-semibold text-gray-400 lg:text-4xl">
                Settings
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SettingLayout;
