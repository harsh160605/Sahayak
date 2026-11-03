import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, KeyRound, Building, Mail, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ fullName, department });
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-warm-300 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          SECURITY & IDENTITY
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
          Academic User Profile
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Manage your institution-verified credentials and system preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-warm-200">
          <div className="h-16 w-16 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-lg font-mono">
            {currentUser?.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900">{currentUser?.fullName}</h3>
            <p className="text-xs text-navy-500 font-mono">
              {currentUser?.role === 'teacher' ? `Faculty ID: ${currentUser.facultyId}` : `Roll No: ${currentUser?.studentId}`}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-warm-200 text-navy-800">
              Role: {currentUser?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1">Official Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1">College Email (Read-Only)</label>
            <input
              type="email"
              disabled
              value={currentUser?.email}
              className="w-full px-3 py-2 rounded-md border border-warm-200 bg-warm-100 text-navy-500 text-xs font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-3 border-t border-warm-200 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md shadow-subtle transition-all"
            >
              Update Profile Information
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

