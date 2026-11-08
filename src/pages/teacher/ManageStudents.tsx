import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Users, Search, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const ManageStudents: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, enrollments, manuallyEnrollStudent, removeStudentFromCourse } = useData();

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(myCourses[0]?.id || '');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Manual student enrollment form state
  const [studentName, setStudentName] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  const currentCourseEnrollments = enrollments.filter(
    e => e.courseId === selectedCourseId && e.status === 'active'
  );

  const filteredEnrollments = currentCourseEnrollments.filter(e =>
    e.studentName.toLowerCase().includes(search.toLowerCase()) ||
    e.studentRollNo.toLowerCase().includes(search.toLowerCase()) ||
    e.studentEmail.toLowerCase().includes(search.toLowerCase())
  );

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    manuallyEnrollStudent(
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
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            ROSTER DIRECTORY
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Manage Enrolled Students
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Search, manually enroll, or manage student rosters course by course.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover text-surface text-xs font-semibold shadow-subtle transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Student Manually</span>
        </button>
      </div>

      {/* Course Filter Selector & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-navy-700 font-mono uppercase">Course:</label>
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary font-medium"
          >
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary shadow-subtle"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-surface rounded-lg border border-warm-300 overflow-x-auto touch-scroll shadow-subtle">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead className="bg-warm-100 border-b border-warm-300 text-navy-600 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Roll Number</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Enrolled Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-200">
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-navy-500 italic">
                  No students currently enrolled in this course roster.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((student, idx) => (
                <tr key={student.id} className="hover:bg-warm-50 transition-colors">
                  <td className="p-3 font-mono text-navy-400 text-[11px]">{idx + 1}</td>
                  <td className="p-3 font-semibold text-navy-900">{student.studentName}</td>
                  <td className="p-3 font-mono text-navy-700 font-medium">{student.studentRollNo}</td>
                  <td className="p-3 font-mono text-navy-500">{student.studentEmail}</td>
                  <td className="p-3 font-mono text-navy-500">{formatDate(student.enrolledAt)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${student.studentName} from this course? Historical attendance records will remain preserved.`)) {
                          removeStudentFromCourse(selectedCourseId, student.studentUid);
                        }
                      }}
                      className="p-1.5 rounded text-navy-400 hover:text-red-700 hover:bg-red-50 transition-colors"
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

      {/* Manual Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-elevated w-full max-w-md p-6 space-y-4">
            <div className="border-b border-warm-200 pb-3">
              <h3 className="text-base font-bold text-navy-900">Manually Enroll Student</h3>
              <p className="text-xs text-navy-500">Directly add an existing student to the course roster.</p>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Sharma"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Student Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22CS018"
                  value={studentRollNo}
                  onChange={e => setStudentRollNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono uppercase focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">College Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. diya.s@college.edu"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium text-navy-700 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-subtle"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

