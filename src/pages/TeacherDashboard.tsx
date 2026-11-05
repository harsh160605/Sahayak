import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Clock3, QrCode, Radio, UserRoundCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatTime } from '../lib/utils';

export const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, sessions, requests, timetable } = useData();
  const myCourses = courses.filter(course => course.teacherId === currentUser?.uid);
  const mySessions = sessions.filter(session => session.teacherId === currentUser?.uid);
  const pendingRequests = requests.filter(request => request.teacherId === currentUser?.uid && request.status === 'pending');
  const activeSession = mySessions.find(session => session.status === 'active' || session.status === 'paused');
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todaySchedule = timetable.filter(slot => slot.teacherId === currentUser?.uid && slot.dayOfWeek === dayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const firstName = currentUser?.fullName.split(' ')[0] || 'there';
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return <div className="dashboard-page animate-fade-in">
    <section className="welcome-band">
      <div className="welcome-copy"><div className="welcome-date"><span className="welcome-date-mark" />{today}</div><h2>{greeting}, {firstName}.</h2><p>Your classes and attendance, all in one place.</p></div>
      <div className="welcome-actions"><Link to="/teacher/take-attendance" className="button-primary"><QrCode size={17} /><span>Take attendance</span><ArrowRight size={16} /></Link>{pendingRequests.length > 0 && <Link to="/teacher/requests" className="request-shortcut"><UserRoundCheck size={15} /><span>{pendingRequests.length} request{pendingRequests.length === 1 ? '' : 's'} to review</span><ArrowUpRight size={14} /></Link>}</div>
    </section>

    {activeSession && <Link to={`/teacher/live-session?sessionId=${activeSession.id}`} className="live-class-banner compact-live-banner">
      <span className="live-class-symbol"><Radio size={18} /></span>
      <span className="live-class-copy"><span className="live-class-label"><i className="live-indicator-dot" />CLASS IN PROGRESS <span className="live-class-code">{activeSession.courseCode}</span></span><strong>{activeSession.courseName}</strong><small>{activeSession.lectureTopic} · {activeSession.totalPresent || 0} checked in · Started {formatTime(activeSession.startedAt)}</small></span>
      <span className="button-live">Open live view<ArrowUpRight size={15} /></span>
    </Link>}

    <div className="dashboard-grid">
      <section className="content-panel schedule-panel">
        <div className="panel-heading"><div><span className="panel-kicker">{dayName.toUpperCase()}</span><h3>Today’s classes</h3></div><Link to="/teacher/timetable" className="subtle-link">Full schedule<ArrowRight size={15} /></Link></div>
        <div className="class-list">
          {todaySchedule.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><CalendarDays size={21} /></span><strong>You have a clear day</strong><p>No classes are scheduled for today. Your weekly timetable is one click away.</p><Link to="/teacher/timetable" className="text-link">View timetable<ArrowRight size={14} /></Link></div> : todaySchedule.map((slot, index) => <article className="class-row" key={slot.id}>
            <div className="class-time"><strong>{slot.startTime}</strong><span>{slot.endTime}</span></div><div className="class-timeline"><span className={index === 0 ? 'timeline-dot current' : 'timeline-dot'} /></div><div className="class-info"><div className="class-code">{slot.courseCode}</div><h4>{slot.courseName}</h4><p><Clock3 size={13} />{slot.room}</p></div><Link to={`/teacher/take-attendance?courseId=${slot.courseId}`} className="class-action" aria-label={`Take attendance for ${slot.courseName}`} title="Take attendance"><QrCode size={17} /></Link>
          </article>)}
        </div>
      </section>

      <section className="content-panel courses-panel">
        <div className="panel-heading"><div><span className="panel-kicker">THIS TERM</span><h3>Your courses <span className="heading-count">{myCourses.length}</span></h3></div><Link to="/teacher/courses" className="subtle-link">Manage<ArrowRight size={15} /></Link></div>
        <div className="course-list">
          {myCourses.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><BookOpen size={21} /></span><strong>Start with a course</strong><p>Add your first course to organize rosters and take attendance.</p><Link to="/teacher/courses" className="button-secondary"><BookOpen size={15} />Create a course</Link></div> : myCourses.slice(0, 3).map((course, index) => <article className="course-row" key={course.id}>
            <span className={`course-color-chip course-tone-${index % 4}`}><BookOpen size={17} /></span><div className="course-info"><div className="course-title-line"><h4>{course.courseName}</h4><span className="course-code">{course.courseCode}</span></div><p>{course.enrolledCount || 0} students enrolled</p></div><Link to={`/teacher/students?courseId=${course.id}`} className="course-open" aria-label={`Open ${course.courseName} roster`}><ArrowUpRight size={17} /></Link>
          </article>)}
        </div>
        {myCourses.length > 3 && <Link to="/teacher/courses" className="panel-footer-link">View all {myCourses.length} courses<ArrowRight size={15} /></Link>}
      </section>
    </div>
  </div>;
};
