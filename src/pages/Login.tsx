import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Lock,
  Mail,
  User,
  Building,
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { loginAsDemoUser, loginWithEmail, registerUser, isLiveFirebase } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          ...(role === 'student' 
            ? { studentId: studentId.trim().toUpperCase(), semester } 
            : { facultyId: facultyId.trim().toUpperCase() })
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
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        {/* Brand Crest */}
        <div className="h-12 w-12 rounded-xl bg-navy-900 mx-auto flex items-center justify-center text-primary shadow-subtle">
          <QrCode className="h-7 w-7 text-primary" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">
            SmartAttend
          </h1>
          <p className="text-xs text-navy-600 mt-1 font-mono">
            ACADEMIC ATTENDANCE & VERIFICATION
          </p>
        </div>

        {/* Database Status Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border bg-warm-100 border-warm-300 text-navy-700">
          <span className={`w-2 h-2 rounded-full ${isLiveFirebase ? 'bg-emerald-500' : 'bg-primary'}`} />
          <span>{isLiveFirebase ? 'CLOUD FIRESTORE CONNECTED' : 'LOCAL EVALUATION MODE'}</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-7 px-6 sm:px-8 rounded-xl border border-warm-300 shadow-card space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switcher: Sign In vs Register */}
          <div className="flex border-b border-warm-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 text-center transition-colors ${
                mode === 'login'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-navy-500 hover:text-navy-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 pb-2.5 text-xs font-semibold border-b-2 text-center transition-colors ${
                mode === 'register'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-navy-500 hover:text-navy-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Segment Selector */}
          <div>
            <label className="text-[11px] font-mono uppercase font-semibold text-navy-500 block mb-1.5">
              Portal Access Role
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-warm-100 rounded-lg border border-warm-300">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'teacher'
                    ? 'bg-surface text-navy-900 shadow-subtle border border-warm-300/60'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Faculty / Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'student'
                    ? 'bg-surface text-navy-900 shadow-subtle border border-warm-300/60'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span>Student</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Diya Sharma"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
                    />
                  </div>
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
                      className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs font-mono uppercase bg-surface text-navy-900 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">
                      Academic Semester
                    </label>
                    <select
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
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
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">
                {role === 'teacher' ? 'Institutional Faculty Email' : 'Institutional Student Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
                <input
                  type="email"
                  required
                  placeholder={role === 'teacher' ? 'prof.name@college.edu' : 'student.roll@college.edu'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-navy-400 hover:text-navy-700 p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-semibold transition-all shadow-subtle disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating with system...</span>
              ) : (
                <>
                  <span>
                    {mode === 'login' 
                      ? `Sign In as ${role === 'teacher' ? 'Faculty' : 'Student'}` 
                      : `Register ${role === 'teacher' ? 'Faculty' : 'Student'} Account`
                    }
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Evaluation Section */}
          <div className="pt-4 border-t border-warm-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-navy-500">
                1-Click Quick Evaluation Personas
              </span>
              <span className="text-[10px] text-primary font-mono font-medium">Instant</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('teacher')}
                className="p-3 rounded-lg border border-warm-300 bg-warm-100 hover:bg-warm-200/90 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-primary">Faculty</span>
                  <ArrowRight className="h-3 w-3 text-navy-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="font-semibold text-xs text-navy-900 mt-1">Dr. Alok Sharma</p>
                <p className="text-[10px] text-navy-500 font-mono">FAC-CS-104 &bull; 3 Courses</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="p-3 rounded-lg border border-warm-300 bg-warm-100 hover:bg-warm-200/90 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-teal-700">Student</span>
                  <ArrowRight className="h-3 w-3 text-navy-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="font-semibold text-xs text-navy-900 mt-1">Aarav Patel</p>
                <p className="text-[10px] text-navy-500 font-mono">22CS042 &bull; 6th Semester</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
