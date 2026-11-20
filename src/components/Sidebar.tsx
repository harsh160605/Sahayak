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
  Layers,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';

interface NavItem {
  label: string;
  to: string;
  icon: any;
  highlight?: boolean;
  badge?: number;
}

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { currentUser, logout, switchUserRole } = useAuth();
  const { requests } = useData();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isDeptAdmin = currentUser.role === 'dept_admin' || Boolean(currentUser.isHOD);
  const isTeacher = currentUser.role === 'teacher';
  const pendingRequestsCount = requests.filter(r => r.teacherId === currentUser.uid && r.status === 'pending').length;

  const adminNavItems: NavItem[] = [
    { label: 'Principal Console', to: '/admin', icon: LayoutDashboard },
    { label: 'Institute Roster', to: '/institute-directory', icon: Users },
    { label: 'Course Catalog', to: '/teacher/courses', icon: BookOpen },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const deptAdminNavItems: NavItem[] = [
    { label: 'HOD Console', to: '/dept-admin', icon: LayoutDashboard },
    { label: 'Classes & Divisions', to: '/dept-admin', icon: Layers },
    { label: 'Subject Allocations', to: '/dept-admin', icon: ShieldCheck },
    { label: 'Department Timetable', to: '/teacher/timetable', icon: Calendar },
    { label: 'Manage Students', to: '/teacher/students', icon: Users },
    { label: 'Take Attendance', to: '/teacher/take-attendance', icon: QrCode },
    { label: 'Attendance Reports', to: '/teacher/reports', icon: BarChart3 },
    { 
      label: 'Enrollment Requests', 
      to: '/teacher/requests', 
      icon: UserCheck, 
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined 
    },
    { label: 'Institute Directory', to: '/institute-directory', icon: Users },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const teacherNavItems: NavItem[] = [
    { label: 'Faculty Dashboard', to: '/teacher', icon: LayoutDashboard },
    { label: 'My Courses', to: '/teacher/courses', icon: BookOpen },
    { label: 'Class Timetable', to: '/teacher/timetable', icon: Calendar },
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
    { label: 'Institute Directory', to: '/institute-directory', icon: Users },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { label: 'Class Timetable', to: '/student/timetable', icon: Calendar },
    { label: 'My Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Scan QR Attendance', to: '/student/scan', icon: QrCode, highlight: true },
    { label: 'Attendance History', to: '/student/history', icon: History },
    { label: 'Join a Course', to: '/student/join', icon: GraduationCap },
    { label: 'Institute Directory', to: '/institute-directory', icon: Users },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const navItems: NavItem[] = isAdmin 
    ? adminNavItems 
    : isDeptAdmin 
      ? deptAdminNavItems 
      : isTeacher 
        ? teacherNavItems 
        : studentNavItems;

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
                <span className={`text-[10px] font-mono tracking-widest font-medium uppercase px-1.5 py-0.5 rounded border ${
                  isAdmin 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : isDeptAdmin
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : isTeacher 
                        ? 'bg-warm-200 text-navy-700 border-warm-300' 
                        : 'bg-teal-100 text-teal-800 border-teal-300'
                }`}>
                  {isAdmin ? 'ADMIN' : isDeptAdmin ? 'HOD' : isTeacher ? 'FACULTY' : 'STUDENT'}
                </span>
              </span>
              <p className="text-[11px] text-navy-500 font-mono truncate max-w-[130px]">
                {currentUser.organizationCode ? `Org: ${currentUser.organizationCode}` : 'Academic Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* User Card Mini with Organization Name */}
        <div className="px-4 py-3 m-3 rounded-lg bg-warm-100 border border-warm-300/80 space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy-800 text-warm-50 flex items-center justify-center font-semibold text-xs tracking-wide shrink-0">
              {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-navy-900 truncate">{currentUser.fullName}</p>
              <p className="text-[10px] text-navy-500 font-mono truncate">
                {isDeptAdmin 
                  ? `${currentUser.facultyId || 'HOD'} • ${currentUser.department || 'Dept'}` 
                  : isTeacher 
                    ? `${currentUser.facultyId || 'Faculty'} • ${currentUser.department || 'Dept'}` 
                    : currentUser.studentId || currentUser.rollNo || 'Student'}
              </p>
            </div>
          </div>
          {currentUser.organizationName && (
            <div className="pt-1.5 border-t border-warm-200 text-[10px] text-teal-800 font-mono font-medium truncate">
              🏛️ {currentUser.organizationName}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.to === '/teacher' || item.to === '/student' || item.to === '/dept-admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-3 py-2.5 min-h-[42px] text-xs font-medium rounded-md transition-colors",
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

      {/* 4-Way Role Switcher & Sign Out */}
      <div className="p-3 border-t border-warm-300 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-navy-500 uppercase px-1">
            <span className="flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3 text-primary" />
              <span>Role Switcher</span>
            </span>
            <span className="bg-surface px-1 py-0.2 rounded border border-warm-300">DEMO</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold">
            <button
              onClick={() => switchUserRole('admin')}
              className={cn(
                "px-2 py-1.5 rounded transition-colors text-left",
                isAdmin ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold" : "bg-warm-100 text-navy-700 hover:bg-warm-200"
              )}
            >
              Principal
            </button>
            <button
              onClick={() => switchUserRole('dept_admin')}
              className={cn(
                "px-2 py-1.5 rounded transition-colors text-left",
                isDeptAdmin ? "bg-purple-100 text-purple-900 border border-purple-300 font-bold" : "bg-warm-100 text-navy-700 hover:bg-warm-200"
              )}
            >
              HOD
            </button>
            <button
              onClick={() => switchUserRole('teacher')}
              className={cn(
                "px-2 py-1.5 rounded transition-colors text-left",
                isTeacher && !isDeptAdmin ? "bg-primary/10 text-primary border border-primary/30 font-bold" : "bg-warm-100 text-navy-700 hover:bg-warm-200"
              )}
            >
              Faculty
            </button>
            <button
              onClick={() => switchUserRole('student')}
              className={cn(
                "px-2 py-1.5 rounded transition-colors text-left",
                currentUser.role === 'student' ? "bg-teal-100 text-teal-900 border border-teal-300 font-bold" : "bg-warm-100 text-navy-700 hover:bg-warm-200"
              )}
            >
              Student
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[40px] text-xs font-medium text-navy-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
