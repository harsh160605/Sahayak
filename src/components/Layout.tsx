import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, ShieldCheck, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // If in live attendance presentation mode, don't wrap in standard sidebar layout
  const isLiveScreen = location.pathname.includes('/live-session');

  if (isLiveScreen) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-navy-900/40 backdrop-blur-sm">
          <div className="w-64 bg-surface h-full shadow-elevated">
            <div className="p-3 flex justify-end">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md hover:bg-warm-200 text-navy-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Editorial Topbar */}
        <header className="h-16 bg-surface border-b border-warm-300 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-navy-700 hover:bg-warm-200 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-navy-500 font-mono">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>ACADEMIC VERIFICATION SYSTEM</span>
              <span className="hidden sm:inline text-warm-400">/</span>
              <span className="hidden sm:inline font-sans text-navy-700 font-medium">
                {currentUser?.department || 'Department of Engineering'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-warm-100 rounded-md border border-warm-300 text-xs text-navy-500">
              <Search className="h-3.5 w-3.5 text-navy-400" />
              <span>Cmd + K to search</span>
            </div>

            <div className="h-8 w-px bg-warm-300 mx-1" />

            <button 
              className="relative p-2 rounded-md text-navy-600 hover:bg-warm-200/80 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

