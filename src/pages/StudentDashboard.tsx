import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  GraduationCap, 
  Radio,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatTime } from '../lib/utils';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, sessions, attendanceRecords, timetable } = useData();

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
  const todaySchedule = timetable
    .filter(t => enrolledCourseIds.includes(t.courseId) && t.dayOfWeek === todayDayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Compute attendance stats
  const eligibleSessions = sessions.filter(s => enrolledCourseIds.includes(s.courseId) && s.status === 'ended');
  const myAttendanceRecords = attendanceRecords.filter(
    r => r.studentUid === currentUser?.uid && r.status === 'present' && enrolledCourseIds.includes(r.courseId)
  );

  const attendedCount = myAttendanceRecords.length;
  const totalConducted = eligibleSessions.length;
  
  // Real percentage: only compute if at least one session has ended
  const overallPercentage = totalConducted > 0 ? Math.round((attendedCount / totalConducted) * 100) : null;
  const isBelowThreshold = overallPercentage !== null && overallPercentage < 75;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-warm-300 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            ACADEMIC PROFILE & ATTENDANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900 mt-0.5">
            Hello, {currentUser?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Roll No: <span className="font-mono font-medium text-navy-800">{currentUser?.studentId || '22CS042'}</span> &bull; {currentUser?.department} &bull; {currentUser?.semester || 'Current Semester'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/student/scan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-all active:scale-95"
          >
            <QrCode className="h-4 w-4" />
            <span>Scan QR for Attendance</span>
          </Link>
          <Link
            to="/student/timetable"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-medium shadow-subtle transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-navy-500" />
            <span>My Schedule</span>
          </Link>
        </div>
      </div>

      {/* PRIORITY 1: LIVE LECTURE BROADCAST BANNER (Students see active ongoing lectures immediately) */}
      {liveSessions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-teal-950 text-white shadow-elevated border border-teal-800 space-y-3">
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
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-900 border border-teal-700 text-teal-200">
              Attendance Window Open
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
                  className="p-4 rounded-lg bg-navy-900/80 border border-teal-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-900 text-teal-200 border border-teal-700">
                        {session.courseCode}
                      </span>
                      {session.geofence?.enabled && (
                        <span className="flex items-center gap-1 text-[10px] text-teal-300 font-mono">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          <span>GPS Required ({session.geofence.radiusMeters}m)</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{session.courseName}</h3>
                    <p className="text-xs text-teal-300 font-mono">
                      Topic: {session.lectureTopic} &bull; Started {formatTime(session.startedAt)}
                    </p>
                  </div>

                  <div className="shrink-0 pt-1 sm:pt-0">
                    {alreadyMarked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        Marked Present
                      </span>
                    ) : (
                      <Link
                        to="/student/scan"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs transition-colors shadow-subtle active:scale-95"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Scan In Now</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance Threshold Notice (Only shown if sessions were actually conducted and below 75%) */}
      {isBelowThreshold && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-subtle">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-amber-950 uppercase font-mono tracking-wide">
              Attendance Standing Notice: {overallPercentage}% (Below 75% Norm)
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              Your overall attendance is currently below the mandatory 75% requirement. Regular presence in upcoming lectures is required to retain university examination eligibility.
            </p>
          </div>
        </div>
      )}

      {/* Structured Stats Grid (Real values, no arbitrary tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Overall Attendance</span>
            {overallPercentage !== null && overallPercentage >= 75 ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ) : overallPercentage !== null ? (
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            ) : (
              <Clock className="h-4 w-4 text-navy-400" />
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {overallPercentage !== null ? `${overallPercentage}%` : '—'}
          </div>
          <p className="text-[11px] text-navy-500 mt-1">
            {overallPercentage !== null ? 'Threshold: 75% minimum' : 'No ended lectures yet'}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Attended / Total</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {attendedCount} <span className="text-sm font-normal text-navy-500 font-mono">/ {totalConducted}</span>
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Completed lectures</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Courses Enrolled</span>
            <BookOpen className="h-4 w-4 text-navy-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {myCourses.length}
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Active enrollments</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wide text-navy-600">Live Lectures</span>
            <Radio className={`h-4 w-4 ${liveSessions.length > 0 ? 'text-primary animate-pulse' : 'text-navy-400'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-700">
            {liveSessions.length}
          </div>
          <p className="text-[11px] text-navy-500 mt-1">
            {liveSessions.length > 0 ? 'Ready for QR check-in' : 'No active sessions now'}
          </p>
        </div>
      </div>

      {/* Main Grid: Enrolled Courses Standing & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-navy-900 tracking-tight">
                Enrolled Courses & Attendance Standing
              </h2>
            </div>
            <Link to="/student/join" className="text-xs text-primary font-medium hover:underline">
              Browse Catalog &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCourses.length === 0 ? (
              <div className="col-span-full p-8 rounded-lg bg-surface border border-warm-300 text-center space-y-2">
                <GraduationCap className="h-8 w-8 text-navy-400 mx-auto opacity-60" />
                <p className="text-xs font-semibold text-navy-900">You are not yet enrolled in any course</p>
                <p className="text-[11px] text-navy-500">Explore the college course catalog to request admission.</p>
                <Link
                  to="/student/join"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold mt-2"
                >
                  <span>Browse Courses</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              myCourses.map(course => {
                const courseSessions = sessions.filter(s => s.courseId === course.id && s.status === 'ended');
                const courseAttended = attendanceRecords.filter(
                  r => r.courseId === course.id && r.studentUid === currentUser?.uid && r.status === 'present'
                ).length;
                
                const percentage = courseSessions.length > 0 
                  ? Math.round((courseAttended / courseSessions.length) * 100) 
                  : null;

                const isWarning = percentage !== null && percentage < 75;

                // Calculate classes needed to reach 75%
                let neededClasses = 0;
                if (isWarning && courseSessions.length > 0) {
                  // (attended + x) / (total + x) >= 0.75 => x >= 3*total - 4*attended
                  neededClasses = Math.max(0, Math.ceil(3 * courseSessions.length - 4 * courseAttended));
                }

                return (
                  <div 
                    key={course.id}
                    className="p-4 sm:p-5 rounded-lg bg-surface border border-warm-300 shadow-subtle flex flex-col justify-between space-y-4 hover:border-warm-400 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-warm-200 text-navy-800 border border-warm-300">
                          {course.courseCode}
                        </span>
                        {percentage !== null ? (
                          <span className={`text-xs font-mono font-bold ${percentage >= 75 ? 'text-teal-700' : 'text-amber-600'}`}>
                            {percentage}%
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-navy-400">
                            New
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-navy-900 leading-snug">{course.courseName}</h3>
                      <p className="text-xs text-navy-500 font-medium">Instructor: {course.teacherName}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-warm-200">
                      <div className="w-full bg-warm-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            percentage === null 
                              ? 'bg-warm-300' 
                              : percentage >= 75 
                              ? 'bg-primary' 
                              : 'bg-amber-500'
                          }`} 
                          style={{ width: `${percentage !== null ? Math.min(100, percentage) : 0}%` }} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] font-mono text-navy-500">
                        <span>{courseAttended} of {courseSessions.length} attended</span>
                        <Link to="/student/history" className="text-primary hover:underline font-medium">
                          Log &rarr;
                        </Link>
                      </div>

                      {neededClasses > 0 && (
                        <p className="text-[10px] text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Attend next {neededClasses} {neededClasses === 1 ? 'class' : 'classes'} to reach 75%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's Timetable Widget */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-navy-900 tracking-tight">
                Today ({todayDayName})
              </h2>
            </div>
            <Link to="/student/timetable" className="text-xs text-primary font-medium hover:underline">
              Weekly &rarr;
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle space-y-3">
            {todaySchedule.length === 0 ? (
              <div className="py-8 text-center text-xs text-navy-500 space-y-1">
                <Calendar className="h-6 w-6 text-navy-400 mx-auto opacity-50 mb-1" />
                <p className="font-semibold text-navy-800">No lectures scheduled today</p>
                <p className="text-[11px] text-navy-500">Enjoy your free period or check the weekly schedule.</p>
              </div>
            ) : (
              todaySchedule.map(slot => (
                <div key={slot.id} className="p-3 rounded-md bg-warm-100 border border-warm-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-900 font-mono">{slot.courseCode}</span>
                    <span className="text-teal-800 font-mono text-[11px] font-semibold">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <p className="text-xs text-navy-800 font-medium truncate">{slot.courseName}</p>
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
