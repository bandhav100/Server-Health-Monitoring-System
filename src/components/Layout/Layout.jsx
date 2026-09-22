import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const { sidebarOpen } = useDashboard();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = isDesktop ? (sidebarOpen ? 256 : 80) : 0;

  return (
    <div className="min-h-screen bg-transparent w-full max-w-full overflow-x-hidden">
      <Sidebar isDesktop={isDesktop} />
      <div
        className="app-shell flex-1 flex flex-col transition-[margin,width,max-width] duration-300 min-w-0"
        style={{
          marginLeft: `${sidebarWidth}px`,
          width: isDesktop ? `calc(100% - ${sidebarWidth}px)` : '100%',
          maxWidth: isDesktop ? `calc(100vw - ${sidebarWidth}px)` : '100vw',
          overflowX: 'hidden',
        }}
      >
        <Navbar isDesktop={isDesktop} />
        <main className="min-h-[calc(100vh-80px)] bg-transparent p-3 sm:p-4 md:p-6 w-full max-w-full min-w-0 overflow-x-hidden box-border">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
