import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Plus, BookOpen, Users, QrCode, Search, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherCourses: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, addCourse } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Course creation form state
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'Computer Science & Engineering');
  const [semester, setSemester] = useState('6th Semester');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);
  const filteredCourses = myCourses.filter(c => 
    c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
    c.courseName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);

    try {
      await addCourse({
        courseCode: courseCode.trim().toUpperCase(),
        courseName: courseName.trim(),
        department,
        semester,
        academicYear,
        teacherId: currentUser.uid,
        teacherName: currentUser.fullName,
        description: description.trim()
      });

      setIsModalOpen(false);
      setCourseCode('');
      setCourseName('');
      setDescription('');
    } catch (err: any) {
      console.error('Failed to create course:', err);
      alert('Error creating course: ' + (err.message || err));
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
              CURRICULUM MANAGEMENT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Course Offerings & Curricula
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage departmental course offerings, student cohorts, and attendance schedules.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by code or course title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
          Showing {filteredCourses.length} of {myCourses.length} offerings
        </span>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <BookOpen className="h-10 w-10 text-slate-400 mx-auto opacity-50 mb-1" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {myCourses.length === 0 ? 'No courses registered yet' : 'No courses match your query'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {myCourses.length === 0 
                ? 'Create a new course offering to begin registering student cohorts and conducting roll call sessions.'
                : 'Try adjusting your search criteria.'}
            </p>
            {myCourses.length === 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Course</span>
              </button>
            )}
          </div>
        ) : (
          filteredCourses.map(course => (
            <div 
              key={course.id}
              className="erp-box p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {course.courseCode}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{course.semester}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{course.courseName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{course.description || 'Core departmental syllabus offering.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>{course.enrolledCount || 0} enrolled</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/teacher/students?courseId=${course.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                  >
                    Roster
                  </Link>

                  <Link
                    to={`/teacher/take-attendance?courseId=${course.id}`}
                    className="p-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white transition-colors shadow-sm"
                    title="Launch Live Roll Call"
                  >
                    <QrCode className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Course Creation Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Academic Course</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Provide official catalog details to initialize course enrollment.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS402"
                    value={courseCode}
                    onChange={e => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems & Kernel Architecture"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Semester</label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Course Description</label>
                <textarea
                  rows={3}
                  placeholder="Syllabus overview, topics covered, and prerequisites..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create Course Offering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
