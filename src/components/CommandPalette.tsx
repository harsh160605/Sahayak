import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  QrCode, 
  Calendar, 
  History, 
  BarChart3, 
  UserCheck, 
  User, 
  GraduationCap, 
  ArrowRightLeft, 
  X,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
  category: 'Navigation' | 'Actions' | 'Courses';
  badge?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser, switchUserRole } = useAuth();
  const { courses, sessions, requests } = useData();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTeacher = currentUser?.role === 'teacher';

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open palette
          const trigger = document.getElementById('search-palette-trigger');
          trigger?.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) return null;

  const items: CommandItem[] = [];

  if (isTeacher) {
    const pendingCount = requests.filter(r => r.teacherId === currentUser.uid && r.status === 'pending').length;
    const activeSession = sessions.find(s => s.teacherId === currentUser.uid && s.status === 'active');

    items.push(
      {
        id: 'start-attendance',
        title: 'Launch Live Attendance',
        subtitle: activeSession ? 'Active session currently in progress' : 'Start dynamic QR session',
        icon: Play,
        category: 'Actions',
        badge: activeSession ? 'LIVE' : undefined,
        action: () => {
          navigate('/teacher/take-attendance');
          onClose();
        }
      },
      {
        id: 'review-requests',
        title: 'Enrollment Requests',
        subtitle: pendingCount > 0 ? `${pendingCount} student requests awaiting approval` : 'No pending requests',
        icon: UserCheck,
        category: 'Actions',
        badge: pendingCount > 0 ? `${pendingCount}` : undefined,
        action: () => {
          navigate('/teacher/requests');
          onClose();
        }
      },
      {
        id: 'nav-dashboard',
        title: 'Faculty Dashboard',
        subtitle: 'Overview of courses and attendance stats',
        icon: LayoutDashboard,
        category: 'Navigation',
        action: () => {
          navigate('/teacher');
          onClose();
        }
      },
      {
        id: 'nav-courses',
        title: 'My Courses & Rosters',
        subtitle: 'Manage curriculum and course details',
        icon: BookOpen,
        category: 'Navigation',
        action: () => {
          navigate('/teacher/courses');
          onClose();
        }
      },
      {
        id: 'nav-timetable',
        title: 'Class Timetable',
        subtitle: 'Weekly lecture schedule and rooms',
        icon: Calendar,
        category: 'Navigation',
        action: () => {
          navigate('/teacher/timetable');
          onClose();
        }
      },
      {
        id: 'nav-students',
        title: 'Manage Students',
        subtitle: 'View student rosters and manual enrollment',
        icon: Users,
        category: 'Navigation',
        action: () => {
          navigate('/teacher/students');
          onClose();
        }
      },
      {
        id: 'nav-history',
        title: 'Attendance History',
        subtitle: 'Historical session logs and CSV export',
        icon: History,
        category: 'Navigation',
        action: () => {
          navigate('/teacher/history');
          onClose();
        }
      },
      {
        id: 'nav-reports',
        title: 'Reports & Defaulter Tracking',
        subtitle: 'Cohort analytics and compliance metrics',
        icon: BarChart3,
        category: 'Navigation',
        action: () => {
          navigate('/teacher/reports');
          onClose();
        }
      }
    );

    // Add courses to jump directly
    courses.filter(c => c.teacherId === currentUser.uid).forEach(c => {
      items.push({
        id: `course-${c.id}`,
        title: `${c.courseCode} — ${c.courseName}`,
        subtitle: `${c.enrolledCount || 0} students enrolled`,
        icon: BookOpen,
        category: 'Courses',
        action: () => {
          navigate(`/teacher/take-attendance?courseId=${c.id}`);
          onClose();
        }
      });
    });
  } else {
    items.push(
      {
        id: 'scan-qr',
        title: 'Scan QR Attendance',
        subtitle: 'Verify presence for active classroom lecture',
        icon: QrCode,
        category: 'Actions',
        badge: 'Priority',
        action: () => {
          navigate('/student/scan');
          onClose();
        }
      },
      {
        id: 'nav-student-dash',
        title: 'Student Dashboard',
        subtitle: 'Attendance standing and enrolled courses',
        icon: LayoutDashboard,
        category: 'Navigation',
        action: () => {
          navigate('/student');
          onClose();
        }
      },
      {
        id: 'nav-student-timetable',
        title: 'Class Timetable',
        subtitle: 'Today and weekly lecture schedule',
        icon: Calendar,
        category: 'Navigation',
        action: () => {
          navigate('/student/timetable');
          onClose();
        }
      },
      {
        id: 'nav-join-course',
        title: 'Join an Academic Course',
        subtitle: 'Browse catalog and request enrollment',
        icon: GraduationCap,
        category: 'Navigation',
        action: () => {
          navigate('/student/join');
          onClose();
        }
      },
      {
        id: 'nav-student-history',
        title: 'Attendance History',
        subtitle: 'Personal attendance records and timestamps',
        icon: History,
        category: 'Navigation',
        action: () => {
          navigate('/student/history');
          onClose();
        }
      }
    );
  }

  // Common items
  items.push(
    {
      id: 'nav-profile',
      title: 'Profile & Settings',
      subtitle: `${currentUser.fullName} (${currentUser.role})`,
      icon: User,
      category: 'Navigation',
      action: () => {
        navigate('/profile');
        onClose();
      }
    },
    {
      id: 'switch-role',
      title: `Switch to ${isTeacher ? 'Student View' : 'Teacher View'}`,
      subtitle: 'Demo role switcher for evaluation',
      icon: ArrowRightLeft,
      category: 'Actions',
      badge: 'DEMO',
      action: () => {
        switchUserRole(isTeacher ? 'student' : 'teacher');
        navigate(isTeacher ? '/student' : '/teacher');
        onClose();
      }
    }
  );

  const filteredItems = items.filter(item => {
    const term = query.toLowerCase();
    return item.title.toLowerCase().includes(term) || (item.subtitle && item.subtitle.toLowerCase().includes(term));
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-surface rounded-xl border border-warm-300 shadow-elevated overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 border-b border-warm-200">
          <Search className="h-4 w-4 text-navy-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a screen, command, or course..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-3.5 text-xs text-navy-900 placeholder-navy-400 bg-transparent focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded text-navy-400 hover:text-navy-700 hover:bg-warm-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-warm-100">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-navy-500">
              No matching pages or commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-navy-900 text-white' : 'hover:bg-warm-100 text-navy-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-md ${
                      isSelected ? 'bg-navy-800 text-teal-300' : 'bg-warm-200 text-navy-700'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-navy-900'}`}>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className={`text-[11px] truncate ${isSelected ? 'text-navy-300' : 'text-navy-500'}`}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      isSelected 
                        ? 'bg-teal-500 text-navy-950' 
                        : 'bg-warm-200 text-navy-800 border border-warm-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-warm-100 border-t border-warm-200 flex items-center justify-between text-[11px] font-mono text-navy-500">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>ESC Close</span>
          </div>
          <span>SmartAttend Navigator</span>
        </div>
      </div>
    </div>
  );
};
