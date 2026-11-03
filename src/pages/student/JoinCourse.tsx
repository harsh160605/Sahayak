import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GraduationCap, Search, CheckCircle2, Clock, Send, AlertCircle } from 'lucide-react';

export const JoinCourse: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, requests, requestEnrollment } = useData();

  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid);
  const myRequests = requests.filter(r => r.studentId === currentUser?.uid);

  const filteredCourses = courses.filter(c => 
    c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
    c.courseName.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(search.toLowerCase())
  );

  const handleRequest = (courseId: string) => {
    if (!currentUser) return;
    const res = requestEnrollment(
      currentUser.uid,
      currentUser.fullName,
      currentUser.studentId || 'STUDENT',
      currentUser.email,
      courseId
    );
    setFeedback(res);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="border-b border-warm-300 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          COURSE ADMISSIONS
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
          Join an Academic Course
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Search for faculty courses by code or title and submit an enrollment request for teacher review.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg border text-xs flex items-center gap-2 ${
          feedback.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          {feedback.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-navy-400" />
        <input
          type="text"
          placeholder="Search by course code (e.g. CS301), title, or teacher name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary shadow-subtle"
        />
      </div>

      {/* Available Courses List */}
      <div className="space-y-3">
        {filteredCourses.map(course => {
          const isEnrolled = myEnrollments.some(e => e.courseId === course.id && e.status === 'active');
          const pendingReq = myRequests.find(r => r.courseId === course.id && r.status === 'pending');
          const rejectedReq = myRequests.find(r => r.courseId === course.id && r.status === 'rejected');

          return (
            <div 
              key={course.id}
              className="p-5 rounded-lg bg-surface border border-warm-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-warm-200 text-navy-800 border border-warm-300">
                    {course.courseCode}
                  </span>
                  <span className="text-xs text-navy-500 font-mono">{course.semester} &bull; {course.academicYear}</span>
                </div>
                <h3 className="text-sm font-semibold text-navy-900">{course.courseName}</h3>
                <p className="text-xs text-navy-600">Instructor: {course.teacherName} ({course.department})</p>
              </div>

              <div className="shrink-0">
                {isEnrolled ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Enrolled
                  </span>
                ) : pendingReq ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    Request Pending
                  </span>
                ) : (
                  <button
                    onClick={() => handleRequest(course.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors active:scale-95 shadow-subtle"
                  >
                    <Send className="h-3 w-3" />
                    <span>Request Enrollment</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

