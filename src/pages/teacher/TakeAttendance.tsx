import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  QrCode, 
  Play, 
  Clock, 
  MapPin, 
  Navigation, 
  AlertCircle,
  Radio,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Monitor
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
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
            ROLL CALL INITIALIZER
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Launch Live Attendance Session
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Initialize a rotating cryptographic QR session with optional GPS geofencing perimeter for classroom roll call.
        </p>
      </div>

      {/* Existing Active Session Alert */}
      {existingActiveSession && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-blue-700 dark:text-blue-400 animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-950 dark:text-blue-200 font-mono uppercase">
                Active Session In Progress: {existingActiveSession.courseCode}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Topic: {existingActiveSession.lectureTopic} ({existingActiveSession.totalPresent || 0} students recorded)
              </p>
            </div>
          </div>
          <Link
            to={`/teacher/live-session?sessionId=${existingActiveSession.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
          >
            <span>Open Session Console</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm transition-colors">
        <form onSubmit={handleStart} className="space-y-5">
          {/* Course Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Target Course & Cohort Roster <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-medium"
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Lecture Topic or Unit Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Unit 3: Distributed Consensus & Raft Architecture"
              value={lectureTopic}
              onChange={e => setLectureTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* QR Refresh Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Anti-Proxy Cryptographic Rotation Cycle
              </label>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Prevents photo sharing
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  refreshInterval === 3 
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-slate-900 dark:text-white font-semibold' 
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 3}
                    onChange={() => setRefreshInterval(3)}
                    className="accent-blue-600"
                  />
                  <div>
                    <span className="text-xs block font-bold">3 Seconds</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Strict anti-proxy rotation</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">Recommended</span>
              </label>

              <label 
                className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  refreshInterval === 5 
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-slate-900 dark:text-white font-semibold' 
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 5}
                    onChange={() => setRefreshInterval(5)}
                    className="accent-blue-600"
                  />
                  <div>
                    <span className="text-xs block font-bold">5 Seconds</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Auditoriums / large cohorts</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">Relaxed</span>
              </label>
            </div>
          </div>

          {/* Geofencing Configuration Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Classroom GPS Geofencing</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Enforce physical lecture hall attendance</span>
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
                <div className="w-10 h-5 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {enableGeofence ? (
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Students will be required to be physically within the defined perimeter of your current GPS location when scanning the QR code.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Perimeter Radius
                    </label>
                    <select
                      value={geoRadius}
                      onChange={e => setGeoRadius(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    >
                      <option value={30}>30 meters (Strict Classroom)</option>
                      <option value={50}>50 meters (Standard Hall)</option>
                      <option value={100}>100 meters (Auditorium / Floor)</option>
                      <option value={200}>200 meters (Department Block)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Classroom / Hall Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hall 302 / CS Block"
                      value={locationName}
                      onChange={e => setLocationName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* GPS Coordinates Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                  <div>
                    {currentCoords ? (
                      <div className="font-mono text-[11px] text-emerald-800 dark:text-emerald-400">
                        <span className="font-bold">✓ Coordinates Locked:</span> {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] italic">Coordinates not yet acquired</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    <Navigation className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span>{detectingLocation ? 'Locating...' : 'Refresh GPS'}</span>
                  </button>
                </div>

                {geoError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-800 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>{geoError}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Disabled. Attendance is cryptographically validated without GPS perimeter restriction.
              </p>
            )}
          </div>

          {/* Projector Notice */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Projector-Ready Mode</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Starting this session opens the distance-first projector view with live attendee ticker, fullscreen mode, and privacy masking for student names.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedCourseId || (enableGeofence && !currentCoords)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Session & Open Live Console</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
