'use client';

import { Menu, Bell } from 'lucide-react';

interface MobileNavProps {
  onToggle: () => void;
}

export default function MobileNav({ onToggle }: MobileNavProps) {
  return (
    <header className="mobile-nav">
      <button className="mobile-nav-toggle" onClick={onToggle} aria-label="Toggle menu">
        <Menu size={24} />
      </button>
      <div className="mobile-nav-logo">FinTrack</div>
      <button className="mobile-nav-notification" aria-label="Notifications">
        <Bell size={24} />
      </button>
    </header>
  );
}
