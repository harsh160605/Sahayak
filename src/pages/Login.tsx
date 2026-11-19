import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  QrCode, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Building, 
  Plus, 
  KeyRound, 
  GraduationCap,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole, YearOfStudy } from '../types';

export const Login: React.FC = () => {
  const { 
    loginAsDemoUser, 
    loginWithEmail, 
    registerUser, 
    createOrganizationAndRegisterAdmin, 
    isLiveFirebase 
  } = useAuth();
  
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'join_org' | 'create_org'>('login');
  const [role, setRole] = useState<'teacher' | 'student'>('student');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Engineering');
  const [studentId, setStudentId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>('Third Year');
  const [divisionName, setDivisionName] = useState('Division A');
  const [facultyId, setFacultyId] = useState('');
  const [semester, setSemester] = useState('6th Semester');
  
  // Organization Join / Create Fields
  const [orgCode, setOrgCode] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newOrgCity, setNewOrgCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fillSampleInstitute = () => {
    setNewOrgName('Trinity College of Engineering & Research');
    setNewOrgCode('TCOER25');
    setNewOrgCity('Pune');
    setFullName('Prof. Jareena Shaikh');
    setFacultyId('FAC-CS-01');
    setDepartment('Computer Science & Engineering');
    setEmail('jareena.shaikh@tcoer.edu');
    setPassword('Password@123');
    setErrorMsg(null);
  };

  const fillSampleJoinStudent = () => {
    setOrgCode('APEX101');
    setRole('student');
    setFullName('Rohan Verma');
    setStudentId('22CS088');
    setSemester('6th Semester');
    setDepartment('Computer Science & Engineering');
    setEmail('rohan.cs22@college.edu');
    setPassword('Password@123');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (mode === 'login') {
      if (isLiveFirebase) {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          navigate(role === 'teacher' ? '/teacher' : '/student');
        } else {
          setErrorMsg(res.error || 'Invalid credentials or user not found.');
        }
      } else {
        loginAsDemoUser(role);
        navigate(role === 'teacher' ? '/teacher' : '/student');
      }
    } else if (mode === 'join_org') {
      // Register Professor or Student joining an existing institute
      const profileData = {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        department: department.trim(),
        ...(role === 'student' 
          ? { 
              studentId: (rollNo || studentId).trim().toUpperCase(), 
              rollNo: (rollNo || studentId).trim(),
              semester,
              yearOfStudy,
              divisionName
            } 
          : { 
              facultyId: facultyId.trim().toUpperCase() 
            })
      };
      const res = await registerUser(email, password, profileData, orgCode);
      if (res.success) {
        navigate(role === 'teacher' ? '/teacher' : '/student');
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } else if (mode === 'create_org') {
      // Create brand new Organization / College
      const res = await createOrganizationAndRegisterAdmin(
        newOrgName,
        newOrgCode,
        newOrgCity,
        email,
        password,
        fullName,
        department,
        facultyId
      );
      if (res.success) {
        navigate('/admin');
      } else {
        setErrorMsg(res.error || 'Failed to create organization.');
      }
    }

    setLoading(false);
  };

  const handleQuickDemo = (demoRole: UserRole) => {
    loginAsDemoUser(demoRole);
    navigate(demoRole === 'admin' ? '/admin' : demoRole === 'teacher' ? '/teacher' : '/student');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 sm:px-6 lg:px-8">
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
            {isLiveFirebase ? 'CONNECTED TO CLOUD FIRESTORE' : 'OFFLINE DEMO MODE (APEX101)'}
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-7 px-6 shadow-card rounded-xl border border-warm-300 sm:px-9 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Tabs: Sign In / Join Institute / Create Institute */}
          <div className="grid grid-cols-3 gap-1 bg-warm-100 p-1 rounded-lg border border-warm-300 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'login' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('join_org'); setErrorMsg(null); }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'join_org' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Join Institute
            </button>
            <button
              type="button"
              onClick={() => { setMode('create_org'); setErrorMsg(null); }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'create_org' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              New Institute
            </button>
          </div>

          {/* Role Tabs for Sign In and Join */}
          {mode !== 'create_org' && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-warm-100 rounded-lg border border-warm-300">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  role === 'student' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  role === 'teacher' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Professor / Faculty
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* NEW ORGANIZATION CREATION FORM */}
            {mode === 'create_org' && (
              <div className="space-y-3">
                {/* Highlighted Launch Wizard Card */}
                <div className="p-3.5 bg-gradient-to-br from-warm-100 via-surface to-warm-200 border border-warm-300 rounded-lg shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-navy-900 text-warm-100 rounded-md shrink-0 mt-0.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                        Interactive 6-Step Onboarding Wizard
                        <span className="text-[10px] bg-primary/10 text-primary font-mono px-1.5 py-0.2 rounded border border-primary/20">Recommended</span>
                      </h4>
                      <p className="text-[11px] text-navy-600 leading-snug">
                        Setup complete institute hierarchy: Departments, FE/SE/TE/BE Divisions, Faculty Class Teachers, and bulk student roster.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/onboarding')}
                        className="mt-2 w-full py-1.5 px-3 bg-navy-900 hover:bg-navy-800 text-warm-50 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-subtle"
                      >
                        <span>Start College Setup Wizard</span>
                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-warm-300"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-mono text-navy-400 uppercase">Or quick single-step setup</span>
                  <div className="flex-grow border-t border-warm-300"></div>
                </div>

                <div className="space-y-3 p-3 rounded-lg bg-warm-50 border border-warm-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <Building className="h-4 w-4 text-primary" />
                      <span>Express Institute Setup</span>
                    </div>
                    <button
                      type="button"
                      onClick={fillSampleInstitute}
                      className="text-[10px] font-semibold text-primary hover:underline bg-white px-2 py-0.5 rounded border border-warm-300"
                    >
                      Auto-Fill Sample Data
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-0.5">Institute / College Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Institute of Technology"
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-warm-300 rounded text-xs focus:outline-none focus:border-primary bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-navy-700 mb-0.5">Unique Join Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. APEX24"
                        value={newOrgCode}
                        onChange={e => setNewOrgCode(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 border border-warm-300 rounded text-xs font-mono uppercase font-bold focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-navy-700 mb-0.5">City / Campus</label>
                      <input
                        type="text"
                        placeholder="e.g. Pune"
                        value={newOrgCity}
                        onChange={e => setNewOrgCity(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-warm-300 rounded text-xs focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* JOIN EXISTING ORGANIZATION VIA CODE */}
            {mode === 'join_org' && (
              <div>
                <label className="block text-xs font-semibold text-navy-800 mb-1 flex items-center justify-between">
                  <span>College Organization Code</span>
                  <button
                    type="button"
                    onClick={fillSampleJoinStudent}
                    className="text-[10px] text-primary hover:underline font-normal"
                  >
                    Auto-Fill Sample Student (APEX101)
                  </button>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter College Code (e.g. APEX101)"
                    value={orgCode}
                    onChange={e => setOrgCode(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-md text-xs font-mono uppercase font-bold text-navy-900 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* COMMON FIELDS FOR REGISTRATION / CREATION */}
            {(mode === 'join_org' || mode === 'create_org') && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    {mode === 'create_org' ? 'Faculty Admin Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={mode === 'create_org' ? 'e.g. Dr. Rajeshwari Kulkarni' : role === 'teacher' ? 'e.g. Dr. Alok Sharma' : 'e.g. Aarav Patel'}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">
                      {role === 'teacher' || mode === 'create_org' ? 'Faculty ID' : 'Roll Number / Student ID'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={role === 'teacher' || mode === 'create_org' ? 'FAC-CS-101' : '22CS042'}
                      value={role === 'teacher' || mode === 'create_org' ? facultyId : rollNo || studentId}
                      onChange={e => {
                        if (role === 'teacher' || mode === 'create_org') {
                          setFacultyId(e.target.value);
                        } else {
                          setRollNo(e.target.value);
                          setStudentId(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs font-mono uppercase focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>
                </div>

                {role === 'student' && mode === 'join_org' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 mb-1">Academic Year</label>
                      <select
                        value={yearOfStudy}
                        onChange={e => setYearOfStudy(e.target.value as YearOfStudy)}
                        className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900"
                      >
                        <option value="First Year">First Year (FE)</option>
                        <option value="Second Year">Second Year (SE)</option>
                        <option value="Third Year">Third Year (TE)</option>
                        <option value="Fourth Year">Fourth Year (BE)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 mb-1">Division</label>
                      <select
                        value={divisionName}
                        onChange={e => setDivisionName(e.target.value)}
                        className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs bg-surface text-navy-900"
                      >
                        <option value="Division A">Division A</option>
                        <option value="Division B">Division B</option>
                        <option value="Division C">Division C</option>
                        <option value="Division D">Division D</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Official College Email</label>
              <input
                type="email"
                required
                placeholder="your.email@college.edu"
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
                ? 'Processing...' 
                : mode === 'login' 
                  ? `Sign In to Portal` 
                  : mode === 'join_org'
                    ? `Join College as ${role === 'teacher' ? 'Professor' : 'Student'}`
                    : `Create Institute & Admin Account`
              }
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="pt-3 border-t border-warm-200 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-navy-500 block text-center">
              Quick 1-Click Evaluation Accounts (Apex Tech - APEX101)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-left text-xs transition-colors"
              >
                <p className="font-semibold text-navy-900 truncate">Dr. R. Kulkarni</p>
                <p className="text-[10px] text-amber-800 font-mono font-bold">Admin Demo &rarr;</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('teacher')}
                className="p-2 rounded-md border border-warm-300 bg-warm-100 hover:bg-warm-200 text-left text-xs transition-colors"
              >
                <p className="font-semibold text-navy-900 truncate">Dr. A. Sharma</p>
                <p className="text-[10px] text-primary font-mono font-bold">Faculty Demo &rarr;</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="p-2 rounded-md border border-warm-300 bg-warm-100 hover:bg-warm-200 text-left text-xs transition-colors"
              >
                <p className="font-semibold text-navy-900 truncate">Aarav Patel</p>
                <p className="text-[10px] text-teal-800 font-mono font-bold">Student Demo &rarr;</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
