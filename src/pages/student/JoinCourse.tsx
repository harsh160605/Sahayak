import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  GraduationCap, 
  Search, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertCircle,
  BookOpen,
  User,
  XCircle
} from 'lucide-react';

export const JoinCourse: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, requests, requestEnrollment } = useData();

  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [submittingCourseId, setSubmittingCourseId] = useState<string | null>(null);

  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid);
  const myRequests = requests.filter(r => r.studentId === currentUser?.uid);

  const filteredCourses = courses.filter(c => 
    c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
    c.courseName.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(search.toLowerCase()) ||
    c.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleRequest = async (courseId: string) => {
    if (!currentUser) return;
    setSubmittingCourseId(courseId);
    setFeedback(null);

    const res = await requestEnrollment(
      currentUser.uid,
      currentUser.fullName,
      currentUser.studentId || 'STUDENT',
      currentUser.email,
      courseId
    );

    setFeedback(res);
    setSubmittingCourseId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="border-b border-warm-300 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          ACADEMIC ADMISSIONS
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
          Join an Academic Course
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Search the department catalog for faculty courses and submit an enrollment request for teacher approval.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 shadow-subtle ${
          feedback.success 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          {feedback.success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-navy-400" />
        <input
          type="text"
          placeholder="Search by course code (e.g. CS301), title, or teacher name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary shadow-subtle"
        />
      </div>

      {/* Available Courses List */}
      <div className="space-y-3.5">
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-warm-300 rounded-xl space-y-2">
            <BookOpen className="h-10 w-10 text-navy-400 mx-auto opacity-50 mb-1" />
            <h3 className="text-sm font-bold text-navy-900">No courses match your query</h3>
            <p className="text-xs text-navy-500">Check the spelling of course code or faculty instructor name.</p>
          </div>
        ) : (
          filteredCourses.map(course => {
            const isEnrolled = myEnrollments.some(e => e.courseId === course.id && e.status === 'active');
            const pendingReq = myRequests.find(r => r.courseId === course.id && r.status === 'pending');
            const rejectedReq = myRequests.find(r => r.courseId === course.id && r.status === 'rejected');
            const isSubmitting = submittingCourseId === course.id;

            return (
              <div 
                key={course.id}
                className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle hover:border-warm-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-warm-200 text-navy-900 border border-warm-300">
                      {course.courseCode}
                    </span>
                    <span className="text-xs text-navy-500 font-mono">
                      {course.semester} &bull; {course.academicYear}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-navy-900 leading-snug">{course.courseName}</h3>
                  <p className="text-xs text-navy-600 line-clamp-2">{course.description}</p>
                  <p className="text-[11px] text-navy-500 font-medium">
                    Instructor: <span className="text-navy-800 font-semibold">{course.teacherName}</span> ({course.department})
                  </p>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-warm-200 flex justify-end">
                  {isEnrolled ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Enrolled
                    </span>
                  ) : pendingReq ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 font-mono">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRequest(course.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-all active:scale-95 shadow-subtle disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Request Enrollment'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
