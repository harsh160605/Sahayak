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
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';

export const Sidebar: React.FC = () => {
  const { currentUser, logout, switchUserRole } = useAuth();
  const { requests } = useData();

  if (!currentUser) return null;

  const isTeacher = currentUser.role === 'teacher';
  const pendingRequestsCount = requests.filter(r => r.teacherId === currentUser.uid && r.status === 'pending').length;

  const teacherNavItems = [
    { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard },
    { label: 'My Courses', to: '/teacher/courses', icon: BookOpen },
    { label: 'Manage Students', to: '/teacher/students', icon: Users },
    { label: 'Take Attendance', to: '/teacher/take-attendance', icon: QrCode },
    { label: 'Attendance History', to: '/teacher/history', icon: History },
    { label: 'Reports & Analytics', to: '/teacher/reports', icon: BarChart3 },
    { 
      label: 'Enrollment Requests', 
      to: '/teacher/requests', 
      icon: UserCheck, 
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined 
    },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const studentNavItems = [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { label: 'My Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Scan QR Attendance', to: '/student/scan', icon: QrCode, highlight: true },
    { label: 'Attendance History', to: '/student/history', icon: History },
    { label: 'Join a Course', to: '/student/join', icon: GraduationCap },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <aside className="w-64 bg-surface border-r border-warm-300 min-h-screen flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-warm-300">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-navy-900 flex items-center justify-center text-primary-light shadow-subtle">
              <QrCode className="h-5 w-5 text-primary" strokeWidth={2.2} />
            </div>
            <div>
              <span className="font-semibold text-navy-900 tracking-tight text-base flex items-center gap-1.5">
                SmartAttend
                <span className="text-[10px] font-mono tracking-widest font-medium uppercase px-1.5 py-0.5 rounded bg-warm-200 text-navy-700 border border-warm-300">
                  {isTeacher ? 'FACULTY' : 'STUDENT'}
                </span>
              </span>
              <p className="text-[11px] text-navy-500 font-mono">Academic Portal</p>
            </div>
          </div>
        </div>

        {/* User Card Mini */}
        <div className="px-4 py-4 m-3 rounded-lg bg-warm-100 border border-warm-300/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-navy-800 text-warm-50 flex items-center justify-center font-semibold text-xs tracking-wide">
              {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-navy-900 truncate">{currentUser.fullName}</p>
              <p className="text-[11px] text-navy-500 font-mono truncate">
                {isTeacher ? currentUser.facultyId : currentUser.studentId}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/teacher' || item.to === '/student'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-navy-900 text-surface shadow-subtle"
                      : "text-navy-700 hover:text-navy-900 hover:bg-warm-200/70",
                    item.highlight && !isActive && "text-primary hover:bg-primary-light/50 font-semibold"
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-primary text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher & Sign Out */}
      <div className="p-3 border-t border-warm-300 space-y-2">
        <button
          onClick={() => switchUserRole(isTeacher ? 'student' : 'teacher')}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md bg-warm-200/70 text-navy-800 hover:bg-warm-300/80 transition-colors"
          title="Switch view for presentation or evaluation"
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
            <span>Switch to {isTeacher ? 'Student View' : 'Teacher View'}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1 py-0.5 bg-surface rounded border border-warm-300 text-navy-600">
            DEMO
          </span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-navy-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

