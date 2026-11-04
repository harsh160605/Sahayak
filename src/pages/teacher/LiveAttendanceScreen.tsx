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
  MapPin
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
        dark: '#0F172A', // Deep navy QR modules for highest contrast
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
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-navy-900">Attendance Session Not Found</h2>
          <p className="text-sm text-navy-600">The requested attendance session is either expired or does not exist.</p>
          <button
            onClick={() => navigate('/teacher')}
            className="px-4 py-2 bg-navy-900 text-white rounded-md text-xs font-semibold"
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

  return (
    <div className="min-h-screen bg-navy-900 text-surface flex flex-col font-sans select-none">
      {/* Projection Top Bar */}
      <header className="h-20 border-b border-navy-800 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center font-bold text-lg text-white">
            SA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                {course?.courseCode || session.courseCode}
              </span>
              <span className="text-navy-400 text-xs">&bull;</span>
              <span className="text-xs text-navy-300 font-medium">{session.lectureTopic}</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {course?.courseName || session.courseName}
            </h1>
          </div>
        </div>

        {/* Live Status Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${session.status === 'active' ? 'bg-emerald-500 animate-pulse' : session.status === 'paused' ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span className="uppercase font-semibold tracking-wider">
              {session.status === 'active' ? 'LIVE ROTATION' : session.status.toUpperCase()}
            </span>
          </div>

          <div className="h-6 w-px bg-navy-800" />

          {session.status === 'active' ? (
            <button
              onClick={() => pauseSession(session.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium transition-colors border border-amber-500/30"
              title="Pause session"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause</span>
            </button>
          ) : session.status === 'paused' ? (
            <button
              onClick={() => resumeSession(session.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium transition-colors border border-emerald-500/30"
              title="Resume session"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Resume</span>
            </button>
          ) : null}

          {session.status !== 'ended' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to finalize and end this attendance session?')) {
                  endSession(session.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-colors border border-red-500/30"
              title="End session"
            >
              <Square className="h-3.5 w-3.5" />
              <span>End Session</span>
            </button>
          )}

          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className="p-2 rounded-md bg-navy-800 hover:bg-navy-700 text-navy-300 transition-colors"
            title={privacyMode ? "Disable privacy masking" : "Enable privacy masking"}
          >
            {privacyMode ? <EyeOff className="h-4 w-4 text-teal-400" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md bg-navy-800 hover:bg-navy-700 text-navy-300 transition-colors"
            title="Toggle fullscreen projector mode"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Classroom Dual Arena */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Arena: Projection Screen for QR */}
        <div className="lg:col-span-7 p-8 flex flex-col items-center justify-center border-r border-navy-800 bg-navy-950/60 relative">
          {session.status === 'active' ? (
            <div className="space-y-6 text-center">
              {/* Rotating QR Card Container */}
              <div className="relative p-6 bg-white rounded-2xl shadow-2xl border-4 border-teal-500/40 inline-block transition-transform duration-300">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Live Attendance QR Code" 
                    className="w-80 h-80 sm:w-96 sm:h-96 object-contain block" 
                  />
                ) : (
                  <div className="w-80 h-80 flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-navy-600 animate-spin" />
                  </div>
                )}

                {/* Expiry Countdown Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-navy-900 border-2 border-teal-400 text-xs font-mono font-bold text-teal-300 flex items-center gap-2 shadow-lg">
                  <Clock className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                  <span>REFRESHING IN {countdown}S</span>
                </div>
              </div>

              {/* Classroom Instructions */}
              <div className="max-w-md mx-auto pt-2 space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-teal-400 uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Cryptographic Dynamic Anti-Proxy</span>
                </div>
                {session.geofence?.enabled && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-navy-800 py-1 px-3 rounded-full border border-teal-500/30">
                    <MapPin className="h-3.5 w-3.5 text-teal-400" />
                    <span>GPS Geofenced ({session.geofence.radiusMeters}m perimeter)</span>
                  </div>
                )}
                <p className="text-sm text-navy-300">
                  Open SmartAttend on your phone and scan with your camera. Screenshots expire in {refreshInterval} seconds.
                </p>
              </div>
            </div>
          ) : session.status === 'paused' ? (
            <div className="text-center space-y-4 p-8 bg-navy-900 rounded-xl border border-navy-700 max-w-md">
              <Pause className="h-12 w-12 text-amber-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Attendance Paused</h3>
              <p className="text-sm text-navy-300">The QR code is temporarily frozen. Resuming the session will regenerate active tokens.</p>
              <button
                onClick={() => resumeSession(session.id)}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-bold transition-all"
              >
                Resume Attendance
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 p-8 bg-navy-900 rounded-xl border border-navy-700 max-w-md">
              <CheckCircle className="h-12 w-12 text-teal-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Session Finalized</h3>
              <p className="text-sm text-navy-300">This lecture attendance is marked complete. Attendance submissions are officially closed.</p>
              <button
                onClick={() => navigate('/teacher/history')}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-md text-xs font-bold transition-all border border-navy-700"
              >
                View Attendance Record
              </button>
            </div>
          )}
        </div>

        {/* Right Arena: Live Real-Time Attendee Roster */}
        <div className="lg:col-span-5 flex flex-col bg-navy-900 overflow-hidden">
          {/* Header with Live Tally */}
          <div className="p-6 border-b border-navy-800 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-navy-400">LIVE PARTICIPATION</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {sessionRecords.length}
                  </span>
                  <span className="text-sm font-mono text-navy-400">
                    / {enrolledStudents.length} Students
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-teal-400">
                  {attendancePercentage}%
                </span>
                <p className="text-[11px] font-mono text-navy-400">Turnout Rate</p>
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
                placeholder="Search verified student or roll no..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md bg-navy-800 border border-navy-700 text-xs text-white placeholder-navy-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Real-time Attendee Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-navy-500">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs font-mono">No students marked present yet.</p>
                <p className="text-[11px] text-navy-600 mt-0.5">Scans will instantly update here via Firestore listener.</p>
              </div>
            ) : (
              filteredRecords.map((record, index) => {
                const displayName = privacyMode 
                  ? `${record.studentName.slice(0, 1)}*** ${record.studentName.split(' ')[1] || ''}` 
                  : record.studentName;

                return (
                  <div
                    key={record.id}
                    className="p-3 rounded-lg bg-navy-800/80 border border-navy-700 flex items-center justify-between text-xs animate-in fade-in duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-mono font-semibold text-[10px]">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{displayName}</p>
                        <p className="text-[11px] text-navy-400 font-mono">{record.studentRollNo}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-teal-400">
                        {formatTime(record.markedAt)}
                      </span>
                      <p className="text-[9px] uppercase font-mono text-emerald-400">Verified</p>
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

