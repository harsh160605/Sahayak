import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Users, Search, Plus, Trash2, CheckCircle, Clock, X, User, ChevronRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const ManageStudents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCourse = searchParams.get('courseId');

  const { currentUser } = useAuth();
  const { courses, enrollments, manuallyEnrollStudent, removeStudentFromCourse } = useData();

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(preselectedCourse || myCourses[0]?.id || '');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Manual student enrollment form state
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const currentCourseEnrollments = enrollments.filter(
    e => e.courseId === selectedCourseId && e.status === 'active'
  );

  const filteredEnrollments = currentCourseEnrollments.filter(e =>
    e.studentName.toLowerCase().includes(search.toLowerCase()) ||
    e.studentRollNo.toLowerCase().includes(search.toLowerCase()) ||
    e.studentEmail.toLowerCase().includes(search.toLowerCase())
  );

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSubmitting(true);

    try {
      await manuallyEnrollStudent(
        selectedCourseId,
        `student_custom_${Date.now()}`,
        studentName.trim(),
        studentRollNo.trim().toUpperCase(),
        studentEmail.trim()
      );

      setIsAddModalOpen(false);
      setStudentName('');
      setStudentRollNo('');
      setStudentEmail('');
    } catch (err: any) {
      alert('Failed to enroll student: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              STUDENT DIRECTORY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Manage Student Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, inspect, and manually register students into assigned course cohorts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={!selectedCourseId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Add Student Manually</span>
        </button>
      </div>

      {/* Course Filter Selector & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono uppercase shrink-0">Course Filter:</label>
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-medium truncate max-w-xs sm:max-w-md"
          >
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name or roll no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {selectedCourse?.courseCode} Roster ({currentCourseEnrollments.length} Enrolled)
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Showing {filteredEnrollments.length} matching students
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredEnrollments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 italic">
              No students enrolled in this course roster.
            </div>
          ) : (
            filteredEnrollments.map((student, idx) => (
              <div key={student.id} className="p-4 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{student.studentName}</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300">{student.studentRollNo}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{student.studentEmail}</p>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Remove ${student.studentName} (${student.studentRollNo}) from this course roster?`)) {
                      removeStudentFromCourse(selectedCourseId, student.studentUid);
                    }
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                  title="Remove student"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Enrolled Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                    No students currently enrolled in this course roster.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400 text-[11px] text-center">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{student.studentName}</td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium">{student.studentRollNo}</td>
                    <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{student.studentEmail}</td>
                    <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{formatDate(student.enrolledAt)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove ${student.studentName} (${student.studentRollNo}) from this course?`)) {
                            removeStudentFromCourse(selectedCourseId, student.studentUid);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove from course roster"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Student Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Manually Register Student</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enrolling into <strong className="text-slate-900 dark:text-white">{selectedCourse?.courseCode}</strong>
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Sharma"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Student Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22CS018"
                  value={studentRollNo}
                  onChange={e => setStudentRollNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Institutional Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. diya.s@college.edu"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
