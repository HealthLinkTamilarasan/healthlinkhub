import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardNavbar from './DashboardNavbar';

function PatientDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999 }}
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div 
        className="main-content"
        style={{ transition: 'margin-left 0.3s' }}
      >
        <DashboardNavbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
export default PatientDashboardLayout;
