import { Outlet, useParams } from "react-router-dom";
import Tabs from "../../../components/layout/Tabs";
import PortalLayout from "../../../components/layout/PortalLayout";

export default function AffiliateDetailLayout() {
  const { id } = useParams(); // e.g. affiliate id
  const tabs = [
    { label: "Members", to: `/national/affiliate/${id}/members` },
    { label: "Officers", to: `/national/affiliate/${id}/officers` },
  ];

  return (
    <div className="flex flex-col flex-1 bg-white rounded-md shadow shadow-neutral-50">
      <Tabs tabs={tabs} />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}
