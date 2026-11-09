import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatTime } from '../lib/utils';
import { DayOfWeek } from '../types';

export const StudentDashboard: React.FC = () => {
  const { currentUser, currentOrg } = useAuth();
  const { 
    courses, 
    enrollments, 
    sessions, 
    attendanceRecords, 
    timetable, 
    divisions,
    getSlotConductStatus 
  } = useData();

  const [activeTab, setActiveTab] = useState<'schedule' | 'courses'>('schedule');

  // Student enrollments & courses
  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active');
  const enrolledCourseIds = myEnrollments.map(e => e.courseId);
  
  const myCourses = courses.filter(c => 
    enrolledCourseIds.includes(c.id) || 
    (c.department === currentUser?.department && (!c.semester || c.semester === currentUser?.semester))
  );
  const activeCourseIds = myCourses.map(c => c.id);

  // Student's division details
  const myDivision = divisions.find(d => 
    d.id === currentUser?.divisionId || 
    (d.name === currentUser?.divisionName && d.yearOfStudy === currentUser?.yearOfStudy)
  );

  // Active / Live sessions right now matching student's enrolled courses
  const liveSessions = sessions.filter(
    s => activeCourseIds.includes(s.courseId) && 
         (s.status === 'active' || s.status === 'paused')
  );

  // Today's schedule calculation
  const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayRawIndex = new Date().getDay(); // 0 is Sunday
  const todayDayName: DayOfWeek = todayRawIndex === 0 ? 'Monday' : (dayNames[todayRawIndex - 1] || 'Monday');
  const isWeekendDemo = todayRawIndex === 0 || todayRawIndex === 6;

  // Selected Day for interactive timetable preview & swipe navigation
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<DayOfWeek>(todayDayName);

  const handlePrevDay = () => {
    const idx = dayNames.indexOf(selectedScheduleDay);
    const prev = (idx - 1 + dayNames.length) % dayNames.length;
    setSelectedScheduleDay(dayNames[prev]);
  };

  const handleNextDay = () => {
    const idx = dayNames.indexOf(selectedScheduleDay);
    const next = (idx + 1) % dayNames.length;
    setSelectedScheduleDay(dayNames[next]);
  };

  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNextDay();
      } else {
        handlePrevDay();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Timetable slots for this student's division or enrolled courses on selected day
  const scheduleDaySlots = timetable.filter(t => {
    const matchesDivision = t.divisionId === currentUser?.divisionId || t.divisionName === currentUser?.divisionName;
    const matchesCourse = activeCourseIds.includes(t.courseId || '');
    return t.dayOfWeek === selectedScheduleDay && (matchesDivision || matchesCourse) && t.sessionType !== 'break';
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Timetable slots for today (for top metrics & active check)
  const todayDateStr = new Date().toISOString().slice(0, 10);

  // Extra lectures scheduled or conducted for this student's division today
  const divisionExtraLectures = sessions.filter(s => 
    s.isExtraLecture && 
    (s.divisionId === currentUser?.divisionId || s.divisionName === currentUser?.divisionName || activeCourseIds.includes(s.courseId)) &&
    (s.lectureDate === todayDateStr || (s.startedAt && s.startedAt.startsWith(todayDateStr)))
  );

  const divisionSlots = timetable.filter(t => {
    const matchesDivision = t.divisionId === currentUser?.divisionId || t.divisionName === currentUser?.divisionName;
    const matchesCourse = activeCourseIds.includes(t.courseId || '');
    return t.dayOfWeek === todayDayName && (matchesDivision || matchesCourse) && t.sessionType !== 'break';
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Fallback to Monday for weekend review
  const activeDisplaySlots = divisionSlots.length > 0
    ? divisionSlots
    : timetable.filter(t => {
        const matchesDivision = t.divisionId === currentUser?.divisionId || t.divisionName === currentUser?.divisionName;
        const matchesCourse = activeCourseIds.includes(t.courseId || '');
        return t.dayOfWeek === 'Monday' && (matchesDivision || matchesCourse) && t.sessionType !== 'break';
      }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Next or current slot
  const currentHourMinute = new Date().toTimeString().slice(0, 5);
  const currentActiveSlot = activeDisplaySlots.find(
    s => currentHourMinute >= s.startTime && currentHourMinute <= s.endTime
  ) || activeDisplaySlots[0];

  // Unified, robust calculation of course-by-course and overall attendance statistics
  const courseSummaries = useMemo(() => {
    return myCourses.map(course => {
      // 1. All conducted sessions registered for this course (excluding cancelled or non-conducted sessions)
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

      // Deduplicate by sessionId so a student is counted at most once per session
      const attendedSessionIds = new Set(
        studentRecords.map(r => r.sessionId || r.id)
      );
      const attended = attendedSessionIds.size;

      // 3. All valid conducted sessions for this course (from conducted sessions list + any recorded attendances)
      const allConductedSessionIds = new Set([
        ...courseSessions.map(s => s.id),
        ...attendanceRecords.filter(r => r.courseId === course.id).map(r => r.sessionId).filter(Boolean)
      ]);

      // Total conducted sessions for this course can NEVER be less than attended
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

  // Aggregate overall attendance across all enrolled courses
  const attendedCount = courseSummaries.reduce((sum, c) => sum + c.attended, 0);
  const totalConducted = courseSummaries.reduce((sum, c) => sum + c.totalConducted, 0);

  // Overall percentage strictly clamped between 0% and 100%
  const overallPercentage = totalConducted > 0 
    ? Math.min(100, Math.max(0, Math.round((attendedCount / totalConducted) * 100))) 
    : 100;
  const isBelowThreshold = overallPercentage < 75;

  // Mathematically sound safety buffer calculation:
  // Can only have a safe buffer if overall attendance >= 75% and classes were held
  const safeBufferMiss = (overallPercentage >= 75 && totalConducted > 0)
    ? Math.max(0, Math.floor((4 * attendedCount - 3 * totalConducted) / 3))
    : 0;

  // Consecutive classes needed to reach 75%
  const requiredCatchupAttend = (overallPercentage < 75 && totalConducted > 0)
    ? Math.max(1, Math.ceil(3 * totalConducted - 4 * attendedCount))
    : 0;

  // Time-of-day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.fullName?.split(' ')[0] || 'Student';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header: Clean Personalized Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-300 pb-3 sm:pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-navy-500 mb-1">
            <span className="hidden sm:inline font-semibold text-primary">STUDENT PORTAL &bull;</span>
            <span className="font-semibold text-navy-800 bg-warm-100 px-2 py-0.5 rounded border border-warm-200 text-[11px]">
              {currentUser?.divisionName || 'Div A'}
            </span>
            <span className="text-warm-400">&bull;</span>
            <span className="text-navy-700">Roll: <strong className="font-mono text-navy-900">{currentUser?.studentId || currentUser?.rollNo || '22CS042'}</strong></span>
            <span className="hidden sm:inline text-warm-400">&bull;</span>
            <span className="hidden sm:inline text-navy-600">{currentUser?.yearOfStudy || 'Third Year'}</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-navy-900">
            {timeGreeting}, {firstName}
          </h1>
          <p className="hidden sm:block text-xs text-navy-600 mt-0.5">
            {currentOrg?.name || 'Apex Institute of Technology'} &bull; Department of {currentUser?.department || 'Computer Engineering'}
          </p>
        </div>

        {/* Primary Action Button (Desktop Only — mobile uses persistent thumb-first bottom bar) */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <Link
            to="/student/scan"
            className="px-5 py-2.5 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-semibold shadow-subtle transition-all duration-150 inline-flex items-center gap-2 active:scale-95"
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            <span>Scan QR Attendance</span>
          </Link>
          <Link
            to="/student/timetable"
            className="px-3.5 py-2.5 min-h-[44px] rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            title="View Weekly Timetable"
          >
            <Calendar className="h-4 w-4 text-navy-500" aria-hidden="true" />
            <span className="hidden sm:inline">Timetable</span>
          </Link>
        </div>
      </div>

      {/* 2. Concise Metrics Row (Simplified 2-Column on Mobile, 3-Card on Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Metric 1: Overall Attendance */}
        <div className="p-3.5 sm:p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-navy-600">
            <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider">Attendance</span>
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span className={`text-2xl sm:text-3xl font-bold font-mono ${overallPercentage >= 75 ? 'text-teal-800' : 'text-amber-700'}`}>
              {overallPercentage}%
            </span>
            <span className="text-[10px] sm:text-xs text-navy-500 font-mono">
              ({attendedCount}/{totalConducted} classes)
            </span>
          </div>
          <div className="w-full bg-warm-200 h-1.5 sm:h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${overallPercentage >= 75 ? 'bg-primary' : 'bg-amber-600'}`} 
              style={{ width: `${Math.min(100, overallPercentage)}%` }} 
            />
          </div>
          <span className="text-[10px] sm:text-[11px] text-navy-500 font-mono block">
            Target: &ge;75% required
          </span>
        </div>

        {/* Metric 2: Attendance Safety Margin */}
        <div className={`p-3.5 sm:p-5 rounded-xl border shadow-subtle space-y-1.5 sm:space-y-2 ${
          safeBufferMiss > 0 
            ? 'bg-teal-50/40 border-teal-200' 
            : isBelowThreshold 
              ? 'bg-amber-50/50 border-amber-300' 
              : 'bg-surface border-warm-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-navy-700 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
              <span>Safety</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded ${
              safeBufferMiss > 0 ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-900'
            }`}>
              {safeBufferMiss > 0 ? 'Good' : 'Risk'}
            </span>
          </div>

          <div className="text-xl sm:text-2xl font-bold font-mono text-navy-900">
            {safeBufferMiss > 0 ? (
              <span>+{safeBufferMiss} <span className="text-[10px] sm:text-xs font-normal text-navy-600">buffer</span></span>
            ) : isBelowThreshold ? (
              <span className="text-amber-800">{Math.max(requiredCatchupAttend, 1)} <span className="text-[10px] sm:text-xs font-normal text-amber-700">needed</span></span>
            ) : (
              <span>0 <span className="text-[10px] sm:text-xs font-normal text-navy-600">buffer</span></span>
            )}
          </div>

          <p className="text-[10px] sm:text-xs text-navy-600 line-clamp-1 sm:line-clamp-none">
            {safeBufferMiss > 0 
              ? `Can miss up to ${safeBufferMiss} safely.`
              : isBelowThreshold 
                ? `Attend next ${Math.max(requiredCatchupAttend, 1)} sessions.`
                : 'At 75% boundary.'}
          </p>
        </div>

        {/* Metric 3: Today's Schedule Overview (Desktop Only - on mobile, schedule section is right below) */}
        <div className="hidden sm:block p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-navy-600">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Today's Schedule</span>
            <GraduationCap className="h-4 w-4 text-navy-500" aria-hidden="true" />
          </div>
          <div className="text-3xl font-bold font-mono text-navy-900">
            {activeDisplaySlots.length} <span className="text-xs font-normal text-navy-500">classes</span>
          </div>
          <p className="text-xs text-navy-600 truncate">
            {myCourses.length} active registered courses
          </p>
          <div className="text-[11px] text-navy-500 font-mono">
            Division: {currentUser?.divisionName || 'Div A'}
          </div>
        </div>
      </div>

      {/* 4. Progressive Disclosure: Toggle between Today's Schedule & Subject Attendance */}
      <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
        {/* Section Tabs */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-warm-200">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`pb-3 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'border-b-2 border-primary text-navy-900 font-bold'
                  : 'text-navy-500 hover:text-navy-800'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Today's Classes ({activeDisplaySlots.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`pb-3 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'courses'
                  ? 'border-b-2 border-primary text-navy-900 font-bold'
                  : 'text-navy-500 hover:text-navy-800'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Subject Attendance ({myCourses.length})</span>
            </button>
          </div>

          <Link 
            to={activeTab === 'schedule' ? '/student/timetable' : '/student/courses'} 
            className="text-xs text-primary font-semibold hover:underline pb-3 inline-flex items-center gap-1"
          >
            <span>{activeTab === 'schedule' ? 'Weekly Grid' : 'All Courses'}</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Tab Body */}
        <div className="p-5">
          {activeTab === 'schedule' ? (
            <div className="space-y-3">
              {/* Day Selector Pills & Mobile Navigation Bar */}
              <div className="flex items-center justify-between pb-1 gap-2 overflow-x-auto touch-scroll no-scrollbar">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevDay}
                    className="p-1.5 rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-700 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 transition-all"
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {dayNames.map(d => {
                    const isSelected = selectedScheduleDay === d;
                    const isToday = d === todayDayName;
                    const count = timetable.filter(t => {
                      const matchesDivision = t.divisionId === currentUser?.divisionId || t.divisionName === currentUser?.divisionName;
                      const matchesCourse = activeCourseIds.includes(t.courseId || '');
                      return t.dayOfWeek === d && (matchesDivision || matchesCourse) && t.sessionType !== 'break';
                    }).length;

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedScheduleDay(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 min-h-[36px] ${
                          isSelected
                            ? 'bg-navy-900 text-white shadow-subtle'
                            : 'bg-warm-100/80 text-navy-700 hover:bg-warm-200 border border-warm-200'
                        }`}
                      >
                        <span>{d.slice(0, 3)}</span>
                        {isToday && (
                          <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                            isSelected ? 'bg-primary text-white' : 'bg-teal-100 text-teal-800'
                          }`}>
                            NOW
                          </span>
                        )}
                        <span className={`text-[10px] font-mono px-1.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-warm-200 text-navy-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleNextDay}
                    className="p-1.5 rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-700 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 transition-all"
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {selectedScheduleDay !== todayDayName && (
                  <button
                    type="button"
                    onClick={() => setSelectedScheduleDay(todayDayName)}
                    className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shrink-0 hover:bg-teal-100 transition-colors"
                  >
                    Jump to Today
                  </button>
                )}
              </div>

              {/* Day Classes Container with Touch Swipe Gesture */}
              <div 
                className="space-y-2.5 pt-1 touch-scroll"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Extra Lectures Alert for Today */}
                {selectedScheduleDay === todayDayName && divisionExtraLectures.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {divisionExtraLectures.map(extra => (
                      <div
                        key={extra.id}
                        className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-600 text-white">
                              EXTRA LECTURE
                            </span>
                            <span className="text-xs font-mono font-bold text-navy-900">{extra.courseCode}</span>
                            <span className="text-xs text-navy-600 font-mono">
                              {extra.scheduledStartTime || 'Live Today'} {extra.scheduledEndTime ? `– ${extra.scheduledEndTime}` : ''}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-navy-900">{extra.lectureTopic}</h4>
                          <p className="text-[11px] text-navy-600 font-mono">
                            Instructor: {extra.teacherName || 'Faculty'} &bull; Room: {extra.room || 'Classroom'}
                          </p>
                        </div>

                        {extra.status === 'active' && (
                          <Link
                            to="/student/scan"
                            className="px-3 py-1.5 min-h-[36px] rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle inline-flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>Scan Extra Class</span>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {scheduleDaySlots.length === 0 ? (
                  <div className="py-8 text-center bg-warm-50/60 rounded-xl border border-dashed border-warm-300 space-y-1">
                    <p className="text-xs font-bold text-navy-800">No classes scheduled on {selectedScheduleDay}</p>
                    <p className="text-[11px] text-navy-500">You have no lectures or practicals assigned for your division on this day.</p>
                  </div>
                ) : (
                  scheduleDaySlots.map((slot, index) => {
                    const isCurrent = slot.id === currentActiveSlot?.id && selectedScheduleDay === todayDayName;
                    const statusInfo = selectedScheduleDay === todayDayName 
                      ? getSlotConductStatus(slot, todayDateStr) 
                      : null;

                    const isAttended = statusInfo?.session?.id 
                      ? attendanceRecords.some(r => r.sessionId === statusInfo.session?.id && r.studentUid === currentUser?.uid && r.status === 'present')
                      : false;

                    return (
                      <div
                        key={slot.id || index}
                        className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          statusInfo?.status === 'IN_PROGRESS'
                            ? 'bg-teal-50/60 border-teal-300 ring-1 ring-primary/20 shadow-subtle'
                            : statusInfo?.status === 'CANCELLED'
                            ? 'bg-rose-50/40 border-rose-200'
                            : statusInfo?.status === 'RESCHEDULED'
                            ? 'bg-amber-50/40 border-amber-200'
                            : statusInfo?.status === 'NOT_CONDUCTED'
                            ? 'bg-warm-100/50 border-warm-300'
                            : isCurrent
                            ? 'bg-warm-50 border-primary ring-1 ring-primary/20 shadow-subtle'
                            : 'bg-white border-warm-200 hover:bg-warm-50/50'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono font-bold shrink-0 ${
                            statusInfo?.status === 'IN_PROGRESS' 
                              ? 'bg-primary text-white animate-pulse'
                              : isCurrent 
                              ? 'bg-primary text-white' 
                              : 'bg-navy-900 text-white'
                          }`}>
                            {slot.startTime} – {slot.endTime}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-bold text-navy-900">{slot.courseCode}</span>
                              <span className="text-xs font-bold text-navy-900">&bull; {slot.courseName}</span>

                              {/* Real-time Status Badges */}
                              {statusInfo?.status === 'IN_PROGRESS' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-600 text-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                                  <span>LIVE NOW</span>
                                </span>
                              )}
                              {statusInfo?.status === 'CANCELLED' && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                  CANCELLED BY FACULTY
                                </span>
                              )}
                              {statusInfo?.status === 'RESCHEDULED' && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  RESCHEDULED
                                </span>
                              )}
                              {statusInfo?.status === 'NOT_CONDUCTED' && (
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-warm-200 text-navy-600">
                                  NOT CONDUCTED
                                </span>
                              )}
                              {statusInfo?.status === 'COMPLETED' && (
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  isAttended ? 'bg-teal-100 text-teal-800' : 'bg-warm-200 text-navy-600'
                                }`}>
                                  {isAttended ? 'ATTENDED ✓' : 'SESSION ENDED'}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-navy-500 font-mono mt-0.5">
                              Room: {slot.room || 'Hall 301'} &bull; Instructor: {slot.teacherName}
                            </p>

                            {/* Detailed Notice for Cancelled or Rescheduled Classes */}
                            {statusInfo?.status === 'CANCELLED' && (
                              <p className="text-[11px] text-rose-700 italic mt-1 font-sans">
                                Notice: {statusInfo.cancellationReason} &bull; <strong className="font-semibold text-teal-800">Student attendance unaffected.</strong>
                              </p>
                            )}

                            {statusInfo?.status === 'RESCHEDULED' && statusInfo.session?.rescheduledTo && (
                              <p className="text-[11px] text-amber-800 font-mono mt-1">
                                Compensatory timing: {statusInfo.session.rescheduledTo.date} ({statusInfo.session.rescheduledTo.startTime}–{statusInfo.session.rescheduledTo.endTime}) [Room {statusInfo.session.rescheduledTo.room || slot.room}]
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {statusInfo?.status === 'IN_PROGRESS' && (
                            <Link
                              to="/student/scan"
                              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle inline-flex items-center gap-1.5 transition-all active:scale-95"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              <span>Scan Now</span>
                            </Link>
                          )}

                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-warm-200 text-navy-700">
                            {slot.sessionType}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Mobile Touch Swipe Hint */}
                <p className="text-[10px] text-navy-400 font-mono text-center md:hidden pt-2 flex items-center justify-center gap-1.5">
                  <span>Swipe left/right to browse days</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courseSummaries.map(({ course, attended, totalConducted: total, percentage, isSafe }) => (
                <div
                  key={course.id}
                  className="p-4 rounded-lg border border-warm-200 bg-white hover:border-warm-300 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-navy-900 text-white">
                      {course.courseCode}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isSafe ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      {percentage}% {isSafe ? 'Good' : 'At Risk'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-navy-900 truncate">{course.courseName}</h3>
                    <p className="text-[11px] text-navy-500">Instructor: {course.teacherName || 'Faculty'}</p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-warm-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isSafe ? 'bg-primary' : 'bg-amber-600'}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-navy-500">
                      <span>{attended}/{total} attended</span>
                      <span>{isSafe ? 'Above 75%' : 'Defaulter Risk'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
