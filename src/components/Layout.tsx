import React, { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { NotificationPopover } from './NotificationPopover';
import { 
  ShieldCheck, 
  Search, 
  Menu, 
  X, 
  LayoutDashboard, 
  QrCode, 
  Calendar, 
  BookOpen, 
  User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const Layout: React.FC = () => {
  const { currentUser } = useAuth();
  const { sessions, requests, enrollments } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();

  // If in live attendance presentation mode, don't wrap in standard sidebar layout
  const isLiveScreen = location.pathname.includes('/live-session');

  if (isLiveScreen) {
    return <Outlet />;
  }

  const isTeacher = currentUser?.role === 'teacher';
  const pendingRequestsCount = requests.filter(r => r.teacherId === currentUser?.uid && r.status === 'pending').length;
  const teacherActiveSession = sessions.find(s => s.teacherId === currentUser?.uid && s.status === 'active');
  const myEnrolledCourseIds = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active').map(e => e.courseId);
  const studentActiveSession = sessions.find(s => myEnrolledCourseIds.includes(s.courseId) && s.status === 'active');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Command Palette Modal */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop and Aside */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex md:hidden bg-navy-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-72 bg-surface h-full shadow-elevated flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 border-b border-warm-200 flex justify-between items-center bg-warm-100">
              <span className="text-xs font-bold font-mono text-navy-800 uppercase tracking-wider">
                Menu Navigation
              </span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md hover:bg-warm-200 text-navy-700 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-surface border-b border-warm-300 px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-navy-700 hover:bg-warm-200 md:hidden focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-navy-600 truncate">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-navy-700 hidden sm:inline">
                ACADEMIC SYSTEM
              </span>
              <span className="hidden sm:inline text-warm-400">/</span>
              <span className="font-medium text-navy-800 truncate text-xs">
                {currentUser?.department || 'Department of Engineering'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Functional Search Bar Trigger */}
            <button
              id="search-palette-trigger"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-warm-100 hover:bg-warm-200/80 rounded-md border border-warm-300 text-xs text-navy-600 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              title="Search screens and actions (Cmd + K or Ctrl + K)"
            >
              <Search className="h-3.5 w-3.5 text-navy-500" />
              <span className="hidden sm:inline">Quick Jump</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface border border-warm-300 text-[10px] font-mono text-navy-500 font-medium">
                ⌘K
              </kbd>
            </button>

            <div className="h-6 w-px bg-warm-300 mx-0.5 hidden sm:block" />

            {/* Functional Notifications Popover */}
            <NotificationPopover />

            {/* Quick Profile Link */}
            <NavLink
              to="/profile"
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-warm-200 transition-colors text-xs font-semibold text-navy-900"
              title="View profile"
            >
              <div className="w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {currentUser?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden lg:inline text-navy-800 font-medium max-w-[120px] truncate">
                {currentUser?.fullName.split(' ')[0]}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (Thumb friendly for small screens) */}
        <nav 
          className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-warm-300 px-2 flex items-center justify-around z-20 shadow-elevated"
          aria-label="Mobile Navigation Bar"
        >
          <NavLink
            to={isTeacher ? '/teacher' : '/student'}
            end
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-navy-500 hover:text-navy-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 mb-0.5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to={isTeacher ? '/teacher/take-attendance' : '/student/scan'}
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-navy-500 hover:text-navy-900'
            }`}
          >
            <div className="relative">
              <QrCode className="h-4 w-4 mb-0.5" />
              {((isTeacher && teacherActiveSession) || (!isTeacher && studentActiveSession)) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <span>{isTeacher ? 'Attend' : 'Scan QR'}</span>
          </NavLink>

          <NavLink
            to={isTeacher ? '/teacher/timetable' : '/student/timetable'}
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-navy-500 hover:text-navy-900'
            }`}
          >
            <Calendar className="h-4 w-4 mb-0.5" />
            <span>Schedule</span>
          </NavLink>

          <NavLink
            to={isTeacher ? '/teacher/courses' : '/student/courses'}
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-navy-500 hover:text-navy-900'
            }`}
          >
            <BookOpen className="h-4 w-4 mb-0.5" />
            <span>Courses</span>
          </NavLink>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium text-navy-500 hover:text-navy-900 transition-colors"
          >
            <div className="relative">
              <Menu className="h-4 w-4 mb-0.5" />
              {isTeacher && pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
