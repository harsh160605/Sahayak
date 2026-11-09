import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { 
  Bell, 
  ShieldCheck, 
  Search, 
  Menu, 
  X, 
  LayoutDashboard, 
  Calendar, 
  QrCode, 
  BookOpen, 
  User, 
  BarChart3,
  Users,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getDeviceFingerprint } from '../lib/deviceFingerprint';
import { DeviceLockedScreen } from './DeviceLockedScreen';

export const Layout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { bindCurrentDevice } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const clientDevice = getDeviceFingerprint();

  // Single-Device Binding check (Strictly enforced for students; teachers and admins are exempt)
  const isStudent = currentUser?.role === 'student';
  const isDeviceBound = Boolean(currentUser?.boundDeviceId);
  const isDeviceMatch = isDeviceBound && currentUser?.boundDeviceId === clientDevice.deviceId;
  const isUnauthorizedStudentDevice = Boolean(isStudent && isDeviceBound && !isDeviceMatch);

  // Auto-bind device on the student's first login
  useEffect(() => {
    if (currentUser && currentUser.role === 'student' && !currentUser.boundDeviceId) {
      bindCurrentDevice(currentUser.uid, {
        deviceId: clientDevice.deviceId,
        deviceName: clientDevice.deviceName,
        platform: clientDevice.platform
      });
    }
  }, [currentUser?.uid, currentUser?.boundDeviceId]);

  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';

  // If in live attendance presentation mode, don't wrap in standard sidebar layout
  const isLiveScreen = location.pathname.includes('/live-session');

  if (isLiveScreen) {
    return <Outlet />;
  }

  // Thumb-friendly mobile bottom navigation items
  const studentBottomNav = [
    { label: 'Home', to: '/student', icon: LayoutDashboard },
    { label: 'Schedule', to: '/student/timetable', icon: Calendar },
    { label: 'Scan QR', to: '/student/scan', icon: QrCode, isPrimaryAction: true },
    { label: 'Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const teacherBottomNav = [
    { label: 'Home', to: '/teacher', icon: LayoutDashboard },
    { label: 'Schedule', to: '/teacher/timetable', icon: Calendar },
    { label: 'Take Att.', to: '/teacher/take-attendance', icon: QrCode, isPrimaryAction: true },
    { label: 'Reports', to: '/teacher/reports', icon: BarChart3 },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const adminBottomNav = [
    { label: 'Console', to: '/admin', icon: LayoutDashboard },
    { label: 'Timetable', to: '/admin/timetable', icon: Calendar },
    { label: 'Attendance', to: '/teacher/take-attendance', icon: QrCode, isPrimaryAction: true },
    { label: 'Roster', to: '/institute-directory', icon: Users },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const bottomNavItems = isAdmin ? adminBottomNav : isTeacher ? teacherBottomNav : studentBottomNav;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-navy-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-64 bg-surface h-full shadow-elevated flex flex-col">
            <div className="p-3 flex justify-end border-b border-warm-200">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-warm-200 text-navy-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Editorial Topbar */}
        <header className="h-14 sm:h-16 bg-surface border-b border-warm-300 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-navy-700 hover:bg-warm-200 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              aria-label="Open navigation drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-navy-600 font-mono truncate">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold tracking-wider text-[11px] sm:text-xs text-navy-900">SMARTATTEND</span>
              <span className="hidden sm:inline text-warm-400">/</span>
              <span className="hidden sm:inline font-sans text-navy-700 font-medium truncate text-xs">
                {currentUser?.department || 'Department of Engineering'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-warm-100 rounded-md border border-warm-300 text-xs text-navy-500">
              <Search className="h-3.5 w-3.5 text-navy-400" />
              <span>Cmd + K to search</span>
            </div>

            <div className="hidden sm:block h-6 w-px bg-warm-300 mx-0.5" />

            <button 
              className="relative p-2 rounded-lg text-navy-600 hover:bg-warm-200/80 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* Quick Sign Out Action (Visible across all pages on mobile and desktop) */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-navy-600 hover:text-red-700 hover:bg-red-50/80 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Sign Out"
              aria-label="Sign out of account"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-8 pb-24 md:pb-8 touch-scroll">
          {isUnauthorizedStudentDevice ? (
            <DeviceLockedScreen clientDevice={clientDevice} />
          ) : (
            <Outlet />
          )}
        </main>

        {/* Thumb-First Mobile Bottom Navigation Bar (Phone Only - hidden if device locked) */}
        {!isUnauthorizedStudentDevice && (
          <nav 
            aria-label="Mobile Navigation" 
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-warm-300 px-2 py-1 safe-bottom flex items-center justify-around shadow-elevated"
          >
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              if (item.isPrimaryAction) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center -mt-4 px-3 py-1 rounded-full group transition-transform active:scale-95 ${
                        isActive ? 'scale-105' : ''
                      }`
                    }
                  >
                    <div className="h-12 w-12 rounded-full bg-navy-900 text-white flex items-center justify-center shadow-lg border-2 border-primary group-hover:bg-navy-800 transition-colors">
                      <Icon className="h-5 w-5 text-teal-400" />
                    </div>
                    <span className="text-[10px] font-bold font-sans text-navy-900 mt-0.5">
                      {item.label}
                    </span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/teacher' || item.to === '/student'}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1.5 rounded-lg text-center transition-colors ${
                      isActive
                        ? 'text-teal-800 font-semibold'
                        : 'text-navy-500 hover:text-navy-800'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 mb-0.5" strokeWidth={1.9} />
                  <span className="text-[10px] leading-tight font-sans">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};

