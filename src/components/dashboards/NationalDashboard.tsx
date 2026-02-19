// src/components/dashboards/NationalDashboard.tsx
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function NationalDashboard() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        alert("Logout failed. Please try again.");
      } else {
        // Redirect to login page after successful logout
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An unexpected error occurred during logout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Logout */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">National Administrator Dashboard</h1>
              <p className="text-gray-600 text-sm">Welcome to the national admin dashboard</p>
            </div>
            
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Affiliate Management</h2>
            <p className="text-gray-600">Manage all affiliates and their members</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Reports & Analytics</h2>
            <p className="text-gray-600">View system-wide reports and analytics</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">User Management</h2>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contract Database</h2>
            <p className="text-gray-600">Access and manage all contracts</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Arbitration Records</h2>
            <p className="text-gray-600">View and manage arbitration cases</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">System Settings</h2>
            <p className="text-gray-600">Configure system-wide settings</p>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">80</div>
              <div className="text-sm text-gray-600">Total Affiliates</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">4,000</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">49</div>
              <div className="text-sm text-gray-600">States Covered</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <div className="text-sm text-gray-600">National Admins</div>
            </div>
          </div>
        </div>
      </main>
          <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">User management</h1>
          <p className="text-gray-500">
            Manage your team members and their account permissions here.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg shadow-sm hover:bg-gray-100">
            Export
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700">
            + Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select className="px-3 py-2 border rounded-lg text-sm text-gray-600">
          <option>Role</option>
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm text-gray-600">
          <option>2F Auth</option>
        </select>
        <button className="px-3 py-2 border rounded-lg text-sm text-gray-600">
          + Add filter
        </button>
        <div className="ml-auto flex gap-2">
          <input
            type="text"
            placeholder="Search"
            className="px-3 py-2 border rounded-lg text-sm w-48"
          />
          <button className="px-3 py-2 border rounded-lg text-sm text-gray-600">
            Customize
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-4 py-3">Full name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined date</th>
              <th className="px-4 py-3">2F Auth</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Row */}
            <tr className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
                  LS
                </div>
                Liam Smith
              </td>
              <td className="px-4 py-3">smith@example.com</td>
              <td className="px-4 py-3">Project Manager</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  Active
                </span>
              </td>
              <td className="px-4 py-3">24 Jun 2024, 9:23 pm</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                  Enabled
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                <button className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600">
                  Edit
                </button>
                <button className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600">
                  Delete
                </button>
              </td>
            </tr>

            {/* Repeat rows here */}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Rows per page
          <select className="ml-1 px-2 py-1 border rounded">
            <option>15</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span className="ml-2">1–15 of 380 rows</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 border rounded">&laquo;</button>
          <button className="px-3 py-1 border rounded bg-blue-50 text-blue-600">
            1
          </button>
          <button className="px-3 py-1 border rounded">2</button>
          <button className="px-3 py-1 border rounded">5</button>
          <button className="px-2 py-1 border rounded">&raquo;</button>
        </div>
      </div>
    </div>
    </div>

  );
}