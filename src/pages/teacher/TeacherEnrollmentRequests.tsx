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
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            ADMISSIONS & REGISTRATIONS
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Course Enrollment Requests
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review, approve, or decline student enrollment requests before they can mark lecture attendance.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Pending Approvals</span>
            <span className={`px-2 py-0.2 rounded-full font-mono text-[10px] font-bold ${
              pendingRequests.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {pendingRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviewed')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'reviewed'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Decision Audit Log</span>
            <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {reviewedRequests.length}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search student or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'pending' ? (
        <div className="space-y-3">
          {filteredPending.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto opacity-75 mb-1" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {pendingRequests.length === 0 ? 'All requests reviewed' : 'No requests match search'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {pendingRequests.length === 0
                  ? 'There are currently no student enrollment requests awaiting your decision.'
                  : 'Try clearing your search query.'}
              </p>
            </div>
          ) : (
            filteredPending.map(req => (
              <div 
                key={req.id}
                className="erp-box p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{req.studentName}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {req.studentRollNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Applying for Course: <strong className="text-slate-900 dark:text-white font-mono">{req.courseCode}</strong> — {req.courseName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Submitted: {formatDate(req.requestedAt)} at {formatTime(req.requestedAt)} &bull; {req.studentEmail}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      const reason = window.prompt('Optional decline reason:', 'Admission criteria not fulfilled');
                      if (reason !== null) {
                        rejectRequest(req.id, reason);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => approveRequest(req.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve Admission</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Decision Status</th>
                  <th className="p-3">Reviewed Date</th>
                  <th className="p-3">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReviewed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                      No reviewed enrollment requests in history.
                    </td>
                  </tr>
                ) : (
                  filteredReviewed.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{req.studentName}</td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium">{req.studentRollNo}</td>
                      <td className="p-3 font-mono text-slate-900 dark:text-white">{req.courseCode}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          req.status === 'approved' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                        {req.reviewedAt ? formatDate(req.reviewedAt) : 'N/A'}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
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
