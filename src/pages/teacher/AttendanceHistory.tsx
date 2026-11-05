import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  History, 
  Download, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  BookOpen,
  MapPin,
  Clock
} from 'lucide-react';
import { formatDate, formatTime } from '../../lib/utils';

export const AttendanceHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, sessions, attendanceRecords, enrollments } = useData();

  const isTeacher = currentUser?.role === 'teacher';

  // Get courses based on role
  const relevantCourses = isTeacher
    ? courses.filter(c => c.teacherId === currentUser?.uid)
    : courses.filter(c => 
        enrollments.some(e => e.courseId === c.id && e.studentUid === currentUser?.uid && e.status === 'active')
      );

  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Sessions for dropdown filter
  const courseSessions = selectedCourseId === 'all'
    ? sessions.filter(s => relevantCourses.some(c => c.id === s.courseId))
    : sessions.filter(s => s.courseId === selectedCourseId);

  // Filter records
  const filteredRecords = attendanceRecords.filter(r => {
    // 1. Role filter: students only see their own attendance
    if (!isTeacher && r.studentUid !== currentUser?.uid) {
      return false;
    }
    // For teachers, only see records for courses they teach
    if (isTeacher && !relevantCourses.some(c => c.id === r.courseId)) {
      return false;
    }

    // 2. Course filter
    if (selectedCourseId !== 'all' && r.courseId !== selectedCourseId) {
      return false;
    }

    // 3. Session filter
    if (selectedSessionId !== 'all' && r.sessionId !== selectedSessionId) {
      return false;
    }

    // 4. Search query
    if (search.trim()) {
      const term = search.toLowerCase();
      const sess = sessions.find(s => s.id === r.sessionId);
      const matchesStudent = r.studentName.toLowerCase().includes(term) || r.studentRollNo.toLowerCase().includes(term);
      const matchesTopic = (sess?.lectureTopic || '').toLowerCase().includes(term);
      const matchesCourse = (sess?.courseCode || '').toLowerCase().includes(term);
      return matchesStudent || matchesTopic || matchesCourse;
    }

    return true;
  });

  // Export to CSV Generator
  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No attendance records available to export.');
      return;
    }

    const headers = ['Record ID', 'Course Code', 'Student Roll No', 'Student Name', 'Session Topic', 'Status', 'Timestamp', 'Verification Source'];
    const rows = filteredRecords.map(r => {
      const sess = sessions.find(s => s.id === r.sessionId);
      const course = courses.find(c => c.id === r.courseId);
      return [
        r.id,
        course?.courseCode || 'N/A',
        r.studentRollNo,
        `"${r.studentName}"`,
        `"${sess?.lectureTopic || 'Lecture'}"`,
        r.status.toUpperCase(),
        r.markedAt,
        r.source
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const prefix = isTeacher ? 'Faculty_Audit' : `Student_${currentUser?.studentId || 'Records'}`;
    link.setAttribute('download', `SmartAttend_${prefix}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            {isTeacher ? 'AUDIT & VERIFICATION LOGS' : 'PERSONAL ATTENDANCE LOG'}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Attendance History & Export
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            {isTeacher 
              ? 'Complete historical verification trail with lecture timestamps, student roll numbers, and CSV export.'
              : 'Detailed chronological log of your recorded attendance across all enrolled courses.'}
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={filteredRecords.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-semibold shadow-subtle transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-navy-600" />
          <span>Export CSV ({filteredRecords.length})</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface p-4 rounded-xl border border-warm-300 shadow-subtle">
        <div>
          <label className="text-[11px] font-semibold text-navy-600 font-mono uppercase block mb-1">
            Course Filter:
          </label>
          <select
            value={selectedCourseId}
            onChange={e => {
              setSelectedCourseId(e.target.value);
              setSelectedSessionId('all');
            }}
            className="w-full px-3 py-1.5 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary font-medium"
          >
            <option value="all">All Courses ({relevantCourses.length})</option>
            {relevantCourses.map(c => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-navy-600 font-mono uppercase block mb-1">
            Lecture Session:
          </label>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
          >
            <option value="all">All Sessions ({courseSessions.length})</option>
            {courseSessions.map(s => (
              <option key={s.id} value={s.id}>
                {formatDate(s.startedAt)}: {s.lectureTopic}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-navy-600 font-mono uppercase block mb-1">
            Search Records:
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
            <input
              type="text"
              placeholder={isTeacher ? "Search student or roll no..." : "Search topic or course..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table & Mobile Cards */}
      <div className="bg-surface rounded-xl border border-warm-300 overflow-hidden shadow-subtle">
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-warm-200">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-navy-500 italic">
              No attendance records match your filter criteria.
            </div>
          ) : (
            filteredRecords.map(r => {
              const sess = sessions.find(s => s.id === r.sessionId);
              const course = courses.find(c => c.id === r.courseId);
              return (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-warm-200 text-navy-900 border border-warm-300">
                      {course?.courseCode || 'CRS'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800">
                      {r.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-navy-900">{r.studentName}</h4>
                    <p className="text-[11px] text-navy-500 font-mono">Roll No: {r.studentRollNo}</p>
                    <p className="text-xs text-navy-700 mt-1">{sess?.lectureTopic || 'Lecture Session'}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-navy-500 pt-1 border-t border-warm-100">
                    <span>{formatDate(r.markedAt)} {formatTime(r.markedAt)}</span>
                    <span className="text-teal-700 font-semibold">{r.source === 'qr_scan' ? 'Dynamic QR' : 'Manual'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Dense Structured Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-100 border-b border-warm-300 text-navy-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Course</th>
                <th className="p-3">Student Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Lecture Topic</th>
                <th className="p-3">Status</th>
                <th className="p-3">Marked Timestamp</th>
                <th className="p-3">Verification Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-navy-500 italic">
                    No attendance records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => {
                  const sess = sessions.find(s => s.id === r.sessionId);
                  const course = courses.find(c => c.id === r.courseId);
                  return (
                    <tr key={r.id} className="hover:bg-warm-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-navy-900">
                        {course?.courseCode || 'CRS'}
                      </td>
                      <td className="p-3 font-mono font-semibold text-navy-800">{r.studentRollNo}</td>
                      <td className="p-3 font-medium text-navy-900">{r.studentName}</td>
                      <td className="p-3 text-navy-700 max-w-xs truncate">{sess?.lectureTopic || 'Lecture'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-navy-600">
                        {formatDate(r.markedAt)} at {formatTime(r.markedAt)}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-800 font-medium">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          {r.source === 'qr_scan' ? 'Dynamic QR' : 'Manual Entry'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
