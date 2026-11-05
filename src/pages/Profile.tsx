import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  ShieldCheck, 
  KeyRound, 
  Building, 
  Mail, 
  CheckCircle2, 
  ArrowRightLeft, 
  LogOut,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile, switchUserRole, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [semester, setSemester] = useState(currentUser?.semester || '6th Semester');
  const [successMsg, setSuccessMsg] = useState(false);
  const [saving, setSaving] = useState(false);

  const isTeacher = currentUser?.role === 'teacher';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({ 
      fullName: fullName.trim(), 
      department: department.trim(),
      ...(isTeacher ? {} : { semester })
    });
    setSaving(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const initials = currentUser?.fullName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SA';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="border-b border-warm-300 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          SECURITY & IDENTITY
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
          Academic User Profile
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Manage your institution-verified credentials, department affiliation, and system preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center gap-2.5 shadow-subtle animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Profile information updated and synced successfully!</span>
        </div>
      )}

      {/* Profile Identity Card */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 sm:p-7 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-warm-200">
          <div className="h-16 w-16 rounded-2xl bg-navy-900 text-white flex items-center justify-center font-bold text-xl font-mono shadow-subtle shrink-0">
            {initials}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy-900 truncate">{currentUser?.fullName}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                isTeacher 
                  ? 'bg-warm-200 text-navy-900 border-warm-300' 
                  : 'bg-teal-100 text-teal-800 border-teal-200'
              }`}>
                {isTeacher ? 'FACULTY' : 'STUDENT'}
              </span>
            </div>
            <p className="text-xs text-navy-600 font-mono">
              {isTeacher 
                ? `Faculty ID: ${currentUser?.facultyId || 'FAC-104'}` 
                : `Student Roll No: ${currentUser?.studentId || '22CS042'}`}
            </p>
            <p className="text-[11px] text-navy-500">
              Department of {currentUser?.department}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1">
              Official Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs text-navy-900 focus:outline-none focus:border-primary font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-navy-700 block mb-1">
                College Email (Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3 py-2 rounded-md border border-warm-200 bg-warm-100 text-navy-500 text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-navy-700 block mb-1">
                {isTeacher ? 'Faculty Identifier' : 'Student Roll Number'} (Read-Only)
              </label>
              <input
                type="text"
                disabled
                value={isTeacher ? (currentUser?.facultyId || 'FAC-CS-104') : (currentUser?.studentId || '22CS042')}
                className="w-full px-3 py-2 rounded-md border border-warm-200 bg-warm-100 text-navy-500 text-xs font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-navy-700 block mb-1">
                Academic Department
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs text-navy-900 focus:outline-none focus:border-primary font-medium"
              />
            </div>

            {!isTeacher && (
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Enrolled Semester
                </label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs text-navy-900 focus:outline-none focus:border-primary"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="4th Semester">4th Semester</option>
                  <option value="5th Semester">5th Semester</option>
                  <option value="6th Semester">6th Semester</option>
                  <option value="7th Semester">7th Semester</option>
                  <option value="8th Semester">8th Semester</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-warm-200 flex items-center justify-between">
            <span className="text-[11px] font-mono text-navy-400">
              Account created: {currentUser?.createdAt ? formatDate(currentUser.createdAt) : 'Academic Year 2024'}
            </span>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md shadow-subtle transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Role Switcher & System Session Controls */}
      <div className="bg-surface rounded-xl border border-warm-300 p-5 shadow-subtle space-y-4">
        <h3 className="text-xs font-bold font-mono uppercase text-navy-600 tracking-wider">
          Evaluation Persona Switcher
        </h3>
        <p className="text-xs text-navy-600">
          Seamlessly switch between Teacher and Student perspectives to inspect attendance broadcasting or scanner check-in workflows.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => {
              switchUserRole(isTeacher ? 'student' : 'teacher');
              navigate(isTeacher ? '/student' : '/teacher');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-warm-100 hover:bg-warm-200 text-navy-900 border border-warm-300 rounded-md text-xs font-semibold transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            <span>Switch to {isTeacher ? 'Student View' : 'Faculty View'}</span>
          </button>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md text-xs font-semibold transition-colors ml-auto"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
