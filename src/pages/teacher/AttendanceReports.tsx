import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  BarChart3, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  Download, 
  Search, 
  BookOpen, 
  ShieldAlert, 
  ShieldCheck 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const AttendanceReports: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, sessions, enrollments, attendanceRecords } = useData();

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(myCourses[0]?.id || '');
  const [defaulterThreshold, setDefaulterThreshold] = useState<number>(75);
  const [search, setSearch] = useState<string>('');

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const courseSessions = sessions.filter(s => s.courseId === selectedCourseId && s.status === 'ended');
  const courseEnrollments = enrollments.filter(e => e.courseId === selectedCourseId && e.status === 'active');

  // Compute student-by-student attendance
  const studentMetrics = courseEnrollments.map(student => {
    const attended = attendanceRecords.filter(
      r => r.courseId === selectedCourseId && r.studentUid === student.studentUid && r.status === 'present'
    ).length;
    const totalEligible = courseSessions.length;
    const percentage = totalEligible > 0 ? Math.round((attended / totalEligible) * 100) : null;

    return {
      ...student,
      attended,
      totalEligible,
      percentage,
      isDefaulter: percentage !== null && percentage < defaulterThreshold
    };
  });

  const filteredStudentMetrics = studentMetrics.filter(s =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentRollNo.toLowerCase().includes(search.toLowerCase())
  );

  const defaulters = studentMetrics.filter(s => s.isDefaulter);

  // Chart data: session turnout trend
  const sessionChartData = courseSessions.map((sess, idx) => ({
    name: `Lec ${idx + 1}`,
    topic: sess.lectureTopic,
    turnout: sess.totalPresent || 0,
    enrolled: courseEnrollments.length
  }));

  const exportDefaultersCSV = () => {
    if (defaulters.length === 0) {
      alert('No defaulter students found below the selected threshold.');
      return;
    }

    const headers = ['Roll Number', 'Student Name', 'College Email', 'Attended', 'Total Lectures', 'Attendance %', 'Threshold'];
    const rows = defaulters.map(d => [
      d.studentRollNo,
      `"${d.studentName}"`,
      d.studentEmail,
      d.attended,
      d.totalEligible,
      `${d.percentage}%`,
      `${defaulterThreshold}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Defaulters_${selectedCourse?.courseCode || 'Course'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              ACADEMIC COMPLIANCE & REPORTS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Attendance Reports & Defaulter Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cohort attendance turnout analytics and university exam eligibility compliance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-medium"
          >
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName}
              </option>
            ))}
          </select>

          <button
            onClick={exportDefaultersCSV}
            disabled={defaulters.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Defaulters ({defaulters.length})</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Lectures Completed</span>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{courseSessions.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Conducted lecture sessions</p>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Active Cohort Size</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{courseEnrollments.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Enrolled students</p>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Defaulters (&lt;{defaulterThreshold}%)
              </span>
              <AlertTriangle className={`h-4 w-4 ${defaulters.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{defaulters.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {defaulters.length > 0 ? 'Students below mandatory threshold' : 'All students compliant'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart: Lecture Turnout */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lecture Turnout Trend</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Attendance headcounts across chronological lectures.</p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {selectedCourse?.courseCode} &bull; Total Cohort: {courseEnrollments.length}
          </span>
        </div>

        <div className="h-64 w-full">
          {sessionChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
              No completed lectures for chart visualization yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    color: '#FFF', 
                    borderRadius: 8, 
                    fontSize: 12, 
                    border: '1px solid #334155',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                  }} 
                />
                <Bar dataKey="turnout" fill="#2563EB" radius={[4, 4, 0, 0]} name="Students Present" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Student Defaulter / Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-3 p-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Student Attendance Roster & Defaulter Check</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track individual student standing against university exam criteria.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Norm:</span>
              <select
                value={defaulterThreshold}
                onChange={e => setDefaulterThreshold(Number(e.target.value))}
                className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
              >
                <option value={85}>85% (Strict)</option>
                <option value={75}>75% (University Norm)</option>
                <option value={65}>65% (Lenient)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Lectures Attended</th>
                <th className="p-3">Attendance %</th>
                <th className="p-3">Eligibility Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudentMetrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 dark:text-slate-400 italic">
                    No enrolled students in this course roster.
                  </td>
                </tr>
              ) : (
                filteredStudentMetrics.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-semibold text-slate-900 dark:text-white">{s.studentRollNo}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{s.studentName}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{s.attended} / {s.totalEligible}</td>
                    <td className="p-3 font-mono font-bold">
                      {s.percentage !== null ? (
                        <span className={s.percentage >= defaulterThreshold ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {s.percentage}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">No lectures yet</span>
                      )}
                    </td>
                    <td className="p-3">
                      {s.isDefaulter ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                          <ShieldAlert className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                          <span>Defaulter (&lt;{defaulterThreshold}%)</span>
                        </span>
                      ) : s.percentage !== null ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Eligible</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                          Pending Session
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
