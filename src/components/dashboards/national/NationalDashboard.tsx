// src/components/dashboards/national/NationalDashboard.tsx
import React from "react";
import PortalLayout from "../../layout/PortalLayout";
import StatsGrid from "./components/StatsGrid";
import RecentActivity from "./components/RecentActivity";
import Dashboard from "./components/Dashboard";
import { Routes, Route } from "react-router-dom";
import Document from "./../../../pages/national/Document/DocumentManagement";
import AffiliateDashboard from "../affiliate/AffiliateDashboard";
import LinkManagement from "../../national/links/LinkManagement";
import NationalInformationManager from "../../../pages/national/information/InformationManagement";
import AffiliateListPage from "../../../pages/affiliates/AffiliateListPage/AffiliatesListPage";
import AffiliateDetailLayout from "../../../pages/affiliates/AffiliateDetailPage/AffiliateDetailLayout";
import AffiliateMemberPage from "../../../pages/affiliates/AffiliateDetailPage/AffiliateMemberPage";
import AffiliateOfficerPage from "../../../pages/affiliates/AffiliateDetailPage/AffiliateOfficerPage";
import MemeberManagement from "../../../pages/members/MembersManagement/MembersManagement";
import NationalEvent from "../../../pages/national/Event/EventList";
export default function NationalDashboard() {
  return (
    <PortalLayout>
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/documents" element={<Document />} /> */}
          {/* <Route path="dashboard" element={<NationalDashboard />} /> */}
          <Route path="affiliates" element={<AffiliateDashboard />} />
          <Route path="links" element={<LinkManagement />} />
          <Route path="information" element={<NationalInformationManager />} />

          <Route path="affiliate-management" element={<AffiliateListPage />} />
          <Route path="affiliate/:id" element={<AffiliateDetailLayout />}>
            <Route index element={<AffiliateMemberPage />} />
            <Route index path="members" element={<AffiliateMemberPage />} />
            <Route path="officers" element={<AffiliateOfficerPage />} />
          </Route>
          <Route path="member-management" element={<MemeberManagement />} />
            <Route path="events" element={<NationalEvent />} />
        </Routes>
        </main>
    </PortalLayout>
  );
}
