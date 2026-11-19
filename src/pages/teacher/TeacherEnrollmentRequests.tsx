import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserCheck, Check, X, Clock, AlertCircle } from 'lucide-react';
import { formatDate, formatTime } from '../../lib/utils';

export const TeacherEnrollmentRequests: React.FC = () => {
  const { currentUser } = useAuth();
  const { requests, approveRequest, rejectRequest } = useData();

  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');

  const myRequests = requests.filter(r => r.teacherId === currentUser?.uid);
  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const reviewedRequests = myRequests.filter(r => r.status !== 'pending');

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

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-warm-300 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <span>Pending Approvals</span>
          <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-warm-200 text-navy-800">
            {pendingRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reviewed')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'reviewed'
              ? 'border-primary text-primary'
              : 'border-transparent text-navy-500 hover:text-navy-900'
          }`}
        >
          <span>Audit Log ({reviewedRequests.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'pending' ? (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-warm-300 rounded-lg">
              <UserCheck className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-navy-900">All requests reviewed</p>
              <p className="text-xs text-navy-500 mt-1">There are no pending student enrollment requests for your courses.</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div 
                key={req.id}
                className="p-5 rounded-lg bg-surface border border-warm-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-navy-900">{req.studentName}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-warm-200 text-navy-800 border border-warm-300">
                      {req.studentRollNo}
                    </span>
                  </div>
                  <p className="text-xs text-navy-600">
                    Applying for: <strong className="text-navy-900">{req.courseCode}</strong> — {req.courseName}
                  </p>
                  <p className="text-[11px] text-navy-500 font-mono">
                    Submitted: {formatDate(req.requestedAt)} at {formatTime(req.requestedAt)} &bull; {req.studentEmail}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => rejectRequest(req.id, 'Declined by instructor')}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => approveRequest(req.id)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-subtle transition-all active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-warm-300 overflow-x-auto touch-scroll shadow-subtle">
          <table className="w-full text-left text-xs min-w-[560px]">
            <thead className="bg-warm-100 border-b border-warm-300 text-navy-600 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Course</th>
                <th className="p-3">Status</th>
                <th className="p-3">Decision Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-200">
              {reviewedRequests.map(req => (
                <tr key={req.id} className="hover:bg-warm-50">
                  <td className="p-3 font-semibold text-navy-900">{req.studentName}</td>
                  <td className="p-3 font-mono text-navy-600">{req.studentRollNo}</td>
                  <td className="p-3 text-navy-800">{req.courseCode}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      req.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-navy-500">
                    {req.reviewedAt ? formatDate(req.reviewedAt) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

