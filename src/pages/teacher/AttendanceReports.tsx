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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            ANALYTICS & COMPLIANCE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Attendance Reports & Defaulter Tracking
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Cohort attendance turnout analytics and university threshold compliance flags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={exportDefaultersCSV}
            disabled={defaulters.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-semibold shadow-subtle transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Defaulters ({defaulters.length})</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wide font-semibold text-navy-600">Total Lectures Held</span>
            <BarChart3 className="h-4 w-4 text-navy-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">{courseSessions.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">Completed lecture sessions</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wide font-semibold text-navy-600">Active Cohort Size</span>
            <Users className="h-4 w-4 text-navy-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">{courseEnrollments.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">Enrolled students</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wide font-semibold text-navy-600">
              Defaulters (&lt;{defaulterThreshold}%)
            </span>
            <AlertTriangle className={`h-4 w-4 ${defaulters.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">{defaulters.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">
            {defaulters.length > 0 ? 'Students below compliance threshold' : 'All students meeting threshold'}
          </p>
        </div>
      </div>

      {/* Chart: Lecture Turnout */}
      <div className="p-5 sm:p-6 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-sm font-bold text-navy-900">Lecture Turnout Trend</h3>
          <span className="text-[11px] font-mono text-navy-500">
            {selectedCourse?.courseCode} &bull; Total cohort: {courseEnrollments.length}
          </span>
        </div>

        <div className="h-64 w-full">
          {sessionChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-navy-400 italic">
              No completed lectures for chart visualization yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    color: '#FFF', 
                    borderRadius: 8, 
                    fontSize: 12, 
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="turnout" fill="#0D9488" radius={[4, 4, 0, 0]} name="Students Present" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Student Defaulter / Performance Table */}
      <div className="bg-surface rounded-xl border border-warm-300 overflow-hidden shadow-subtle space-y-3 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-navy-900">Student Attendance Roster & Defaulter Check</h3>
            <p className="text-xs text-navy-500">Track individual student standing against university exam requirements.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-navy-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-md border border-warm-300 bg-surface text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-navy-600 font-mono">Norm:</span>
              <select
                value={defaulterThreshold}
                onChange={e => setDefaulterThreshold(Number(e.target.value))}
                className="px-2 py-1 border border-warm-300 rounded text-xs bg-warm-100 font-mono text-navy-900"
              >
                <option value={85}>85% (Strict)</option>
                <option value={75}>75% (University Norm)</option>
                <option value={65}>65% (Lenient)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-warm-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-100 border-b border-warm-200 text-navy-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Lectures Attended</th>
                <th className="p-3">Attendance %</th>
                <th className="p-3">Eligibility Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-200">
              {filteredStudentMetrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-navy-500 italic">
                    No enrolled students in this course roster.
                  </td>
                </tr>
              ) : (
                filteredStudentMetrics.map(s => (
                  <tr key={s.id} className="hover:bg-warm-50/80 transition-colors">
                    <td className="p-3 font-mono font-semibold text-navy-900">{s.studentRollNo}</td>
                    <td className="p-3 font-medium text-navy-900">{s.studentName}</td>
                    <td className="p-3 font-mono text-navy-600">{s.attended} / {s.totalEligible}</td>
                    <td className="p-3 font-mono font-bold">
                      {s.percentage !== null ? (
                        <span className={s.percentage >= defaulterThreshold ? 'text-teal-700' : 'text-rose-700'}>
                          {s.percentage}%
                        </span>
                      ) : (
                        <span className="text-navy-400 font-normal">No lectures yet</span>
                      )}
                    </td>
                    <td className="p-3">
                      {s.isDefaulter ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                          <ShieldAlert className="h-3 w-3 text-rose-600" />
                          <span>Defaulter (&lt;{defaulterThreshold}%)</span>
                        </span>
                      ) : s.percentage !== null ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>Eligible</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-navy-600 bg-warm-100">
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
