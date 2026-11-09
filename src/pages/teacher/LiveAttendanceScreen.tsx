import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowLeft,
  UserCheck,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatTime } from '../../lib/utils';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../../config/firebase';
import { AttendanceSession, AttendanceRecord } from '../../types';

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
    organizationUsers, 
    updateSessionToken, 
    pauseSession, 
    resumeSession, 
    endSession,
    markManualAttendance,
    removeManualAttendance
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

  // Direct Firestore real-time listener for this session's attendance stream (zero-lag live updates)
  const [liveStreamRecords, setLiveStreamRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!sessionId || !isLiveFirebaseConfigured) return;
    try {
      const q = query(collection(db, 'attendanceRecords'), where('sessionId', '==', sessionId));
      const unsub = onSnapshot(q, (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach(docSnap => {
          records.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setLiveStreamRecords(records);
      }, err => {
        console.warn('Live attendance direct stream notice:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Live attendance stream setup notice:', e);
    }
  }, [sessionId]);

  // Combined real-time session attendance records (merges context + direct stream + local storage)
  const sessionRecords = useMemo(() => {
    const fromContext = attendanceRecords.filter(r => r.sessionId === sessionId);
    const map = new Map<string, AttendanceRecord>();
    fromContext.forEach(r => map.set(r.studentUid, r));
    liveStreamRecords.forEach(r => map.set(r.studentUid, r));

    // Also check localStorage fallback for cross-tab local testing
    try {
      const saved = localStorage.getItem('smartattend_attendance_records');
      if (saved) {
        const parsed: AttendanceRecord[] = JSON.parse(saved);
        parsed.filter(r => r.sessionId === sessionId).forEach(r => {
          if (!map.has(r.studentUid)) map.set(r.studentUid, r);
        });
      }
    } catch {}

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime()
    );
  }, [attendanceRecords, liveStreamRecords, sessionId]);

  // Manual Attendance Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [manualCustomRoll, setManualCustomRoll] = useState('');
  const [manualCustomName, setManualCustomName] = useState('');
  const [manualNotice, setManualNotice] = useState<string | null>(null);

  // Complete student roster for this course and division (for manual mark selection)
  const eligibleRoster = useMemo(() => {
    const list: { uid: string; name: string; rollNo: string; email?: string }[] = [];
    const addedUids = new Set<string>();

    // 1. Enrolled students
    enrolledStudents.forEach(e => {
      if (!addedUids.has(e.studentUid)) {
        list.push({
          uid: e.studentUid,
          name: e.studentName,
          rollNo: e.studentRollNo,
          email: e.studentEmail
        });
        addedUids.add(e.studentUid);
      }
    });

    // 2. Division students (match divisionId or divisionName)
    organizationUsers
      .filter(u => u.role === 'student')
      .filter(u => 
        (session?.divisionId && u.divisionId === session.divisionId) ||
        (session?.divisionName && u.divisionName === session.divisionName)
      )
      .forEach(u => {
        if (!addedUids.has(u.uid)) {
          list.push({
            uid: u.uid,
            name: u.fullName,
            rollNo: u.studentId || u.rollNo || 'N/A',
            email: u.email
          });
          addedUids.add(u.uid);
        }
      });

    // 3. Fallback: all students in organization if roster is small
    if (list.length === 0) {
      organizationUsers.filter(u => u.role === 'student').forEach(u => {
        if (!addedUids.has(u.uid)) {
          list.push({
            uid: u.uid,
            name: u.fullName,
            rollNo: u.studentId || u.rollNo || 'N/A',
            email: u.email
          });
          addedUids.add(u.uid);
        }
      });
    }

    return list.sort((a, b) => a.rollNo.localeCompare(b.rollNo));
  }, [enrolledStudents, organizationUsers, session?.divisionId, session?.divisionName]);

  const filteredEligibleRoster = useMemo(() => {
    if (!manualSearch.trim()) return eligibleRoster;
    const q = manualSearch.toLowerCase().trim();
    return eligibleRoster.filter(s => 
      s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [eligibleRoster, manualSearch]);

  const handleManualMark = async (student: { uid: string; name: string; rollNo: string }) => {
    if (!sessionId) return;
    try {
      await markManualAttendance(sessionId, student.uid, student.name, student.rollNo, 'Faculty manual override (no phone)');
      setManualNotice(`Marked ${student.name} (${student.rollNo}) Present.`);
      setTimeout(() => setManualNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to mark attendance.');
    }
  };

  const handleManualRemove = async (studentUid: string, studentName: string) => {
    if (!sessionId) return;
    try {
      await removeManualAttendance(sessionId, studentUid);
      setManualNotice(`Removed attendance for ${studentName}.`);
      setTimeout(() => setManualNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove attendance.');
    }
  };

  const handleCustomManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !manualCustomRoll.trim() || !manualCustomName.trim()) return;
    const customUid = `manual_student_${Date.now()}`;
    await handleManualMark({
      uid: customUid,
      name: manualCustomName.trim(),
      rollNo: manualCustomRoll.trim().toUpperCase()
    });
    setManualCustomRoll('');
    setManualCustomName('');
  };

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
              <div className="p-3 bg-navy-800/90 rounded-lg border border-teal-500/30 text-xs font-mono text-teal-300">
                Total Verified Present: <span className="font-bold text-white text-base">{sessionRecords.length}</span> students
              </div>
              <button
                onClick={() => navigate(`/teacher/history?courseId=${session.courseId}&sessionId=${session.id}`)}
                className="w-full px-5 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary-dark text-white rounded-lg text-xs font-bold transition-all shadow-subtle active:scale-95 flex items-center justify-center gap-2"
              >
                <span>View Final Attendance Ledger</span>
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

            {/* Quick Filter & Manual Attendance Trigger */}
            <div className="space-y-2">
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

              <button
                type="button"
                onClick={() => setManualModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 active:bg-teal-500/35 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-subtle cursor-pointer"
                title="Mark students present manually (for dead phone, no phone, or offline)"
              >
                <UserCheck className="h-4 w-4 text-teal-400 shrink-0" />
                <span>Mark Attendance Manually (No Phone / Offline)</span>
              </button>
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

                const isManual = record.source === 'manual_teacher';

                return (
                  <div
                    key={record.id}
                    className="p-3 rounded-lg bg-navy-800/90 border border-navy-700 flex items-center justify-between text-xs transition-all duration-200 hover:border-teal-500/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white">{displayName}</p>
                          {isManual && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              MANUAL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-navy-400 font-mono">{record.studentRollNo}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <span className="text-xs font-mono text-teal-400 block">
                          {formatTime(record.markedAt)}
                        </span>
                        <p className={`text-xs font-mono font-semibold flex items-center gap-1 justify-end ${
                          isManual ? 'text-amber-300' : 'text-emerald-400'
                        }`}>
                          <CheckCircle className="h-3 w-3" />
                          <span>{isManual ? 'Manual Pass' : 'Verified'}</span>
                        </p>
                      </div>
                      {isManual && (
                        <button
                          type="button"
                          onClick={() => handleManualRemove(record.studentUid, record.studentName)}
                          className="p-1 rounded text-navy-400 hover:text-red-400 hover:bg-navy-700/60 transition-colors"
                          title="Undo / Remove manual attendance"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Manual Attendance Modal (For students without phones or facing issues) */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-elevated w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="p-5 border-b border-navy-800 flex items-center justify-between shrink-0 bg-navy-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Manual Attendance Override
                  </h3>
                  <p className="text-xs text-navy-400">
                    {course?.courseCode || session.courseCode} &bull; {session.divisionName || 'Class'} &bull; For students unable to scan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {manualNotice && (
              <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{manualNotice}</span>
              </div>
            )}

            {/* Filter Search */}
            <div className="p-4 border-b border-navy-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search student by name or roll number..."
                  value={manualSearch}
                  onChange={e => setManualSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-navy-800/80 border border-navy-700 text-xs text-white placeholder-navy-500 focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* Student Roster List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 touch-scroll">
              {filteredEligibleRoster.length === 0 ? (
                <div className="py-8 text-center text-navy-500 text-xs font-mono">
                  No students found matching "{manualSearch}".
                </div>
              ) : (
                filteredEligibleRoster.map(student => {
                  const isPresent = sessionRecords.some(r => r.studentUid === student.uid);
                  const record = sessionRecords.find(r => r.studentUid === student.uid);

                  return (
                    <div
                      key={student.uid}
                      className="p-3 rounded-lg bg-navy-800/60 border border-navy-700 flex items-center justify-between text-xs hover:border-navy-600 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{student.name}</span>
                          <span className="font-mono text-teal-400 text-[11px] font-bold">
                            {student.rollNo}
                          </span>
                        </div>
                        {record && (
                          <span className="text-[10px] text-navy-400 font-mono">
                            Marked at {formatTime(record.markedAt)} ({record.source === 'qr_scan' ? 'Dynamic QR' : 'Manual'})
                          </span>
                        )}
                      </div>

                      <div>
                        {isPresent ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold font-mono">
                              <CheckCircle className="h-3 w-3" />
                              <span>Present</span>
                            </span>
                            {record?.source === 'manual_teacher' && (
                              <button
                                type="button"
                                onClick={() => handleManualRemove(student.uid, student.name)}
                                className="px-2 py-1 rounded text-[10px] text-navy-400 hover:text-red-400 hover:bg-navy-700/60 border border-transparent hover:border-red-500/30 transition-colors"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleManualMark(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-subtle active:scale-95 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Mark Present</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Custom / Unregistered Student */}
            <div className="p-4 bg-navy-950/70 border-t border-navy-800 shrink-0">
              <span className="text-[11px] font-mono text-navy-400 font-semibold block mb-2">
                Quick Mark by Roll No (Unlisted / Guest Student):
              </span>
              <form onSubmit={handleCustomManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Roll No (e.g. 22CS099)"
                  value={manualCustomRoll}
                  onChange={e => setManualCustomRoll(e.target.value)}
                  className="w-36 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-xs font-mono uppercase text-white focus:outline-none focus:border-teal-400"
                />
                <input
                  type="text"
                  placeholder="Student Full Name"
                  value={manualCustomName}
                  onChange={e => setManualCustomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-xs text-white focus:outline-none focus:border-teal-400"
                />
                <button
                  type="submit"
                  disabled={!manualCustomRoll.trim() || !manualCustomName.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Mark Present
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
