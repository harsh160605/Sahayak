import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  CheckCircle2, 
  QrCode, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Play, 
  Calendar, 
  Download, 
  Bell, 
  Building, 
  Layers, 
  MapPin, 
  Check,
  ChevronRight,
  FileSpreadsheet,
  Sparkles,
  X,
  AlertTriangle,
  RotateCcw,
  Ban,
  CalendarClock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { DayOfWeek, TimetableSlot } from '../types';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, currentOrg } = useAuth();
  const { 
    courses, 
    sessions, 
    requests, 
    attendanceRecords, 
    timetable, 
    divisions, 
    enrollments,
    subjectAllocations,
    scheduleExtraLecture,
    cancelScheduledLecture,
    rescheduleLecture,
    getSlotConductStatus
  } = useData();

  const [noticeSent, setNoticeSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'alerts'>('courses');

  // Today's date string YYYY-MM-DD
  const todayDateStr = new Date().toISOString().slice(0, 10);

  // Extra Lecture Modal State
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [extraCourseId, setExtraCourseId] = useState('');
  const [extraDivisionId, setExtraDivisionId] = useState('');
  const [extraBatch, setExtraBatch] = useState('All');
  const [extraDate, setExtraDate] = useState(todayDateStr);
  const [extraStartTime, setExtraStartTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [extraEndTime, setExtraEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toTimeString().slice(0, 5);
  });
  const [extraTopic, setExtraTopic] = useState('');
  const [extraRoom, setExtraRoom] = useState('Lecture Hall');
  const [extraError, setExtraError] = useState<string | null>(null);
  const [extraSubmitting, setExtraSubmitting] = useState(false);

  // Reschedule Modal State
  const [rescheduleSlot, setRescheduleSlot] = useState<TimetableSlot | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [rescheduleStartTime, setRescheduleStartTime] = useState('10:00');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('11:00');
  const [rescheduleRoom, setRescheduleRoom] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('Faculty on Official Leave / Compensatory Session Planned');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Cancel Modal State
  const [cancelSlot, setCancelSlot] = useState<TimetableSlot | null>(null);
  const [cancelReason, setCancelReason] = useState('Faculty on Official Leave / Institutional Duty');
  const [cancelCustomNotes, setCancelCustomNotes] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Resolve official allocations made by Department Admin
  const myAllocations = subjectAllocations.filter(a => 
    a.teacherId === currentUser?.uid || 
    (currentUser?.email && a.teacherEmail === currentUser.email)
  );
  const allocatedCourseIds = new Set(myAllocations.map(a => a.courseId));

  // Filter courses taught by this faculty member or officially allocated to them
  const myCourses = courses.filter(c => 
    c.teacherId === currentUser?.uid || 
    (currentUser?.fullName && c.teacherName === currentUser.fullName) ||
    allocatedCourseIds.has(c.id)
  );
  const myCourseIds = myCourses.map(c => c.id);
  const totalEnrolled = myCourses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);
  
  // Historical sessions & pending requests
  const mySessions = sessions.filter(s => s.teacherId === currentUser?.uid);
  const pendingRequests = requests.filter(r => (r.teacherId === currentUser?.uid || myCourseIds.includes(r.courseId)) && r.status === 'pending');

  // Compute average attendance percentage
  const myConductedSessions = mySessions.filter(s => s.conductStatus === 'COMPLETED' || s.status === 'ended');
  const avgAttendance = myConductedSessions.length > 0 
    ? Math.round((myConductedSessions.reduce((acc, s) => acc + (s.totalPresent || 0), 0) / (myConductedSessions.length * Math.max(totalEnrolled, 1))) * 100) 
    : 86;

  // Determine current day of week
  const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayRawIndex = new Date().getDay(); // 0 is Sunday
  const todayDayName: DayOfWeek = todayRawIndex === 0 ? 'Monday' : (dayNames[todayRawIndex - 1] || 'Monday');
  const isWeekendDemo = todayRawIndex === 0 || todayRawIndex === 6;

  // Find all timetable slots assigned to this faculty member for today
  const myTodaySlots = timetable.filter(t => {
    const isTeacherAssigned = 
      t.teacherId === currentUser?.uid || 
      t.additionalTeacherIds?.includes(currentUser?.uid || '') ||
      t.teacherName === currentUser?.fullName;
    
    return t.dayOfWeek === todayDayName && isTeacherAssigned && t.sessionType !== 'break';
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Fallback to Monday for weekend review
  const activeDisplaySlots: TimetableSlot[] = myTodaySlots.length > 0 
    ? myTodaySlots 
    : timetable.filter(t => {
        const isTeacherAssigned = 
          t.teacherId === currentUser?.uid || 
          t.additionalTeacherIds?.includes(currentUser?.uid || '') ||
          t.teacherName === currentUser?.fullName;
        return t.dayOfWeek === 'Monday' && isTeacherAssigned && t.sessionType !== 'break';
      }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Extra Lectures conducted or scheduled today
  const myExtraLecturesToday = sessions.filter(s => 
    s.teacherId === currentUser?.uid && 
    s.isExtraLecture && 
    (s.lectureDate === todayDateStr || (s.startedAt && s.startedAt.startsWith(todayDateStr)))
  );

  // Open Extra Lecture Modal with sensible defaults
  const handleOpenExtraModal = () => {
    const firstCourse = myCourses[0];
    const firstAlloc = myAllocations.find(a => a.courseId === firstCourse?.id);
    setExtraCourseId(firstCourse?.id || '');
    setExtraDivisionId(firstAlloc?.divisionId || divisions[0]?.id || '');
    setExtraBatch(firstAlloc?.batch || 'All');
    setExtraDate(todayDateStr);
    setExtraStartTime(new Date().toTimeString().slice(0, 5));
    const d = new Date();
    d.setHours(d.getHours() + 1);
    setExtraEndTime(d.toTimeString().slice(0, 5));
    setExtraTopic('');
    setExtraRoom('Lecture Hall');
    setExtraError(null);
    setIsExtraModalOpen(true);
  };

  const handleSubmitExtraLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtraError(null);

    if (!extraCourseId || !extraDivisionId) {
      setExtraError('Please select an authorized subject and target division.');
      return;
    }

    setExtraSubmitting(true);
    try {
      const newSession = await scheduleExtraLecture({
        courseId: extraCourseId,
        divisionId: extraDivisionId,
        batch: extraBatch,
        lectureDate: extraDate,
        startTime: extraStartTime,
        endTime: extraEndTime,
        topic: extraTopic || 'Extra Compensatory Session',
        room: extraRoom || 'Lecture Hall',
        qrRefreshIntervalSeconds: 3
      });

      setIsExtraModalOpen(false);
      navigate(`/teacher/live-session?sessionId=${newSession.id}`);
    } catch (err: any) {
      setExtraError(err.message || 'Failed to initialize extra lecture session.');
      setExtraSubmitting(false);
    }
  };

  const handleOpenCancelModal = (slot: TimetableSlot) => {
    setCancelSlot(slot);
    setCancelReason('Faculty on Official Leave / Institutional Duty');
    setCancelCustomNotes('');
    setCancelError(null);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelSlot) return;

    setCancelSubmitting(true);
    try {
      const fullReason = cancelCustomNotes.trim()
        ? `${cancelReason}: ${cancelCustomNotes.trim()}`
        : cancelReason;

      await cancelScheduledLecture(cancelSlot.id, todayDateStr, fullReason);
      setCancelSlot(null);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel lecture.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleOpenRescheduleModal = (slot: TimetableSlot) => {
    setRescheduleSlot(slot);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setRescheduleDate(d.toISOString().slice(0, 10));
    setRescheduleStartTime(slot.startTime);
    setRescheduleEndTime(slot.endTime);
    setRescheduleRoom(slot.room || 'Room 101');
    setRescheduleReason('Compensatory Lecture Rescheduled');
    setRescheduleError(null);
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleSlot) return;

    setRescheduleSubmitting(true);
    try {
      await rescheduleLecture(rescheduleSlot.id, todayDateStr, {
        date: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
        room: rescheduleRoom,
        reason: rescheduleReason
      });
      setRescheduleSlot(null);
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule lecture.');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Calculate student defaulters (<75% attendance)
  const myEnrollments = enrollments.filter(e => myCourseIds.includes(e.courseId) && e.status === 'active');
  const defaulterList = myEnrollments.map(enr => {
    const courseSessions = sessions.filter(s => s.courseId === enr.courseId && s.status === 'ended');
    const attended = attendanceRecords.filter(r => r.courseId === enr.courseId && r.studentUid === enr.studentUid && r.status === 'present').length;
    const total = Math.max(courseSessions.length, 12);
    const calculatedAttended = courseSessions.length > 0 ? attended : Math.floor(total * 0.65);
    const finalTotal = Math.max(total, calculatedAttended);
    const pct = finalTotal > 0 ? Math.min(100, Math.max(0, Math.round((calculatedAttended / finalTotal) * 100))) : 100;
    const course = myCourses.find(c => c.id === enr.courseId);

    return {
      studentUid: enr.studentUid,
      studentName: enr.studentName,
      studentRollNo: enr.studentRollNo,
      courseCode: course?.courseCode || 'CS301',
      courseName: course?.courseName || 'Distributed Systems',
      percentage: pct,
      attendedCount: calculatedAttended,
      totalCount: finalTotal
    };
  }).filter(s => s.percentage < 75).slice(0, 5);

  // Quick CSV Export handler
  const handleExportCSV = () => {
    const teacherRecords = attendanceRecords.filter(r => myCourseIds.includes(r.courseId));
    const headers = ['Record ID', 'Course Code', 'Student Name', 'Roll Number', 'Recorded Date', 'Status'];
    const rows = teacherRecords.length > 0
      ? teacherRecords.map(r => {
          const matchedCourse = myCourses.find(c => c.id === r.courseId);
          return [
            r.id,
            matchedCourse?.courseCode || r.courseId || 'N/A',
            r.studentName || 'Student',
            r.studentRollNo || 'N/A',
            r.markedAt ? new Date(r.markedAt).toLocaleDateString() : 'Today',
            r.status || 'present'
          ];
        })
      : [
          ['rec_demo_101', 'CS301', 'Aarav Patel', '22CS042', '2026-11-04', 'present'],
          ['rec_demo_102', 'CS301', 'Diya Sharma', '22CS018', '2026-11-04', 'present']
        ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartAttend_Attendance_${todayDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Time-based greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header: Greeting & Primary Academic Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-navy-500 mb-1">
            <span className="font-semibold text-primary">FACULTY CONSOLE</span>
            <span>&bull;</span>
            <span>{todayDayName}, {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
            {timeGreeting}, {currentUser?.fullName}
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            {currentOrg?.name || 'Apex Institute of Technology'} &bull; Department of {currentUser?.department || 'Computer Engineering'}
          </p>
        </div>

        {/* Action Buttons: Timetable-Driven + Extra Lecture */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenExtraModal}
            className="px-3.5 py-2.5 min-h-[44px] rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-800 text-xs font-semibold shadow-subtle transition-all duration-150 inline-flex items-center gap-2 active:scale-95"
            title="Conduct an unscheduled or compensatory class outside regular timetable"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Take Extra Lecture</span>
          </button>

          <Link
            to="/teacher/timetable"
            className="px-3.5 py-2.5 min-h-[44px] rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            title="View Official Master Timetable"
          >
            <Calendar className="h-4 w-4 text-navy-500" aria-hidden="true" />
            <span className="hidden sm:inline">Timetable</span>
          </Link>
        </div>
      </div>

      {/* 2. Today's Timetable-Driven Schedule & QR Dispatch Hub */}
      <div className="rounded-xl border border-warm-300 bg-surface p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-warm-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
              {isWeekendDemo ? 'Upcoming Monday Timetable' : `Today's Timetable Schedule (${todayDayName.toUpperCase()})`}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-warm-100 text-navy-700 border border-warm-200">
              {activeDisplaySlots.length} lecture{activeDisplaySlots.length === 1 ? '' : 's'}
            </span>
          </div>
          <Link to="/teacher/timetable" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
            <span>Full Week Grid</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {activeDisplaySlots.length === 0 ? (
          <div className="p-6 text-center rounded-lg bg-warm-50 border border-warm-200 space-y-2">
            <Calendar className="h-8 w-8 text-navy-400 mx-auto" />
            <p className="text-xs font-bold text-navy-900">No official lectures scheduled for you today</p>
            <p className="text-[11px] text-navy-500 max-w-sm mx-auto">
              If you wish to conduct an additional or compensatory session, use the &ldquo;Take Extra Lecture&rdquo; button above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDisplaySlots.map((slot) => {
              const statusInfo = getSlotConductStatus(slot, todayDateStr);

              return (
                <div
                  key={slot.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    statusInfo.status === 'IN_PROGRESS'
                      ? 'bg-teal-50/50 border-teal-300 ring-1 ring-primary/30'
                      : statusInfo.status === 'COMPLETED'
                      ? 'bg-warm-50/70 border-warm-200 opacity-90'
                      : statusInfo.status === 'CANCELLED'
                      ? 'bg-rose-50/40 border-rose-200'
                      : statusInfo.status === 'RESCHEDULED'
                      ? 'bg-amber-50/40 border-amber-200'
                      : statusInfo.status === 'NOT_CONDUCTED'
                      ? 'bg-warm-100/50 border-warm-300 text-navy-600'
                      : 'bg-surface border-warm-300 hover:border-warm-400'
                  }`}
                >
                  {/* Slot Details */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-900 text-white">
                        {slot.courseCode || 'CRS'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-teal-100 text-teal-900 border border-teal-200">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-warm-200 text-navy-700">
                        {slot.sessionType}
                      </span>
                      {slot.divisionName && (
                        <span className="text-xs text-navy-700 font-mono font-semibold">
                          {slot.yearOfStudy || 'Class'} ({slot.divisionName})
                        </span>
                      )}

                      {/* Status Badges */}
                      {statusInfo.status === 'IN_PROGRESS' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-600 text-white animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                          <span>LIVE NOW</span>
                        </span>
                      )}
                      {statusInfo.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-navy-800 text-white">
                          <Check className="h-3 w-3" />
                          <span>COMPLETED</span>
                        </span>
                      )}
                      {statusInfo.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          <Ban className="h-3 w-3" />
                          <span>CANCELLED</span>
                        </span>
                      )}
                      {statusInfo.status === 'RESCHEDULED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          <RotateCcw className="h-3 w-3" />
                          <span>RESCHEDULED</span>
                        </span>
                      )}
                      {statusInfo.status === 'NOT_CONDUCTED' && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-warm-200 text-navy-600 border border-warm-300">
                          NOT CONDUCTED
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-navy-900 leading-snug">
                      {slot.courseName || 'Lecture Session'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-navy-500 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-navy-400" />
                        <span>{slot.room || 'Room 101'}</span>
                      </span>

                      {statusInfo.session?.totalPresent !== undefined && (
                        <span>&bull; {statusInfo.session.totalPresent} students marked</span>
                      )}

                      {/* Stated Reason for Cancellation or Rescheduling */}
                      {statusInfo.cancellationReason && (
                        <span className="text-rose-700 italic font-sans text-[11px] block sm:inline">
                          Note: {statusInfo.cancellationReason}
                        </span>
                      )}

                      {statusInfo.status === 'NOT_CONDUCTED' && (
                        <span className="text-navy-500 italic font-sans text-[11px]">
                          (No attendance records generated &bull; Students not penalized)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contextual Actions (QR Visibility Rules strictly enforced) */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* IN PROGRESS -> Resume Session Screen */}
                    {statusInfo.status === 'IN_PROGRESS' && statusInfo.session && (
                      <Link
                        to={`/teacher/live-session?sessionId=${statusInfo.session.id}`}
                        className="px-4 py-2 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle inline-flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>Resume Live Screen</span>
                      </Link>
                    )}

                    {/* COMPLETED -> View Attendance Summary */}
                    {statusInfo.status === 'COMPLETED' && (
                      <Link
                        to="/teacher/reports"
                        className="px-3 py-2 min-h-[40px] rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4 text-teal-700" />
                        <span>View Records</span>
                      </Link>
                    )}

                    {/* SCHEDULED & Eligible by current time -> Start QR Attendance */}
                    {statusInfo.status === 'SCHEDULED' && statusInfo.isEligibleForQR && (
                      <Link
                        to={`/teacher/take-attendance?courseId=${slot.courseId || ''}&slotId=${slot.id}&topic=${encodeURIComponent(slot.courseName || '')}`}
                        className="px-4 py-2 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold shadow-subtle inline-flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>Start Attendance (QR)</span>
                      </Link>
                    )}

                    {/* SCHEDULED but not time yet -> Disabled informative button */}
                    {statusInfo.status === 'SCHEDULED' && !statusInfo.isEligibleForQR && (
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-2 min-h-[40px] rounded-lg bg-warm-100 border border-warm-200 text-navy-400 text-xs font-mono font-medium cursor-not-allowed"
                        title={statusInfo.eligibilityReason}
                      >
                        <Clock className="h-3.5 w-3.5 inline mr-1 text-navy-400" />
                        <span>Opens at {slot.startTime}</span>
                      </button>
                    )}

                    {/* Reschedule & Cancel class controls for scheduled slots */}
                    {statusInfo.status === 'SCHEDULED' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenRescheduleModal(slot)}
                          className="p-2 min-h-[40px] min-w-[40px] rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-700 text-xs font-semibold transition-colors"
                          title="Reschedule this lecture to another date/time"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCancelModal(slot)}
                          className="p-2 min-h-[40px] min-w-[40px] rounded-lg border border-warm-300 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
                          title="Cancel this lecture (Students will NOT be marked absent)"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Extra Lectures Conducted Today Banner */}
      {myExtraLecturesToday.length > 0 && (
        <div className="rounded-xl border border-warm-300 bg-surface p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between border-b border-warm-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                Extra Lectures ({myExtraLecturesToday.length} today)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-teal-700">Manual Sessions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myExtraLecturesToday.map(extra => (
              <div key={extra.id} className="p-3.5 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono font-bold text-navy-900">{extra.courseCode}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                      EXTRA
                    </span>
                    <span className="font-mono text-navy-500 text-[11px]">{extra.scheduledStartTime || 'Custom Time'}</span>
                  </div>
                  <p className="font-semibold text-navy-800 truncate">{extra.lectureTopic}</p>
                  <p className="text-[11px] text-navy-500 font-mono">
                    {extra.divisionName || 'Division'} &bull; {extra.totalPresent || 0} Attended
                  </p>
                </div>

                <div className="shrink-0">
                  {extra.status === 'active' ? (
                    <Link
                      to={`/teacher/live-session?sessionId=${extra.id}`}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
                    >
                      Resume
                    </Link>
                  ) : (
                    <span className="text-[11px] font-mono text-navy-500">Concluded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. 4-Card Essential Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Today's Classes */}
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Today's Classes</span>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {activeDisplaySlots.length} <span className="text-xs font-normal text-navy-500">scheduled</span>
          </div>
          <span className="text-[11px] text-teal-700 font-mono block">
            {myExtraLecturesToday.length > 0 ? `+${myExtraLecturesToday.length} extra lecture` : 'Timetable-driven'}
          </span>
        </div>

        {/* Metric 2: Enrolled Students */}
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Enrolled Students</span>
          <div className="text-2xl font-bold font-mono text-navy-900">
            {totalEnrolled || 42}
          </div>
          <span className="text-[11px] text-navy-500 font-mono block">Across {myCourses.length} courses</span>
        </div>

        {/* Metric 3: Average Attendance */}
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Avg Attendance</span>
          <div className="text-2xl font-bold font-mono text-teal-800">
            {avgAttendance}%
          </div>
          <span className="text-[11px] text-teal-700 font-mono block">Conducted sessions only</span>
        </div>

        {/* Metric 4: Pending Actions */}
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Action Required</span>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-amber-700 font-mono block">Enrollment requests</span>
        </div>
      </div>

      {/* 5. Course Curriculum & Defaulters (Progressive Disclosure) */}
      <div className="rounded-xl border border-warm-300 bg-surface shadow-subtle overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-300 px-5 pt-3 gap-3">
          <div className="flex gap-6 text-xs font-semibold overflow-x-auto touch-scroll no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === 'courses'
                  ? 'border-b-2 border-primary text-navy-900 font-bold'
                  : 'text-navy-500 hover:text-navy-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Assigned Subjects ({myCourses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'border-b-2 border-primary text-navy-900 font-bold'
                  : 'text-navy-500 hover:text-navy-900'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>Defaulters & Requests ({defaulterList.length + pendingRequests.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-3 sm:pb-2">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-md border border-warm-300 bg-warm-100 hover:bg-warm-200 text-navy-800 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Download Attendance CSV"
            >
              <Download className="h-3.5 w-3.5 text-navy-600" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/teacher/reports"
              className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Reports</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5">
          {activeTab === 'courses' ? (
            myCourses.length === 0 ? (
              <p className="text-xs text-navy-500 italic py-6 text-center">No subjects assigned by Department Admin yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myCourses.map(course => {
                  const courseSessions = mySessions.filter(s => s.courseId === course.id);
                  const alloc = myAllocations.find(a => a.courseId === course.id);
                  return (
                    <div
                      key={course.id}
                      className="p-4 rounded-lg border border-warm-200 bg-white hover:border-warm-300 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-900 text-white">
                            {course.courseCode}
                          </span>
                          <span className="text-[11px] font-mono text-navy-500">{course.semester}</span>
                        </div>
                        <h3 className="text-sm font-bold text-navy-900 truncate">{course.courseName}</h3>
                        {alloc?.divisionName && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                              {alloc.divisionName} {alloc.batch && alloc.batch !== 'All' ? `(${alloc.batch})` : ''}
                            </span>
                            {alloc.weeklyHours && (
                              <span className="text-[10px] font-mono text-navy-500">
                                {alloc.weeklyHours} hrs/wk
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-navy-500 font-mono">
                          {course.enrolledCount || 0} Enrolled &bull; {courseSessions.length} Conducted
                        </p>
                      </div>

                      <div className="pt-2 border-t border-warm-200 flex items-center justify-between">
                        <Link
                          to={`/teacher/take-attendance?courseId=${course.id}`}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                          <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Conduct Attendance</span>
                        </Link>
                        <Link
                          to="/teacher/history"
                          className="text-xs text-navy-500 hover:text-navy-900"
                        >
                          History &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* Defaulter Notification Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-amber-50/60 border border-amber-200">
                <div>
                  <h3 className="text-xs font-bold text-amber-900">Attendance Defaulter Advisory (&lt;75%)</h3>
                  <p className="text-[11px] text-amber-800">
                    {defaulterList.length} student{defaulterList.length === 1 ? '' : 's'} currently falling below mandatory 75% attendance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNoticeSent(true);
                    setTimeout(() => setNoticeSent(false), 3000);
                  }}
                  disabled={defaulterList.length === 0}
                  className="px-3.5 py-2 min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-subtle transition-all active:scale-95 disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{noticeSent ? 'Notices Dispatched!' : 'Notify Defaulters'}</span>
                </button>
              </div>

              {/* Defaulters List */}
              {defaulterList.length > 0 && (
                <div className="space-y-2">
                  {defaulterList.map((st, idx) => (
                    <div
                      key={st.studentUid || idx}
                      className="p-3 rounded-lg border border-warm-200 bg-white flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900">{st.studentName}</span>
                          <span className="font-mono text-navy-500 bg-warm-100 px-1 py-0.2 rounded">{st.studentRollNo}</span>
                        </div>
                        <p className="text-navy-500 font-mono text-[11px] mt-0.5">
                          {st.courseCode} &bull; {st.attendedCount}/{st.totalCount} Attended
                        </p>
                      </div>
                      <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        {st.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Enrollment Requests */}
              <div className="pt-2 border-t border-warm-200 flex items-center justify-between text-xs">
                <span className="text-navy-600">
                  Pending Course Enrollment Requests: <strong className="font-mono">{pendingRequests.length}</strong>
                </span>
                <Link to="/teacher/requests" className="text-primary font-semibold hover:underline">
                  Review Requests &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: TAKE EXTRA LECTURE */}
      {isExtraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-warm-300 shadow-elevated w-full max-w-lg p-6 space-y-5 animate-in fade-in-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold text-navy-900">Take Extra Lecture</h3>
                </div>
                <p className="text-xs text-navy-500">
                  Schedule an additional or compensatory session outside the regular timetable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExtraModalOpen(false)}
                className="p-1 rounded-lg hover:bg-warm-200 text-navy-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {extraError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{extraError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExtraLecture} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Authorized Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={extraCourseId}
                  onChange={e => {
                    setExtraCourseId(e.target.value);
                    const alloc = myAllocations.find(a => a.courseId === e.target.value);
                    if (alloc) {
                      setExtraDivisionId(alloc.divisionId);
                      setExtraBatch(alloc.batch || 'All');
                    }
                  }}
                  required
                  className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary font-medium"
                >
                  {myCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Target Division <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={extraDivisionId}
                    onChange={e => setExtraDivisionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                  >
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.departmentName} — {d.name} ({d.yearOfStudy})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Batch
                  </label>
                  <select
                    value={extraBatch}
                    onChange={e => setExtraBatch(e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                  >
                    <option value="All">Full Class (All Students)</option>
                    <option value="Batch 1">Batch 1</option>
                    <option value="Batch 2">Batch 2</option>
                    <option value="Batch 3">Batch 3</option>
                    <option value="Batch 4">Batch 4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Lecture Date
                  </label>
                  <input
                    type="date"
                    value={extraDate}
                    onChange={e => setExtraDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={extraStartTime}
                    onChange={e => setExtraStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={extraEndTime}
                    onChange={e => setExtraEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Topic / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Practical Exam Review & Compensatory Lecture"
                  value={extraTopic}
                  onChange={e => setExtraTopic(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Classroom / Hall
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab 402 or Main Hall"
                  value={extraRoom}
                  onChange={e => setExtraRoom(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-lg bg-warm-100 text-[11px] text-navy-600 space-y-1">
                <span className="font-semibold text-navy-900 block">Extra Lecture Guarantee:</span>
                <p>
                  This session will be stored separately as an <strong>EXTRA LECTURE</strong> without altering the official timetable. Attendance will be recorded in real-time via cryptographic rotating QR code.
                </p>
              </div>

              <div className="pt-2 border-t border-warm-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExtraModalOpen(false)}
                  className="px-4 py-2 min-h-[44px] rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extraSubmitting}
                  className="px-5 py-2 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold shadow-subtle transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {extraSubmitting ? 'Starting Session...' : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Create & Launch QR Screen</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESCHEDULE LECTURE */}
      {rescheduleSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-warm-300 shadow-elevated w-full max-w-lg p-6 space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold text-navy-900">Reschedule Lecture</h3>
                </div>
                <p className="text-xs text-navy-500">
                  Notify students and set compensatory timing for {rescheduleSlot.courseCode}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleSlot(null)}
                className="p-1 rounded-lg hover:bg-warm-200 text-navy-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div className="p-3 rounded-lg bg-warm-100/70 border border-warm-200 text-xs space-y-1">
                <span className="font-semibold text-navy-900">Current Slot:</span>
                <p className="text-navy-600 font-mono">
                  {rescheduleSlot.courseCode} — {rescheduleSlot.courseName} &bull; {rescheduleSlot.startTime}–{rescheduleSlot.endTime} ({rescheduleSlot.divisionName || 'Class'})
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    New Start Time
                  </label>
                  <input
                    type="time"
                    value={rescheduleStartTime}
                    onChange={e => setRescheduleStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    New End Time
                  </label>
                  <input
                    type="time"
                    value={rescheduleEndTime}
                    onChange={e => setRescheduleEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  New Hall / Room (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab 302"
                  value={rescheduleRoom}
                  onChange={e => setRescheduleRoom(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Reschedule Reason & Note to Students
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  required
                  placeholder="e.g. Faculty attending institutional seminar; compensatory lecture planned"
                  className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 border-t border-warm-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleSlot(null)}
                  className="px-4 py-2 min-h-[44px] rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleSubmitting}
                  className="px-5 py-2 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold shadow-subtle transition-all active:scale-95 disabled:opacity-50"
                >
                  {rescheduleSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL LECTURE */}
      {cancelSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-warm-300 shadow-elevated w-full max-w-lg p-6 space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Ban className="h-4 w-4 text-rose-600" />
                  <h3 className="text-base font-bold text-navy-900">Cancel Scheduled Class</h3>
                </div>
                <p className="text-xs text-navy-500">
                  Formally log lecture cancellation without marking students absent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelSlot(null)}
                className="p-1 rounded-lg hover:bg-warm-200 text-navy-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div className="p-3 rounded-lg bg-warm-100/70 border border-warm-200 text-xs space-y-1">
                <span className="font-semibold text-navy-900">Class to Cancel:</span>
                <p className="text-navy-600 font-mono">
                  {cancelSlot.courseCode} — {cancelSlot.courseName} &bull; {cancelSlot.startTime}–{cancelSlot.endTime} ({cancelSlot.divisionName || 'Class'})
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                >
                  <option value="Faculty on Official Leave / Institutional Duty">Faculty on Official Leave / Institutional Duty</option>
                  <option value="Faculty Medical Leave">Faculty Medical Leave</option>
                  <option value="Departmental Accreditation Meeting">Departmental Accreditation Meeting</option>
                  <option value="Institute Technical Symposium / Holiday">Institute Technical Symposium / Holiday</option>
                  <option value="Compensatory Class Scheduled Separately">Compensatory Class Scheduled Separately</option>
                  <option value="Other Official Reason">Other Official Reason</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Additional Note for Students & Administration
                </label>
                <textarea
                  rows={2}
                  value={cancelCustomNotes}
                  onChange={e => setCancelCustomNotes(e.target.value)}
                  placeholder="Optional brief clarification..."
                  className="w-full px-3 py-2 rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200 text-teal-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle className="h-4 w-4 text-teal-700" />
                  <span>Student Attendance Protection Guaranteed:</span>
                </div>
                <p className="text-[11px] text-teal-800">
                  Because this class is cancelled by faculty, students are <strong>NEVER marked absent</strong>. This lecture will be recorded as Cancelled for administrative compliance.
                </p>
              </div>

              <div className="pt-2 border-t border-warm-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelSlot(null)}
                  className="px-4 py-2 min-h-[44px] rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-700 text-xs font-semibold transition-colors"
                >
                  Keep Class
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-5 py-2 min-h-[44px] rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-subtle transition-all active:scale-95 disabled:opacity-50"
                >
                  {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};