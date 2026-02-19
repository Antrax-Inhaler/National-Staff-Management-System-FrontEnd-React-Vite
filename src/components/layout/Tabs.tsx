import { NavLink } from "react-router-dom";

export type TabLink = {
  label: string; // Tab text
  to: string; // Relative or absolute route
  icon?: React.ReactNode;
};

type TabsProps = {
  tabs: TabLink[];
  basePath?: string; // Optional prefix (e.g. `/affiliates/:id`)
};

export default function Tabs({ tabs, basePath = "" }: TabsProps) {
  return (
    <div className="w-full border-b border-zinc-400">
      <nav className="flex px-4 space-x-6">
        {tabs.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={`${basePath}${to}`}
            end
            className={({ isActive }) =>
              `flex items-center py-4 px-1 border-b-2 text-sm font-medium transition
               ${
                 isActive
                   ? "border-blue-500 text-blue-600"
                   : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
               }`
            }
          >
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
