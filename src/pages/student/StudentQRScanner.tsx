import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  MapPin,
  Navigation,
  ArrowLeft,
  Check,
  Building,
  Calendar,
  Clock,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import confetti from 'canvas-confetti';
import { formatTime } from '../../lib/utils';

export const StudentQRScanner: React.FC = () => {
  const { currentUser } = useAuth();
  const { verifyAndRecordAttendance } = useData();

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

  // Synthesize crisp harmonic audio confirmation on successful attendance stamp
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Note 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      gain2.gain.setValueAtTime(0.22, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } catch (_) {}
  };

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
          qrbox: { width: 260, height: 260 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (_errorMessage) => {
          // ignore transient frame decode misses
        }
      );
      setScanning(true);
    } catch (err: any) {
      console.warn('Camera initiation notice:', err);
      setCameraError(
        'Unable to initialize physical camera. Ensure permissions are granted, or use the direct verification simulator below.'
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
    if (!currentUser) return;

    // Check GPS coords
    let coords = studentCoords;
    if (!coords) {
      coords = await acquireGPSLocation();
    }

    // Trigger server-side validation with geofence
    const result = await verifyAndRecordAttendance(
      token,
      currentUser.uid,
      currentUser.fullName,
      currentUser.studentId || 'STUDENT',
      coords || undefined
    );

    setScanResult(result);

    if (result.success) {
      // Audio Chime Feedback
      playSuccessChime();

      // Mobile Haptic Feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 70, 90]);
        } catch (_) {}
      }

      // Multi-hue academic celebratory confetti
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.75 },
        colors: ['#0D9488', '#0F766E', '#2DD4BF', '#F59E0B']
      });

      stopScanner();
    }
  };

  useEffect(() => {
    acquireGPSLocation();
    // Auto-trigger camera scanner on student route entry
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. Header with Breadcrumb Back link */}
      <div className="flex items-center justify-between border-b border-warm-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">
            Scan Classroom Attendance
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Point your device camera at the rotating QR code on the lecture hall screen.
          </p>
        </div>
        <Link
          to="/student"
          className="px-3 py-1.5 rounded-lg bg-warm-100 hover:bg-warm-200 border border-warm-300 text-navy-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* 2. Verification Feedback & Academic Ledger Receipt */}
      {scanResult && (
        <div 
          className={`p-6 rounded-xl border shadow-subtle space-y-4 transition-all duration-300 ${
            scanResult.success 
              ? 'bg-teal-50/70 border-teal-300 text-teal-950' 
              : 'bg-red-50/70 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${
              scanResult.success ? 'bg-teal-100 text-teal-800 animate-checkmark' : 'bg-red-100 text-red-800'
            }`}>
              {scanResult.success ? (
                <CheckCircle2 className="h-7 w-7 text-primary" />
              ) : (
                <AlertCircle className="h-7 w-7 text-red-600" />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  scanResult.success ? 'bg-teal-200/60 text-teal-900' : 'bg-red-200/60 text-red-900'
                }`}>
                  {scanResult.success ? 'OFFICIAL ATTENDANCE RECORDED' : 'CHECK-IN REJECTED'}
                </span>
                <span className="text-xs font-mono text-navy-500">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              <h2 className="text-lg font-bold text-navy-900">
                {scanResult.success ? 'Verified & Stamped Present!' : 'Verification Failed'}
              </h2>
              <p className="text-xs text-navy-700 leading-relaxed">{scanResult.message}</p>

              {/* Verified Ledger Slip */}
              {scanResult.success && scanResult.courseName && (
                <div className="mt-3 p-4 rounded-lg bg-surface border border-teal-200 text-xs font-mono space-y-2 text-navy-800 shadow-subtle">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-warm-200">
                    <div>
                      <span className="text-navy-500 block text-xs">STUDENT</span>
                      <strong className="text-navy-900 font-sans">{currentUser?.fullName}</strong>
                      <span className="text-navy-500 block font-mono">Roll: {currentUser?.studentId || '22CS042'}</span>
                    </div>
                    <div>
                      <span className="text-navy-500 block text-xs">COURSE</span>
                      <strong className="text-navy-900 font-sans">{scanResult.courseName}</strong>
                      <span className="text-navy-500 block">Topic: {scanResult.sessionTopic}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <span className="flex items-center gap-1.5 text-teal-800 font-bold">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Cryptographic Nonce Authenticated</span>
                    </span>
                    {scanResult.distanceMeters !== undefined && (
                      <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        <span>GPS Verified (~{scanResult.distanceMeters}m from podium)</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action recovery buttons */}
              <div className="pt-2 flex items-center gap-2">
                <Link
                  to="/student"
                  className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
                >
                  Return to Dashboard
                </Link>
                {!scanResult.success && (
                  <button
                    onClick={startScanner}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Try Scanning Again</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GPS Geofencing Status Badge */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-warm-300 text-xs shadow-subtle">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-warm-100 text-navy-700">
            <MapPin className={`h-4 w-4 ${studentCoords ? 'text-primary' : 'text-navy-400'}`} />
          </div>
          <div>
            <span className="font-bold text-navy-900">GPS Classroom Perimeter Check: </span>
            {studentCoords ? (
              <span className="text-teal-800 font-mono font-medium">
                Locked ({studentCoords.latitude.toFixed(4)}, {studentCoords.longitude.toFixed(4)})
              </span>
            ) : locating ? (
              <span className="text-amber-700 italic font-mono">Acquiring GPS fix...</span>
            ) : (
              <span className="text-navy-500 italic">Location unverified</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={acquireGPSLocation}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 font-mono"
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>{locating ? 'Locating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {locatingError && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{locatingError}</span>
        </div>
      )}

      {/* 4. Camera Viewfinder Arena with Animated Reticles & Laser Sweep */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-6">
        <div className="relative rounded-xl overflow-hidden bg-navy-950 min-h-[320px] flex flex-col items-center justify-center border border-navy-800">
          <div id="qr-reader-container" className="w-full h-full" />

          {/* Precision Target Overlay when Scanning is Active */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col items-center justify-center">
              {/* Top HUD Guidance Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1.5 rounded-full bg-navy-950/85 backdrop-blur-md border border-teal-500/40 text-teal-300 text-[11px] font-mono tracking-wider flex items-center gap-2 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>ALIGN ROTATING QR IN TARGET</span>
              </div>

              {/* Precision Target Reticles */}
              <div className="relative w-64 h-64 border border-teal-500/30 rounded-2xl animate-reticle shadow-[0_0_24px_rgba(13,148,136,0.25)]">
                {/* 4 Corner Guidance Brackets */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />

                {/* Center Crosshair Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <div className="w-4 h-0.5 bg-teal-300" />
                  <div className="h-4 w-0.5 bg-teal-300 absolute" />
                </div>

                {/* Animated Horizontal Laser Sweep Beam */}
                <div className="absolute left-1.5 right-1.5 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_12px_2px_rgba(45,212,191,0.9)] animate-laser" />
              </div>
            </div>
          )}

          {!scanning && !scanResult?.success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-warm-300 bg-navy-900/90 space-y-3">
              <div className="h-14 w-14 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-teal-400 shadow-xl">
                <Camera className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Camera Access Required</h3>
                <p className="text-xs text-navy-400 max-w-xs mx-auto">
                  Align your camera with the rotating QR code on the lecture projector or monitor.
                </p>
              </div>
              <button
                onClick={startScanner}
                className="px-6 py-3 min-h-[48px] rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Activate Camera Scanner</span>
              </button>
            </div>
          )}

          {scanning && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full px-4 flex justify-center">
              <button
                onClick={stopScanner}
                className="px-5 py-2.5 min-h-[44px] rounded-full bg-navy-900/90 backdrop-blur border border-navy-700 text-white text-xs font-mono font-semibold flex items-center gap-2 hover:bg-navy-800 shadow-xl active:scale-95"
              >
                <CameraOff className="h-3.5 w-3.5 text-red-400" />
                <span>Pause Scanner</span>
              </button>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* 5. Desktop Testing & One-Click Verification Simulator */}
        <div className="pt-4 border-t border-warm-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-navy-500 uppercase tracking-wider font-semibold">
              Instant Desktop Scanner Simulator
            </span>
            <span className="text-xs font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Dev Mode Available
            </span>
          </div>
          <p className="text-xs text-navy-600 mb-3">
            If testing on a desktop without an external mobile camera, paste or enter the live session token string here to simulate an instant scan:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. SA_TOKEN::sess_... (or paste token)"
              value={simulatedTokenInput}
              onChange={e => setSimulatedTokenInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 min-h-[44px] text-xs rounded-lg border border-warm-300 font-mono focus:outline-none focus:border-primary text-navy-900"
            />
            <button
              onClick={() => handleScanSuccess(simulatedTokenInput)}
              className="px-5 py-2.5 min-h-[44px] bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center active:scale-95"
            >
              Verify Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
