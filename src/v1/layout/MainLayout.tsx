import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
// import Aside from "./Sidebar/Aside";
// import NavHeader from "./Header/NavHeader";

function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex flex-col flex-1 w-full overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
