import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserCheck, Check, X, Clock, AlertCircle, Search, ShieldCheck } from 'lucide-react';
import { formatDate, formatTime } from '../../lib/utils';

export const TeacherEnrollmentRequests: React.FC = () => {
  const { currentUser } = useAuth();
  const { requests, approveRequest, rejectRequest } = useData();

  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [search, setSearch] = useState('');

  const myRequests = requests.filter(r => r.teacherId === currentUser?.uid);
  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const reviewedRequests = myRequests.filter(r => r.status !== 'pending');

  const filteredPending = pendingRequests.filter(r =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) ||
    r.studentRollNo.toLowerCase().includes(search.toLowerCase()) ||
    r.courseCode.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReviewed = reviewedRequests.filter(r =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) ||
    r.studentRollNo.toLowerCase().includes(search.toLowerCase()) ||
    r.courseCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="border-b border-warm-300 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          ADMISSIONS & ENROLLMENTS
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
          Student Enrollment Requests
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Review and approve student admission into your active courses before they can mark attendance.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-300 pb-2">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <span>Pending Approvals</span>
            <span className={`px-2 py-0.2 rounded-full font-mono text-[10px] font-bold ${
              pendingRequests.length > 0 ? 'bg-primary text-white' : 'bg-warm-200 text-navy-700'
            }`}>
              {pendingRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviewed')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'reviewed'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <span>Audit Log</span>
            <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-warm-200 text-navy-700">
              {reviewedRequests.length}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-navy-400" />
          <input
            type="text"
            placeholder="Search student or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-surface border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'pending' ? (
        <div className="space-y-3">
          {filteredPending.length === 0 ? (
            <div className="p-12 text-center bg-surface border border-warm-300 rounded-xl space-y-2">
              <ShieldCheck className="h-10 w-10 text-emerald-600 mx-auto opacity-75 mb-1" />
              <h3 className="text-sm font-bold text-navy-900">
                {pendingRequests.length === 0 ? 'All requests reviewed' : 'No requests match search'}
              </h3>
              <p className="text-xs text-navy-500 max-w-sm mx-auto">
                {pendingRequests.length === 0
                  ? 'There are currently no pending student enrollment requests awaiting your decision.'
                  : 'Try clearing your search query.'}
              </p>
            </div>
          ) : (
            filteredPending.map(req => (
              <div 
                key={req.id}
                className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle hover:border-warm-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-navy-900">{req.studentName}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-warm-200 text-navy-900 border border-warm-300">
                      {req.studentRollNo}
                    </span>
                  </div>
                  <p className="text-xs text-navy-700">
                    Applying for: <strong className="text-navy-900 font-mono">{req.courseCode}</strong> — {req.courseName}
                  </p>
                  <p className="text-[11px] text-navy-500 font-mono">
                    Submitted: {formatDate(req.requestedAt)} at {formatTime(req.requestedAt)} &bull; {req.studentEmail}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-warm-200">
                  <button
                    onClick={() => {
                      const reason = window.prompt('Optional decline reason:', 'Application criteria not met');
                      if (reason !== null) {
                        rejectRequest(req.id, reason);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => approveRequest(req.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve Enrollment</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-warm-300 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100 border-b border-warm-300 text-navy-600 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Decision Date</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {filteredReviewed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-navy-500 italic">
                      No reviewed enrollment requests in history.
                    </td>
                  </tr>
                ) : (
                  filteredReviewed.map(req => (
                    <tr key={req.id} className="hover:bg-warm-50/80 transition-colors">
                      <td className="p-3 font-semibold text-navy-900">{req.studentName}</td>
                      <td className="p-3 font-mono text-navy-700 font-medium">{req.studentRollNo}</td>
                      <td className="p-3 font-mono text-navy-900">{req.courseCode}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          req.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-navy-500">
                        {req.reviewedAt ? formatDate(req.reviewedAt) : 'N/A'}
                      </td>
                      <td className="p-3 text-navy-500 text-[11px] max-w-xs truncate">
                        {req.decisionReason || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
