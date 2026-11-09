import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  CheckCircle2, 
  LogOut, 
  Smartphone,
  Check,
  AlertCircle
} from 'lucide-react';
import { getDeviceFingerprint } from '../lib/deviceFingerprint';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clientDevice = getDeviceFingerprint();

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
      {/* Editorial Header */}
      <div className="border-b border-warm-300 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
          Account & Device Profile
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Manage your verified student credentials, registered attendance device, and active session.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Profile information updated successfully.</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-warm-200">
          {currentUser?.profilePhoto ? (
            <img 
              src={currentUser.profilePhoto} 
              alt={currentUser.fullName}
              className="h-16 w-16 rounded-full object-cover border-2 border-primary shadow-subtle"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-lg font-mono">
              {currentUser?.fullName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-navy-900">{currentUser?.fullName}</h3>
            <p className="text-xs text-navy-500 font-mono">
              {currentUser?.role === 'teacher' 
                ? `Faculty ID: ${currentUser.facultyId}` 
                : `Roll No: ${currentUser?.studentId || currentUser?.rollNo || '22CS042'}`}
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

      {/* Linked Student Device Card (Strict 1 Student = 1 Device) */}
      {currentUser?.role === 'student' && (
        <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-bold text-navy-900">Registered Student Device</h2>
            </div>
            {currentUser?.boundDeviceId ? (
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Linked & Active
              </span>
            ) : (
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                Auto-Binds on First Login
              </span>
            )}
          </div>

          <p className="text-xs text-navy-600 leading-relaxed">
            To prevent proxy attendance, your account is permanently bound to your physical mobile device. Attendance scanning is authorized only from your registered phone.
          </p>

          <div className="p-4 rounded-lg bg-warm-50 border border-warm-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-navy-500 font-mono">Bound Device Name:</span>
              <strong className="text-navy-900 font-mono">
                {currentUser?.boundDeviceName || clientDevice.deviceName}
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-navy-500 font-mono">Device Identifier:</span>
              <span className="font-mono text-navy-700 text-[11px]">
                {currentUser?.boundDeviceId ? `${currentUser.boundDeviceId.slice(0, 18)}...` : clientDevice.deviceId.slice(0, 18) + '...'}
              </span>
            </div>
            {currentUser?.boundAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-500 font-mono">Linked On:</span>
                <span className="font-mono text-navy-700">
                  {new Date(currentUser.boundAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-200/60 text-xs text-teal-900 flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Need to change your phone?</strong> If you replace or repair your phone, logging in from your new device will prompt you to send a <strong>Device Change Request</strong> directly to your Department Teacher for approval.
            </span>
          </div>
        </div>
      )}

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
            Client Device: <span className="text-emerald-700 font-medium font-mono">{clientDevice.deviceName}</span>
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
