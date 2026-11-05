import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Check, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, Moon, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Login: React.FC = () => {
  const { loginAsDemoUser, loginWithEmail, registerUser, isLiveFirebase } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    if (isLiveFirebase) {
      if (mode === 'login') {
        const result = await loginWithEmail(email, password);
        if (result.success) navigate(role === 'teacher' ? '/teacher' : '/student');
        else setErrorMsg(result.error || 'We couldn’t sign you in. Check your details and try again.');
      } else {
        const profileData = { fullName: fullName.trim(), email: email.trim(), role, department: department.trim(), ...(role === 'student' ? { studentId: studentId.trim().toUpperCase(), semester } : { facultyId: facultyId.trim().toUpperCase() }) };
        const result = await registerUser(email, password, profileData);
        if (result.success) navigate(role === 'teacher' ? '/teacher' : '/student');
        else setErrorMsg(result.error || 'We couldn’t create your account. Please try again.');
      }
    } else {
      loginAsDemoUser(role);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    }
    setLoading(false);
  };

  const enterDemo = (demoRole: 'teacher' | 'student') => {
    loginAsDemoUser(demoRole);
    navigate(demoRole === 'teacher' ? '/teacher' : '/student');
  };

  return <div className="login-page">
    <header className="login-header"><div className="login-brand"><span className="login-brand-icon"><GraduationCap size={20} /></span><span>SmartAttend</span></div><div className="login-header-actions"><span className="connection-status"><i />{isLiveFirebase ? 'Connected to campus' : 'Preview environment'}</span><button className="icon-button theme-toggle" onClick={toggleTheme} aria-label="Change appearance">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button></div></header>

    <main className="login-main">
      <section className="login-story">
        <div className="story-topline"><span className="story-star">✳</span><span>A calmer way to keep track</span></div>
        <h1>Show up.<br /><em>Stay in sync.</em></h1>
        <p className="story-description">Your classes, attendance and course updates, all in one thoughtful little space.</p>

        <div className="story-preview" aria-label="Example of a class schedule">
          <div className="preview-heading"><div><span className="preview-kicker">A TUESDAY SNAPSHOT</span><strong>Your day, at a glance</strong></div><CalendarDays size={18} /></div>
          <div className="preview-class"><span className="preview-time">09:00</span><span className="preview-line"><i /></span><div><strong>Human Computer Interaction</strong><small>CS 304 · Studio 2</small></div><span className="preview-check"><Check size={13} /></span></div>
          <div className="preview-class"><span className="preview-time">11:30</span><span className="preview-line"><i /></span><div><strong>Data Structures</strong><small>CS 212 · Lecture hall B</small></div><span className="preview-count"><BookOpen size={13} /></span></div>
          <div className="preview-footer"><span><i />Everything in one place</span><span>Made for campus life</span></div>
        </div>
        <div className="story-points"><span><Check size={15} />Easy check-ins</span><span><Check size={15} />Clear attendance records</span><span><Check size={15} />Made for students and faculty</span></div>
      </section>

      <section className="login-form-column">
        <div className="login-card">
          <div className="form-intro"><span className="form-eyebrow">WELCOME TO SMARTATTEND</span><h2>{mode === 'login' ? 'Let’s get you in.' : 'Create your account.'}</h2><p>{mode === 'login' ? 'Sign in with your campus account to continue.' : 'A few details and you’ll be ready to go.'}</p></div>

          <div className="role-choice" aria-label="Choose your account type">
            <button type="button" onClick={() => setRole('teacher')} className={role === 'teacher' ? 'role-choice-option selected' : 'role-choice-option'}><UserRound size={16} /><span>Faculty</span></button>
            <button type="button" onClick={() => setRole('student')} className={role === 'student' ? 'role-choice-option selected' : 'role-choice-option'}><GraduationCap size={17} /><span>Student</span></button>
          </div>

          <div className="form-mode-tabs"><button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setErrorMsg(null); }}>Sign in</button><button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setErrorMsg(null); }}>Create account</button></div>

          {errorMsg && <div className="login-error" role="alert">{errorMsg}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' && <>
              <label className="field-label">Full name<div className="field-wrap"><UserRound size={16} /><input required type="text" autoComplete="name" placeholder="e.g. Diya Sharma" value={fullName} onChange={e => setFullName(e.target.value)} /></div></label>
              <div className="field-grid"><label className="field-label">{role === 'teacher' ? 'Faculty ID' : 'Student ID'}<div className="field-wrap"><input required type="text" placeholder={role === 'teacher' ? 'FAC-CS-104' : '22CS042'} value={role === 'teacher' ? facultyId : studentId} onChange={e => role === 'teacher' ? setFacultyId(e.target.value) : setStudentId(e.target.value)} /></div></label><label className="field-label">Department<div className="field-wrap"><input required type="text" value={department} onChange={e => setDepartment(e.target.value)} /></div></label></div>
              {role === 'student' && <label className="field-label">Semester<div className="field-wrap"><select value={semester} onChange={e => setSemester(e.target.value)}>{['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'].map(value => <option key={value}>{value}</option>)}</select></div></label>}
            </>}
            <label className="field-label">Campus email<div className="field-wrap"><Mail size={16} /><input required type="email" autoComplete="email" placeholder={role === 'teacher' ? 'you@campus.edu' : 'name@campus.edu'} value={email} onChange={e => setEmail(e.target.value)} /></div></label>
            <label className="field-label">Password<div className="field-wrap"><LockKeyhole size={16} /><input required type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            <button type="submit" className="button-primary login-submit" disabled={loading}>{loading ? 'Just a moment…' : mode === 'login' ? 'Sign in' : 'Create account'}{!loading && <ArrowRight size={17} />}</button>
          </form>

          <div className="demo-divider"><span />or explore a demo<span /></div>
          <div className="demo-actions"><button type="button" onClick={() => enterDemo('teacher')}><span className="demo-avatar faculty">F</span><span><strong>Faculty demo</strong><small>Explore the teaching workspace</small></span><ArrowRight size={15} /></button><button type="button" onClick={() => enterDemo('student')}><span className="demo-avatar student">S</span><span><strong>Student demo</strong><small>Explore the student workspace</small></span><ArrowRight size={15} /></button></div>
        </div>
        <p className="login-help">Having trouble? Contact your campus administrator.</p>
      </section>
    </main>
    <footer className="login-footer"><span>© SmartAttend · Campus attendance, made simple</span><span>Secure campus access <i /></span></footer>
  </div>;
};
