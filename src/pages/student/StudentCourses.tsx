import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  QrCode, 
  History, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  User,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const StudentCourses: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, sessions, attendanceRecords } = useData();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'safe' | 'warning'>('all');

  // Enrolled courses for this student (either explicit enrollment or departmental curriculum match)
  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active');
  const enrolledCourseIds = myEnrollments.map(e => e.courseId);

  const myCourses = courses.filter(c => 
    enrolledCourseIds.includes(c.id) || 
    (c.department === currentUser?.department && (!c.semester || c.semester === currentUser?.semester))
  );

  // Robust calculation of attendance per course
  const courseSummaries = useMemo(() => {
    return myCourses.map(course => {
      // 1. All conducted sessions registered for this course
      const courseSessions = sessions.filter(s => 
        s.courseId === course.id && 
        s.conductStatus !== 'CANCELLED' && 
        s.conductStatus !== 'NOT_CONDUCTED' &&
        (s.status === 'ended' || s.status === 'active')
      );
      
      // 2. Attendance records for this student in this course
      const studentRecords = attendanceRecords.filter(
        r => r.courseId === course.id && r.studentUid === currentUser?.uid && r.status === 'present'
      );

      // Deduplicate by sessionId
      const attendedSessionIds = new Set(
        studentRecords.map(r => r.sessionId || r.id)
      );
      const attended = attendedSessionIds.size;

      // 3. All valid conducted sessions
      const allConductedSessionIds = new Set([
        ...courseSessions.map(s => s.id),
        ...attendanceRecords.filter(r => r.courseId === course.id).map(r => r.sessionId).filter(Boolean)
      ]);

      const totalConducted = Math.max(allConductedSessionIds.size, attended);

      const percentage = totalConducted > 0 
        ? Math.min(100, Math.max(0, Math.round((attended / totalConducted) * 100)))
        : 100;

      return {
        course,
        attended,
        totalConducted,
        percentage,
        isSafe: percentage >= 75
      };
    });
  }, [myCourses, sessions, attendanceRecords, currentUser?.uid]);

  // Aggregate stats
  const totalEnrolled = courseSummaries.length;
  const safeCount = courseSummaries.filter(c => c.isSafe).length;
  const warningCount = totalEnrolled - safeCount;
  const totalAttended = courseSummaries.reduce((sum, c) => sum + c.attended, 0);
  const totalHeld = courseSummaries.reduce((sum, c) => sum + c.totalConducted, 0);
  const aggregatePercentage = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 100;

  // Search & filter
  const filteredSummaries = courseSummaries.filter(item => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      item.course.courseCode.toLowerCase().includes(q) ||
      item.course.courseName.toLowerCase().includes(q) ||
      (item.course.teacherName && item.course.teacherName.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (filterMode === 'safe') return item.isSafe;
    if (filterMode === 'warning') return !item.isSafe;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>ACADEMIC CURRICULUM</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            My Registered Courses
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Subject-wise attendance tracker, faculty details, and university compliance status.
          </p>
        </div>

        <Link
          to="/student/join"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-semibold shadow-subtle transition-all active:scale-95 shrink-0"
        >
          <GraduationCap className="h-4 w-4" />
          <span>Join New Course</span>
        </Link>
      </div>

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-navy-500 uppercase">Enrolled Subjects</span>
          <div className="text-2xl font-extrabold font-mono text-navy-900">{totalEnrolled}</div>
          <span className="text-[10px] text-navy-500 font-sans block">Official Curriculum</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-navy-500 uppercase">Average Attendance</span>
          <div className={`text-2xl font-extrabold font-mono ${aggregatePercentage >= 75 ? 'text-teal-800' : 'text-amber-800'}`}>
            {aggregatePercentage}%
          </div>
          <span className="text-[10px] text-navy-500 font-sans block">{totalAttended} / {totalHeld} Total Hours</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-teal-800 uppercase flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-teal-700" />
            <span>Safe Subjects</span>
          </span>
          <div className="text-2xl font-extrabold font-mono text-teal-900">{safeCount}</div>
          <span className="text-[10px] text-teal-700 font-sans block">&ge; 75% Threshold</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-amber-800 uppercase flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-700" />
            <span>At Risk</span>
          </span>
          <div className={`text-2xl font-extrabold font-mono ${warningCount > 0 ? 'text-amber-900' : 'text-navy-900'}`}>
            {warningCount}
          </div>
          <span className="text-[10px] text-amber-800 font-sans block">&lt; 75% Shortage</span>
        </div>
      </div>

      {/* 3. Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-warm-300 shadow-subtle">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search by course code (e.g. CS301), title, or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-warm-50/60 border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-navy-900 text-white'
                : 'bg-warm-100 text-navy-700 hover:bg-warm-200'
            }`}
          >
            All ({totalEnrolled})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('safe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'safe'
                ? 'bg-teal-700 text-white'
                : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            Safe ({safeCount})
          </button>
          {warningCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'warning'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Shortage ({warningCount})
            </button>
          )}
        </div>
      </div>

      {/* 4. Course Cards Grid */}
      {filteredSummaries.length === 0 ? (
        <div className="p-10 rounded-xl bg-surface border border-warm-300 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-navy-400 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-navy-900">No matching courses found</h3>
          <p className="text-xs text-navy-600 max-w-sm mx-auto">
            {search ? 'Try adjusting your search terms.' : 'You have not joined any courses yet.'}
          </p>
          <Link
            to="/student/join"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover shadow-subtle"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Browse Available Courses</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSummaries.map(({ course, attended, totalConducted: total, percentage, isSafe }) => {
            const shortageLecturesNeeded = !isSafe && total > 0
              ? Math.ceil((0.75 * total - attended) / 0.25)
              : 0;

            return (
              <div 
                key={course.id}
                className="p-5 rounded-xl bg-surface border border-warm-300 hover:border-warm-400 shadow-subtle transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded bg-navy-900 text-white text-xs font-mono font-bold">
                        {course.courseCode}
                      </span>
                      <span className="text-[11px] font-mono text-navy-500">
                        {course.semester || currentUser?.semester || 'Semester'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1 ${
                      isSafe
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      {isSafe ? <CheckCircle2 className="h-3 w-3 text-teal-700" /> : <AlertTriangle className="h-3 w-3 text-amber-700" />}
                      <span>{percentage}%</span>
                    </span>
                  </div>

                  {/* Course Name */}
                  <div>
                    <h3 className="text-base font-bold text-navy-900 leading-snug">
                      {course.courseName}
                    </h3>
                    <p className="text-xs text-navy-600 mt-1 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-navy-400 shrink-0" />
                      <span>Prof. {course.teacherName || 'Faculty Member'}</span>
                      {course.department && (
                        <>
                          <span className="text-warm-400">&bull;</span>
                          <span className="truncate">{course.department}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Attendance Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-navy-600">
                        Present: <strong>{attended}</strong> / {total} Lectures
                      </span>
                      <span className={isSafe ? 'text-teal-800 font-bold' : 'text-amber-800 font-bold'}>
                        {isSafe ? 'Eligible' : 'Shortage'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-warm-200 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSafe ? 'bg-primary' : 'bg-amber-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {!isSafe && shortageLecturesNeeded > 0 && (
                      <p className="text-[11px] text-amber-900 font-medium">
                        Attend next <strong>{shortageLecturesNeeded}</strong> lectures consecutively to reach 75%.
                      </p>
                    )}
                  </div>
                </div>

                {/* Course Actions Footer */}
                <div className="pt-3 border-t border-warm-200 flex items-center justify-between gap-2">
                  <Link
                    to="/student/scan"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-all active:scale-95"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Scan QR</span>
                  </Link>

                  <Link
                    to={`/student/history?courseId=${course.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-medium transition-colors"
                  >
                    <History className="h-3.5 w-3.5 text-navy-600" />
                    <span>View Logs</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

