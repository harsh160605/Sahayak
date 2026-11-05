import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  QrCode, 
  History, 
  BarChart3, 
  UserCheck, 
  User, 
  LogOut,
  GraduationCap,
  ArrowRightLeft,
  Calendar,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  highlight?: boolean;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { currentUser, logout, switchUserRole } = useAuth();
  const { requests, sessions, enrollments } = useData();

  if (!currentUser) return null;

  const isTeacher = currentUser.role === 'teacher';
  const pendingRequestsCount = requests.filter(r => r.teacherId === currentUser.uid && r.status === 'pending').length;
  
  // Check active session status
  const teacherActiveSession = sessions.find(s => s.teacherId === currentUser.uid && s.status === 'active');
  const myEnrolledCourseIds = enrollments.filter(e => e.studentUid === currentUser.uid && e.status === 'active').map(e => e.courseId);
  const studentActiveSession = sessions.find(s => myEnrolledCourseIds.includes(s.courseId) && s.status === 'active');

  const teacherNavItems: NavItem[] = [
    { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard },
    { 
      label: 'Live Attendance', 
      to: '/teacher/take-attendance', 
      icon: QrCode, 
      badge: teacherActiveSession ? 'ACTIVE' : undefined,
      badgeColor: 'bg-emerald-600 text-white'
    },
    { label: 'My Courses', to: '/teacher/courses', icon: BookOpen },
    { label: 'Class Timetable', to: '/teacher/timetable', icon: Calendar },
    { label: 'Manage Students', to: '/teacher/students', icon: Users },
    { 
      label: 'Enrollment Requests', 
      to: '/teacher/requests', 
      icon: UserCheck, 
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined,
      badgeColor: 'bg-primary text-white'
    },
    { label: 'Attendance History', to: '/teacher/history', icon: History },
    { label: 'Reports & Analytics', to: '/teacher/reports', icon: BarChart3 },
    { label: 'Faculty Profile', to: '/profile', icon: User },
  ];

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { 
      label: 'Scan QR Attendance', 
      to: '/student/scan', 
      icon: QrCode, 
      highlight: true,
      badge: studentActiveSession ? 'LIVE' : undefined,
      badgeColor: 'bg-emerald-600 text-white animate-pulse'
    },
    { label: 'Class Timetable', to: '/student/timetable', icon: Calendar },
    { label: 'Enrolled Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Join a Course', to: '/student/join', icon: GraduationCap },
    { label: 'Attendance History', to: '/student/history', icon: History },
    { label: 'Student Profile', to: '/profile', icon: User },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const initials = currentUser.fullName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 bg-surface border-r border-warm-300 h-full flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-warm-300">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-navy-900 flex items-center justify-center text-primary shadow-subtle shrink-0">
              <QrCode className="h-5 w-5 text-primary" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-navy-900 tracking-tight text-sm">
                  SmartAttend
                </span>
                <span className="text-[9px] font-mono tracking-wider font-semibold uppercase px-1.5 py-0.5 rounded bg-warm-200 text-navy-700 border border-warm-300">
                  {isTeacher ? 'FACULTY' : 'STUDENT'}
                </span>
              </div>
              <p className="text-[10px] text-navy-500 font-mono tracking-tight truncate">
                Academic Verification
              </p>
            </div>
          </div>
        </div>

        {/* User Card Mini */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-warm-100 border border-warm-300/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs tracking-wide shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-navy-900 truncate">{currentUser.fullName}</p>
              <p className="text-[10px] text-navy-500 font-mono truncate">
                {isTeacher ? (currentUser.facultyId || 'FACULTY') : (currentUser.studentId || 'STUDENT')}
              </p>
            </div>
          </div>
        </div>

        {/* Live session banner if active */}
        {((isTeacher && teacherActiveSession) || (!isTeacher && studentActiveSession)) && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-teal-700 animate-pulse" />
              <span className="text-[11px] font-semibold text-teal-900 font-mono">
                {isTeacher ? 'Session Active' : 'Lecture Live'}
              </span>
            </div>
            <NavLink
              to={isTeacher ? `/teacher/live-session?sessionId=${teacherActiveSession?.id}` : '/student/scan'}
              onClick={onNavigate}
              className="text-[10px] font-bold text-primary hover:underline font-mono"
            >
              Open &rarr;
            </NavLink>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="px-3 py-1 space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/teacher' || item.to === '/student'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group",
                    isActive
                      ? "bg-navy-900 text-white font-semibold shadow-subtle"
                      : "text-navy-700 hover:text-navy-900 hover:bg-warm-200/80",
                    item.highlight && !isActive && "text-primary hover:bg-primary-light/60 font-semibold"
                  )
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" strokeWidth={1.9} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={cn(
                    "px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full",
                    item.badgeColor || "bg-primary text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher & Sign Out */}
      <div className="p-3 border-t border-warm-300 space-y-1.5 bg-surface mt-4">
        <button
          onClick={() => {
            switchUserRole(isTeacher ? 'student' : 'teacher');
            if (onNavigate) onNavigate();
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md bg-warm-100 hover:bg-warm-200 text-navy-800 transition-colors border border-warm-300/80"
          title="Switch role view for evaluation or demonstration"
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
            <span>Switch to {isTeacher ? 'Student' : 'Faculty'}</span>
          </div>
          <span className="text-[9px] uppercase font-mono px-1 py-0.5 bg-surface rounded border border-warm-300 text-navy-600 font-semibold">
            DEMO
          </span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-navy-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
