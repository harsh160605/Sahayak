import React, { useEffect, useState, useRef } from 'react';
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
  Navigation
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
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0D9488', '#0F766E', '#14B8A6']
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="border-b border-warm-300 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
          STUDENT VERIFICATION
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
          Mark Attendance via QR
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          Scan the dynamic rotating QR code projected in your classroom.
        </p>
      </div>

      {/* Verification Feedback Result */}
      {scanResult && (
        <div 
          className={`p-5 rounded-lg border shadow-subtle ${
            scanResult.success 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {scanResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="text-sm font-bold">
                {scanResult.success ? 'Attendance Successfully Recorded!' : 'Verification Failed'}
              </h3>
              <p className="text-xs leading-relaxed">{scanResult.message}</p>
              {scanResult.courseName && (
                <div className="pt-2 text-xs font-mono space-y-0.5">
                  <p><strong>Course:</strong> {scanResult.courseName}</p>
                  <p><strong>Topic:</strong> {scanResult.sessionTopic}</p>
                  <p><strong>Timestamp:</strong> {formatTime(scanResult.markedAt || '')}</p>
                  {scanResult.distanceMeters !== undefined && (
                    <p className="text-teal-700"><strong>GPS Proximity:</strong> ~{scanResult.distanceMeters}m from instructor</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Geofencing Location Status Badge */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-warm-300 text-xs shadow-subtle">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${studentCoords ? 'text-primary' : 'text-navy-400'}`} />
          <div>
            <span className="font-semibold text-navy-900">GPS Classroom Perimeter Status: </span>
            {studentCoords ? (
              <span className="text-emerald-700 font-mono font-medium">Locked ({studentCoords.latitude.toFixed(4)}, {studentCoords.longitude.toFixed(4)})</span>
            ) : locating ? (
              <span className="text-amber-700 italic">Acquiring GPS fix...</span>
            ) : (
              <span className="text-navy-500 italic">Location unverified</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={acquireGPSLocation}
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 font-mono"
        >
          <Navigation className="h-3 w-3" />
          <span>{locating ? 'Locating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {locatingError && (
        <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{locatingError}</span>
        </div>
      )}

      {/* Camera Viewfinder Arena */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-6">
        <div className="relative rounded-lg overflow-hidden bg-navy-950 min-h-[300px] flex flex-col items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full" />

          {!scanning && !scanResult?.success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-warm-300 bg-navy-900/90 space-y-3">
              <div className="h-12 w-12 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-teal-400">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Camera Access Required</p>
                <p className="text-xs text-navy-400 max-w-xs mt-1">
                  Point your smartphone or web camera at the instructor’s screen.
                </p>
              </div>
              <button
                onClick={startScanner}
                className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-all active:scale-95"
              >
                Start Camera Scanner
              </button>
            </div>
          )}

          {scanning && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button
                onClick={stopScanner}
                className="px-4 py-1.5 rounded-full bg-navy-900/80 backdrop-blur border border-navy-700 text-white text-xs font-mono flex items-center gap-1.5 hover:bg-navy-800"
              >
                <CameraOff className="h-3.5 w-3.5 text-red-400" />
                <span>Stop Scanner</span>
              </button>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Quick Diagnostic Token Entry for Testing */}
        <div className="pt-4 border-t border-warm-200">
          <span className="text-[11px] font-mono text-navy-500 uppercase tracking-wider block mb-2">
            Developer / One-Click Scanner Simulator
          </span>
          <p className="text-xs text-navy-600 mb-3">
            If testing on a desktop machine without pointing a phone camera at the teacher screen, you can paste or simulate the current live session token here:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. SA_TOKEN::sess_... (or paste token)"
              value={simulatedTokenInput}
              onChange={e => setSimulatedTokenInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-md border border-warm-300 font-mono focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => handleScanSuccess(simulatedTokenInput)}
              className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Verify Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
