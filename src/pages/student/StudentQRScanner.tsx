import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Radio, 
  Check 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import confetti from 'canvas-confetti';
import { formatTime } from '../../lib/utils';
import { Link } from 'react-router-dom';

export const StudentQRScanner: React.FC = () => {
  const { currentUser } = useAuth();
  const { verifyAndRecordAttendance, sessions, enrollments } = useData();

  const [scanning, setScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [studentCoords, setStudentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    courseName?: string;
    sessionTopic?: string;
    markedAt?: string;
    distanceMeters?: number;
  } | null>(null);
  
  const [simulatedTokenInput, setSimulatedTokenInput] = useState<string>('');
  const scannerRef = useRef<any>(null);

  // Find active lecture for student
  const myEnrolledCourseIds = enrollments
    .filter(e => e.studentUid === currentUser?.uid && e.status === 'active')
    .map(e => e.courseId);

  const activeLecture = sessions.find(
    s => myEnrolledCourseIds.includes(s.courseId) && (s.status === 'active' || s.status === 'paused')
  );

  // Request GPS coordinates for geofencing compliance
  const acquireGPSLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocatingError('Geolocation not supported by device.');
        resolve(null);
        return;
      }

      setLocating(true);
      setLocatingError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          setStudentCoords(coords);
          setLocating(false);
          resolve(coords);
        },
        (err) => {
          setLocatingError(`Location permission required: ${err.message}`);
          setLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const startScanner = async () => {
    setCameraError(null);
    setScanResult(null);

    // Acquire GPS silently at scanner startup
    acquireGPSLocation();

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (_errorMessage) => {
          // ignore transient frame misses
        }
      );
      setScanning(true);
    } catch (err: any) {
      console.warn('Camera initiation notice:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions, or use the direct evaluation token entry below.'
      );
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
    }
    setScanning(false);
  };

  const handleScanSuccess = async (token: string) => {
    if (!currentUser || !token.trim()) return;

    // Check GPS coords
    let coords = studentCoords;
    if (!coords) {
      coords = await acquireGPSLocation();
    }

    // Trigger server-side validation with geofence
    const result = await verifyAndRecordAttendance(
      token.trim(),
      currentUser.uid,
      currentUser.fullName,
      currentUser.studentId || 'STUDENT',
      coords || undefined
    );

    setScanResult(result);

    if (result.success) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#2563EB', '#1D4ED8', '#10B981']
      });
      stopScanner();
    }
  };

  useEffect(() => {
    acquireGPSLocation();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            PRESENCE VERIFICATION
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Mark Attendance via QR
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scan the rotating cryptographic QR code displayed on your lecture hall projector screen.
        </p>
      </div>

      {/* Active Lecture Context Banner */}
      {activeLecture && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Radio className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-950 dark:text-blue-200 font-mono">
                {activeLecture.courseCode} — {activeLecture.courseName}
              </p>
              <p className="text-[11px] text-blue-800 dark:text-blue-300">
                Topic: {activeLecture.lectureTopic} &bull; Started {formatTime(activeLecture.startedAt)}
              </p>
            </div>
          </div>
          {activeLecture.geofence?.enabled && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 shrink-0">
              GPS {activeLecture.geofence.radiusMeters}m
            </span>
          )}
        </div>
      )}

      {/* Verification Feedback Result */}
      {scanResult && (
        <div 
          className={`p-5 rounded-xl border shadow-sm ${
            scanResult.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {scanResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold">
                {scanResult.success ? 'Attendance Verified & Recorded' : 'Verification Failed'}
              </h3>
              <p className="text-xs leading-relaxed">{scanResult.message}</p>
              {scanResult.courseName && (
                <div className="pt-2 text-xs font-mono space-y-1 bg-white/70 dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p><strong>Course:</strong> {scanResult.courseName}</p>
                  <p><strong>Topic:</strong> {scanResult.sessionTopic}</p>
                  <p><strong>Timestamp:</strong> {formatTime(scanResult.markedAt || '')}</p>
                  {scanResult.distanceMeters !== undefined && (
                    <p className="text-blue-800 dark:text-blue-300 font-bold">
                      <strong>GPS Distance:</strong> ~{scanResult.distanceMeters}m from classroom center
                    </p>
                  )}
                </div>
              )}

              {scanResult.success && (
                <div className="pt-2">
                  <Link
                    to="/student/history"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    <span>View in attendance log</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Geofencing Location Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm gap-2 transition-colors">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 shrink-0 ${studentCoords ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">GPS Classroom Perimeter Status: </span>
            {studentCoords ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                Locked ({studentCoords.latitude.toFixed(4)}, {studentCoords.longitude.toFixed(4)})
              </span>
            ) : locating ? (
              <span className="text-amber-700 dark:text-amber-400 italic">Acquiring GPS fix...</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 italic">Location unverified</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={acquireGPSLocation}
          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono self-start sm:self-auto cursor-pointer"
        >
          <Navigation className="h-3 w-3" />
          <span>{locating ? 'Locating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {locatingError && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{locatingError}</span>
        </div>
      )}

      {/* Camera Viewfinder Arena */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
        <div className="relative rounded-xl overflow-hidden bg-slate-950 min-h-[300px] flex flex-col items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full" />

          {!scanning && !scanResult?.success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-950/90 space-y-3">
              <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shadow-sm">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Camera Access Ready</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Position your camera at the projected classroom QR token.
                </p>
              </div>
              <button
                onClick={startScanner}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Start Camera Scanner
              </button>
            </div>
          )}

          {scanning && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button
                onClick={stopScanner}
                className="px-4 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700 text-white text-xs font-mono flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
              >
                <CameraOff className="h-3.5 w-3.5 text-rose-400" />
                <span>Stop Scanner</span>
              </button>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Diagnostic Token Entry for Testing / Simulator */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Evaluation & Desktop Simulator
            </span>
            {activeLecture?.currentQrToken && (
              <button
                type="button"
                onClick={() => setSimulatedTokenInput(activeLecture.currentQrToken || '')}
                className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Paste Active Lecture Token</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For desktop testing without camera hardware, enter or paste the dynamic token generated by the faculty screen:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. SA_TOKEN::sess_... (or paste token)"
              value={simulatedTokenInput}
              onChange={e => setSimulatedTokenInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={() => handleScanSuccess(simulatedTokenInput)}
              disabled={!simulatedTokenInput.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Verify Presence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
