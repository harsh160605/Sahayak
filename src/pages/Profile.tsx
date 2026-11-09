import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  CheckCircle2, 
  LogOut, 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  X,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { detectFaceInStream } from '../lib/faceVerification';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Face ID Enrollment Camera State
  const [showFaceEnrollModal, setShowFaceEnrollModal] = useState(false);
  const [enrollCameraActive, setEnrollCameraActive] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string>('Align your face inside the circle');
  const [enrollFaceDetected, setEnrollFaceDetected] = useState(false);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ fullName, department });
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  };

  // Start Enrollment Camera
  const startEnrollmentCamera = async () => {
    setShowFaceEnrollModal(true);
    setEnrollError(null);
    setEnrollStatus('Initializing front camera...');
    setEnrollFaceDetected(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setEnrollCameraActive(true);
      setEnrollStatus('Looking for your face...');

      // Run real-time detection loop
      const runLoop = async () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
        try {
          const det = await detectFaceInStream(videoRef.current, canvasRef.current);
          if (det.hasFace) {
            setEnrollFaceDetected(true);
            setEnrollStatus('✓ Face centered! Ready to enroll');
          } else {
            setEnrollFaceDetected(false);
            setEnrollStatus('Position your face inside the circle');
          }
        } catch {
          // ignore stream ticks
        }
        loopRef.current = requestAnimationFrame(() => {
          setTimeout(runLoop, 150);
        });
      };

      runLoop();
    } catch (err: any) {
      console.warn('Face camera access error:', err);
      setEnrollError(err.message || 'Camera permission denied');
      setEnrollCameraActive(false);
    }
  };

  const stopEnrollmentCamera = () => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setEnrollCameraActive(false);
    setShowFaceEnrollModal(false);
  };

  const captureAndEnrollBaseline = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessingEnrollment(true);
    setEnrollStatus('Extracting 64-D Biometric Feature Vector...');

    try {
      const det = await detectFaceInStream(videoRef.current, canvasRef.current);
      const photoUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);

      if (!det.featureVector || det.featureVector.length === 0) {
        setEnrollError('Could not reliably detect face features. Please look directly at camera.');
        setIsProcessingEnrollment(false);
        return;
      }

      await updateProfile({
        profilePhoto: photoUrl,
        faceBaselineVector: det.featureVector
      });

      stopEnrollmentCamera();
      setIsProcessingEnrollment(false);
      setEnrollSuccessMsg(true);
      setTimeout(() => setEnrollSuccessMsg(false), 4000);
    } catch (err: any) {
      setEnrollError(err.message || 'Failed to enroll face baseline');
      setIsProcessingEnrollment(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header with Quick Sign-Out */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            SECURITY & IDENTITY
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Academic User Profile
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Manage your institution-verified credentials, biometric Face ID, and active session.
          </p>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="self-start sm:self-auto flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100/90 text-red-700 text-xs font-semibold shadow-subtle transition-all active:scale-95 disabled:opacity-50"
          title="Sign out of your account"
          aria-label="Sign out of your account"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {enrollSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span>Biometric Face ID Baseline successfully registered! Subsequent QR scans will verify against this master photo.</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-warm-200">
          {currentUser?.profilePhoto ? (
            <img 
              src={currentUser.profilePhoto} 
              alt={currentUser.fullName}
              className="h-16 w-16 rounded-full object-cover border-2 border-primary shadow-subtle"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-lg font-mono">
              {currentUser?.fullName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-navy-900">{currentUser?.fullName}</h3>
            <p className="text-xs text-navy-500 font-mono">
              {currentUser?.role === 'teacher' ? `Faculty ID: ${currentUser.facultyId}` : `Roll No: ${currentUser?.studentId || currentUser?.rollNo || '22CS042'}`}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-warm-200 text-navy-800">
              Role: {currentUser?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1">Official Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1">College Email (Read-Only)</label>
            <input
              type="email"
              disabled
              value={currentUser?.email}
              className="w-full px-3 py-2 rounded-md border border-warm-200 bg-warm-100 text-navy-500 text-xs font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-3 border-t border-warm-200 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-subtle transition-all active:scale-95 flex items-center justify-center"
            >
              Update Profile Information
            </button>
          </div>
        </form>
      </div>

      {/* Biometric Face ID Master Baseline Card (Student Only or All Roles) */}
      {currentUser?.role === 'student' && (
        <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-bold text-navy-900">Biometric Face ID & Anti-Proxy Baseline</h2>
            </div>
            {currentUser?.faceBaselineVector && currentUser.faceBaselineVector.length > 0 ? (
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Baseline Enrolled & Active
              </span>
            ) : (
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                Pending First Enrollment
              </span>
            )}
          </div>

          <p className="text-xs text-navy-600 leading-relaxed">
            {currentUser?.faceBaselineVector && currentUser.faceBaselineVector.length > 0 ? (
              <>Your master 64-dimensional facial feature vector is securely locked to your account. When scanning classroom QR codes, your live selfie is compared against this master profile using 1:1 Cosine Similarity.</>
            ) : (
              <>You have not enrolled a master face baseline yet. You can enroll your face now using your camera, or your <strong>very first classroom QR attendance selfie</strong> will automatically register as your permanent master baseline.</>
            )}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-warm-200">
            <div className="flex items-center gap-3">
              {currentUser?.profilePhoto ? (
                <img 
                  src={currentUser.profilePhoto} 
                  alt="Enrolled Master Baseline" 
                  className="h-12 w-12 rounded-lg object-cover border border-emerald-300 shadow-sm"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-warm-200 text-warm-500 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-warm-400" />
                </div>
              )}
              <div className="text-xs">
                <p className="font-semibold text-navy-800">
                  {currentUser?.faceBaselineVector ? 'Master Reference Selfie' : 'No Reference Photo'}
                </p>
                <p className="text-[11px] text-navy-500 font-mono">
                  {currentUser?.faceBaselineVector ? '64-D Vector • L2 Normalized' : 'Auto-enrolls on 1st Lecture'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startEnrollmentCamera}
              className="px-4 py-2 min-h-[44px] rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>{currentUser?.faceBaselineVector ? 'Update Master Face ID' : 'Enroll Face ID Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Face ID Camera Enrollment Modal */}
      {showFaceEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl border border-warm-300 shadow-elevated w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-navy-900">Enroll Master Face ID</h3>
              </div>
              <button 
                onClick={stopEnrollmentCamera}
                className="p-1 rounded-md text-navy-400 hover:text-navy-700 hover:bg-warm-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {enrollError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            {/* Circular Viewfinder */}
            <div className="relative w-52 h-52 mx-auto rounded-full overflow-hidden border-4 border-navy-900/20 shadow-inner bg-navy-950 flex items-center justify-center">
              <video 
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Circular Target Ring */}
              <div className={`absolute inset-0 rounded-full border-2 pointer-events-none transition-colors duration-300 ${
                enrollFaceDetected ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-dashed border-white/40'
              }`} />
            </div>

            {/* Status Feedback */}
            <div className="text-center">
              <p className={`text-xs font-semibold ${enrollFaceDetected ? 'text-emerald-700' : 'text-navy-600'}`}>
                {enrollStatus}
              </p>
              <p className="text-[11px] text-navy-400 mt-0.5">
                Ensure good lighting with no glare or sunglasses
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={stopEnrollmentCamera}
                className="flex-1 py-2.5 rounded-lg border border-warm-300 text-xs font-semibold text-navy-700 hover:bg-warm-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureAndEnrollBaseline}
                disabled={isProcessingEnrollment || !enrollFaceDetected}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isProcessingEnrollment ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Save Baseline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Session Management & Sign Out Card */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-bold text-navy-900">Session & Authentication</h2>
          </div>
          <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            Active Verified Session
          </span>
        </div>

        <p className="text-xs text-navy-600 leading-relaxed">
          You are currently signed in as <span className="font-mono font-medium text-navy-900">{currentUser?.email}</span> with{' '}
          <span className="font-semibold text-navy-900 capitalize">{currentUser?.role}</span> permissions. Signing out will clear your local cryptographic session credentials.
        </p>

        <div className="pt-3 border-t border-warm-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-navy-500 font-mono">
            Device Status: <span className="text-emerald-700 font-medium">Authorized</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold shadow-subtle transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out of Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
