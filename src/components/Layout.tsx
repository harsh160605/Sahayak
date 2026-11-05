import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, CalendarDays, Menu, Moon, QrCode, Search, Sun, X, LayoutDashboard } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { NotificationPopover } from './NotificationPopover';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

const routeTitles: Record<string, string> = {
  '/teacher': 'Overview', '/teacher/courses': 'My courses', '/teacher/timetable': 'Class schedule',
  '/teacher/students': 'Student directory', '/teacher/take-attendance': 'Take attendance',
  '/teacher/history': 'Attendance history', '/teacher/reports': 'Reports', '/teacher/requests': 'Join requests',
  '/student': 'Overview', '/student/scan': 'Check in', '/student/timetable': 'Class schedule',
  '/student/courses': 'My courses', '/student/join': 'Find a course', '/student/history': 'Attendance history',
  '/profile': 'Account settings',
};

export const Layout: React.FC = () => {
  const { currentUser } = useAuth();
  const { sessions, enrollments } = useData();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const isTeacher = currentUser?.role === 'teacher';
  const isLiveScreen = location.pathname.includes('/live-session');

  if (isLiveScreen) return <Outlet />;

  const courseIds = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active').map(e => e.courseId);
  const hasLive = sessions.some(s => s.status === 'active' && (isTeacher ? s.teacherId === currentUser?.uid : courseIds.includes(s.courseId)));
  const initials = currentUser?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const title = routeTitles[location.pathname] || 'SmartAttend';

  return (
    <div className="workspace-shell">
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      <div className="desktop-sidebar"><Sidebar /></div>
      {mobileMenuOpen && <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-drawer" onClick={event => event.stopPropagation()}>
          <div className="mobile-drawer-top"><span>Menu</span><button className="icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </div>
      </div>}

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="topbar-heading">
            <button className="icon-button mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <div className="topbar-title-wrap">
              <div className="topbar-overline">{isTeacher ? 'FACULTY WORKSPACE' : 'STUDENT WORKSPACE'}</div>
              <h1 className="topbar-title">{title}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            {hasLive && <span className="live-indicator"><span className="live-indicator-dot" />{isTeacher ? 'Class in progress' : 'Check-in open'}</span>}
            <button id="search-palette-trigger" className="search-trigger" onClick={() => setCommandPaletteOpen(true)} aria-label="Search pages and actions">
              <Search size={16} /><span>Search anything</span><kbd>⌘ K</kbd>
            </button>
            <NotificationPopover />
            <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Change appearance">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <NavLink to="/profile" className="topbar-avatar" title="Open account settings">{initials}</NavLink>
          </div>
        </header>

        <main className="workspace-content" key={location.pathname}>
          <Outlet />
        </main>

        <nav className="mobile-bottom-nav" aria-label="Quick navigation">
          <NavLink to={isTeacher ? '/teacher' : '/student'} end className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}><LayoutDashboard size={18} /><span>Home</span></NavLink>
          <NavLink to={isTeacher ? '/teacher/take-attendance' : '/student/scan'} className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}><span className="mobile-nav-icon-wrap"><QrCode size={18} />{hasLive && <i />}</span><span>{isTeacher ? 'Roll call' : 'Check in'}</span></NavLink>
          <NavLink to={isTeacher ? '/teacher/timetable' : '/student/timetable'} className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}><CalendarDays size={18} /><span>Schedule</span></NavLink>
          <NavLink to={isTeacher ? '/teacher/courses' : '/student/courses'} className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}><BookOpen size={18} /><span>Courses</span></NavLink>
          <button className="mobile-nav-item" onClick={() => setMobileMenuOpen(true)}><Menu size={18} /><span>More</span></button>
        </nav>
      </div>
    </div>
  );
};
