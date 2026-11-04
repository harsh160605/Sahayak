import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  GraduationCap, 
  TrendingUp,
  Radio,
  MapPin,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatTime } from '../lib/utils';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, sessions, attendanceRecords, requests, timetable } = useData();

  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active');
  const enrolledCourseIds = myEnrollments.map(e => e.courseId);
  const myCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

  // Find Active / Live Lectures right now
  const liveSessions = sessions.filter(
    s => enrolledCourseIds.includes(s.courseId) && (s.status === 'active' || s.status === 'paused')
  );

  // Today's Day Name
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = days[new Date().getDay()];
  const todaySchedule = timetable.filter(
    t => enrolledCourseIds.includes(t.courseId) && t.dayOfWeek === todayDayName
  );

  // Compute attendance stats
  const eligibleSessions = sessions.filter(s => enrolledCourseIds.includes(s.courseId) && s.status === 'ended');
  const myAttendanceRecords = attendanceRecords.filter(r => r.studentUid === currentUser?.uid && r.status === 'present');

  const attendedCount = myAttendanceRecords.length;
  const totalConducted = Math.max(eligibleSessions.length, 1);
  const overallPercentage = Math.round((attendedCount / totalConducted) * 100);

  const pendingRequests = requests.filter(r => r.studentId === currentUser?.uid && r.status === 'pending');
  const isBelowThreshold = overallPercentage < 75;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-warm-300 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            ACADEMIC PROFILE & ATTENDANCE
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-navy-900 mt-1">
            Hello, {currentUser?.fullName}
          </h1>
          <p className="text-sm text-navy-600 mt-1">
            Roll No: <span className="font-mono font-medium text-navy-800">{currentUser?.studentId}</span> &bull; {currentUser?.department} &bull; {currentUser?.semester}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/student/scan"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-surface text-xs font-semibold shadow-subtle transition-all duration-150 active:scale-95"
          >
            <QrCode className="h-4 w-4" />
            <span>Scan QR for Attendance</span>
          </Link>
          <Link
            to="/student/timetable"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-semibold shadow-subtle transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>My Schedule</span>
          </Link>
        </div>
      </div>

      {/* LIVE LECTURE BROADCAST BANNER (FEATURE: Students see active ongoing lectures) */}
      {liveSessions.length > 0 ? (
        <div className="p-5 rounded-xl bg-teal-900 text-white shadow-elevated border border-teal-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-teal-300">
                ACTIVE LECTURE IN PROGRESS ({liveSessions.length})
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-800 text-teal-200">
              Live Attendance Open
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {liveSessions.map(session => {
              const alreadyMarked = attendanceRecords.some(
                r => r.sessionId === session.id && r.studentUid === currentUser?.uid
              );

              return (
                <div 
                  key={session.id} 
                  className="p-4 rounded-lg bg-teal-950/70 border border-teal-700/60 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-800 text-teal-200">
                        {session.courseCode}
                      </span>
                      {session.geofence?.enabled && (
                        <span className="flex items-center gap-1 text-[10px] text-teal-300 font-mono">
                          <MapPin className="h-3 w-3" />
                          <span>GPS Geofenced ({session.geofence.radiusMeters}m)</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{session.courseName}</h3>
                    <p className="text-xs text-teal-300/90 font-mono">
                      Topic: {session.lectureTopic} &bull; Started {formatTime(session.startedAt)}
                    </p>
                  </div>

                  <div>
                    {alreadyMarked ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Marked
                      </span>
                    ) : (
                      <Link
                        to="/student/scan"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs transition-colors shadow-subtle active:scale-95"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Scan Now</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Attendance Threshold Warning Banner */}
      {isBelowThreshold && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-amber-900 uppercase font-mono">
              Attendance Threshold Notice (Below 75%)
            </h3>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Your overall attendance is currently {overallPercentage}%. Maintain at least 75% to remain eligible for end-semester university examinations.
            </p>
          </div>
        </div>
      )}

      {/* Structured Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-xs font-medium uppercase font-mono tracking-wide">Overall Attendance</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {overallPercentage}%
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Min threshold: 75%</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-xs font-medium uppercase font-mono tracking-wide">Lectures Attended</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {attendedCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Verified presence</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-xs font-medium uppercase font-mono tracking-wide">Courses Enrolled</span>
            <BookOpen className="h-4 w-4 text-navy-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {myCourses.length}
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Active enrollments</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-xs font-medium uppercase font-mono tracking-wide">Active Sessions</span>
            <Radio className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-700">
            {liveSessions.length}
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Ready for scan</p>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Enrolled Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy-900 tracking-tight">Enrolled Courses & Standing</h2>
            <Link to="/student/join" className="text-xs text-primary font-medium hover:underline">
              Browse Catalog &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCourses.map(course => {
              const courseSessions = sessions.filter(s => s.courseId === course.id && s.status === 'ended');
              const courseAttended = attendanceRecords.filter(
                r => r.courseId === course.id && r.studentUid === currentUser?.uid && r.status === 'present'
              ).length;
              const percentage = courseSessions.length > 0 ? Math.round((courseAttended / courseSessions.length) * 100) : 100;

              return (
                <div 
                  key={course.id}
                  className="p-5 rounded-lg bg-surface border border-warm-300 shadow-subtle flex flex-col justify-between space-y-4 hover:border-warm-400 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-warm-200 text-navy-800 border border-warm-300">
                        {course.courseCode}
                      </span>
                      <span className={`text-xs font-mono font-bold ${percentage >= 75 ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-navy-900">{course.courseName}</h3>
                    <p className="text-xs text-navy-500">Instructor: {course.teacherName}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-warm-200">
                    <div className="w-full bg-warm-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${percentage >= 75 ? 'bg-primary' : 'bg-amber-500'}`} 
                        style={{ width: `${Math.min(100, percentage)}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-navy-500">
                      <span>{courseAttended} of {courseSessions.length} attended</span>
                      <Link to="/student/history" className="text-primary hover:underline">
                        View log &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Timetable Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-navy-900 tracking-tight">Today ({todayDayName})</h2>
            </div>
            <Link to="/student/timetable" className="text-xs text-primary font-medium hover:underline">
              Full Week
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle space-y-3">
            {todaySchedule.length === 0 ? (
              <p className="text-xs text-navy-500 italic py-6 text-center">
                No lectures scheduled for today.
              </p>
            ) : (
              todaySchedule.map(slot => (
                <div key={slot.id} className="p-3 rounded-md bg-warm-100 border border-warm-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-900 font-mono">{slot.courseCode}</span>
                    <span className="text-navy-600 font-mono text-[11px]">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <p className="text-xs text-navy-700 font-medium truncate">{slot.courseName}</p>
                  <p className="text-[11px] text-navy-500 font-mono">Room: {slot.room} &bull; {slot.teacherName}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
