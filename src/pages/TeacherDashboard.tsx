import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  CheckCircle2, 
  QrCode, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  Play,
  UserCheck,
  Calendar,
  Radio,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate, formatTime } from '../lib/utils';

export const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, sessions, requests, enrollments } = useData();

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);
  const mySessions = sessions.filter(s => s.teacherId === currentUser?.uid);
  const pendingRequests = requests.filter(r => r.teacherId === currentUser?.uid && r.status === 'pending');
  
  // Real active / paused session
  const activeSession = mySessions.find(s => s.status === 'active' || s.status === 'paused');

  // Compute accurate real metrics without hardcoded trends or fake fallbacks
  const totalEnrolled = myCourses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);
  const endedSessions = mySessions.filter(s => s.status === 'ended');

  // Compute genuine average attendance only if completed sessions exist
  let avgAttendancePercentage: number | null = null;
  if (endedSessions.length > 0) {
    let totalPresentSum = 0;
    let totalPossibleSum = 0;

    endedSessions.forEach(s => {
      const course = courses.find(c => c.id === s.courseId);
      const courseEnrolled = enrollments.filter(e => e.courseId === s.courseId && e.status === 'active').length || course?.enrolledCount || 0;
      if (courseEnrolled > 0) {
        totalPresentSum += (s.totalPresent || 0);
        totalPossibleSum += courseEnrolled;
      }
    });

    if (totalPossibleSum > 0) {
      avgAttendancePercentage = Math.round((totalPresentSum / totalPossibleSum) * 100);
    }
  }

  const recentSessions = mySessions.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-warm-300 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            FACULTY PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900 mt-0.5">
            Welcome back, {currentUser?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            {currentUser?.department} &bull; Faculty ID: <span className="font-mono font-medium text-navy-800">{currentUser?.facultyId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/teacher/take-attendance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-all active:scale-95"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Launch Attendance</span>
          </Link>
          <Link
            to="/teacher/timetable"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-medium shadow-subtle transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-navy-500" />
            <span>Timetable</span>
          </Link>
          <Link
            to="/teacher/courses"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-medium shadow-subtle transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-navy-500" />
            <span>Courses</span>
          </Link>
        </div>
      </div>

      {/* ACTIVE LIVE SESSION BANNER (Priority 1: Teacher's Ongoing Lecture) */}
      {activeSession && (
        <div className="p-4 sm:p-5 rounded-xl bg-navy-900 text-white shadow-elevated border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-300 shrink-0">
              <Radio className="h-5 w-5 animate-pulse text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-800 text-teal-200">
                  {activeSession.courseCode}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  LIVE SESSION ACTIVE
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {activeSession.courseName}
              </h3>
              <p className="text-xs text-navy-300 font-mono">
                Topic: {activeSession.lectureTopic} &bull; Started {formatTime(activeSession.startedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to={`/teacher/live-session?sessionId=${activeSession.id}`}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle transition-colors flex items-center gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Open Projector View</span>
            </Link>
          </div>
        </div>
      )}

      {/* ACTIONABLE TASK BANNER: Pending Enrollment Requests (Priority 2: Review Queue) */}
      {pendingRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-950 uppercase font-mono tracking-wide">
                {pendingRequests.length} Student {pendingRequests.length === 1 ? 'Request' : 'Requests'} Awaiting Review
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Students cannot check into attendance sessions until their course admission is approved.
              </p>
            </div>
          </div>

          <Link
            to="/teacher/requests"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            <span>Review Queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Structured Metrics Grid (No fake trends, real values with empty fallback states) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Active Courses</span>
            <BookOpen className="h-4 w-4 text-navy-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">{myCourses.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">Teaching portfolio</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Enrolled Students</span>
            <Users className="h-4 w-4 text-navy-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">{totalEnrolled}</div>
          <p className="text-[11px] text-navy-500 mt-1">Across all cohorts</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Sessions Conducted</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">{endedSessions.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">
            {endedSessions.length > 0 ? `${mySessions.length} total initialized` : 'No sessions completed yet'}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Avg. Attendance</span>
            <Clock className="h-4 w-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {avgAttendancePercentage !== null ? `${avgAttendancePercentage}%` : '—'}
          </div>
          <p className="text-[11px] text-navy-500 mt-1">
            {avgAttendancePercentage !== null ? 'Historical cohort average' : 'Calculates after first session'}
          </p>
        </div>
      </div>

      {/* Main Operational Split: Courses Roster & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Directory (2 Cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-navy-900 tracking-tight">Active Courses & Rosters</h2>
            </div>
            <Link to="/teacher/courses" className="text-xs text-primary font-medium hover:underline">
              View all ({myCourses.length}) &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {myCourses.length === 0 ? (
              <div className="p-8 rounded-lg bg-surface border border-warm-300 text-center space-y-2">
                <BookOpen className="h-8 w-8 text-navy-400 mx-auto opacity-60" />
                <p className="text-xs font-semibold text-navy-900">No active courses registered</p>
                <p className="text-[11px] text-navy-500">Create your first course to begin launching attendance.</p>
                <Link
                  to="/teacher/courses"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold mt-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Course</span>
                </Link>
              </div>
            ) : (
              myCourses.map(course => (
                <div 
                  key={course.id} 
                  className="p-4 sm:p-5 rounded-lg bg-surface border border-warm-300 shadow-subtle hover:border-warm-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-warm-200 text-navy-800 border border-warm-300">
                        {course.courseCode}
                      </span>
                      <span className="text-xs text-navy-500 font-mono">{course.semester}</span>
                    </div>
                    <h3 className="text-sm font-bold text-navy-900 truncate">{course.courseName}</h3>
                    <p className="text-xs text-navy-600 line-clamp-1">{course.description}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-warm-200">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-mono font-bold text-navy-900">{course.enrolledCount || 0}</span>
                      <p className="text-[10px] text-navy-500 font-mono">Enrolled</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/teacher/students?courseId=${course.id}`}
                        className="px-2.5 py-1.5 rounded-md bg-warm-100 hover:bg-warm-200 border border-warm-300 text-navy-700 text-xs font-medium transition-colors"
                        title="Manage Student Roster"
                      >
                        Roster
                      </Link>

                      <Link
                        to={`/teacher/take-attendance?courseId=${course.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-subtle transition-colors"
                        title="Start Live QR Attendance"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Launch</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Attendance Sessions & Audit Feed */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-navy-900 tracking-tight">Recent Sessions</h2>
            </div>
            <Link to="/teacher/history" className="text-xs text-primary font-medium hover:underline">
              Full History &rarr;
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle space-y-3">
            {recentSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-navy-500 space-y-1">
                <Clock className="h-6 w-6 text-navy-400 mx-auto opacity-50 mb-1" />
                <p className="font-semibold text-navy-800">No sessions recorded yet</p>
                <p className="text-[11px] text-navy-500">Initiate your first lecture session using the Launch button.</p>
              </div>
            ) : (
              recentSessions.map(session => (
                <div key={session.id} className="pb-3 border-b border-warm-200 last:border-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-900 font-mono">{session.courseCode}</span>
                    <span className="text-navy-500 text-[11px] font-mono">{formatDate(session.startedAt)}</span>
                  </div>
                  <p className="text-xs text-navy-700 line-clamp-1">{session.lectureTopic}</p>
                  <div className="flex items-center justify-between text-[11px] pt-0.5 text-navy-500 font-mono">
                    <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      {session.totalPresent || 0} students marked
                    </span>
                    <span className={`px-1.5 py-0.2 rounded uppercase text-[9px] font-mono font-bold border ${
                      session.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : session.status === 'paused'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-warm-100 text-navy-700 border-warm-300'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
