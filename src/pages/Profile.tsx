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
  Calendar
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
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
            IDENTITY & CREDENTIALS
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Academic User Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review institutional identity records, department affiliation, and system settings.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">Profile information updated and synced successfully.</span>
        </div>
      )}

      {/* Profile Identity Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="h-14 w-14 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-lg font-mono shadow-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{currentUser?.fullName}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                isTeacher 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700' 
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
              }`}>
                {isTeacher ? 'FACULTY' : 'STUDENT'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {isTeacher 
                ? `Faculty ID: ${currentUser?.facultyId || 'FAC-104'}` 
                : `Student Roll No: ${currentUser?.studentId || '22CS042'}`}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Department of {currentUser?.department}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Official Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Institutional Email (Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {isTeacher ? 'Faculty Identifier' : 'Student Roll Number'} (Read-Only)
              </label>
              <input
                type="text"
                disabled
                value={isTeacher ? (currentUser?.facultyId || 'FAC-CS-104') : (currentUser?.studentId || '22CS042')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Academic Department
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            {!isTeacher && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Enrolled Semester
                </label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-600"
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

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Account created: {currentUser?.createdAt ? formatDate(currentUser.createdAt) : 'Academic Year 2024'}
            </span>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Role Switcher & System Session Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
        <h3 className="text-xs font-bold font-mono uppercase text-slate-600 dark:text-slate-400 tracking-wider">
          Evaluation Persona Switcher
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Seamlessly switch between Teacher and Student perspectives to test attendance broadcasting or scanner check-in workflows.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => {
              switchUserRole(isTeacher ? 'student' : 'teacher');
              navigate(isTeacher ? '/student' : '/teacher');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Switch to {isTeacher ? 'Student View' : 'Faculty View'}</span>
          </button>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold transition-colors ml-auto"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
