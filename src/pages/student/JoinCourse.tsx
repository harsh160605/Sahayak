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
  XCircle,
  ChevronRight
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
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            COURSE REGISTRATION
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Academic Course Catalog
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore departmental course offerings and submit an enrollment request for faculty instructor approval.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 shadow-sm ${
          feedback.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200' 
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
        }`}>
          {feedback.success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search by course code (e.g. CS301), title, or teacher name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-sm"
        />
      </div>

      {/* Available Courses List */}
      <div className="space-y-3.5">
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <BookOpen className="h-10 w-10 text-slate-400 mx-auto opacity-50 mb-1" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No courses match your query</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Check the spelling of course code or faculty instructor name.</p>
          </div>
        ) : (
          filteredCourses.map(course => {
            const isEnrolled = myEnrollments.some(e => e.courseId === course.id && e.status === 'active');
            const pendingReq = myRequests.find(r => r.courseId === course.id && r.status === 'pending');
            const isSubmitting = submittingCourseId === course.id;

            return (
              <div 
                key={course.id}
                className="erp-box p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {course.courseCode}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {course.semester} &bull; {course.academicYear}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{course.courseName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{course.description || 'Core academic curriculum.'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Instructor: <span className="text-slate-800 dark:text-slate-200 font-semibold">{course.teacherName}</span> ({course.department})
                  </p>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 flex justify-end">
                  {isEnrolled ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Enrolled
                    </span>
                  ) : pendingReq ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRequest(course.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
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
