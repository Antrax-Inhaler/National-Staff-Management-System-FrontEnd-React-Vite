import { FileClock, ShieldUser } from "lucide-react";
import Badge from "../ui/Badge";
import type { ProfileData, ProfileRole } from "../../api/profile";
import OfficerHistoryModal from "../officer/OfficerHistoryModal";
import RoleHistory from "../role/RoleHistory";

interface RoleCardProps {
  data: ProfileData;
}

export default function ProfileRolesCard({ data }: RoleCardProps) {
  const roles = data.roles || [];
  const title = roles.length > 1 ? "Current Roles" : "Current Role";

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-sm">
      <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
        <ShieldUser className="w-5 h-5 text-gray-600" />
        {title}
      </h2>

      {roles.length ? (
        <ul className="divide-y divide-gray-200">
          {roles.map((role: ProfileRole) => (
            <li key={role.id} className="py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  {role.name
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <RoleHistory id={role.id} type={role.type} title={role.name} />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-700">
                Level:
                <Badge
                  variant="primary"
                  className="px-2 py-0.5 text-xs tracking-wide uppercase rounded-lg"
                >
                  {role.type}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-gray-500">No roles assigned.</p>
      )}
    </div>
  );
}
