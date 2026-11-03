import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Plus, BookOpen, Users, QrCode, Search, Filter } from 'lucide-react';
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

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);
  const filteredCourses = myCourses.filter(c => 
    c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
    c.courseName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    addCourse({
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
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            COURSE CURRICULUM
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            My Courses & Rosters
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Manage academic offerings, enrolled student cohorts, and attendance policies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-surface text-xs font-semibold shadow-subtle transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search by code or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md bg-surface border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary shadow-subtle"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-surface border border-warm-300 rounded-lg">
            <BookOpen className="h-8 w-8 text-navy-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-navy-900">No courses match your search</p>
            <p className="text-xs text-navy-500 mt-1">Create a new course to begin tracking attendance.</p>
          </div>
        ) : (
          filteredCourses.map(course => (
            <div 
              key={course.id}
              className="p-5 rounded-lg bg-surface border border-warm-300 shadow-subtle hover:border-warm-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-warm-200 text-navy-800 border border-warm-300">
                    {course.courseCode}
                  </span>
                  <span className="text-[11px] font-mono text-navy-500">{course.semester}</span>
                </div>
                <h3 className="text-sm font-semibold text-navy-900 leading-snug">{course.courseName}</h3>
                <p className="text-xs text-navy-600 line-clamp-2 leading-relaxed">{course.description}</p>
              </div>

              <div className="pt-3 border-t border-warm-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-navy-600 font-mono">
                  <Users className="h-3.5 w-3.5 text-navy-500" />
                  <span>{course.enrolledCount || 0} enrolled</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/teacher/take-attendance?courseId=${course.id}`}
                    className="p-1.5 rounded bg-warm-100 hover:bg-primary hover:text-white border border-warm-300 text-navy-700 transition-colors"
                    title="Start Live Attendance"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-elevated w-full max-w-lg p-6 space-y-5">
            <div className="border-b border-warm-200 pb-3">
              <h3 className="text-base font-bold text-navy-900">Create Academic Course</h3>
              <p className="text-xs text-navy-500">Provide official catalog details to initialize student enrollments.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS402"
                    value={courseCode}
                    onChange={e => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Course Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems & Kernel Architecture"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">Semester</label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Course Description</label>
                <textarea
                  rows={3}
                  placeholder="Summary of syllabus, topics covered, and prerequisites..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium text-navy-700 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-subtle"
                >
                  Confirm & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

