// src/components/dashboards/affiliate/AffiliateDashboard.tsx
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../layout/Sidebar/Sidebar';
import Header from '../../layout/Header/Header';
import MemberList from './components/MemberList';
import ProfilePage from './components/ProfilePage';
import OfficerTools from './components/OfficerTools';
import Dashboard from './components/Dashboard';
import LinkList from '../../../pages/affiliates/Links';
import Document from '../../../pages/affiliates/Document/DocumentManagement';
import Event from '../../../pages/affiliates/Event/AffiliateEventManagement';
import Profile from './../member/Profile';
export default function AffiliateDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Remove userType prop, Sidebar handles it via useAuth */}
      <Sidebar />
      
      <div className="flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="members" element={<MemberList />} />
            <Route path="profile" element={<Profile />} />
            <Route path="officers" element={<OfficerTools />} />
             <Route path="/links" element={<LinkList />} />
            <Route path="/documents" element={<Document />} />
                <Route path="/events" element={<Event />} />
            {/* <Route
              path="dashboard"
              element={
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
                  <p className="text-gray-600">Welcome to your affiliate portal</p>
                </div>
              }
            /> */}
          </Routes>
        </main>
      </div>
    </div>
  );
}
