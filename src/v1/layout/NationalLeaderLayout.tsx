import { Outlet, useOutlet, useParams } from "react-router-dom";
import Tabs from "./Tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { affiliate } from "../api/affiliate";
import { Building, Loader2, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { national } from "../api/national";
import { readableName } from "../helpers/formatter";
import AssignUser from "../components/national/AssignUser";
import NewSubSidebar from "@v1/layout/Sidebar/NewSubSidebar";

export interface role {
  id: number;
  name: string;
  description: string;
  children?: role[];
}

export default function NationalLeaderLayout() {
  const outlet = useOutlet();
  const { data: roles, isFetching: rolesFetching } = useQuery({
    queryKey: ["national-leaders-roles"],
    queryFn: () => national.roles(),
  });

  if (rolesFetching) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const menuItems =
    roles?.map((item) => {
      return {
        id: item.id.toString(),
        label: readableName(item.name),
        path: `/leader-roster/${item.id.toString()}/users`,
      };
    }) ?? [];

  return (
    <div className="flex flex-col h-full bg-white rounded-md shadow shadow-neutral-50">
      {/* HEADER - Fixed */}
      <div className="flex items-center flex-shrink-0 gap-4 p-5 bg-white border border-gray-100 rounded-xl">
        <div className="flex items-center justify-center text-blue-600 bg-blue-100 rounded-lg w-14 h-14">
          <Users size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            National Leader Roster
          </h1>
        </div>
        <div className="flex items-end justify-end flex-1 w-full gap-2">
          <AssignUser roles={menuItems} />
        </div>
      </div>

      {/* MAIN CONTENT - Scrollable */}
      <main className="flex flex-1 w-full min-h-0 overflow-hidden">
        <NewSubSidebar
          items={menuItems}
          searchable
          searchPlaceholder="Search Role..."
        />
        <div className="overflow-y-auto flex-1 lg:flex-none lg:w-[80%]">
          {outlet ? (
            <Outlet context={{ roles }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 bg-zinc-100">
              <UserCog className="w-16 h-16 text-gray-400 lg:w-24 lg:h-24" />
              <span className="font-semibold text-gray-400 lg:text-4xl">
                National Leaders
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
