import React, { useState, useRef, useEffect } from 'react';
import { Bell, QrCode, UserCheck, AlertCircle, CheckCircle, Radio, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime } from '../lib/utils';

export const NotificationPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { requests, sessions, enrollments } = useData();

  const isTeacher = currentUser?.role === 'teacher';

  // Compute real notifications
  interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'live_session' | 'request' | 'info';
    action: () => void;
  }

  const notifications: Notification[] = [];

  if (isTeacher && currentUser) {
    // 1. Pending requests
    const pending = requests.filter(r => r.teacherId === currentUser.uid && r.status === 'pending');
    if (pending.length > 0) {
      notifications.push({
        id: 'pending-requests',
        title: `${pending.length} Pending Enrollment ${pending.length === 1 ? 'Request' : 'Requests'}`,
        description: `Students waiting for admission in ${pending[0].courseCode}`,
        time: formatDate(pending[0].requestedAt),
        type: 'request',
        action: () => {
          navigate('/teacher/requests');
          setIsOpen(false);
        }
      });
    }

    // 2. Active session
    const active = sessions.find(s => s.teacherId === currentUser.uid && s.status === 'active');
    if (active) {
      notifications.push({
        id: `active-${active.id}`,
        title: 'Live Attendance Session Active',
        description: `${active.courseCode} — ${active.lectureTopic}`,
        time: formatTime(active.startedAt),
        type: 'live_session',
        action: () => {
          navigate(`/teacher/live-session?sessionId=${active.id}`);
          setIsOpen(false);
        }
      });
    }
  } else if (!isTeacher && currentUser) {
    // 1. Active sessions in enrolled courses
    const myEnrolledCourseIds = enrollments
      .filter(e => e.studentUid === currentUser.uid && e.status === 'active')
      .map(e => e.courseId);

    const live = sessions.find(s => myEnrolledCourseIds.includes(s.courseId) && s.status === 'active');
    if (live) {
      notifications.push({
        id: `student-live-${live.id}`,
        title: 'Active Lecture in Progress',
        description: `${live.courseCode}: ${live.lectureTopic} — Scan QR token now`,
        time: formatTime(live.startedAt),
        type: 'live_session',
        action: () => {
          navigate('/student/scan');
          setIsOpen(false);
        }
      });
    }

    // 2. Pending or recently approved requests
    const myRequests = requests.filter(r => r.studentId === currentUser.uid);
    const approved = myRequests.filter(r => r.status === 'approved');
    if (approved.length > 0) {
      notifications.push({
        id: 'request-approved',
        title: 'Course Enrollment Approved',
        description: `You are enrolled in ${approved[0].courseCode}`,
        time: approved[0].reviewedAt ? formatDate(approved[0].reviewedAt) : 'Recently',
        type: 'info',
        action: () => {
          navigate('/student');
          setIsOpen(false);
        }
      });
    }
  }

  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        title="Academic notifications"
        aria-label="Academic notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Academic Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-600 text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-1 opacity-75" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">All caught up</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">No pending alerts or active lecture notices right now.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={n.action}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-start gap-3"
                >
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                    {n.type === 'live_session' ? (
                      <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                    ) : n.type === 'request' ? (
                      <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400">SmartAttend Live System Notifications</span>
          </div>
        </div>
      )}
    </div>
  );
};
