import React, { useState } from "react";
import { Globe, Settings, Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import RoleGuard from "../../components/RoleGuard";
import { Committees, Roles } from "../../constants/roles";

function SubSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MOBILE TOGGLE BUTTON */}
      <button
        className="fixed z-30 p-4 bg-white border rounded-full shadow-lg bottom-4 right-4 lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Settings />
      </button>

      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 z-20 lg:hidden transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* MOBILE DRAWER */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-xl p-4
          transition-transform duration-300 lg:hidden
          ${open ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings />
            <h1 className="font-semibold">Settings</h1>
          </div>
          <button onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        <nav>
          <ul className="space-y-2 text-sm">
            <li>
              <RoleGuard
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  ...Committees.EXECUTIVE_COMMITTEE,
                ]}
              >
                <NavLink
                  to="domains"
                  className={({ isActive }) =>
                    `flex items-center w-full gap-3 px-3 py-2 text-left transition rounded-lg hover:bg-gray-100 ${
                      isActive ? "bg-gray-100" : ""
                    } `
                  }
                >
                  <Globe size={18} />
                  <span>Domains</span>
                </NavLink>
              </RoleGuard>
            </li>
          </ul>
        </nav>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden h-full p-4 bg-white lg:block lg:flex-1 ">
        {/* <div className="flex gap-2 mb-4">
          <Settings />
          <h1 className="font-semibold">Settings</h1>
        </div> */}

        <nav>
          <ul className="space-y-2 text-sm ">
            <li>
              <RoleGuard
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  ...Committees.EXECUTIVE_COMMITTEE,
                ]}
              >
                <NavLink
                  to="domains"
                  className={({ isActive }) =>
                    `flex items-center w-full gap-3 px-3 py-2 text-left transition rounded-lg hover:bg-gray-100 ${
                      isActive ? "bg-gray-100" : ""
                    } `
                  }
                >
                  <Globe size={18} />
                  <span>Domains</span>
                </NavLink>
              </RoleGuard>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}

export default SubSidebar;
