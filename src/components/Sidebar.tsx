import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight, BookOpen, CalendarDays, ChartNoAxesColumn, CircleHelp,
  ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, QrCode, Settings2,
  UserRound, Users, UserRoundCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';

interface SidebarProps { onNavigate?: () => void }

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { currentUser, logout, switchUserRole } = useAuth();
  const { requests, sessions, enrollments } = useData();
  if (!currentUser) return null;

  const isTeacher = currentUser.role === 'teacher';
  const pending = requests.filter(r => r.teacherId === currentUser.uid && r.status === 'pending').length;
  const enrolledIds = enrollments.filter(e => e.studentUid === currentUser.uid && e.status === 'active').map(e => e.courseId);
  const live = sessions.some(s => isTeacher
    ? s.teacherId === currentUser.uid && s.status === 'active'
    : enrolledIds.includes(s.courseId) && s.status === 'active');
  const sections = isTeacher ? [
    { title: 'TEACHING', items: [
      { label: 'Overview', to: '/teacher', icon: LayoutDashboard },
      { label: 'Take attendance', to: '/teacher/take-attendance', icon: QrCode, badge: live ? 'Live' : undefined },
      { label: 'My courses', to: '/teacher/courses', icon: BookOpen },
      { label: 'Class schedule', to: '/teacher/timetable', icon: CalendarDays },
    ] },
    { title: 'STUDENTS & RECORDS', items: [
      { label: 'Student directory', to: '/teacher/students', icon: Users },
      { label: 'Join requests', to: '/teacher/requests', icon: UserRoundCheck, badge: pending ? String(pending) : undefined },
      { label: 'Attendance history', to: '/teacher/history', icon: ClipboardCheck },
      { label: 'Reports', to: '/teacher/reports', icon: ChartNoAxesColumn },
    ] },
  ] : [
    { title: 'YOUR CAMPUS', items: [
      { label: 'Overview', to: '/student', icon: LayoutDashboard },
      { label: 'Check in', to: '/student/scan', icon: QrCode, badge: live ? 'Live' : undefined },
      { label: 'My courses', to: '/student/courses', icon: BookOpen },
      { label: 'Class schedule', to: '/student/timetable', icon: CalendarDays },
    ] },
    { title: 'MORE', items: [
      { label: 'Find a course', to: '/student/join', icon: GraduationCap },
      { label: 'Attendance history', to: '/student/history', icon: ClipboardCheck },
    ] },
  ];
  const initials = currentUser.fullName.split(' ').map(part => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <div className="brand-symbol"><GraduationCap size={20} strokeWidth={2.1} /></div>
        <div><div className="brand-name">SmartAttend</div><div className="brand-caption">Campus, in sync</div></div>
      </div>

      <div className="sidebar-person">
        <div className="person-avatar">{initials}</div>
        <div className="person-copy"><div className="person-name">{currentUser.fullName}</div><div className="person-role">{isTeacher ? 'Faculty account' : 'Student account'}</div></div>
        <span className="online-dot" title="Signed in" />
      </div>

      <div className="sidebar-navigation">
        {sections.map(section => (
          <section className="nav-section" key={section.title}>
            <h2 className="nav-section-label">{section.title}</h2>
            <nav aria-label={section.title}>
              {section.items.map(item => {
                const Icon = item.icon;
                return <NavLink key={item.to} to={item.to} end={item.to === '/teacher' || item.to === '/student'} onClick={onNavigate}
                  className={({ isActive }) => cn('sidebar-link', isActive && 'is-active')}>
                  <Icon size={18} strokeWidth={1.9} />
                  <span>{item.label}</span>
                  {item.badge && <span className={cn('nav-badge', item.badge === 'Live' && 'nav-badge-live')}>{item.badge}</span>}
                </NavLink>;
              })}
            </nav>
          </section>
        ))}
      </div>

      <div className="sidebar-bottom">
        <NavLink to="/profile" onClick={onNavigate} className={({ isActive }) => cn('sidebar-link', isActive && 'is-active')}>
          <Settings2 size={18} strokeWidth={1.9} /><span>Account settings</span>
        </NavLink>
        <div className="sidebar-bottom-rule" />
        <button className="role-switch" onClick={() => { switchUserRole(isTeacher ? 'student' : 'teacher'); onNavigate?.(); }} title="Switch role in demo mode">
          <ArrowLeftRight size={16} /><span>Switch to {isTeacher ? 'student' : 'faculty'} view</span>
        </button>
        <button className="signout-link" onClick={logout}><LogOut size={16} /><span>Sign out</span></button>
        <div className="sidebar-help"><CircleHelp size={14} /><span>Need a hand? Ask your campus admin.</span></div>
      </div>
    </aside>
  );
};
