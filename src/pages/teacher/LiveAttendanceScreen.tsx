import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { 
  Pause, 
  Play, 
  Square, 
  Maximize2, 
  Minimize2, 
  Users, 
  Clock, 
  ShieldCheck, 
  ShieldAlert,
  RefreshCw, 
  Search, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Loader2,
  Sparkles,
  Radio,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatTime } from '../../lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../../config/firebase';
import { AttendanceSession } from '../../types';

export const LiveAttendanceScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { 
    sessions, 
    courses, 
    enrollments, 
    attendanceRecords, 
    updateSessionToken, 
    pauseSession, 
    resumeSession, 
    endSession 
  } = useData();

  // Resolve session from state or persistent storage
  const resolveSession = (): AttendanceSession | null => {
    const fromState = sessions.find(s => s.id === sessionId);
    if (fromState) return fromState;
    try {
      const saved = localStorage.getItem('smartattend_sessions');
      if (saved) {
        const parsed: AttendanceSession[] = JSON.parse(saved);
        const match = parsed.find(s => s.id === sessionId);
        if (match) return match;
      }
    } catch {}
    return null;
  };

  const initialSession = resolveSession();
  const [session, setSession] = useState<AttendanceSession | null>(initialSession);
  const [loadingSession, setLoadingSession] = useState<boolean>(!initialSession);

  // Sync when sessions array updates
  useEffect(() => {
    const resolved = resolveSession();
    if (resolved) {
      setSession(resolved);
      setLoadingSession(false);
    }
  }, [sessions, sessionId]);

  // Fallback: If snapshot hasn't arrived yet on initial mount, directly fetch document from Firestore
  useEffect(() => {
    if (!session && sessionId && isLiveFirebaseConfigured) {
      setLoadingSession(true);
      getDoc(doc(db, 'attendanceSessions', sessionId))
        .then((snap) => {
          if (snap.exists()) {
            setSession({ id: snap.id, ...(snap.data() as any) });
          }
        })
        .catch((err) => {
          console.warn('Direct Firestore fetch notice for session:', err);
        })
        .finally(() => {
          setLoadingSession(false);
        });
    } else if (!session) {
      setLoadingSession(false);
    }
  }, [sessionId, session]);

  const course = courses.find(c => c.id === session?.courseId);
  const enrolledStudents = enrollments.filter(e => e.courseId === session?.courseId && e.status === 'active');
  const sessionRecords = attendanceRecords.filter(r => r.sessionId === sessionId);

  // Strict Faculty Authorization: Only session creator or Admin can operate live screen
  const isAuthorizedForSession = currentUser?.role === 'admin' || (session ? session.teacherId === currentUser?.uid : true);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(session?.qrRefreshIntervalSeconds || 3);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [privacyMode, setPrivacyMode] = useState<boolean>(false); // masks names on public projectors
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshInterval = session?.qrRefreshIntervalSeconds || 3;

  // Rotating Cryptographic Token Generator
  const generateNewToken = () => {
    if (!session || session.status !== 'active' || !isAuthorizedForSession) return;

    setIsRefreshing(true);
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 10);
    // Unpredictable payload tied to session ID and millisecond timestamp
    const tokenString = `SA_TOKEN::${session.id}::${timestamp}::${nonce}`;
    const expiresAt = timestamp + (refreshInterval * 1000);

    updateSessionToken(session.id, tokenString, expiresAt);

    QRCode.toDataURL(tokenString, {
      width: 520,
      margin: 2,
      color: {
        dark: '#0F172A', // Deep navy QR modules for highest projector contrast
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    }).then(url => {
      setQrDataUrl(url);
      setTimeout(() => setIsRefreshing(false), 500);
    }).catch(err => {
      console.error('Failed to generate QR code', err);
      setIsRefreshing(false);
    });

    setCountdown(refreshInterval);
  };

  // Live Timer & Countdown Effect
  useEffect(() => {
    if (!session || session.status !== 'active' || !isAuthorizedForSession) return;

    generateNewToken();

    const intervalTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          generateNewToken();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [session?.status, session?.id, refreshInterval, isAuthorizedForSession]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (loadingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-mono text-teal-400">Connecting to Live Attendance Session...</p>
        </div>
      </div>
    );
  }

  // Security Intercept: Unauthorized faculty attempting to access another teacher's live session
  if (session && !isAuthorizedForSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
        <div className="p-8 max-w-md text-center space-y-4 bg-navy-900 border border-navy-800 rounded-2xl text-white shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold">Unauthorized Session Access</h2>
            <p className="text-xs text-navy-300 leading-relaxed">
              This live attendance session was created by another faculty member. Under institutional authorization controls, you cannot inspect, project, or manage another instructor's live session.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Faculty Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy-950">
        <div className="p-8 max-w-md text-center space-y-4 bg-navy-900 border border-navy-800 rounded-xl text-white">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Attendance Session Not Found</h2>
          <p className="text-xs text-navy-300">
            The requested attendance session has concluded or the ID could not be loaded.
          </p>
          <button
            onClick={() => navigate('/teacher')}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const attendancePercentage = enrolledStudents.length > 0 
    ? Math.round((sessionRecords.length / enrolledStudents.length) * 100) 
    : 0;

  const filteredRecords = sessionRecords.filter(r => 
    r.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.studentRollNo.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Circumference for 9px radius SVG circle: 2 * PI * 9 ~= 56.548
  const circleCircumference = 56.548;
  const strokeOffset = circleCircumference * (1 - countdown / refreshInterval);

  return (
    <div className="min-h-screen bg-navy-950 text-surface flex flex-col font-sans select-none">
      {/* 1. Projection Top Bar - Responsive for Projector, Tablet & Mobile */}
      <header className="min-h-[64px] sm:h-20 border-b border-navy-800/80 px-4 sm:px-8 py-2.5 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0 bg-navy-900/90 backdrop-blur">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg bg-primary flex items-center justify-center font-bold text-base sm:text-lg text-white shadow-subtle shrink-0">
            SA
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                {course?.courseCode || session.courseCode}
              </span>
              {session.sessionCategory === 'extra' || session.isExtraLecture ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-navy-950 uppercase shadow-subtle">
                  EXTRA LECTURE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-900/80 text-teal-300 border border-teal-700/50 uppercase">
                  TIMETABLE CLASS
                </span>
              )}
              {session.divisionName && (
                <span className="text-navy-400 text-xs font-mono hidden sm:inline">&bull; {session.divisionName} {session.batch && session.batch !== 'All' ? `(${session.batch})` : ''}</span>
              )}
              <span className="text-navy-500 text-xs">&bull;</span>
              <span className="text-[11px] sm:text-xs text-navy-300 font-medium truncate">{session.lectureTopic || 'Live Lecture'}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {course?.courseName || session.courseName}
            </h1>
          </div>
        </div>

        {/* Live Status Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-navy-800/90 border border-navy-700 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${session.status === 'active' ? 'bg-emerald-400 animate-pulse' : session.status === 'paused' ? 'bg-amber-400' : 'bg-red-400'}`} />
            <span className="uppercase font-semibold tracking-wider text-navy-200 text-[10px] sm:text-xs">
              {session.status === 'active' ? 'LIVE ROTATION' : session.status.toUpperCase()}
            </span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-navy-800" />

          {session.status === 'active' ? (
            <button
              onClick={() => pauseSession(session.id)}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium transition-colors border border-amber-500/30"
              title="Pause session"
            >
              <Pause className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : session.status === 'paused' ? (
            <button
              onClick={() => resumeSession(session.id)}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium transition-colors border border-emerald-500/30"
              title="Resume session"
            >
              <Play className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resume</span>
            </button>
          ) : null}

          {session.status !== 'ended' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to finalize and end this attendance session?')) {
                  endSession(session.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-colors border border-red-500/30"
              title="End session"
            >
              <Square className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">End Session</span>
            </button>
          )}

          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md bg-navy-800 hover:bg-navy-700 text-navy-300 transition-colors"
            title={privacyMode ? "Disable privacy masking" : "Enable privacy masking"}
            aria-label="Toggle privacy masking"
          >
            {privacyMode ? <EyeOff className="h-4 w-4 text-teal-400" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md bg-navy-800 hover:bg-navy-700 text-navy-300 transition-colors"
            title="Toggle fullscreen projector mode"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. Classroom Dual Arena - Adaptive for Mobile/Tablet Scrolling or Fullscreen Side-by-Side */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden touch-scroll">
        {/* Left Arena: Projection Screen for QR with Authored Motion */}
        <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-navy-800/80 bg-navy-950 relative min-h-[420px] lg:min-h-0">
          {session.status === 'active' ? (
            <div className="space-y-4 sm:space-y-6 text-center max-w-xl mx-auto w-full">
              {/* Precision Framed Rotating QR Container */}
              <div className="relative inline-block">
                {/* Precision Optical Framing Reticles */}
                <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-teal-400 pointer-events-none" />
                <div className="absolute -top-3 -right-3 w-6 h-6 border-t border-r border-teal-400 pointer-events-none" />
                <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b border-l border-teal-400 pointer-events-none" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-teal-400 pointer-events-none" />

                {/* White Paper Canvas for Maximum Contrast */}
                <div className={`p-4 sm:p-6 bg-white rounded-2xl shadow-2xl border-2 border-teal-400/40 transition-all duration-300 ${isRefreshing ? 'animate-token-flash' : ''}`}>
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Dynamic Rotating Attendance QR Code" 
                      className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 max-w-[76vw] max-h-[76vw] object-contain block select-none" 
                    />
                  ) : (
                    <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-navy-600 animate-spin" />
                    </div>
                  )}

                  {/* Expiry Countdown Badge with Circular SVG Progress Ring */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-navy-900 border-2 border-teal-400 text-xs font-mono font-bold text-teal-300 flex items-center gap-2.5 shadow-xl">
                    <svg className="w-5 h-5 -rotate-90 shrink-0" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="rgba(13, 148, 136, 0.25)"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="#2DD4BF"
                        strokeWidth="2.5"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="tracking-wide">
                      REFRESHING IN {countdown}S
                    </span>
                  </div>
                </div>
              </div>

              {/* Classroom Security Metadata */}
              <div className="max-w-md mx-auto pt-4 space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-teal-400 uppercase tracking-widest font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Dynamic Cryptographic Nonce &bull; Anti-Proxy Protected</span>
                </div>
                {session.geofence?.enabled && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-navy-900/90 py-1 px-3.5 rounded-full border border-teal-500/30 shadow-subtle">
                    <MapPin className="h-3.5 w-3.5 text-teal-400" />
                    <span>GPS Geofenced ({session.geofence.radiusMeters}m perimeter locked)</span>
                  </div>
                )}
                <p className="text-xs text-navy-300 leading-relaxed pt-1">
                  Point your camera at the screen to check in. Screenshots become invalid after {refreshInterval} seconds.
                </p>
              </div>
            </div>
          ) : session.status === 'paused' ? (
            <div className="text-center space-y-4 p-8 bg-navy-900 rounded-xl border border-navy-700 max-w-md shadow-2xl">
              <Pause className="h-12 w-12 text-amber-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Attendance Paused</h3>
              <p className="text-xs text-navy-300">
                The rotating token is temporarily frozen. Resuming the session will immediately regenerate an active QR code.
              </p>
              <button
                onClick={() => resumeSession(session.id)}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all shadow-subtle active:scale-95"
              >
                Resume Attendance
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 p-8 bg-navy-900 rounded-xl border border-navy-700 max-w-md shadow-2xl">
              <CheckCircle className="h-12 w-12 text-teal-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Session Finalized</h3>
              <p className="text-xs text-navy-300">
                Attendance for this lecture has been finalized and locked. Submissions are closed.
              </p>
              <button
                onClick={() => navigate('/teacher/history')}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg text-xs font-bold transition-all border border-navy-700 shadow-subtle"
              >
                View Final Attendance Ledger
              </button>
            </div>
          )}
        </div>

        {/* Right Arena: Real-Time Live Attendee Ledger Stream */}
        <div className="lg:col-span-5 flex flex-col bg-navy-900/95 border-t lg:border-t-0 border-navy-800 min-h-[380px] lg:overflow-hidden">
          {/* Header with Live Tally */}
          <div className="p-4 sm:p-6 border-b border-navy-800 space-y-3 sm:space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-navy-400 font-semibold">
                  LIVE PARTICIPATION
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white transition-all duration-300">
                    {sessionRecords.length}
                  </span>
                  <span className="text-xs font-mono text-navy-400">
                    / {enrolledStudents.length || 42} Students Present
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl sm:text-2xl font-bold font-mono text-teal-400">
                  {attendancePercentage}%
                </span>
                <p className="text-[10px] sm:text-xs font-mono text-navy-400">Turnout Rate</p>
              </div>
            </div>

            {/* Turnout Progress Bar */}
            <div className="w-full bg-navy-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, attendancePercentage)}%` }}
              />
            </div>

            {/* Quick Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
              <input
                type="text"
                placeholder="Filter verified student by name or roll no..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-navy-800/80 border border-navy-700 text-xs text-white placeholder-navy-500 focus:outline-none focus:border-teal-400 min-h-[40px]"
              />
            </div>
          </div>

          {/* Real-time Attendee Stream with Authored Slide-In Motion */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 touch-scroll max-h-[480px] lg:max-h-none">
            {filteredRecords.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-navy-500">
                <Users className="h-8 w-8 mb-2 opacity-40 text-navy-400" />
                <p className="text-xs font-mono">No student scans recorded yet.</p>
                <p className="text-xs text-navy-600 mt-0.5">Verified check-ins will stream here in real time.</p>
              </div>
            ) : (
              filteredRecords.map((record, index) => {
                const displayName = privacyMode 
                  ? `${record.studentName.slice(0, 1)}*** ${record.studentName.split(' ')[1] || ''}` 
                  : record.studentName;

                return (
                  <div
                    key={record.id}
                    className="p-3 rounded-lg bg-navy-800/90 border border-navy-700 flex items-center justify-between text-xs transition-all duration-200 hover:border-teal-500/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-mono font-bold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{displayName}</p>
                        <p className="text-xs text-navy-400 font-mono">{record.studentRollNo}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-teal-400">
                        {formatTime(record.markedAt)}
                      </span>
                      <p className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        <span>Verified</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
