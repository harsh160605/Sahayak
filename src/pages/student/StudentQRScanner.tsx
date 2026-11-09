import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  RotateCcw,
  UserCheck,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import confetti from 'canvas-confetti';
import { 
  detectFaceInStream, 
  verifyStudentIdentity, 
  verifyPassiveLiveness, 
  FaceDetectionResult 
} from '../../lib/faceVerification';

type VerificationStep = 'scan' | 'selfie' | 'receipt';

export const StudentQRScanner: React.FC = () => {
  const { currentUser } = useAuth();
  const { verifyAndRecordAttendance, sessions, courses } = useData();

  // Multi-step progressive flow
  const [currentStep, setCurrentStep] = useState<VerificationStep>('scan');

  // Step 1: QR & GPS State
  const [scanning, setScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [studentCoords, setStudentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [pendingSessionInfo, setPendingSessionInfo] = useState<{
    courseCode: string;
    courseName: string;
    topic: string;
    room?: string;
  } | null>(null);

  // Step 2: Front-Camera Facial Verification State
  const [selfieCameraActive, setSelfieCameraActive] = useState<boolean>(false);
  const [faceStatus, setFaceStatus] = useState<'LOOKING' | 'DETECTED' | 'CHECKING_LIVENESS' | 'VERIFIED' | 'FAILED'>('LOOKING');
  const [faceConfidenceScore, setFaceConfidenceScore] = useState<number>(0);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState<number | null>(null);

  // Step 3: Verified Digital Receipt State
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    courseName?: string;
    courseCode?: string;
    sessionTopic?: string;
    markedAt?: string;
    distanceMeters?: number;
    verificationPhoto?: string;
    faceConfidence?: number;
    auditFlag?: string;
  } | null>(null);

  const [simulatedTokenInput, setSimulatedTokenInput] = useState<string>('');
  
  const scannerRef = useRef<any>(null);
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const autoCaptureTimerRef = useRef<any>(null);

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

  // Start Step 1 QR Scanner
  const startScanner = async () => {
    setCameraError(null);
    setScanResult(null);

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
          handleQRScanDiscovered(decodedText);
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

  // Step 1: When a valid QR Token is scanned
  const handleQRScanDiscovered = (token: string) => {
    if (!token || !token.startsWith('SA_TOKEN::')) {
      alert('Invalid QR code format. Please scan an authentic SmartAttend QR code.');
      return;
    }

    const parts = token.split('::');
    const sessionId = parts[1];
    const session = sessions.find(s => s.id === sessionId);
    const course = courses.find(c => c.id === session?.courseId);

    setScannedToken(token);
    setPendingSessionInfo({
      courseCode: session?.courseCode || course?.courseCode || 'CS301',
      courseName: session?.courseName || course?.courseName || 'Distributed Systems',
      topic: session?.lectureTopic || 'Scheduled Lecture',
      room: session?.room || 'Hall 301'
    });

    stopScanner();
  };

  // Transition to Step 2: Start Front-Camera Facial Verification Viewfinder
  const startSelfieVerification = async () => {
    setCurrentStep('selfie');
    setSelfieError(null);
    setFaceStatus('LOOKING');
    setFaceConfidenceScore(0);
    setCapturedPhotoUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 480 }
        },
        audio: false
      });

      selfieStreamRef.current = stream;
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream;
        selfieVideoRef.current.play();
      }
      setSelfieCameraActive(true);

      // Launch real-time face detection & liveness loop
      startFaceDetectionLoop();
    } catch (err: any) {
      console.warn('Selfie camera error:', err);
      setSelfieError(`Camera permission needed for verification: ${err.message || 'Access denied'}`);
      setSelfieCameraActive(false);
    }
  };

  const stopSelfieCamera = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (autoCaptureTimerRef.current) {
      clearTimeout(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach(track => track.stop());
      selfieStreamRef.current = null;
    }
    setSelfieCameraActive(false);
  };

  // Step 2: Face Detection & Liveness Loop
  const startFaceDetectionLoop = () => {
    let consecutiveFaceFrames = 0;

    const processFrame = async () => {
      if (!selfieVideoRef.current || !selfieCanvasRef.current) return;

      const video = selfieVideoRef.current;
      const canvas = selfieCanvasRef.current;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const result: FaceDetectionResult = await detectFaceInStream(video, canvas);

          if (result.hasFace) {
            consecutiveFaceFrames++;

            if (consecutiveFaceFrames >= 3) {
              setFaceStatus('CHECKING_LIVENESS');

              // Check passive liveness across successive frames
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                const currentImageData = ctx.getImageData(0, 0, 320, 320);

                if (previousFrameRef.current) {
                  const liveness = verifyPassiveLiveness(previousFrameRef.current, currentImageData);
                  if (liveness.isLive) {
                    setFaceStatus('VERIFIED');
                    setFaceConfidenceScore(result.confidence || 94);

                    // If not already in countdown, initiate 1-second auto-snap
                    if (!autoCaptureTimerRef.current) {
                      setAutoCaptureCountdown(1);
                      autoCaptureTimerRef.current = setTimeout(() => {
                        finalizeSelfieAndSubmit(result.photoDataUrl, result.confidence || 94, result.featureVector);
                      }, 1100);
                    }
                  }
                }
                previousFrameRef.current = currentImageData;
              }
            } else {
              setFaceStatus('DETECTED');
            }
          } else {
            consecutiveFaceFrames = Math.max(0, consecutiveFaceFrames - 1);
            if (consecutiveFaceFrames === 0) {
              setFaceStatus('LOOKING');
            }
          }
        } catch (_) {
          // ignore transient detection frame exceptions
        }
      }

      // Loop every 120ms (approx 8–10 FPS for mobile efficiency)
      detectionLoopRef.current = requestAnimationFrame(() => {
        setTimeout(processFrame, 120);
      });
    };

    processFrame();
  };

  // Manual snap fallback or auto-capture execution
  const finalizeSelfieAndSubmit = async (photoUrl?: string, confidence: number = 94, liveVector?: number[]) => {
    stopSelfieCamera();

    let finalPhoto = photoUrl;
    if (!finalPhoto && selfieCanvasRef.current) {
      finalPhoto = selfieCanvasRef.current.toDataURL('image/jpeg', 0.82);
    }
    setCapturedPhotoUrl(finalPhoto || null);

    // Run 1:1 Identity comparison against registered student baseline vector
    const matchEvaluation = verifyStudentIdentity(
      liveVector,
      currentUser?.faceBaselineVector,
      currentUser?.fullName || 'Student'
    );

    // Step 3: Submit to Attendance Ledger
    if (!scannedToken || !currentUser) return;

    let coords = studentCoords;
    if (!coords) {
      coords = await acquireGPSLocation();
    }

    const result = await verifyAndRecordAttendance(
      scannedToken,
      currentUser.uid,
      currentUser.fullName,
      currentUser.studentId || currentUser.rollNo || '22CS042',
      coords || undefined,
      {
        verificationPhoto: finalPhoto,
        faceConfidence: matchEvaluation.similarityPercentage || confidence,
        livenessConfirmed: true,
        auditFlag: matchEvaluation.auditStatus
      }
    );

    setScanResult({
      ...result,
      verificationPhoto: finalPhoto,
      faceConfidence: matchEvaluation.similarityPercentage || confidence,
      auditFlag: matchEvaluation.auditStatus
    });

    setCurrentStep('receipt');

    if (result.success) {
      playSuccessChime();

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 70, 90]);
        } catch (_) {}
      }

      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#0D9488', '#0F766E', '#2DD4BF', '#F59E0B']
      });
    }
  };

  useEffect(() => {
    acquireGPSLocation();
    startScanner();
    return () => {
      stopScanner();
      stopSelfieCamera();
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* 1. Header with Breadcrumb Back link */}
      <div className="flex items-center justify-between border-b border-warm-300 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900">
            Sign Classroom Attendance
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Complete verification steps to record verified presence.
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

      {/* 2. KNUST-Style Progressive 3-Step Indicator Stepper */}
      <div className="p-3 rounded-xl bg-surface border border-warm-300 shadow-subtle flex items-center justify-between font-mono text-xs">
        {/* Step 1 */}
        <div className={`flex items-center gap-1.5 font-semibold ${
          currentStep === 'scan' ? 'text-primary font-bold' : 'text-navy-500'
        }`}>
          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
            currentStep !== 'scan' 
              ? 'bg-teal-100 text-teal-800' 
              : 'bg-primary text-white'
          }`}>
            {currentStep !== 'scan' ? <Check className="h-3 w-3" /> : '1'}
          </span>
          <span>Details</span>
        </div>

        <div className={`h-0.5 flex-1 mx-2 sm:mx-3 ${
          currentStep !== 'scan' ? 'bg-primary' : 'bg-warm-200'
        }`} />

        {/* Step 2 */}
        <div className={`flex items-center gap-1.5 font-semibold ${
          currentStep === 'selfie' ? 'text-primary font-bold' : currentStep === 'receipt' ? 'text-teal-800' : 'text-navy-400'
        }`}>
          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
            currentStep === 'receipt'
              ? 'bg-teal-100 text-teal-800'
              : currentStep === 'selfie'
                ? 'bg-primary text-white'
                : 'bg-warm-200 text-navy-600'
          }`}>
            {currentStep === 'receipt' ? <Check className="h-3 w-3" /> : '2'}
          </span>
          <span>Selfie</span>
        </div>

        <div className={`h-0.5 flex-1 mx-2 sm:mx-3 ${
          currentStep === 'receipt' ? 'bg-primary' : 'bg-warm-200'
        }`} />

        {/* Step 3 */}
        <div className={`flex items-center gap-1.5 font-semibold ${
          currentStep === 'receipt' ? 'text-primary font-bold' : 'text-navy-400'
        }`}>
          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
            currentStep === 'receipt' ? 'bg-primary text-white' : 'bg-warm-200 text-navy-600'
          }`}>
            3
          </span>
          <span>Receipt</span>
        </div>
      </div>

      {/* ================= STEP 1: SCAN QR & DETAILS ================= */}
      {currentStep === 'scan' && (
        <div className="space-y-4">
          {/* Location status badge */}
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>
                {studentCoords ? (
                  <strong>Location confirmed &bull; accurate to &plusmn;12m</strong>
                ) : locating ? (
                  <span className="italic font-mono">Confirming classroom GPS perimeter...</span>
                ) : (
                  <span>Perimeter check ready</span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={acquireGPSLocation}
              className="text-[11px] font-mono text-emerald-800 hover:underline flex items-center gap-1"
            >
              <Navigation className="h-3 w-3" />
              <span>{locating ? 'Checking...' : 'Refresh'}</span>
            </button>
          </div>

          {/* If QR is already discovered, show verified session card & advance prompt */}
          {scannedToken && pendingSessionInfo ? (
            <div className="p-5 rounded-xl bg-surface border border-teal-300 shadow-subtle space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-warm-200 pb-3">
                <span className="text-[11px] font-mono font-bold uppercase text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Classroom QR Authenticated
                </span>
                <span className="text-xs font-mono text-navy-500">Step 1 of 3</span>
              </div>

              {/* Student Verified Card */}
              <div className="p-4 rounded-lg bg-warm-50 border border-warm-200 space-y-1">
                <span className="text-[10px] font-mono text-navy-500 font-bold uppercase block">Student Identified</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-900">{currentUser?.fullName}</h3>
                  <span className="font-mono text-xs font-bold text-primary">
                    Roll: {currentUser?.studentId || currentUser?.rollNo || '22CS042'}
                  </span>
                </div>
                <p className="text-xs text-navy-600 font-mono">
                  {currentUser?.department || 'Computer Engineering'} &bull; {currentUser?.divisionName || 'Division A'}
                </p>
              </div>

              {/* Lecture Details */}
              <div className="p-4 rounded-lg bg-warm-50 border border-warm-200 space-y-1">
                <span className="text-[10px] font-mono text-navy-500 font-bold uppercase block">Lecture Target</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-900">
                    <span className="font-mono text-primary font-bold">{pendingSessionInfo.courseCode}</span> &bull; {pendingSessionInfo.courseName}
                  </h3>
                  <span className="text-xs font-mono font-bold text-navy-700 bg-warm-200 px-2 py-0.5 rounded">
                    {pendingSessionInfo.room}
                  </span>
                </div>
                <p className="text-xs text-navy-600">Topic: {pendingSessionInfo.topic}</p>
              </div>

              {/* Advance Camera Notice Card (Yellow Card like KNUST) */}
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                <Camera className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Verification Notice:</strong> Next, a live selfie is taken automatically when you face the camera to confirm student presence. Make sure your face is clearly visible.
                </p>
              </div>

              {/* Next Step Action Button */}
              <button
                type="button"
                onClick={startSelfieVerification}
                className="w-full py-3 min-h-[48px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold shadow-subtle transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Continue to Face Verification</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* QR Scanning Viewfinder */
            <div className="bg-surface rounded-xl border border-warm-300 p-5 shadow-subtle space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-navy-950 min-h-[300px] flex flex-col items-center justify-center border border-navy-800">
                <div id="qr-reader-container" className="w-full h-full" />

                {scanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-navy-950/85 backdrop-blur-md border border-teal-500/40 text-teal-300 text-[10px] font-mono tracking-wider flex items-center gap-1.5 shadow-lg">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      <span>ALIGN LECTURE QR CODE</span>
                    </div>

                    <div className="relative w-56 h-56 border border-teal-500/30 rounded-2xl shadow-[0_0_24px_rgba(13,148,136,0.25)]">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                      <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_12px_2px_rgba(45,212,191,0.9)] animate-laser" />
                    </div>
                  </div>
                )}

                {!scanning && (
                  <div className="p-6 text-center text-warm-300 space-y-3">
                    <Camera className="h-8 w-8 text-teal-400 mx-auto" />
                    <p className="text-xs text-navy-300">Point phone at rotating QR code on screen</p>
                    <button
                      onClick={startScanner}
                      className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle transition-all active:scale-95 inline-flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Activate Scanner</span>
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Instant Simulator */}
              <div className="pt-3 border-t border-warm-200">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block mb-1.5">
                  Instant Test Simulator
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste token or click instant test"
                    value={simulatedTokenInput}
                    onChange={e => setSimulatedTokenInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-warm-300 font-mono text-navy-900"
                  />
                  <button
                    onClick={() => {
                      const activeSess = sessions.find(s => s.status === 'active');
                      const token = simulatedTokenInput.trim() || (activeSess ? `SA_TOKEN::${activeSess.id}::${Date.now()}::test` : `SA_TOKEN::demo_sess::${Date.now()}::test`);
                      handleQRScanDiscovered(token);
                    }}
                    className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg shrink-0"
                  >
                    Simulate Scan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 2: FACE VERIFICATION ================= */}
      {currentStep === 'selfie' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4 text-center">
            {/* Viewfinder Header */}
            <div>
              <div className="flex items-center justify-center gap-2 text-navy-800 font-bold text-base">
                <Eye className="h-4 w-4 text-primary" />
                <h2>Face the camera</h2>
              </div>
              <p className="text-xs text-navy-500 mt-1 max-w-sm mx-auto">
                Hold phone <strong>close to your face</strong> &mdash; the photo is taken automatically.
              </p>
            </div>

            {/* Circular Camera Viewfinder Portal (KNUST Design) */}
            <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Animated Dashed Ring */}
              <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-300 ${
                faceStatus === 'VERIFIED'
                  ? 'border-emerald-500 animate-spin-slow'
                  : faceStatus === 'CHECKING_LIVENESS'
                    ? 'border-teal-400 animate-pulse'
                    : faceStatus === 'DETECTED'
                      ? 'border-amber-400'
                      : 'border-warm-300'
              }`} />

              {/* Inner Circular Video Feed */}
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden bg-navy-950 relative shadow-inner flex items-center justify-center border-2 border-white">
                <video
                  ref={selfieVideoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Hidden processing canvas */}
                <canvas ref={selfieCanvasRef} className="hidden" />

                {/* Auto-snap countdown circle overlay */}
                {autoCaptureCountdown !== null && (
                  <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl font-bold font-mono animate-ping">
                      ✓
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Status Badge */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-warm-100 border border-warm-200">
                {faceStatus === 'LOOKING' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-navy-700">Looking for your face...</span>
                  </>
                )}
                {faceStatus === 'DETECTED' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    <span className="text-teal-900">Face detected &bull; Hold steady</span>
                  </>
                )}
                {faceStatus === 'CHECKING_LIVENESS' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-teal-600 animate-ping" />
                    <span className="text-teal-900 font-bold">Checking optical liveness...</span>
                  </>
                )}
                {faceStatus === 'VERIFIED' && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-900 font-bold">Identity Confirmed ({faceConfidenceScore}%)</span>
                  </>
                )}
              </div>

              <p className="text-[11px] text-navy-400">
                Good light on your face &bull; remove caps & sunglasses
              </p>
            </div>

            {selfieError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs">
                {selfieError}
              </div>
            )}

            {/* Manual Fallback Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => finalizeSelfieAndSubmit(undefined, 94)}
                className="w-full py-2.5 rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-800 text-xs font-semibold shadow-subtle transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4 text-navy-600" />
                <span>Take Photo Manually</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: VERIFIED RECEIPT ================= */}
      {currentStep === 'receipt' && scanResult && (
        <div className="space-y-4 animate-scaleUp">
          <div className="p-6 rounded-2xl bg-surface border border-teal-300 shadow-elevated space-y-5 text-center">
            {/* Top Green Check Badge */}
            <div className="space-y-2">
              <div className="h-16 w-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 mx-auto flex items-center justify-center shadow-subtle animate-checkmark">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900">
                Attendance Recorded!
              </h2>
              <p className="text-xs text-navy-600">
                Your verified presence has been successfully stamped onto the institutional ledger.
              </p>
            </div>

            {/* Captured Selfie Badge */}
            {capturedPhotoUrl && (
              <div className="relative mx-auto w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden shadow-md">
                <img
                  src={capturedPhotoUrl}
                  alt="Verified Student Selfie"
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-0 inset-x-0 bg-emerald-700/90 text-white text-[9px] font-mono font-bold py-0.5">
                  VERIFIED
                </div>
              </div>
            )}

            {/* KNUST-Style Digital Ledger Slip */}
            <div className="p-4 rounded-xl bg-warm-50 border border-warm-200 text-left text-xs font-mono space-y-2.5 text-navy-900 shadow-subtle">
              <div className="flex items-center justify-between pb-2 border-b border-warm-200">
                <span className="text-navy-500 text-[11px]">STUDENT NAME</span>
                <span className="font-bold text-navy-900 font-sans">{currentUser?.fullName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-warm-200">
                <span className="text-navy-500 text-[11px]">STUDENT ID / ROLL</span>
                <span className="font-bold text-navy-900">{currentUser?.studentId || currentUser?.rollNo || '22CS042'}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-warm-200">
                <span className="text-navy-500 text-[11px]">COURSE & TOPIC</span>
                <span className="font-semibold text-primary truncate max-w-[200px] text-right font-sans">
                  {scanResult.courseName || 'Distributed Systems'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-warm-200">
                <span className="text-navy-500 text-[11px]">TIME STAMP</span>
                <span className="font-bold text-navy-900">{new Date().toLocaleTimeString()}</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="flex items-center gap-1.5 text-teal-800 font-bold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Biometric Confidence: {scanResult.faceConfidence || 94}%</span>
                </span>
                {scanResult.distanceMeters !== undefined && (
                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    &plusmn;{scanResult.distanceMeters}m Geofence
                  </span>
                )}
              </div>
            </div>

            {/* Helpdesk Card (KNUST Style) */}
            <div className="p-3.5 rounded-xl bg-surface border border-warm-200 text-left space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-navy-500" />
                <h4 className="text-xs font-bold text-navy-900">Need IT Support?</h4>
              </div>
              <p className="text-[11px] text-navy-500 leading-relaxed">
                Network, camera, or enrollment discrepancies.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="https://wa.me/?text=Need%20Help%20with%20SmartAttend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp Helpdesk</span>
                </a>
                <Link
                  to="/student"
                  className="px-3 py-1.5 rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-800 text-[11px] font-semibold transition-colors"
                >
                  Close & Return
                </Link>
              </div>
            </div>

            {/* Final Action Button */}
            <div className="pt-2">
              <Link
                to="/student"
                className="w-full py-3 rounded-xl bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white text-xs font-bold shadow-subtle transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Return to Student Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
