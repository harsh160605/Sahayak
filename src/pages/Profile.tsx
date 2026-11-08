import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, KeyRound, Building, Mail, CheckCircle2, LogOut } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ fullName, department });
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header with Quick Sign-Out */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            SECURITY & IDENTITY
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Academic User Profile
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Manage your institution-verified credentials and active session.
          </p>
        </div>

        {/* Prominent Mobile & Desktop Sign Out Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="self-start sm:self-auto flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100/90 text-red-700 text-xs font-semibold shadow-subtle transition-all active:scale-95 disabled:opacity-50"
          title="Sign out of your account"
          aria-label="Sign out of your account"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
        </button>
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
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-subtle transition-all active:scale-95 flex items-center justify-center"
            >
              Update Profile Information
            </button>
          </div>
        </form>
      </div>

      {/* Dedicated Session Management & Sign Out Card */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-bold text-navy-900">Session & Authentication</h2>
          </div>
          <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            Active Verified Session
          </span>
        </div>

        <p className="text-xs text-navy-600 leading-relaxed">
          You are currently signed in as <span className="font-mono font-medium text-navy-900">{currentUser?.email}</span> with{' '}
          <span className="font-semibold text-navy-900 capitalize">{currentUser?.role}</span> permissions. Signing out will clear your local cryptographic session credentials.
        </p>

        <div className="pt-3 border-t border-warm-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-navy-500 font-mono">
            Device Status: <span className="text-emerald-700 font-medium">Authorized</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold shadow-subtle transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out of Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

