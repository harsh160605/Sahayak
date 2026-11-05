import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatTime } from '../../lib/utils';

export const LiveAttendanceScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();

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

  const session = sessions.find(s => s.id === sessionId);
  const course = courses.find(c => c.id === session?.courseId);
  const enrolledStudents = enrollments.filter(e => e.courseId === session?.courseId && e.status === 'active');
  const sessionRecords = attendanceRecords.filter(r => r.sessionId === sessionId);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(session?.qrRefreshIntervalSeconds || 3);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [privacyMode, setPrivacyMode] = useState<boolean>(false); // masks names on public projectors
  const [searchFilter, setSearchFilter] = useState<string>('');

  const refreshInterval = session?.qrRefreshIntervalSeconds || 3;

  // Rotating Cryptographic Token Generator
  const generateNewToken = () => {
    if (!session || session.status !== 'active') return;

    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 10);
    // Unpredictable payload tied to session ID and millisecond timestamp
    const tokenString = `SA_TOKEN::${session.id}::${timestamp}::${nonce}`;
    const expiresAt = timestamp + (refreshInterval * 1000);

    updateSessionToken(session.id, tokenString, expiresAt);

    QRCode.toDataURL(tokenString, {
      width: 480,
      margin: 2,
      color: {
        dark: '#020617', // Deep slate navy for maximum contrast
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code', err);
    });

    setCountdown(refreshInterval);
  };

  // Live Timer & Countdown Effect
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    // Generate initial token immediately
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
  }, [session?.status, session?.id, refreshInterval]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="p-8 max-w-md text-center space-y-4 bg-white rounded-lg border border-slate-200 shadow-xl">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Attendance Session Not Found</h2>
          <p className="text-xs text-slate-600">The requested roll call session is either expired or does not exist.</p>
          <button
            onClick={() => navigate('/teacher')}
            className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold shadow-sm hover:bg-slate-800 transition-colors"
          >
            Return to Faculty Portal
          </button>
        </div>
      </div>
    );
  }

  const enrolledCount = Math.max(enrolledStudents.length, 1);
  const attendancePercentage = Math.round((sessionRecords.length / enrolledCount) * 100);

  const filteredRecords = sessionRecords.filter(r => 
    r.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.studentRollNo.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Projection Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate('/teacher')}
            className="p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
            title="Exit projection console"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                {course?.courseCode || session.courseCode}
              </span>
              <span className="text-slate-600 text-xs">&bull;</span>
              <span className="text-xs text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                {session.lectureTopic}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {course?.courseName || session.courseName}
            </h1>
          </div>
        </div>

        {/* Live Status Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${
              session.status === 'active' 
                ? 'bg-emerald-400 animate-pulse' 
                : session.status === 'paused' 
                ? 'bg-amber-400' 
                : 'bg-rose-500'
            }`} />
            <span className="uppercase font-semibold tracking-wider text-[11px] hidden sm:inline">
              {session.status === 'active' ? 'LIVE ROTATION' : session.status.toUpperCase()}
            </span>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {session.status === 'active' ? (
            <button
              onClick={() => pauseSession(session.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors border border-amber-500/30"
              title="Pause QR rotation"
            >
              <Pause className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : session.status === 'paused' ? (
            <button
              onClick={() => resumeSession(session.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition-colors border border-emerald-500/30"
              title="Resume QR rotation"
            >
              <Play className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resume</span>
            </button>
          ) : null}

          {session.status !== 'ended' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to end and finalize this attendance session? New scans will be rejected.')) {
                  endSession(session.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-colors border border-rose-500/30"
              title="Finalize attendance"
            >
              <Square className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">End Session</span>
            </button>
          )}

          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`p-2 rounded transition-colors border ${
              privacyMode 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={privacyMode ? "Privacy masking is ON: student names masked" : "Privacy masking is OFF: student names visible"}
            aria-label="Toggle student name privacy masking"
          >
            {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded bg-slate-900 text-slate-400 border border-slate-700 hover:text-white transition-colors"
            title="Toggle fullscreen projection mode"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Classroom Dual Console */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Arena: Projection Screen for QR */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 relative">
          {session.status === 'active' ? (
            <div className="space-y-6 text-center max-w-xl mx-auto">
              {/* Rotating QR Card Container */}
              <div className="relative p-5 sm:p-6 bg-white rounded-xl shadow-2xl border-2 border-slate-700 inline-block">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="SmartAttend Dynamic Live QR Code" 
                    className="w-72 h-72 sm:w-96 sm:h-96 object-contain block mx-auto" 
                  />
                ) : (
                  <div className="w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
                  </div>
                )}

                {/* Expiry Countdown Pill */}
                <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-blue-400 flex items-center gap-2 shadow-lg whitespace-nowrap">
                  <Clock className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                  <span>REFRESH IN: {countdown}S</span>
                </div>
              </div>

              {/* Classroom Guidelines */}
              <div className="pt-2 space-y-2 text-center">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-blue-400 font-semibold uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Anti-Proxy Security Enabled</span>
                  </div>

                  {session.geofence?.enabled && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>GPS Perimeter ({session.geofence.radiusMeters}m)</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Open SmartAttend on your mobile phone and scan with your camera. Tokens expire every {refreshInterval} seconds.
                </p>
              </div>
            </div>
          ) : session.status === 'paused' ? (
            <div className="text-center space-y-4 p-8 bg-slate-900 rounded-lg border border-slate-800 max-w-md shadow-lg">
              <Pause className="h-10 w-10 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Attendance Roll Call Paused</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The QR code rotation is held. Resuming the session will regenerate active tokens and reopen the student verification window.
              </p>
              <button
                onClick={() => resumeSession(session.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-sm"
              >
                Resume Roll Call
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 p-8 bg-slate-900 rounded-lg border border-slate-800 max-w-md shadow-lg">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Session Finalized</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This lecture attendance session is ended. Submissions are closed and records have been committed to the institutional audit log.
              </p>
              <button
                onClick={() => navigate('/teacher/history')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-colors border border-slate-700"
              >
                Inspect Audit Records &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Right Arena: Live Real-Time Attendee Roster */}
        <div className="lg:col-span-5 flex flex-col bg-slate-950 overflow-hidden">
          {/* Header with Live Tally */}
          <div className="p-5 border-b border-slate-800 space-y-3 shrink-0 bg-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  VERIFIED ATTENDEES TALLY
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {sessionRecords.length}
                  </span>
                  <span className="text-sm font-mono text-slate-400">
                    / {enrolledStudents.length} Students
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-blue-400">
                  {attendancePercentage}%
                </span>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Turnout Rate</p>
              </div>
            </div>

            {/* Turnout Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-blue-600 h-full transition-all duration-300 ease-out" 
                style={{ width: `${Math.min(100, attendancePercentage)}%` }}
              />
            </div>

            {/* Quick Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search verified student or roll number..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Real-time Attendee Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-xs font-mono font-medium">No check-ins recorded yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  As students scan the projected QR code, verified entries will stream here in real time.
                </p>
              </div>
            ) : (
              filteredRecords.map((record, index) => {
                const displayName = privacyMode 
                  ? `${record.studentName.slice(0, 1)}**** ${record.studentName.split(' ')[1] ? record.studentName.split(' ')[1].slice(0, 1) + '.' : ''}` 
                  : record.studentName;

                return (
                  <div
                    key={record.id}
                    className="p-3 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="font-semibold text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{record.studentRollNo}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-blue-400 font-semibold block">
                        {formatTime(record.markedAt)}
                      </span>
                      <span className="text-[9px] uppercase font-mono text-emerald-400 font-semibold">
                        Verified ✓
                      </span>
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
