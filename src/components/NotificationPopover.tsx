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
  const { requests, sessions, enrollments, courses } = useData();

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
        description: `Students waiting for access in ${pending[0].courseCode}`,
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
        description: `${live.courseCode}: ${live.lectureTopic} — Scan QR now`,
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
        className="relative p-2 rounded-md text-navy-600 hover:text-navy-900 hover:bg-warm-200/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Academic notices"
        aria-label="Academic notices"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl border border-warm-300 shadow-elevated z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="px-4 py-3 border-b border-warm-200 flex items-center justify-between bg-warm-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy-900">Academic Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-primary text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-navy-400 hover:text-navy-700 p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-warm-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-navy-500 space-y-1">
                <CheckCircle className="h-6 w-6 text-teal-600 mx-auto mb-1 opacity-75" />
                <p className="font-semibold text-navy-800">All caught up</p>
                <p className="text-[11px] text-navy-500">No pending requests or active session alerts right now.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={n.action}
                  className="p-3.5 hover:bg-warm-100/80 cursor-pointer transition-colors flex items-start gap-3"
                >
                  <div className="p-2 rounded-md bg-warm-200 text-primary shrink-0 mt-0.5">
                    {n.type === 'live_session' ? (
                      <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                    ) : n.type === 'request' ? (
                      <UserCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-navy-900 truncate">{n.title}</p>
                      <span className="text-[10px] font-mono text-navy-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-navy-600 mt-0.5 line-clamp-2">{n.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-warm-50 border-t border-warm-200 text-center">
            <span className="text-[10px] font-mono text-navy-500">SmartAttend Live Notifications</span>
          </div>
        </div>
      )}
    </div>
  );
};
