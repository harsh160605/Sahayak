import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { BarChart3, AlertTriangle, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const AttendanceReports: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, sessions, enrollments, attendanceRecords, subjectAllocations } = useData();

  const myAllocations = subjectAllocations?.filter(a => 
    a.teacherId === currentUser?.uid || 
    (currentUser?.email && a.teacherEmail === currentUser.email)
  ) || [];
  const allocatedCourseIds = new Set(myAllocations.map(a => a.courseId));

  const myCourses = courses.filter(c => 
    c.teacherId === currentUser?.uid || 
    (currentUser?.fullName && c.teacherName === currentUser.fullName) ||
    allocatedCourseIds.has(c.id) ||
    currentUser?.role === 'admin'
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(myCourses[0]?.id || '');
  const [defaulterThreshold, setDefaulterThreshold] = useState<number>(75);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const courseSessions = sessions.filter(s => s.courseId === selectedCourseId && s.status === 'ended');
  const courseEnrollments = enrollments.filter(e => e.courseId === selectedCourseId && e.status === 'active');

  // Compute student-by-student attendance
  const studentMetrics = courseEnrollments.map(student => {
    const attended = attendanceRecords.filter(
      r => r.courseId === selectedCourseId && r.studentUid === student.studentUid && r.status === 'present'
    ).length;
    const totalEligible = Math.max(courseSessions.length, attended, 1);
    const percentage = Math.min(100, Math.max(0, Math.round((attended / totalEligible) * 100)));

    return {
      ...student,
      attended,
      totalEligible,
      percentage,
      isDefaulter: percentage < defaulterThreshold
    };
  });

  const defaulters = studentMetrics.filter(s => s.isDefaulter);

  // Chart data: session turnout trend
  const sessionChartData = courseSessions.map((sess, idx) => ({
    name: `Lec ${idx + 1}`,
    topic: sess.lectureTopic,
    turnout: sess.totalPresent || 0,
    enrolled: courseEnrollments.length
  }));

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
            Detailed cohort analytics and university threshold compliance flags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-navy-700 font-mono">Course:</label>
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
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wide">Total Lectures Held</span>
            <BarChart3 className="h-4 w-4 text-navy-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">{courseSessions.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">Completed lecture sessions</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wide">Cohort Size</span>
            <Users className="h-4 w-4 text-navy-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-navy-900">{courseEnrollments.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">Enrolled students</p>
        </div>

        <div className="p-4 rounded-lg bg-surface border border-warm-300 shadow-subtle">
          <div className="flex items-center justify-between text-navy-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wide">Defaulter Students (&lt;{defaulterThreshold}%)</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">{defaulters.length}</div>
          <p className="text-[11px] text-navy-500 mt-1">Requiring attendance notice</p>
        </div>
      </div>

      {/* Chart: Lecture Turnout */}
      <div className="p-6 rounded-lg bg-surface border border-warm-300 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900">Lecture-wise Attendance Trend</h3>
          <span className="text-[11px] font-mono text-navy-500">Turnout vs Total Cohort</span>
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
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: 8, fontSize: 12, border: 'none' }} 
                />
                <Bar dataKey="turnout" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Student Defaulter / Performance Table */}
      <div className="bg-surface rounded-lg border border-warm-300 overflow-hidden shadow-subtle space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900">Student Attendance Roster & Defaulter Check</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-500 font-mono">Defaulter Threshold:</span>
            <select
              value={defaulterThreshold}
              onChange={e => setDefaulterThreshold(Number(e.target.value))}
              className="px-2 py-1 border border-warm-300 rounded text-xs bg-warm-50 font-mono"
            >
              <option value={85}>85% (Strict)</option>
              <option value={75}>75% (University Norm)</option>
              <option value={65}>65% (Lenient)</option>
            </select>
          </div>
        </div>

        <div className="border border-warm-200 rounded-md overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs min-w-[560px]">
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
              {studentMetrics.map(s => (
                <tr key={s.id} className="hover:bg-warm-50">
                  <td className="p-3 font-mono font-semibold text-navy-900">{s.studentRollNo}</td>
                  <td className="p-3 font-medium text-navy-800">{s.studentName}</td>
                  <td className="p-3 font-mono text-navy-600">{s.attended} / {s.totalEligible}</td>
                  <td className="p-3 font-mono font-bold">
                    <span className={s.percentage >= defaulterThreshold ? 'text-teal-700' : 'text-rose-700'}>
                      {s.percentage}%
                    </span>
                  </td>
                  <td className="p-3">
                    {s.isDefaulter ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                        Defaulter (&lt;{defaulterThreshold}%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Eligible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

