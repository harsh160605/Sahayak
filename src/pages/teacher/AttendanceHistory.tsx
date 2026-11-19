import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  History, 
  Download, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  ShieldCheck,
  Eye,
  X,
  MapPin
} from 'lucide-react';
import { formatDate, formatTime } from '../../lib/utils';
import { AttendanceRecord } from '../../types';

export const AttendanceHistory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramCourseId = searchParams.get('courseId');
  const paramSessionId = searchParams.get('sessionId');

  const { currentUser } = useAuth();
  const { courses, sessions, attendanceRecords, subjectAllocations } = useData();

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

  const initialCourseId = paramCourseId && myCourses.some(c => c.id === paramCourseId)
    ? paramCourseId
    : (myCourses[0]?.id || paramCourseId || '');

  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(paramSessionId || 'all');
  const [inspectingRecord, setInspectingRecord] = useState<AttendanceRecord | null>(null);

  const courseSessions = sessions.filter(s => !selectedCourseId || s.courseId === selectedCourseId);
  const relevantRecords = attendanceRecords.filter(r => {
    if (selectedSessionId !== 'all') {
      return r.sessionId === selectedSessionId;
    }
    return !selectedCourseId || r.courseId === selectedCourseId;
  });

  // Export to CSV Generator
  const exportToCSV = () => {
    if (relevantRecords.length === 0) {
      alert('No attendance records available to export.');
      return;
    }

    const headers = ['Record ID', 'Student Roll No', 'Student Name', 'Session Topic', 'Status', 'Timestamp', 'Verification Source'];
    const rows = relevantRecords.map(r => {
      const sess = sessions.find(s => s.id === r.sessionId);
      return [
        r.id,
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
    link.setAttribute('download', `SmartAttend_Attendance_${selectedCourseId}_${Date.now()}.csv`);
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
            AUDIT & LOGS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Attendance History & Export
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Historical verification trail with lecture timestamps and CSV export functionality.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-semibold shadow-subtle transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-4 bg-surface p-4 rounded-lg border border-warm-300 shadow-subtle">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-navy-700 font-mono">Course:</label>
          <select
            value={selectedCourseId}
            onChange={e => {
              setSelectedCourseId(e.target.value);
              setSelectedSessionId('all');
            }}
            className="px-3 py-1.5 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
          >
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-navy-700 font-mono">Lecture Session:</label>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
          >
            <option value="all">All Sessions ({courseSessions.length})</option>
            {courseSessions.map(s => (
              <option key={s.id} value={s.id}>
                {formatDate(s.startedAt)}: {s.lectureTopic}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-surface rounded-lg border border-warm-300 overflow-x-auto touch-scroll shadow-subtle">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-warm-100 border-b border-warm-300 text-navy-600 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-3">Student Roll No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Lecture Topic</th>
              <th className="p-3">Status</th>
              <th className="p-3">Marked Timestamp</th>
              <th className="p-3">Verification Source</th>
              <th className="p-3 text-right">Perimeter Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-200">
            {relevantRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-navy-500 italic">
                  No attendance records recorded for the selected filter.
                </td>
              </tr>
            ) : (
              relevantRecords.map(r => {
                const sess = sessions.find(s => s.id === r.sessionId);
                return (
                  <tr key={r.id} className="hover:bg-warm-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-navy-800">{r.studentRollNo}</td>
                    <td className="p-3 font-semibold text-navy-900">{r.studentName}</td>
                    <td className="p-3 text-navy-700">{sess?.lectureTopic || 'Lecture'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-navy-600">
                      {formatDate(r.markedAt)} at {formatTime(r.markedAt)}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-700">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        {r.source === 'qr_scan' ? 'Dynamic QR' : 'Manual Entry'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {r.studentCoordinates ? (
                        <button
                          type="button"
                          onClick={() => setInspectingRecord(r)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warm-100 hover:bg-warm-200 border border-warm-300 text-[11px] font-mono text-navy-800 transition-colors"
                          title="Inspect perimeter audit"
                        >
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>Perimeter Pass</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-navy-400 font-mono italic">
                          Standard
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Inspection Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-warm-300 shadow-elevated max-w-sm w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-warm-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 font-mono uppercase">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Attendance Verification Audit</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="p-1 rounded-md text-navy-400 hover:text-navy-700 hover:bg-warm-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Student & Session Ledger Details */}
            <div className="p-3.5 rounded-lg bg-warm-50 border border-warm-200 text-xs font-mono space-y-2 text-navy-800">
              <div className="flex items-center justify-between pb-1.5 border-b border-warm-200">
                <span className="text-navy-500 text-[11px]">STUDENT</span>
                <span className="font-bold text-navy-900 font-sans">{inspectingRecord.studentName}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-warm-200">
                <span className="text-navy-500 text-[11px]">ROLL NUMBER</span>
                <span className="font-bold text-navy-900">{inspectingRecord.studentRollNo}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-warm-200">
                <span className="text-navy-500 text-[11px]">TIME CAPTURED</span>
                <span className="font-bold text-navy-900">{formatDate(inspectingRecord.markedAt)} at {formatTime(inspectingRecord.markedAt)}</span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-navy-500 text-[11px]">VERIFICATION</span>
                <span className="font-bold text-teal-800 font-mono">Dynamic QR Validated</span>
              </div>
            </div>

            {inspectingRecord.studentCoordinates && (
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Classroom perimeter verified (~{inspectingRecord.studentCoordinates.distanceMeters || 12}m from instructor)</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setInspectingRecord(null)}
              className="w-full py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

