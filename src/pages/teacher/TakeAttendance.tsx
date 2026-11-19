import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { GeoLocationConfig, DayOfWeek, TimetableSlot } from '../../types';

export const TakeAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  const preselectedTopic = searchParams.get('topic');
  const preselectedSlotId = searchParams.get('slotId');
  const requestedMode = searchParams.get('mode');
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { 
    courses, 
    subjectAllocations, 
    divisions, 
    timetable, 
    startAttendanceSession,
    getSlotConductStatus 
  } = useData();

  // Mode: regular timetable lecture vs manually scheduled extra lecture
  const [attendanceMode, setAttendanceMode] = useState<'regular' | 'extra'>(
    requestedMode === 'extra' ? 'extra' : (preselectedSlotId ? 'regular' : 'regular')
  );

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayRawIndex = new Date().getDay();
  const todayDayName: DayOfWeek = todayRawIndex === 0 ? 'Monday' : (dayNames[todayRawIndex - 1] || 'Monday');

  // Find all subjects officially allocated to this faculty member by Department Admin
  const myAllocations = subjectAllocations.filter(a => 
    a.teacherId === currentUser?.uid || 
    (currentUser?.email && a.teacherEmail === currentUser.email)
  );
  const allocatedCourseIds = new Set(myAllocations.map(a => a.courseId));

  // Authorized courses only: Faculty can ONLY access courses allocated to them
  const authorizedCourses = currentUser?.role === 'admin'
    ? courses
    : courses.filter(c => 
        c.teacherId === currentUser?.uid || 
        (currentUser?.fullName && c.teacherName === currentUser.fullName) ||
        allocatedCourseIds.has(c.id)
      );

  // Timetable slots for this faculty today
  const myTodaySlots = timetable.filter(t => {
    const isTeacherAssigned = 
      t.teacherId === currentUser?.uid || 
      t.additionalTeacherIds?.includes(currentUser?.uid || '') ||
      t.teacherName === currentUser?.fullName ||
      currentUser?.role === 'admin';
    
    return (t.dayOfWeek === todayDayName || currentUser?.role === 'admin') && isTeacherAssigned && t.sessionType !== 'break';
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find active / eligible slot right now
  const matchedInitialSlot = preselectedSlotId 
    ? myTodaySlots.find(s => s.id === preselectedSlotId)
    : myTodaySlots.find(s => {
        const check = getSlotConductStatus(s, todayDateStr);
        return check.isEligibleForQR;
      }) || myTodaySlots[0];

  const [selectedSlotId, setSelectedSlotId] = useState<string>(matchedInitialSlot?.id || '');

  // Detect URL parameter manipulation
  const isUnauthorizedUrlAttempt = Boolean(
    preselectedCourseId && 
    currentUser?.role !== 'admin' && 
    !authorizedCourses.some(c => c.id === preselectedCourseId)
  );

  const initialCourseId = (!isUnauthorizedUrlAttempt && preselectedCourseId) 
    ? preselectedCourseId 
    : (matchedInitialSlot?.courseId || authorizedCourses[0]?.id || '');

  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(matchedInitialSlot?.divisionId || '');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [lectureTopic, setLectureTopic] = useState<string>(preselectedTopic || '');
  const [refreshInterval, setRefreshInterval] = useState<3 | 5>(3);

  // Extra Lecture Specific Form State
  const [extraDate, setExtraDate] = useState<string>(todayDateStr);
  const [extraStartTime, setExtraStartTime] = useState<string>(() => new Date().toTimeString().slice(0, 5));
  const [extraEndTime, setExtraEndTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toTimeString().slice(0, 5);
  });
  const [extraRoom, setExtraRoom] = useState<string>('Lecture Hall');

  // Keep selectedCourseId in sync once authorized courses load
  useEffect(() => {
    if (!selectedCourseId && authorizedCourses.length > 0) {
      setSelectedCourseId(authorizedCourses[0].id);
    }
  }, [authorizedCourses, selectedCourseId]);

  // Sync when selectedSlotId changes
  useEffect(() => {
    if (attendanceMode === 'regular' && selectedSlotId) {
      const slot = myTodaySlots.find(s => s.id === selectedSlotId);
      if (slot) {
        if (slot.courseId) setSelectedCourseId(slot.courseId);
        if (slot.divisionId) setSelectedDivisionId(slot.divisionId);
        if (!lectureTopic) setLectureTopic(slot.notes || slot.courseName || '');
      }
    }
  }, [selectedSlotId, attendanceMode, myTodaySlots, lectureTopic]);

  // Sync division/batch whenever selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;
    const matchingAlloc = myAllocations.find(a => a.courseId === selectedCourseId);
    if (matchingAlloc) {
      if (!selectedDivisionId) setSelectedDivisionId(matchingAlloc.divisionId || '');
      setSelectedBatch(matchingAlloc.batch || 'All');
    } else {
      const course = courses.find(c => c.id === selectedCourseId);
      if (course?.divisionId && !selectedDivisionId) {
        setSelectedDivisionId(course.divisionId);
      }
    }
  }, [selectedCourseId, myAllocations, courses, selectedDivisionId]);

  // Selected slot eligibility check
  const activeSlot = myTodaySlots.find(s => s.id === selectedSlotId);
  const activeSlotEligibility = activeSlot 
    ? getSlotConductStatus(activeSlot, todayDateStr) 
    : null;

  // Geofencing state
  const [enableGeofence, setEnableGeofence] = useState<boolean>(false);
  const [geoRadius, setGeoRadius] = useState<number>(50); // 50m, 100m, 200m
  const [locationName, setLocationName] = useState<string>('Main Classroom / Hall');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Execution state
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

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
        setGeoError(`Unable to retrieve location: ${err.message}. Please allow location access in your browser.`);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setStartError('Please log in before starting an attendance session.');
      return;
    }

    const courseToStart = selectedCourseId || authorizedCourses[0]?.id;
    if (!courseToStart) {
      setStartError('No authorized subjects found. You can only start attendance for subjects assigned to you by the Department Admin.');
      return;
    }

    // Timetable eligibility enforcement for regular mode
    if (attendanceMode === 'regular') {
      if (!activeSlot) {
        setStartError('No scheduled timetable slot selected. Please select a valid lecture or switch to "Take Extra Lecture".');
        return;
      }
      if (activeSlotEligibility && !activeSlotEligibility.isEligibleForQR && currentUser.role !== 'admin') {
        setStartError(`Schedule Restriction: ${activeSlotEligibility.eligibilityReason}`);
        return;
      }
    } else {
      // Extra lecture time check
      if (extraStartTime >= extraEndTime) {
        setStartError('Invalid Extra Lecture Time: Start time must be earlier than end time.');
        return;
      }
    }

    if (enableGeofence && !currentCoords) {
      setGeoError('Classroom GPS coordinates are required when Geofencing is enabled. Tap "Refresh GPS" to acquire location, or toggle off geofencing.');
      return;
    }

    setIsStarting(true);
    setStartError(null);

    try {
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

      const isExtra = attendanceMode === 'extra';
      const newSession = await startAttendanceSession(
        courseToStart,
        currentUser.uid,
        isExtra ? `[EXTRA LECTURE] ${lectureTopic || 'Extra Academic Session'}` : (lectureTopic || activeSlot?.courseName || 'Lecture Session'),
        refreshInterval,
        geofenceConfig,
        selectedDivisionId || undefined,
        selectedBatch || 'All',
        {
          sessionCategory: isExtra ? 'extra' : 'regular',
          timetableSlotId: isExtra ? undefined : activeSlot?.id,
          lectureDate: isExtra ? extraDate : todayDateStr,
          scheduledStartTime: isExtra ? extraStartTime : activeSlot?.startTime,
          scheduledEndTime: isExtra ? extraEndTime : activeSlot?.endTime,
          room: isExtra ? extraRoom : activeSlot?.room
        }
      );

      // Redirect immediately to Dedicated Classroom Live Projection Screen
      navigate(`/teacher/live-session?sessionId=${newSession.id}`);
    } catch (err: any) {
      console.error('Failed to start attendance session:', err);
      setStartError(err.message || 'Unable to start session. Please try again.');
      setIsStarting(false);
    }
  };

  // If faculty has NO authorized subjects allocated
  if (currentUser?.role !== 'admin' && authorizedCourses.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-navy-900">
            No Assigned Subjects Found
          </h1>
          <p className="text-xs text-navy-600 max-w-md mx-auto leading-relaxed">
            You do not currently have any academic subjects assigned to your faculty profile. In accordance with institutional policy, attendance can only be conducted for subjects officially allocated to you by your Department Administrator.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-warm-100 border border-warm-300 text-left text-xs space-y-2 max-w-md mx-auto">
          <span className="font-semibold text-navy-900 block">Required Next Steps:</span>
          <ul className="list-disc list-inside space-y-1 text-navy-600">
            <li>Contact your Department Head (HOD) or Academic Administrator.</li>
            <li>Request subject and division allocation in the Admin Governance portal.</li>
            <li>Once assigned, your subjects will instantly appear here ready for attendance.</li>
          </ul>
        </div>
        <div className="pt-2">
          <Link
            to="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface border border-warm-300 text-navy-800 text-xs font-semibold hover:bg-warm-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Faculty Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const selectedAlloc = myAllocations.find(a => a.courseId === selectedCourseId);
  const selectedDiv = divisions.find(d => d.id === selectedDivisionId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. Header with Mode Switcher */}
      <div className="border-b border-warm-300 pb-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
              ATTENDANCE DISPATCH
            </span>
            <span className="text-xs text-navy-400">&bull;</span>
            <span className="text-[11px] font-mono text-teal-800 font-medium">
              {attendanceMode === 'regular' ? 'Timetable-Driven Mode' : 'Extra Lecture Mode'}
            </span>
          </div>

          <Link
            to="/teacher/dashboard"
            className="text-xs text-navy-600 hover:text-navy-900 inline-flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-navy-900">
          Launch Live Attendance Session
        </h1>
        <p className="text-xs text-navy-600 mt-1">
          {attendanceMode === 'regular'
            ? 'Generate dynamic rotating QR codes for your scheduled timetable lectures.'
            : 'Schedule and conduct a separate extra or compensatory class without altering the official timetable.'}
        </p>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={() => setAttendanceMode('regular')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-all ${
              attendanceMode === 'regular'
                ? 'bg-navy-900 text-white border-navy-900 shadow-subtle'
                : 'bg-surface text-navy-700 border-warm-300 hover:bg-warm-100'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
            <span>Regular Timetable Class</span>
          </button>

          <button
            type="button"
            onClick={() => setAttendanceMode('extra')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-all ${
              attendanceMode === 'extra'
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-surface text-navy-700 border-warm-300 hover:bg-warm-100'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
            <span>Take Extra Lecture</span>
          </button>
        </div>
      </div>

      {/* URL Parameter Manipulation Alert */}
      {isUnauthorizedUrlAttempt && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Unauthorized Subject Access Intercepted</span>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Subject ID <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">{preselectedCourseId}</code> is not allocated to your faculty account. Access has been restricted to your officially assigned curriculum below.
            </p>
          </div>
        </div>
      )}

      {startError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{startError}</span>
        </div>
      )}

      {/* REGULAR TIMETABLE MODE: ELIGIBILITY CHECK */}
      {attendanceMode === 'regular' && (
        myTodaySlots.length === 0 ? (
          <div className="p-5 rounded-xl bg-warm-100 border border-warm-300 text-xs space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-navy-500" />
              <span className="font-bold text-navy-900">No Timetable Lectures Scheduled For You Today</span>
            </div>
            <p className="text-navy-600 leading-relaxed">
              Under strict timetable-driven attendance rules, regular QR attendance is only accessible when you have an active scheduled slot. If you are conducting a compensatory or additional lecture, switch to <strong>&ldquo;Take Extra Lecture&rdquo;</strong> mode.
            </p>
            <button
              type="button"
              onClick={() => setAttendanceMode('extra')}
              className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Switch to Take Extra Lecture</span>
            </button>
          </div>
        ) : (
          /* Slot Selector */
          <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
            <label className="text-xs font-semibold text-navy-900 block">
              Select Scheduled Lecture Slot Today ({todayDayName})
            </label>
            <select
              value={selectedSlotId}
              onChange={e => setSelectedSlotId(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-surface text-navy-900 font-medium focus:outline-none focus:border-primary"
            >
              {myTodaySlots.map(s => {
                const check = getSlotConductStatus(s, todayDateStr);
                const statusTag = check.status === 'IN_PROGRESS' 
                  ? ' [LIVE NOW]' 
                  : check.status === 'COMPLETED' 
                  ? ' [COMPLETED]' 
                  : check.status === 'CANCELLED'
                  ? ' [CANCELLED]'
                  : check.status === 'NOT_CONDUCTED'
                  ? ' [NOT CONDUCTED]'
                  : ` [${s.startTime}]`;

                return (
                  <option key={s.id} value={s.id}>
                    {s.courseCode} — {s.courseName} ({s.startTime}–{s.endTime}) &bull; {s.divisionName || 'Class'}{statusTag}
                  </option>
                );
              })}
            </select>

            {/* Real-time Eligibility Status Notice */}
            {activeSlotEligibility && (
              <div className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                activeSlotEligibility.isEligibleForQR
                  ? 'bg-teal-50 border-teal-200 text-teal-900'
                  : 'bg-warm-100 border-warm-300 text-navy-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 shrink-0 ${activeSlotEligibility.isEligibleForQR ? 'text-primary' : 'text-navy-400'}`} />
                  <span className="font-medium">{activeSlotEligibility.eligibilityReason}</span>
                </div>
                {!activeSlotEligibility.isEligibleForQR && (
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('extra')}
                    className="text-primary font-bold hover:underline shrink-0 text-[11px]"
                  >
                    Take Extra Lecture &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* 2. Configuration Form */}
      <div className="bg-surface rounded-xl border border-warm-300 p-6 shadow-subtle">
        <form onSubmit={handleStart} className="space-y-5">
          {/* Mode Indicator Banner */}
          <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-navy-900">
              Session Mode: <strong className="text-primary font-mono uppercase">{attendanceMode === 'regular' ? 'Regular Timetable Slot' : 'Manual Extra Lecture'}</strong>
            </span>
            <span className="text-[11px] font-mono text-navy-500">
              {attendanceMode === 'regular' ? 'Auto-synced with timetable' : 'Stored separately without modifying timetable'}
            </span>
          </div>

          {/* Course Selector (Only assigned subjects) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-navy-700 block">
                Assigned Subject <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {authorizedCourses.length} Authorized
              </span>
            </div>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              disabled={attendanceMode === 'regular' && !!activeSlot}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary font-medium disabled:bg-warm-100 disabled:text-navy-600"
              required
            >
              {authorizedCourses.map(c => {
                const alloc = myAllocations.find(a => a.courseId === c.id);
                const tag = alloc?.divisionName ? ` [${alloc.divisionName} • ${alloc.batch || 'All'}]` : '';
                return (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.courseName}{tag}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Division & Batch Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-navy-700 block mb-1">
                Target Division
              </label>
              <select
                value={selectedDivisionId}
                onChange={e => setSelectedDivisionId(e.target.value)}
                disabled={attendanceMode === 'regular' && !!activeSlot?.divisionId}
                className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary disabled:bg-warm-100"
              >
                {divisions.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.departmentName} — {d.name} ({d.yearOfStudy})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-navy-700 block mb-1">
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
              >
                <option value="All">Full Class (All Students)</option>
                <option value="Batch 1">Batch 1</option>
                <option value="Batch 2">Batch 2</option>
                <option value="Batch 3">Batch 3</option>
                <option value="Batch 4">Batch 4</option>
              </select>
            </div>
          </div>

          {/* Extra Lecture Time Controls (Visible in Extra Lecture Mode) */}
          {attendanceMode === 'extra' && (
            <div className="p-4 rounded-xl bg-warm-100/70 border border-warm-200 space-y-3">
              <span className="text-xs font-bold text-navy-900 block font-mono uppercase tracking-wider">
                Extra Lecture Timing Bounds
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                    Lecture Date
                  </label>
                  <input
                    type="date"
                    value={extraDate}
                    onChange={e => setExtraDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-lg border border-warm-300 text-xs bg-surface font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={extraStartTime}
                    onChange={e => setExtraStartTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-lg border border-warm-300 text-xs bg-surface font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={extraEndTime}
                    onChange={e => setExtraEndTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-lg border border-warm-300 text-xs bg-surface font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                  Classroom / Hall
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab 402"
                  value={extraRoom}
                  onChange={e => setExtraRoom(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-warm-300 text-xs bg-surface"
                />
              </div>
            </div>
          )}

          {/* Lecture Topic */}
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1.5">
              Lecture Topic or Unit Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Consensus & Paxos Protocol Overview"
              value={lectureTopic}
              onChange={e => setLectureTopic(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs text-navy-900 focus:outline-none focus:border-primary"
            />
          </div>

          {/* QR Refresh Configuration */}
          <div>
            <label className="text-xs font-semibold text-navy-700 block mb-1.5">
              Anti-Proxy QR Refresh Interval
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label 
                className={`p-3 min-h-[46px] rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  refreshInterval === 3 
                    ? 'border-primary bg-teal-50/50 text-navy-900 font-semibold ring-1 ring-primary/20' 
                    : 'border-warm-300 bg-surface text-navy-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 3}
                    onChange={() => setRefreshInterval(3)}
                    className="accent-primary"
                  />
                  <span className="text-xs">3 Seconds (Standard)</span>
                </div>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-warm-200">High Security</span>
              </label>

              <label 
                className={`p-3 min-h-[46px] rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  refreshInterval === 5 
                    ? 'border-primary bg-teal-50/50 text-navy-900 font-semibold ring-1 ring-primary/20' 
                    : 'border-warm-300 bg-surface text-navy-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="interval"
                    checked={refreshInterval === 5}
                    onChange={() => setRefreshInterval(5)}
                    className="accent-primary"
                  />
                  <span className="text-xs">5 Seconds</span>
                </div>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-warm-200">Large Hall</span>
              </label>
            </div>
          </div>

          {/* Geofencing Configuration Section */}
          <div className="p-4 rounded-lg bg-warm-100/70 border border-warm-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-navy-900">
                  GPS Classroom Geofencing
                </span>
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
                <div className="w-9 h-5 bg-warm-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-warm-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {enableGeofence ? (
              <div className="space-y-3 pt-2 border-t border-warm-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                      Hall / Room Name
                    </label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={e => setLocationName(e.target.value)}
                      placeholder="e.g. Lab 402 or Main Auditorium"
                      className="w-full px-2.5 py-1.5 rounded border border-warm-300 text-xs text-navy-900 bg-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-navy-700 block mb-1">
                      Allowed Radius
                    </label>
                    <select
                      value={geoRadius}
                      onChange={e => setGeoRadius(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-warm-300 text-xs text-navy-900 bg-surface focus:outline-none focus:border-primary"
                    >
                      <option value={30}>30 meters (Strict Classroom)</option>
                      <option value={50}>50 meters (Standard Hall)</option>
                      <option value={100}>100 meters (Auditorium / Building)</option>
                      <option value={200}>200 meters (Campus Wing)</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-surface border border-warm-200 flex items-center justify-between text-xs">
                  <div>
                    {currentCoords ? (
                      <div className="font-mono text-xs text-teal-800">
                        <span className="font-bold">✓ Coordinates Locked:</span> {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                      </div>
                    ) : (
                      <span className="text-navy-500 text-xs italic">Coordinates not yet acquired</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[36px] rounded bg-warm-200 hover:bg-warm-300 text-navy-800 text-xs font-semibold transition-colors"
                  >
                    <Navigation className="h-3 w-3 text-primary" />
                    <span>{detectingLocation ? 'Locating...' : 'Refresh GPS'}</span>
                  </button>
                </div>

                {geoError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>{geoError}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-navy-500">
                Disabled. Attendance can be marked from any location within the QR rotation window.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isStarting || 
                (!selectedCourseId && authorizedCourses.length === 0) ||
                (attendanceMode === 'regular' && activeSlotEligibility && !activeSlotEligibility.isEligibleForQR && currentUser?.role !== 'admin')
              }
              className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold shadow-subtle transition-all active:scale-95 disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Initializing Live QR Session...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {attendanceMode === 'extra' 
                      ? 'Launch Extra Lecture & Project QR' 
                      : (activeSlotEligibility && !activeSlotEligibility.isEligibleForQR && currentUser?.role !== 'admin')
                      ? `Slot Locked (${activeSlot?.startTime})`
                      : 'Start Timetable Attendance & Project QR'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};