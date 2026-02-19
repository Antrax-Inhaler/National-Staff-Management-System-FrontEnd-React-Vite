// src/components/dashboards/member/MemberDashboard.tsx
import React from 'react';
import PortalLayout from '../../layout/PortalLayout';
import QuickActions from './components/QuickActions';
import { Routes, Route } from 'react-router-dom';
import Profile from './Profile';
import Dashboard from './components/Dashboard';
import LinkList from './../../../pages/members/Links';
import NationalInformation from "./../../../pages/members/information/Information";
import Document from "./../../../pages/members/Document/DocumentManagement";
import Event from "./../../../pages/members/Event/MemberEvents";

export default function MemberDashboard() {
  return (
    <PortalLayout>
      <Routes>
        <Route path="/" element={
          <div>
            <QuickActions />
          </div>
        }/>
        <Route path="profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/links" element={<LinkList />} />
         <Route path="/national" element={<NationalInformation />} />
                  <Route path="/documents" element={<Document />} />
                    <Route path="/events" element={<Event />} />

        {/* Add more routes as needed */}
      </Routes>
    </PortalLayout>
  );
}