import { Outlet, useParams } from "react-router-dom";
import Tabs from "./Tabs";

export default function AffiliateDetailLayout() {
  const { id } = useParams(); // e.g. affiliate id
  const tabs = [
    { label: "Members", to: `/affiliates/${id}/members` },
    { label: "Officers", to: `/affiliates/${id}/officers` },
    { label: "Settings", to: `/affiliates/${id}/settings` },
    { label: "Activity", to: `/affiliates/${id}/activity` },
  ];

  return (
    <div className="flex h-full">
      <Tabs tabs={tabs} />
      <main className="flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
}
