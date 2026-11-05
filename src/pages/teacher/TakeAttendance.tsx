import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  QrCode, 
  Play, 
  Clock, 
  Sparkles, 
  MapPin, 
  Navigation, 
  AlertCircle,
  Radio,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { GeoLocationConfig } from '../../types';

export const TakeAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { courses, sessions, startAttendanceSession } = useData();

  const myCourses = courses.filter(c => c.teacherId === currentUser?.uid);

  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId || (myCourses[0]?.id || ''));
  const [lectureTopic, setLectureTopic] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<3 | 5>(3);

  // Geofencing state
  const [enableGeofence, setEnableGeofence] = useState<boolean>(false);
  const [geoRadius, setGeoRadius] = useState<number>(50); // 30m, 50m, 100m, 200m
  const [locationName, setLocationName] = useState<string>('Main Classroom / Hall');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Check if an active session is already ongoing
  const existingActiveSession = sessions.find(
    s => s.teacherId === currentUser?.uid && (s.status === 'active' || s.status === 'paused')
  );

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setDetectingLocation(false);
      },
      (err) => {
        setGeoError(`Unable to retrieve GPS coordinates: ${err.message}. Please allow location access in your browser.`);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedCourseId) return;

    if (enableGeofence && !currentCoords) {
      setGeoError('Please acquire your classroom GPS coordinates before starting a geofenced session.');
      return;
    }

    let geofenceConfig: GeoLocationConfig | undefined;
    if (enableGeofence && currentCoords) {
      geofenceConfig = {
        enabled: true,
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
        radiusMeters: geoRadius,
        locationName: locationName.trim() || 'Classroom Hall'
      };
    }

    const newSession = await startAttendanceSession(
      selectedCourseId,
      currentUser.uid,
      lectureTopic.trim() || 'Scheduled Lecture',
      refreshInterval,
      geofenceConfig
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
          Initialize a rotating cryptographic QR session with optional GPS geofencing perimeter.
        </p>
      </div>

      {/* Existing Active Session Alert */}
      {existingActiveSession && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-300 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-teal-700 animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-teal-950 font-mono uppercase">
                Active Session Already Running: {existingActiveSession.courseCode}
              </p>
              <p className="text-xs text-teal-800">
                Topic: {existingActiveSession.lectureTopic} ({existingActiveSession.totalPresent || 0} students recorded)
              </p>
            </div>
          </div>
          <Link
            to={`/teacher/live-session?sessionId=${existingActiveSession.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            <span>Open Session</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-warm-300 p-6 sm:p-7 shadow-card">
        <form onSubmit={handleStart} className="space-y-5">
          {/* Course Selector */}
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1.5">
              Select Course & Cohort
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary font-medium"
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
              Lecture Topic or Unit Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Consensus & Raft Architecture"
              value={lectureTopic}
              onChange={e => setLectureTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs text-navy-900 placeholder-navy-400 focus:outline-none focus:border-primary"
            />
          </div>

          {/* QR Refresh Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-navy-700">
                Anti-Proxy QR Refresh Interval
              </label>
              <span className="text-[10px] font-mono text-navy-500">
                Cryptographic rotation cycle
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  refreshInterval === 3 
                    ? 'border-primary bg-primary-light/50 text-navy-900 font-semibold ring-1 ring-primary' 
                    : 'border-warm-300 bg-surface text-navy-700 hover:bg-warm-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 3}
                    onChange={() => setRefreshInterval(3)}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-xs block font-bold">3 Seconds</span>
                    <span className="text-[10px] text-navy-500 block">Recommended security</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warm-200 text-navy-700">Strict</span>
              </label>

              <label 
                className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  refreshInterval === 5 
                    ? 'border-primary bg-primary-light/50 text-navy-900 font-semibold ring-1 ring-primary' 
                    : 'border-warm-300 bg-surface text-navy-700 hover:bg-warm-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 5}
                    onChange={() => setRefreshInterval(5)}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-xs block font-bold">5 Seconds</span>
                    <span className="text-[10px] text-navy-500 block">Large auditoriums</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warm-200 text-navy-700">Relaxed</span>
              </label>
            </div>
          </div>

          {/* Geofencing Configuration Section */}
          <div className="p-4 rounded-xl bg-warm-100/70 border border-warm-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs font-bold text-navy-900 block">GPS Classroom Geofencing</span>
                  <span className="text-[11px] text-navy-500 block">Enforce physical classroom presence</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enableGeofence} 
                  onChange={e => {
                    setEnableGeofence(e.target.checked);
                    if (e.target.checked && !currentCoords) {
                      detectLocation();
                    }
                  }} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-warm-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-warm-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {enableGeofence ? (
              <div className="space-y-3 pt-3 border-t border-warm-200">
                <p className="text-[11px] text-navy-600 leading-relaxed">
                  Students will be required to be physically within the defined perimeter of your current GPS location when scanning the QR code.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                      Perimeter Radius
                    </label>
                    <select
                      value={geoRadius}
                      onChange={e => setGeoRadius(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-md border border-warm-300 text-xs bg-surface font-mono"
                    >
                      <option value={30}>30 meters (Strict Classroom)</option>
                      <option value={50}>50 meters (Standard Hall)</option>
                      <option value={100}>100 meters (Auditorium / Floor)</option>
                      <option value={200}>200 meters (Department Block)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                      Location Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hall 302 / CS Block"
                      value={locationName}
                      onChange={e => setLocationName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-warm-300 text-xs bg-surface"
                    />
                  </div>
                </div>

                {/* GPS Coordinates Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-warm-300 text-xs shadow-subtle">
                  <div>
                    {currentCoords ? (
                      <div className="font-mono text-[11px] text-emerald-800">
                        <span className="font-bold">✓ Coordinates Locked:</span> {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                      </div>
                    ) : (
                      <span className="text-navy-500 text-[11px] italic">Coordinates not yet acquired</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-warm-200 hover:bg-warm-300 text-navy-800 text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    <Navigation className="h-3 w-3 text-primary" />
                    <span>{detectingLocation ? 'Locating...' : 'Refresh GPS'}</span>
                  </button>
                </div>

                {geoError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>{geoError}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-navy-500">
                Disabled. Attendance can be verified from any location within the QR token rotation window.
              </p>
            )}
          </div>

          {/* Projection Notice */}
          <div className="p-4 rounded-xl bg-warm-100 border border-warm-200 text-xs text-navy-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-navy-900">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Projector-Ready Mode</span>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">
              Starting this session opens the distance-first projector view with live attendee feed, fullscreen support, and privacy masking for student names.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedCourseId || (enableGeofence && !currentCoords)}
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
