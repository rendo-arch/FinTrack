'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  Wallet,
  ArrowLeftRight,
  BarChart3,
  Repeat,
  Settings,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  userName: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Income', href: '/income', icon: TrendingUp },
  { name: 'Expenses', href: '/expenses', icon: TrendingDown },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Savings Goals', href: '/savings', icon: Target },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ userName, userEmail, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">FinTrack</div>
          <button 
            className="mobile-close-btn md:hidden" 
            onClick={onClose} 
            aria-label="Close sidebar"
            style={{ display: isOpen ? 'block' : 'none' }}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
              >
                <Icon className="nav-icon" size={20} />
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-email">{userEmail}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} aria-label="Log out">
            <LogOut size={20} className="nav-icon" />
            <span className="nav-label">Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
