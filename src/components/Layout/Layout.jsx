import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const { sidebarOpen } = useDashboard();

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <div className="app-shell flex-1" style={{ marginLeft: sidebarOpen ? '256px' : '80px' }}>
        <Navbar />
        <main className="min-h-[calc(100vh-80px)] bg-transparent p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
