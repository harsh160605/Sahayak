import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  GraduationCap, 
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate } from '../lib/utils';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, sessions, attendanceRecords, requests } = useData();

  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active');
  const enrolledCourseIds = myEnrollments.map(e => e.courseId);
  const myCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

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
            to="/student/join"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-semibold shadow-subtle transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Join Course</span>
          </Link>
        </div>
      </div>

      {/* Attendance Threshold Warning Banner (Design principle: meaningful state handling) */}
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
            <span className="text-xs font-medium uppercase font-mono tracking-wide">Pending Requests</span>
            <Clock className="h-4 w-4 text-navy-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {pendingRequests.length}
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Awaiting faculty review</p>
        </div>
      </div>

      {/* Enrolled Courses & Detailed Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy-900 tracking-tight">Course Attendance Breakdown</h2>
          <Link to="/student/courses" className="text-xs text-primary font-medium hover:underline">
            All courses ({myCourses.length})
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
    </div>
  );
};

