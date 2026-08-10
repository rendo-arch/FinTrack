'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
  };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="dashboard-layout">
      <Sidebar 
        userName={user.name} 
        userEmail={user.email} 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />
      
      <MobileNav onToggle={toggleSidebar} />
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
