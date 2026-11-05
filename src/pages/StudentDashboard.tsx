import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, Clock3, QrCode, Radio, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatTime } from '../lib/utils';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, sessions, attendanceRecords, timetable } = useData();
  const myEnrollments = enrollments.filter(enrollment => enrollment.studentUid === currentUser?.uid && enrollment.status === 'active');
  const enrolledCourseIds = myEnrollments.map(enrollment => enrollment.courseId);
  const myCourses = courses.filter(course => enrolledCourseIds.includes(course.id));
  const liveSessions = sessions.filter(session => enrolledCourseIds.includes(session.courseId) && (session.status === 'active' || session.status === 'paused'));
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todaySchedule = timetable.filter(slot => enrolledCourseIds.includes(slot.courseId) && slot.dayOfWeek === dayName).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const eligibleSessions = sessions.filter(session => enrolledCourseIds.includes(session.courseId) && session.status === 'ended');
  const myAttendanceRecords = attendanceRecords.filter(record => record.studentUid === currentUser?.uid && record.status === 'present' && enrolledCourseIds.includes(record.courseId));
  const attendedCount = myAttendanceRecords.length;
  const totalConducted = eligibleSessions.length;
  const overallPercentage = totalConducted > 0 ? Math.min(100, Math.round((attendedCount / totalConducted) * 100)) : null;
  const belowThreshold = overallPercentage !== null && overallPercentage < 75;
  const firstName = currentUser?.fullName.split(' ')[0] || 'there';
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const sessionWaitingForCheckIn = liveSessions.find(session => !attendanceRecords.some(record => record.sessionId === session.id && record.studentUid === currentUser?.uid));
  const openSession = sessionWaitingForCheckIn || liveSessions[0];
  const checkedIntoOpenSession = !!openSession && !sessionWaitingForCheckIn;

  return <div className="dashboard-page animate-fade-in">
    <section className="welcome-band student-welcome">
      <div className="welcome-copy"><div className="welcome-date"><span className="welcome-date-mark" />{today}</div><h2>{greeting}, {firstName}.</h2><p>Here’s your schedule and attendance at a glance.</p></div>
      <Link to="/student/scan" className="button-primary"><QrCode size={17} /><span>Check in</span><ArrowRight size={16} /></Link>
    </section>

    {openSession && <Link to="/student/scan" className="student-live-strip"><span className="live-card-icon"><Radio size={17} /></span><span className="student-live-copy"><span className="live-kicker"><i className="live-indicator-dot" />CHECK-IN OPEN · {openSession.courseCode}</span><strong>{openSession.courseName}</strong><small>{openSession.lectureTopic} · Started {formatTime(openSession.startedAt)}</small></span>{checkedIntoOpenSession ? <span className="checked-in-status"><Check size={14} />Checked in</span> : <span className="live-strip-action">Scan QR<ArrowRight size={14} /></span>}</Link>}

    <section className="student-summary-panel">
      <div className="attendance-standing">
        <div className="standing-ring-wrap"><div className="standing-ring" style={{ '--attendance-value': `${overallPercentage ?? 0}%` } as React.CSSProperties}><span>{overallPercentage === null ? '—' : `${overallPercentage}%`}</span></div></div>
        <div className="standing-copy"><span className="panel-kicker">YOUR ATTENDANCE</span><h3>{overallPercentage === null ? 'Your record starts here' : belowThreshold ? 'Room to catch up' : 'You’re on track'}</h3><p>{overallPercentage === null ? 'Your record will appear after your first class.' : `${attendedCount} of ${totalConducted} completed classes attended.`}</p><div className={belowThreshold ? 'standing-status needs-attention' : 'standing-status'}>{overallPercentage === null ? <BookOpen size={13} /> : belowThreshold ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}{overallPercentage === null ? 'No classes recorded yet' : belowThreshold ? 'Below the 75% guideline' : 'Meets the 75% guideline'}</div></div>
      </div>
      <div className="standing-divider" />
      <div className="standing-detail"><span className="panel-kicker">THIS TERM</span><div className="standing-detail-number">{myCourses.length}</div><p>enrolled courses</p><Link to="/student/courses" className="subtle-link">See courses<ArrowRight size={14} /></Link></div>
      <div className="standing-detail"><span className="panel-kicker">ATTENDED</span><div className="standing-detail-number">{attendedCount}<span> / {totalConducted}</span></div><p>completed classes</p><Link to="/student/history" className="subtle-link">View history<ArrowRight size={14} /></Link></div>
    </section>

    <div className="dashboard-grid student-grid">
      <section className="content-panel schedule-panel">
        <div className="panel-heading"><div><span className="panel-kicker">{dayName.toUpperCase()}</span><h3>Today’s schedule</h3></div><Link to="/student/timetable" className="subtle-link">Full schedule<ArrowRight size={15} /></Link></div>
        <div className="class-list">
          {todaySchedule.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><CalendarDays size={21} /></span><strong>No classes scheduled today</strong><p>Your weekly timetable has all the details about upcoming classes.</p><Link to="/student/timetable" className="text-link">See weekly schedule<ArrowRight size={14} /></Link></div> : todaySchedule.map((slot, index) => <article key={slot.id} className="class-row">
            <div className="class-time"><strong>{slot.startTime}</strong><span>{slot.endTime}</span></div><div className="class-timeline"><span className={index === 0 ? 'timeline-dot current' : 'timeline-dot'} /></div><div className="class-info"><div className="class-code">{slot.courseCode}</div><h4>{slot.courseName}</h4><p><Clock3 size={13} />{slot.room} · {slot.teacherName}</p></div><Link to="/student/scan" className="class-action" aria-label={`Check in for ${slot.courseName}`} title="Check in"><QrCode size={17} /></Link>
          </article>)}
        </div>
      </section>

      <section className="content-panel student-courses-panel">
        <div className="panel-heading"><div><span className="panel-kicker">YOUR LEARNING</span><h3>Course attendance</h3></div><Link to="/student/courses" className="subtle-link">All courses<ArrowRight size={15} /></Link></div>
        <div className="course-list">
          {myCourses.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><BookOpen size={21} /></span><strong>No courses yet</strong><p>Find a course to see classes and attendance here.</p><Link to="/student/join" className="button-secondary">Browse courses<ArrowRight size={15} /></Link></div> : myCourses.slice(0, 3).map((course, index) => {
            const courseSessions = sessions.filter(session => session.courseId === course.id && session.status === 'ended');
            const courseAttended = attendanceRecords.filter(record => record.courseId === course.id && record.studentUid === currentUser?.uid && record.status === 'present').length;
            const percentage = courseSessions.length > 0 ? Math.min(100, Math.round((courseAttended / courseSessions.length) * 100)) : null;
            return <article key={course.id} className="student-course-row"><div className="student-course-top"><span className={`course-color-chip course-tone-${index % 4}`}><BookOpen size={16} /></span><div className="student-course-heading"><h4>{course.courseName}</h4><p>{course.courseCode}</p></div><strong className={percentage !== null && percentage < 75 ? 'course-percent warning' : 'course-percent'}>{percentage === null ? 'New' : `${percentage}%`}</strong></div><div className="course-progress-track"><span className={percentage !== null && percentage < 75 ? 'progress-low' : ''} style={{ width: `${percentage ?? 0}%` }} /></div><div className="student-course-foot"><span>{courseAttended} of {courseSessions.length} classes attended</span>{percentage !== null && percentage >= 75 ? <span className="course-good"><Check size={12} />On track</span> : percentage !== null ? <span className="course-warning"><ShieldAlert size={12} />Needs attention</span> : <span>New course</span>}</div></article>;
          })}
        </div>
        {myCourses.length > 3 && <Link to="/student/courses" className="panel-footer-link">View all {myCourses.length} courses<ArrowRight size={15} /></Link>}
      </section>
    </div>
  </div>;
};
