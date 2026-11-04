import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, Shield, ArrowRight, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { loginAsDemoUser, loginWithEmail, registerUser, isLiveFirebase } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [semester, setSemester] = useState('6th Semester');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isLiveFirebase) {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          navigate(role === 'teacher' ? '/teacher' : '/student');
        } else {
          setErrorMsg(res.error || 'Invalid credentials or user not found.');
        }
      } else {
        // Registration
        const profileData = {
          fullName: fullName.trim(),
          email: email.trim(),
          role,
          department: department.trim(),
          ...(role === 'student' ? { studentId: studentId.trim().toUpperCase(), semester } : { facultyId: facultyId.trim().toUpperCase() })
        };
        const res = await registerUser(email, password, profileData);
        if (res.success) {
          navigate(role === 'teacher' ? '/teacher' : '/student');
        } else {
          setErrorMsg(res.error || 'Failed to create user account.');
        }
      }
    } else {
      // Demo fallback mode
      loginAsDemoUser(role);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    }
    setLoading(false);
  };

  const handleQuickDemo = (demoRole: 'teacher' | 'student') => {
    loginAsDemoUser(demoRole);
    navigate(demoRole === 'teacher' ? '/teacher' : '/student');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="h-12 w-12 rounded-lg bg-navy-900 mx-auto flex items-center justify-center text-primary shadow-subtle">
          <QrCode className="h-7 w-7 text-primary" strokeWidth={2.2} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-navy-900">SmartAttend</h2>
        
        {/* Backend Indicator Badge */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${
            isLiveFirebase ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-warm-200 text-navy-700 border border-warm-300'
          }`}>
            <Database className="h-3 w-3" />
            {isLiveFirebase ? 'CONNECTED TO CLOUD FIRESTORE' : 'OFFLINE DEMO MODE'}
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-card rounded-xl border border-warm-300 sm:px-10 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Tabs: Login vs Register */}
          <div className="flex items-center border-b border-warm-200 pb-2 justify-between text-xs font-semibold">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`pb-1 border-b-2 transition-colors ${
                  mode === 'login' ? 'border-primary text-primary' : 'border-transparent text-navy-500 hover:text-navy-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`pb-1 border-b-2 transition-colors ${
                  mode === 'register' ? 'border-primary text-primary' : 'border-transparent text-navy-500 hover:text-navy-900'
                }`}
              >
                Create Account
              </button>
            </div>

            <span className="text-[10px] uppercase font-mono text-navy-400">
              {role.toUpperCase()}
            </span>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-warm-100 rounded-lg border border-warm-300">
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                role === 'teacher'
                  ? 'bg-surface text-navy-900 shadow-subtle'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                role === 'student'
                  ? 'bg-surface text-navy-900 shadow-subtle'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diya Sharma"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">
                      {role === 'teacher' ? 'Faculty ID' : 'Roll Number'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={role === 'teacher' ? 'FAC-CS-109' : '22CS088'}
                      value={role === 'teacher' ? facultyId : studentId}
                      onChange={e => role === 'teacher' ? setFacultyId(e.target.value) : setStudentId(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs font-mono uppercase focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">
                {role === 'teacher' ? 'Faculty College Email' : 'Student College Email'}
              </label>
              <input
                type="email"
                required
                placeholder={role === 'teacher' ? 'prof.name@college.edu' : 'student.roll@college.edu'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-semibold transition-all shadow-subtle disabled:opacity-50"
            >
              {loading 
                ? 'Authenticating...' 
                : mode === 'login' 
                  ? `Sign In as ${role === 'teacher' ? 'Faculty' : 'Student'}` 
                  : `Register Account in Firestore`
              }
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="pt-3 border-t border-warm-200 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-navy-500 block text-center">
              Quick 1-Click Evaluation Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('teacher')}
                className="p-2.5 rounded-md border border-warm-300 bg-warm-100 hover:bg-warm-200 text-left text-xs transition-colors"
              >
                <p className="font-semibold text-navy-900">Dr. Alok Sharma</p>
                <p className="text-[10px] text-primary font-mono">Faculty Demo &rarr;</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="p-2.5 rounded-md border border-warm-300 bg-warm-100 hover:bg-warm-200 text-left text-xs transition-colors"
              >
                <p className="font-semibold text-navy-900">Aarav Patel</p>
                <p className="text-[10px] text-primary font-mono">Student Demo &rarr;</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
