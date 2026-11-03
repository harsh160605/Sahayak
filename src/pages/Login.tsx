import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { loginAsDemoUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsDemoUser(activeTab);
    navigate(activeTab === 'teacher' ? '/teacher' : '/student');
  };

  const handleQuickDemo = (role: 'teacher' | 'student') => {
    loginAsDemoUser(role);
    navigate(role === 'teacher' ? '/teacher' : '/student');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="h-12 w-12 rounded-lg bg-navy-900 mx-auto flex items-center justify-center text-primary shadow-subtle">
          <QrCode className="h-7 w-7 text-primary" strokeWidth={2.2} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-navy-900">SmartAttend</h2>
        <p className="text-xs text-navy-600 font-mono">
          Cryptographic Anti-Proxy Academic Attendance System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-card rounded-xl border border-warm-300 sm:px-10 space-y-6">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-warm-100 rounded-lg border border-warm-300">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'teacher'
                  ? 'bg-surface text-navy-900 shadow-subtle'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Faculty Login
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'student'
                  ? 'bg-surface text-navy-900 shadow-subtle'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Student Portal
            </button>
          </div>

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">
                {activeTab === 'teacher' ? 'Faculty College Email' : 'Student Email'}
              </label>
              <input
                type="email"
                required
                placeholder={activeTab === 'teacher' ? 'alok.sharma@college.edu' : 'aarav.cs22@college.edu'}
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
              className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-semibold transition-all shadow-subtle"
            >
              Sign In as {activeTab === 'teacher' ? 'Faculty Member' : 'Enrolled Student'}
            </button>
          </form>

          {/* Quick Instant Demo Login Shortcuts */}
          <div className="pt-4 border-t border-warm-200 space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-navy-500 block text-center">
              Quick Prototype Evaluation Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('teacher')}
                className="p-2.5 rounded-md border border-warm-300 bg-warm-100 hover:bg-warm-200 text-left text-xs transition-colors"
              >
                <p className="font-semibold text-navy-900">Dr. Alok Sharma</p>
                <p className="text-[10px] text-primary font-mono">Teacher Role &rarr;</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="p-2.5 rounded-md border border-warm-300 bg-warm-100 hover:bg-warm-200 text-left text-xs transition-colors"
              >
                <p className="font-semibold text-navy-900">Aarav Patel</p>
                <p className="text-[10px] text-primary font-mono">Student Role &rarr;</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

