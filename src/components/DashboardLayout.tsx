import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { session, logout } = useAuth();

  return (
    <div>
      <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <h1 className="font-bold">Organization Portal</h1>
        <div className="flex items-center gap-4">
          <span>{session?.user?.email}</span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-4">{children}</main>
    </div>
  );
}
