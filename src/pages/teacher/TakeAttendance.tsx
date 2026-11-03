import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { QrCode, Play, Clock, Sparkles } from 'lucide-react';

export const TakeAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { courses, startAttendanceSession } = useData();

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);

  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId || (myCourses[0]?.id || ''));
  const [lectureTopic, setLectureTopic] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<3 | 5>(3);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedCourseId) return;

    const newSession = startAttendanceSession(
      selectedCourseId,
      currentUser.uid,
      lectureTopic || 'Lecture Session',
      refreshInterval
    );

    // Redirect to Dedicated Classroom Live Projection Screen
    navigate(`/teacher/live-session?sessionId=${newSession.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="border-b border-warm-300 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          SESSION INITIALIZER
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
          Launch Live Attendance Session
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Initialize a rotating cryptographic QR session to project in the classroom or hall.
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle">
        <form onSubmit={handleStart} className="space-y-5">
          {/* Course Selector */}
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1.5">
              Select Course & Cohort
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
              required
            >
              {myCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.courseName} ({c.enrolledCount || 0} enrolled)
                </option>
              ))}
            </select>
          </div>

          {/* Lecture Topic */}
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1.5">
              Lecture Topic or Unit (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Consensus & Paxos Overview"
              value={lectureTopic}
              onChange={e => setLectureTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs text-navy-900 focus:outline-none focus:border-primary"
            />
          </div>

          {/* QR Refresh Configuration */}
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1.5">
              Anti-Proxy QR Refresh Interval
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  refreshInterval === 3 
                    ? 'border-primary bg-primary-light/50 text-navy-900 font-semibold' 
                    : 'border-warm-300 bg-surface text-navy-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 3}
                    onChange={() => setRefreshInterval(3)}
                    className="accent-primary"
                  />
                  <span className="text-xs">3 Seconds (Standard)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warm-200">High Security</span>
              </label>

              <label 
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  refreshInterval === 5 
                    ? 'border-primary bg-primary-light/50 text-navy-900 font-semibold' 
                    : 'border-warm-300 bg-surface text-navy-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 5}
                    onChange={() => setRefreshInterval(5)}
                    className="accent-primary"
                  />
                  <span className="text-xs">5 Seconds</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warm-200">Large Hall</span>
              </label>
            </div>
          </div>

          {/* Projection Notice */}
          <div className="p-4 rounded-lg bg-warm-100 border border-warm-200 text-xs text-navy-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-navy-900">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Projector-Ready Mode</span>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">
              Starting this session opens the high-contrast presentation view with live attendee feed, fullscreen toggle, and privacy masking for student names.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedCourseId}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Session & Open Live Screen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

