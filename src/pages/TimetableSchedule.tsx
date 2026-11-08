import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3,
  MapPin, 
  BookOpen, 
  User, 
  Sparkles, 
  Check, 
  Building,
  Layers,
  ArrowRight,
  AlertTriangle,
  Copy,
  Coffee,
  FlaskConical,
  GraduationCap,
  Users,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Palmtree,
  CheckCircle2,
  X,
  Eye,
  Filter
} from 'lucide-react';
import { DayOfWeek, TimetableSlot, SessionType, YearOfStudy } from '../types';

export const TimetableSchedule: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    courses, 
    timetable, 
    departments,
    divisions,
    organizationUsers,
    addTimetableSlot, 
    updateTimetableSlot,
    deleteTimetableSlot, 
    clearDivisionTimetable,
    publishDivisionTimetable,
    unpublishDivisionTimetable,
    copyDayTimetable,
    copyDivisionTimetable,
    checkFacultyAvailability,
    validateTimetableConflicts,
    dayConfigs,
    setDayConfig,
    enrollments 
  } = useData();

  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  const canManage = isAdmin || isTeacher;

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Main Mode Tabs (for Admin/Teacher: Builder vs. Personal Agenda)
  const [activeMainTab, setActiveMainTab] = useState<'division_builder' | 'personal_agenda' | 'week_matrix'>(
    isStudent ? 'division_builder' : 'division_builder'
  );

  // Hierarchy Selection State
  const initialDept = currentUser?.department && departments.some(d => d.name === currentUser.department)
    ? currentUser.department
    : departments[0]?.name || 'Computer Engineering';
    
  const [selectedDept, setSelectedDept] = useState<string>(initialDept);
  const [selectedYearOfStudy, setSelectedYearOfStudy] = useState<YearOfStudy>('Third Year');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026–27');

  // Filter divisions matching selected department and year of study
  const matchingDivisions = useMemo(() => {
    return divisions.filter(div => {
      const deptMatches = div.departmentName?.toLowerCase().trim() === selectedDept.toLowerCase().trim() ||
                          selectedDept.toLowerCase().includes(div.departmentName?.toLowerCase() || '') ||
                          div.departmentName?.toLowerCase().includes(selectedDept.toLowerCase());
      const yearMatches = div.yearOfStudy === selectedYearOfStudy;
      return deptMatches && yearMatches;
    });
  }, [divisions, selectedDept, selectedYearOfStudy]);

  // Selected Division (default to student's division or first matching)
  const initialDivId = isStudent && currentUser?.divisionId
    ? currentUser.divisionId
    : matchingDivisions[0]?.id || divisions[0]?.id || 'div_comp_te_a';

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(initialDivId);

  // Keep division updated if matching divisions change
  const currentDivision = useMemo(() => {
    return divisions.find(d => d.id === selectedDivisionId) || matchingDivisions[0] || divisions[0];
  }, [divisions, selectedDivisionId, matchingDivisions]);

  // Day Selection
  const todayRawIndex = new Date().getDay(); // 0 is Sunday
  const todayDayName: DayOfWeek = todayRawIndex === 0 ? 'Monday' : (days[todayRawIndex - 1] || 'Monday');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDayName);

  // Mobile Swipe Navigation between weekdays
  const handlePrevDay = () => {
    const currentIndex = days.indexOf(selectedDay);
    const prevIndex = (currentIndex - 1 + days.length) % days.length;
    setSelectedDay(days[prevIndex]);
  };

  const handleNextDay = () => {
    const currentIndex = days.indexOf(selectedDay);
    const nextIndex = (currentIndex + 1) % days.length;
    setSelectedDay(days[nextIndex]);
  };

  // Touch gesture tracking for smooth mobile swipe
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe with minimal threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNextDay();
      } else {
        handlePrevDay();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Modal State for Adding / Editing Sessions
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  
  // Session Form State
  const [formSessionType, setFormSessionType] = useState<SessionType>('lecture');
  const [formStartTime, setFormStartTime] = useState('09:15');
  const [formEndTime, setFormEndTime] = useState('10:15');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formAdditionalTeacherIds, setFormAdditionalTeacherIds] = useState<string[]>([]);
  const [formRoom, setFormRoom] = useState('Hall 301');
  const [formNotes, setFormNotes] = useState('');
  const [showAllFaculty, setShowAllFaculty] = useState(false);

  // Copy Day / Division Modals
  const [copyDayModalOpen, setCopyDayModalOpen] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<DayOfWeek>('Monday');
  const [copyDivModalOpen, setCopyDivModalOpen] = useState(false);
  const [copySourceDivId, setCopySourceDivId] = useState<string>('');

  // Conflict Alert Drawer
  const [conflictErrors, setConflictErrors] = useState<string[]>([]);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);

  // Form submission feedback
  const [savingSession, setSavingSession] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Filter department courses with robust normalization
  const availableCourses = useMemo(() => {
    const sDept = (selectedDept || '').toLowerCase().replace(/science|and|&/g, '').trim();
    const list = courses.filter(c => {
      const cDept = (c.department || '').toLowerCase().replace(/science|and|&/g, '').trim();
      return cDept.includes(sDept) || sDept.includes(cDept) || c.departmentId === currentDivision?.departmentId;
    });
    return list.length > 0 ? list : courses;
  }, [courses, selectedDept, currentDivision]);

  // Faculty pool for this department
  const departmentFaculty = useMemo(() => {
    return organizationUsers.filter(u => {
      if (u.role !== 'teacher' && u.role !== 'admin') return false;
      return true; // allow selecting any faculty member in the institute
    });
  }, [organizationUsers]);

  // Slots for current division
  const currentDivisionSlots = useMemo(() => {
    const divId = currentDivision?.id;
    return timetable.filter(s => s.divisionId === divId);
  }, [timetable, currentDivision]);

  // Status of current division timetable
  const isDivisionPublished = useMemo(() => {
    if (currentDivisionSlots.length === 0) return false;
    return currentDivisionSlots.every(s => s.status === 'published');
  }, [currentDivisionSlots]);

  // Slots for the active selected day
  const activeDaySlots = useMemo(() => {
    return currentDivisionSlots
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [currentDivisionSlots, selectedDay]);

  // Current Day Working vs Holiday Status
  const currentDayConfigKey = `${currentDivision?.id}_${selectedDay}`;
  const isDayHoliday = dayConfigs[currentDayConfigKey]?.isWorkingDay === false;
  const holidayReason = dayConfigs[currentDayConfigKey]?.holidayReason || 'Academic Holiday';

  // Smart Faculty Availability in Modal
  const facultyAvailabilityList = useMemo(() => {
    return departmentFaculty.map(faculty => {
      const check = checkFacultyAvailability(
        faculty.uid, 
        selectedDay, 
        formStartTime, 
        formEndTime, 
        editingSlotId || undefined
      );
      return {
        faculty,
        isAvailable: check.available,
        reason: check.conflictReason
      };
    });
  }, [departmentFaculty, selectedDay, formStartTime, formEndTime, editingSlotId, checkFacultyAvailability]);

  const availableFacultyOnly = facultyAvailabilityList.filter(f => f.isAvailable);

  // Time overlap helper
  const isTimeOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
    return startA < endB && endA > startB;
  };

  // Calculate live conflict check inside the modal
  const liveModalConflict = useMemo(() => {
    if (formSessionType === 'break') return null;

    // Time validation
    if (formStartTime >= formEndTime) {
      return 'Start time must be strictly earlier than end time.';
    }

    // Overlap within the same division on this day
    const overlapSlot = activeDaySlots.find(s => {
      if (editingSlotId && s.id === editingSlotId) return false;
      return isTimeOverlap(formStartTime, formEndTime, s.startTime, s.endTime);
    });

    if (overlapSlot) {
      const name = overlapSlot.sessionType === 'break' 
        ? `Break (${overlapSlot.notes || 'Break'})` 
        : `${overlapSlot.courseCode || 'Session'} (${overlapSlot.startTime}–${overlapSlot.endTime})`;
      return `This slot overlaps with an existing ${name} in this division.`;
    }

    // Selected Faculty Availability Check
    if (formTeacherId) {
      const target = facultyAvailabilityList.find(f => f.faculty.uid === formTeacherId);
      if (target && !target.isAvailable) {
        return `Selected Faculty Conflict: ${target.faculty.fullName} is ${target.reason}`;
      }
    }

    // Room conflict check (only against OTHER divisions)
    if (formRoom.trim()) {
      const cleanRoom = formRoom.trim().toLowerCase();
      const roomClash = timetable.find(s => {
        if (editingSlotId && s.id === editingSlotId) return false;
        if (s.divisionId === currentDivision?.id) return false;
        if (s.dayOfWeek !== selectedDay) return false;
        if (!s.room || s.room.trim().toLowerCase() !== cleanRoom) return false;
        return isTimeOverlap(formStartTime, formEndTime, s.startTime, s.endTime);
      });

      if (roomClash) {
        return `Room Conflict: "${formRoom}" is already reserved on ${selectedDay} (${roomClash.startTime}–${roomClash.endTime}) by ${roomClash.divisionName || 'another class'}.`;
      }
    }

    return null;
  }, [formSessionType, formStartTime, formEndTime, activeDaySlots, editingSlotId, formTeacherId, facultyAvailabilityList, formRoom, timetable, selectedDay, currentDivision]);

  // Open Create Modal
  const handleOpenCreateModal = (type: SessionType = 'lecture') => {
    setEditingSlotId(null);
    setFormSessionType(type);
    setFormSubmitError(null);
    
    // Auto calculate smart next start time
    let nextStart = '09:15';
    let nextEnd = type === 'practical' ? '11:15' : type === 'break' ? '09:30' : '10:15';

    if (activeDaySlots.length > 0) {
      const sorted = [...activeDaySlots].sort((a, b) => a.endTime.localeCompare(b.endTime));
      const lastSlot = sorted[sorted.length - 1];
      nextStart = lastSlot.endTime;

      const [h, m] = lastSlot.endTime.split(':').map(Number);
      const addMins = type === 'practical' ? 120 : type === 'break' ? 15 : 60;
      const totalMins = h * 60 + m + addMins;
      const endH = String(Math.floor(totalMins / 60)).padStart(2, '0');
      const endM = String(totalMins % 60).padStart(2, '0');
      nextEnd = `${endH}:${endM}`;
    }

    setFormStartTime(nextStart);
    setFormEndTime(nextEnd);

    // Default course
    const defaultCourse = availableCourses[0];
    setFormCourseId(defaultCourse?.id || '');

    // Default teacher: check who is available for this time slot!
    const available = departmentFaculty.filter(f => {
      const chk = checkFacultyAvailability(f.uid, selectedDay, nextStart, nextEnd);
      return chk.available;
    });

    if (available.length > 0) {
      const preferred = available.find(f => f.uid === defaultCourse?.teacherId);
      setFormTeacherId(preferred ? preferred.uid : available[0].uid);
    } else {
      setFormTeacherId(defaultCourse?.teacherId || departmentFaculty[0]?.uid || '');
    }

    setFormAdditionalTeacherIds([]);
    setFormRoom(type === 'practical' ? 'Computer Lab 1' : 'Hall 301');
    setFormNotes(type === 'break' ? 'Recess / Break' : '');
    setShowAllFaculty(false);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setFormSubmitError(null);
    setFormSessionType(slot.sessionType || 'lecture');
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormCourseId(slot.courseId || '');
    setFormTeacherId(slot.teacherId || '');
    setFormAdditionalTeacherIds(slot.additionalTeacherIds || []);
    setFormRoom(slot.room || 'Hall 301');
    setFormNotes(slot.notes || '');
    setShowAllFaculty(false);
    setModalOpen(true);
  };

  // Save Session (Add / Edit)
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitError(null);

    // Immediate sanity checks
    if (formStartTime >= formEndTime) {
      setFormSubmitError('Start time must be strictly earlier than end time.');
      return;
    }

    if (liveModalConflict) {
      setFormSubmitError(liveModalConflict);
      return;
    }

    const course = courses.find(c => c.id === formCourseId);
    const teacher = organizationUsers.find(u => u.uid === formTeacherId);

    const slotPayload: Omit<TimetableSlot, 'id'> = {
      dayOfWeek: selectedDay,
      sessionType: formSessionType,
      startTime: formStartTime,
      endTime: formEndTime,
      room: formSessionType === 'break' ? undefined : (formRoom.trim() || 'Hall 301'),
      notes: formNotes.trim(),
      organizationId: currentUser?.organizationId || 'org_apex_tech',
      organizationCode: currentUser?.organizationCode || 'APEX101',
      department: currentDivision?.departmentName || selectedDept,
      departmentId: currentDivision?.departmentId || 'dept_comp',
      divisionId: currentDivision?.id || selectedDivisionId,
      divisionName: currentDivision?.name || 'Division A',
      yearOfStudy: currentDivision?.yearOfStudy || selectedYearOfStudy,
      academicYear: selectedAcademicYear,
      semester: course?.semester || '6th Semester',
      status: 'draft',
      ...(formSessionType !== 'break' ? {
        courseId: course?.id || formCourseId || `course_${Date.now()}`,
        courseCode: course?.courseCode || 'SUB',
        courseName: course?.courseName || 'Lecture Session',
        teacherId: teacher?.uid || formTeacherId || departmentFaculty[0]?.uid || 'teacher_prof_sharma',
        teacherName: teacher?.fullName || 'Assigned Faculty',
        additionalTeacherIds: formAdditionalTeacherIds,
        additionalTeacherNames: formAdditionalTeacherIds.map(id => {
          const u = organizationUsers.find(usr => usr.uid === id);
          return u ? u.fullName : 'Co-Instructor';
        })
      } : {})
    };

    setSavingSession(true);
    try {
      if (editingSlotId) {
        await updateTimetableSlot(editingSlotId, slotPayload);
      } else {
        await addTimetableSlot(slotPayload);
      }
      setModalOpen(false);
      setPublishSuccessMsg(`Session added successfully to ${selectedDay}!`);
      setTimeout(() => setPublishSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error saving timetable slot:', err);
      setFormSubmitError(err?.message || 'Failed to save session.');
    } finally {
      setSavingSession(false);
    }
  };

  // Publish Whole Division Timetable with Conflict Validation
  const handlePublishTimetable = async () => {
    if (currentDivisionSlots.length === 0) {
      setConflictErrors(['No sessions are scheduled for this division yet. Please add at least one lecture or practical session before publishing.']);
      setConflictModalOpen(true);
      return;
    }

    setIsPublishing(true);
    try {
      const conflicts = validateTimetableConflicts(currentDivisionSlots);
      if (conflicts.hasConflicts) {
        setConflictErrors(conflicts.errors);
        setConflictModalOpen(true);
        return;
      }

      const targetDivId = currentDivision?.id || selectedDivisionId;
      await publishDivisionTimetable(targetDivId);
      setPublishSuccessMsg(`Timetable for ${currentDivision?.name || 'this division'} (${currentDivisionSlots.length} sessions) published successfully! Students can now access their official schedule.`);
      setTimeout(() => setPublishSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setConflictErrors([err?.message || 'Failed to publish timetable. Please try again.']);
      setConflictModalOpen(true);
    } finally {
      setIsPublishing(false);
    }
  };

  // Toggle Holiday for Selected Day
  const handleToggleHoliday = async () => {
    const willBeHoliday = !isDayHoliday;
    await setDayConfig(
      currentDivision?.id || selectedDivisionId,
      selectedDay,
      !willBeHoliday,
      willBeHoliday ? 'Institutional Holiday / No Classes' : undefined
    );
  };

  // Execute Copy Day
  const handleExecuteCopyDay = async () => {
    if (!currentDivision) return;
    const count = await copyDayTimetable(copySourceDay, selectedDay, currentDivision.id);
    setCopyDayModalOpen(false);
    setPublishSuccessMsg(`Copied ${count} sessions from ${copySourceDay} to ${selectedDay}! Review and adjust slots as needed.`);
    setTimeout(() => setPublishSuccessMsg(null), 4000);
  };

  // Execute Copy Division
  const handleExecuteCopyDivision = async () => {
    if (!currentDivision || !copySourceDivId) return;
    const count = await copyDivisionTimetable(copySourceDivId, currentDivision.id);
    setCopyDivModalOpen(false);
    setPublishSuccessMsg(`Copied full weekly schedule (${count} sessions) into ${currentDivision.name}! Saved as draft for review.`);
    setTimeout(() => setPublishSuccessMsg(null), 4000);
  };

  // Personal Faculty Schedule
  const personalTeacherSlots = useMemo(() => {
    if (!isTeacher && !isAdmin) return [];
    return timetable
      .filter(s => s.teacherId === currentUser?.uid || s.additionalTeacherIds?.includes(currentUser?.uid || ''))
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, isTeacher, isAdmin, currentUser, selectedDay]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      {/* Top Header Banner */}
      <div className="p-6 rounded-xl bg-surface border border-warm-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              <span>ACADEMIC SCHEDULE & ROUTINE ENGINE</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              isDivisionPublished 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {isDivisionPublished ? 'PUBLISHED' : 'DRAFT IN PROGRESS'}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-primary" />
            <span>Master Timetable Builder</span>
          </h1>

          <p className="text-xs text-navy-600 mt-1">
            {isStudent 
              ? `Personalized schedule for ${currentUser?.department} &bull; ${currentUser?.divisionName || 'Your Division'}`
              : `Dynamic daily lecture, lab practical, and break scheduler with cross-institute faculty conflict prevention.`}
          </p>
        </div>

        {/* Action Controls for Admin/Faculty */}
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePublishTimetable}
              disabled={isPublishing}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold shadow-subtle flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                isDivisionPublished
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {isPublishing ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>Publishing Routine...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isDivisionPublished ? 'Republish Timetable' : 'Publish Timetable'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {publishSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{publishSuccessMsg}</span>
          </div>
          <button onClick={() => setPublishSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Mode Tabs for Teachers and Admins */}
      {canManage && (
        <div className="flex border-b border-warm-300 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMainTab('division_builder')}
            className={`pb-3 transition-colors flex items-center gap-1.5 ${
              activeMainTab === 'division_builder'
                ? 'border-b-2 border-primary text-navy-900 font-bold'
                : 'text-navy-500 hover:text-navy-900'
            }`}
          >
            <Layers className="h-4 w-4 text-primary" />
            <span>Division Timetable Builder</span>
          </button>

          {isTeacher && (
            <button
              type="button"
              onClick={() => setActiveMainTab('personal_agenda')}
              className={`pb-3 transition-colors flex items-center gap-1.5 ${
                activeMainTab === 'personal_agenda'
                  ? 'border-b-2 border-primary text-navy-900 font-bold'
                  : 'text-navy-500 hover:text-navy-900'
              }`}
            >
              <User className="h-4 w-4 text-primary" />
              <span>My Teaching Agenda (Cross-Division)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveMainTab('week_matrix')}
            className={`pb-3 transition-colors flex items-center gap-1.5 ${
              activeMainTab === 'week_matrix'
                ? 'border-b-2 border-primary text-navy-900 font-bold'
                : 'text-navy-500 hover:text-navy-900'
            }`}
          >
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>Full-Week Matrix View</span>
          </button>
        </div>
      )}

      {/* HIERARCHY SELECTOR PANEL (Institute -> Dept -> Year -> Division) */}
      {activeMainTab !== 'personal_agenda' && (
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
          <div className="flex items-center justify-between border-b border-warm-200 pb-2">
            <span className="text-[11px] font-mono font-bold uppercase text-navy-600 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Select Division Hierarchy</span>
            </span>

            {/* Quick Copy Division Action */}
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  const otherDiv = divisions.find(d => d.id !== currentDivision?.id);
                  setCopySourceDivId(otherDiv?.id || '');
                  setCopyDivModalOpen(true);
                }}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                <span>Copy from Another Division</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-navy-700 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                disabled={isStudent}
                className="w-full px-2.5 py-1.5 rounded-md border border-warm-300 bg-warm-50 text-xs font-semibold text-navy-900 focus:outline-none focus:border-primary disabled:opacity-60"
              >
                {departments.map((dept, i) => (
                  <option key={i} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-[11px] font-semibold text-navy-700 mb-1">Academic Year</label>
              <select
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-warm-300 bg-warm-50 text-xs font-mono text-navy-900 focus:outline-none focus:border-primary"
              >
                <option value="2026–27">2026–27 (Current)</option>
                <option value="2025–26">2025–26</option>
              </select>
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-[11px] font-semibold text-navy-700 mb-1">Year of Study</label>
              <select
                value={selectedYearOfStudy}
                onChange={e => setSelectedYearOfStudy(e.target.value as YearOfStudy)}
                disabled={isStudent}
                className="w-full px-2.5 py-1.5 rounded-md border border-warm-300 bg-warm-50 text-xs font-semibold text-navy-900 focus:outline-none focus:border-primary disabled:opacity-60"
              >
                <option value="First Year">First Year (FE)</option>
                <option value="Second Year">Second Year (SE)</option>
                <option value="Third Year">Third Year (TE)</option>
                <option value="Fourth Year">Fourth Year (BE)</option>
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="block text-[11px] font-semibold text-navy-700 mb-1">Assigned Division</label>
              <select
                value={selectedDivisionId}
                onChange={e => setSelectedDivisionId(e.target.value)}
                disabled={isStudent}
                className="w-full px-2.5 py-1.5 rounded-md border border-warm-300 bg-warm-50 text-xs font-bold text-teal-900 focus:outline-none focus:border-primary disabled:opacity-60"
              >
                {matchingDivisions.map(div => (
                  <option key={div.id} value={div.id}>
                    {div.name} &bull; Class Teacher: {div.classTeacherName || 'Unassigned'}
                  </option>
                ))}
                {matchingDivisions.length === 0 && (
                  <option value={currentDivision?.id || 'div_comp_te_a'}>
                    {currentDivision?.name || 'Division A'} (Default)
                  </option>
                )}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: DIVISION BUILDER (DAY BY DAY VIEW) */}
      {activeMainTab === 'division_builder' && (
        <div className="space-y-4">
          {/* Mobile Swipe Navigation & Day Switcher (Visible on Mobile/Tablet) */}
          <div className="flex md:hidden items-center justify-between p-2.5 rounded-xl bg-surface border border-warm-300 shadow-subtle">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-2 rounded-lg border border-warm-300 bg-warm-100 hover:bg-warm-200 text-navy-800 min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95 transition-all"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-navy-900 font-mono text-sm tracking-wide">
                {selectedDay}
              </span>
              {selectedDay === todayDayName ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  TODAY
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDay(todayDayName)}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-warm-100 hover:bg-warm-200 text-primary border border-warm-300 transition-colors"
                >
                  Jump to Today
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-2 rounded-lg border border-warm-300 bg-warm-100 hover:bg-warm-200 text-navy-800 min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95 transition-all"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Tabs Bar with variable count badges */}
          <div className="flex items-center justify-between border-b border-warm-300 pb-2 overflow-x-auto touch-scroll no-scrollbar gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              {days.map(d => {
                const dayKey = `${currentDivision?.id}_${d}`;
                const isHol = dayConfigs[dayKey]?.isWorkingDay === false;
                const count = currentDivisionSlots.filter(s => s.dayOfWeek === d).length;
                const lectCount = currentDivisionSlots.filter(s => s.dayOfWeek === d && s.sessionType === 'lecture').length;
                const practCount = currentDivisionSlots.filter(s => s.dayOfWeek === d && s.sessionType === 'practical').length;

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                      selectedDay === d
                        ? 'bg-navy-900 text-warm-50 shadow-subtle'
                        : 'bg-surface text-navy-700 hover:bg-warm-100 border border-warm-300'
                    }`}
                  >
                    <span>{d}</span>
                    {isHol ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-mono">Off</span>
                    ) : (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        selectedDay === d ? 'bg-primary/20 text-warm-100' : 'bg-warm-200 text-navy-700'
                      }`}>
                        {count > 0 ? `${lectCount}L${practCount > 0 ? `+${practCount}P` : ''}` : '0'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Day Specific Tools */}
            {canManage && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleHoliday}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                    isDayHoliday 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-warm-100 text-navy-700 border-warm-300 hover:bg-warm-200'
                  }`}
                  title="Toggle whether this day is a working day or holiday"
                >
                  <Palmtree className="h-3.5 w-3.5" />
                  <span>{isDayHoliday ? 'Restore as Working Day' : 'Mark as Holiday'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const otherDay = days.find(d => d !== selectedDay) || 'Monday';
                    setCopySourceDay(otherDay);
                    setCopyDayModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded text-[11px] font-semibold bg-warm-100 hover:bg-warm-200 border border-warm-300 text-navy-800 flex items-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Day</span>
                </button>

                {activeDaySlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Clear all ${activeDaySlots.length} sessions on ${selectedDay}?`)) {
                        clearDivisionTimetable(currentDivision?.id || selectedDivisionId, selectedDay);
                      }
                    }}
                    className="p-1.5 rounded text-navy-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Clear All Slots on this Day"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Holiday Alert Banner */}
          {isDayHoliday && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                <Palmtree className="h-4 w-4 text-amber-700 shrink-0" />
                <span>{selectedDay} is marked as a Holiday: {holidayReason}</span>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={handleToggleHoliday}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Change to Working Day
                </button>
              )}
            </div>
          )}

          {/* SESSIONS LIST FOR ACTIVE DAY */}
          <div 
            className="space-y-3 touch-scroll"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {activeDaySlots.length === 0 ? (
              <div className="p-12 text-center bg-surface border border-dashed border-warm-300 rounded-xl space-y-3">
                <Calendar className="h-10 w-10 text-navy-300 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-navy-900">No Sessions Scheduled on {selectedDay}</h3>
                  <p className="text-xs text-navy-500 max-w-md mx-auto mt-0.5">
                    {canManage 
                      ? 'Add daily lectures, practical laboratory slots, or refreshment breaks below. Each day can have an independent routine.'
                      : 'No classes are scheduled for your division on this day.'}
                  </p>
                </div>

                {canManage && !isDayHoliday && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal('lecture')}
                      className="px-3.5 py-2 bg-navy-900 text-warm-50 text-xs font-bold rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5 shadow-subtle"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      <span>Add Lecture Slot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal('practical')}
                      className="px-3.5 py-2 bg-purple-700 text-white text-xs font-bold rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-1.5 shadow-subtle"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      <span>Add Practical Lab</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeDaySlots.map((slot, index) => {
                  const isPractical = slot.sessionType === 'practical';
                  const isBreak = slot.sessionType === 'break';

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                        isBreak 
                          ? 'bg-amber-50/70 border-amber-200'
                          : isPractical
                            ? 'bg-purple-50/40 border-purple-200 hover:border-purple-300'
                            : 'bg-surface border-warm-300 hover:border-warm-400 shadow-subtle'
                      }`}
                    >
                      {/* Left: Time & Type Badge */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-28 shrink-0 font-mono text-center">
                          <span className="text-xs font-bold text-navy-900 block">
                            {slot.startTime} – {slot.endTime}
                          </span>
                          <span className="text-[10px] text-navy-500 font-medium">
                            {(() => {
                              const [sh, sm] = slot.startTime.split(':').map(Number);
                              const [eh, em] = slot.endTime.split(':').map(Number);
                              const duration = (eh * 60 + em) - (sh * 60 + sm);
                              return `${duration} mins`;
                            })()}
                          </span>
                        </div>

                        <div className="h-8 w-1 border-r border-warm-300 hidden md:block"></div>

                        {/* Session Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isBreak ? (
                              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold flex items-center gap-1">
                                <Coffee className="h-3 w-3" />
                                <span>RECESS / BREAK</span>
                              </span>
                            ) : isPractical ? (
                              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold flex items-center gap-1">
                                <FlaskConical className="h-3 w-3 text-purple-700" />
                                <span>PRACTICAL LAB</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-bold flex items-center gap-1">
                                <BookOpen className="h-3 w-3 text-primary" />
                                <span>THEORY LECTURE</span>
                              </span>
                            )}

                            {!isBreak && (
                              <span className="text-[11px] font-mono font-bold text-navy-700">
                                {slot.courseCode}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-navy-900">
                            {isBreak ? (slot.notes || 'Lunch / Tea Break') : slot.courseName}
                          </h4>

                          {/* Faculty & Room row */}
                          {!isBreak && (
                            <div className="flex flex-wrap items-center gap-3 text-xs text-navy-600 pt-0.5">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-primary" />
                                <strong className="text-navy-800">{slot.teacherName}</strong>
                                {slot.additionalTeacherNames && slot.additionalTeacherNames.length > 0 && (
                                  <span className="text-navy-500 font-normal">
                                    + {slot.additionalTeacherNames.join(', ')}
                                  </span>
                                )}
                              </span>

                              <span className="flex items-center gap-1 font-mono text-[11px] bg-warm-100 px-2 py-0.5 rounded border border-warm-200">
                                <MapPin className="h-3 w-3 text-navy-400" />
                                <span>{slot.room || 'Hall'}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      {canManage && (
                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(slot)}
                            className="p-1.5 rounded-md hover:bg-warm-100 text-navy-600 hover:text-navy-900 transition-colors"
                            title="Edit Session"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTimetableSlot(slot.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-navy-400 hover:text-red-600 transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Quick-Add Buttons */}
            {canManage && !isDayHoliday && (
              <div className="p-3 bg-warm-50 rounded-xl border border-warm-300 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-navy-700">
                  Add more slots for {selectedDay}:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('lecture')}
                    className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-warm-50 text-xs font-bold rounded-md flex items-center gap-1.5 shadow-subtle transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    <span>+ Add Lecture</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('practical')}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-md flex items-center gap-1.5 shadow-subtle transition-all"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>+ Add Practical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('break')}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all"
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    <span>+ Add Break</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Swipe Guidance Hint */}
            <p className="text-[11px] text-navy-400 font-mono text-center md:hidden pt-2 flex items-center justify-center gap-1.5">
              <span>Swipe screen left or right to switch days</span>
            </p>
          </div>
        </div>
      )}

      {/* VIEW 2: TEACHER'S PERSONAL AGENDA (Cross-Division) */}
      {activeMainTab === 'personal_agenda' && isTeacher && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span>
                Personal teaching agenda for <strong>{currentUser?.fullName}</strong>. Automatically consolidated across all divisions.
              </span>
            </div>
            <span className="font-mono font-bold text-primary">
              {personalTeacherSlots.length} Classes Today ({selectedDay})
            </span>
          </div>

          {/* Day Selector */}
          <div className="flex items-center gap-2 overflow-x-auto touch-scroll no-scrollbar pb-2 border-b border-warm-300">
            {days.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  selectedDay === d ? 'bg-navy-900 text-white' : 'bg-surface text-navy-700 border border-warm-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {personalTeacherSlots.length === 0 ? (
              <div className="p-8 text-center bg-surface border border-warm-300 rounded-xl space-y-2">
                <p className="text-xs text-navy-500">You have no scheduled lectures or practicals on {selectedDay}.</p>
              </div>
            ) : (
              personalTeacherSlots.map(slot => (
                <div key={slot.id} className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-navy-900 w-28">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                          {slot.courseCode}
                        </span>
                        <span className="text-[11px] font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {slot.yearOfStudy} &bull; {slot.divisionName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-navy-900 mt-0.5">{slot.courseName}</h4>
                      <p className="text-xs text-navy-500 font-mono mt-0.5">Location: {slot.room || 'Room'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: WHOLE-WEEK MATRIX GRID */}
      {activeMainTab === 'week_matrix' && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-warm-300 rounded-xl bg-surface shadow-subtle">
            <div className="grid grid-cols-6 divide-x divide-warm-300 min-w-[900px]">
              {days.map(d => {
                const dayKey = `${currentDivision?.id}_${d}`;
                const isHol = dayConfigs[dayKey]?.isWorkingDay === false;
                const slots = currentDivisionSlots
                  .filter(s => s.dayOfWeek === d)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={d} className="flex flex-col min-h-[450px]">
                    {/* Day Header */}
                    <div className="bg-warm-100 p-2.5 text-center border-b border-warm-300">
                      <span className="text-xs font-bold text-navy-900 block">{d}</span>
                      <span className="text-[10px] font-mono text-navy-500">
                        {isHol ? 'Holiday' : `${slots.length} Slots`}
                      </span>
                    </div>

                    {/* Day Slots */}
                    <div className="p-2 space-y-2 flex-grow bg-warm-50/40">
                      {isHol ? (
                        <div className="p-4 text-center rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                          Holiday
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="p-4 text-center text-[10px] text-navy-400">
                          No sessions
                        </div>
                      ) : (
                        slots.map(s => (
                          <div 
                            key={s.id}
                            className={`p-2 rounded text-[11px] border space-y-1 ${
                              s.sessionType === 'break'
                                ? 'bg-amber-100/70 border-amber-200 text-amber-900'
                                : s.sessionType === 'practical'
                                  ? 'bg-purple-50 border-purple-200 text-purple-900'
                                  : 'bg-surface border-warm-300 text-navy-900'
                            }`}
                          >
                            <span className="font-mono text-[10px] font-bold block text-navy-700">
                              {s.startTime}–{s.endTime}
                            </span>
                            <p className="font-bold truncate">
                              {s.sessionType === 'break' ? (s.notes || 'Break') : s.courseCode}
                            </p>
                            {s.sessionType !== 'break' && (
                              <p className="text-[10px] text-navy-500 truncate">{s.teacherName}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT TIMETABLE SESSION (INTELLIGENT WITH FACULTY AVAILABILITY) */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-modal max-w-lg w-full p-6 space-y-4 my-8 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-navy-900">
                  {editingSlotId ? 'Edit Scheduled Session' : `Add Session on ${selectedDay}`}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="text-navy-400 hover:text-navy-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Division Badge */}
            <div className="p-2.5 rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-between text-xs">
              <span className="text-navy-600 font-medium">Target Class:</span>
              <span className="font-bold text-navy-900">
                {currentDivision?.departmentName} &bull; {currentDivision?.yearOfStudy} &bull; {currentDivision?.name}
              </span>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4">
              {/* Session Type Tabs */}
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Session Type</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-warm-100 rounded-lg border border-warm-300 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFormSessionType('lecture')}
                    className={`py-1.5 rounded-md transition-all ${
                      formSessionType === 'lecture' ? 'bg-surface text-navy-900 shadow-subtle font-bold' : 'text-navy-600 hover:text-navy-900'
                    }`}
                  >
                    Lecture
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSessionType('practical')}
                    className={`py-1.5 rounded-md transition-all ${
                      formSessionType === 'practical' ? 'bg-surface text-purple-900 shadow-subtle font-bold' : 'text-navy-600 hover:text-navy-900'
                    }`}
                  >
                    Practical Lab
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSessionType('break')}
                    className={`py-1.5 rounded-md transition-all ${
                      formSessionType === 'break' ? 'bg-surface text-amber-900 shadow-subtle font-bold' : 'text-navy-600 hover:text-navy-900'
                    }`}
                  >
                    Break / Lunch
                  </button>
                </div>
              </div>

              {/* Time Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono font-bold bg-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono font-bold bg-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* IF BREAK: Notes only */}
              {formSessionType === 'break' ? (
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">Break Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lunch Break, Recess, Tea Break"
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-white focus:outline-none focus:border-primary"
                  />
                </div>
              ) : (
                <>
                  {/* Subject Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">
                      {formSessionType === 'practical' ? 'Practical Lab Subject' : 'Course / Subject'}
                    </label>
                    <select
                      value={formCourseId}
                      onChange={e => {
                        const cid = e.target.value;
                        setFormCourseId(cid);
                        const c = courses.find(crs => crs.id === cid);
                        if (c) setFormTeacherId(c.teacherId);
                      }}
                      className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-white focus:outline-none focus:border-primary"
                    >
                      {availableCourses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.courseCode} — {course.courseName} (Prof. {course.teacherName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SMART FACULTY AVAILABILITY DETECTION */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-warm-50 border border-warm-300">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>Lead Instructor (Smart Availability Checked)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAllFaculty(!showAllFaculty)}
                        className="text-[10px] font-semibold text-primary hover:underline"
                      >
                        {showAllFaculty ? 'Filter to Available Only' : 'Show All Faculty & Conflicts'}
                      </button>
                    </div>

                    {availableFacultyOnly.length === 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                          <span>All professors are currently scheduled elsewhere at this time.</span>
                        </p>
                        <p className="text-[11px] leading-tight">
                          You can still assign a faculty member or adjust the session time slot.
                        </p>
                      </div>
                    )}

                    <select
                      value={formTeacherId}
                      onChange={e => setFormTeacherId(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-white focus:outline-none focus:border-primary font-medium"
                    >
                      {(showAllFaculty || availableFacultyOnly.length === 0 ? facultyAvailabilityList : availableFacultyOnly).map(({ faculty, isAvailable, reason }) => (
                        <option 
                          key={faculty.uid} 
                          value={faculty.uid} 
                          className={!isAvailable ? 'text-amber-800 bg-amber-50 font-normal' : 'text-navy-900 font-semibold'}
                        >
                          {isAvailable 
                            ? `✓ ${faculty.fullName} (${faculty.facultyId || faculty.department}) - Available`
                            : `⚠ ${faculty.fullName} - ${reason}`}
                        </option>
                      ))}
                    </select>

                    <p className="text-[10px] text-navy-500">
                      Cross-checks all divisions and years in the institute on {selectedDay} ({formStartTime}–{formEndTime}).
                    </p>
                  </div>

                  {/* For Practical Lab: Additional Co-Instructors */}
                  {formSessionType === 'practical' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-navy-700 mb-1">
                        Additional Lab Co-Faculty (Optional)
                      </label>
                      <select
                        multiple
                        value={formAdditionalTeacherIds}
                        onChange={e => {
                          const selected = Array.from(e.target.selectedOptions, o => o.value);
                          setFormAdditionalTeacherIds(selected);
                        }}
                        className="w-full px-3 py-1.5 rounded-md border border-warm-300 text-xs bg-white focus:outline-none focus:border-primary h-20"
                      >
                        {departmentFaculty.map(f => (
                          <option key={f.uid} value={f.uid}>
                            {f.fullName} ({f.department})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-navy-400">Hold Ctrl / Cmd to select multiple co-instructors.</p>
                    </div>
                  )}

                  {/* Room / Lab Location */}
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1">Room / Lab Hall</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hall 301, Lab 4, Seminar Room B"
                      value={formRoom}
                      onChange={e => setFormRoom(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono bg-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* LIVE CONFLICT ALERT WARNING */}
              {liveModalConflict && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <p className="font-bold">Schedule Conflict Warning:</p>
                    <p className="text-[11px] leading-tight mt-0.5">{liveModalConflict}</p>
                  </div>
                </div>
              )}

              {formSubmitError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Cannot Add Session:</p>
                    <p className="text-[11px] leading-tight mt-0.5">{formSubmitError}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-warm-300 text-navy-700 text-xs font-semibold hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-warm-50 text-xs font-bold rounded-md shadow-subtle flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {savingSession ? (
                    <span>Adding Session...</span>
                  ) : (
                    <span>{editingSlotId ? 'Save Changes' : 'Add to Schedule'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFLICTS PREVENTING PUBLISH */}
      {/* ========================================================================= */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-red-300 shadow-modal max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-700 border-b border-red-200 pb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-navy-900">
                Cannot Publish Timetable: Conflicts Found
              </h3>
            </div>

            <p className="text-xs text-navy-600">
              The following scheduling clashes were detected across the institute. Timetables cannot be published until all simultaneous faculty or room clashes are resolved:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {conflictErrors.map((err, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
                  {err}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-warm-200">
              <button
                type="button"
                onClick={() => setConflictModalOpen(false)}
                className="px-4 py-2 bg-navy-900 text-warm-50 text-xs font-bold rounded-md hover:bg-navy-800"
              >
                Close & Resolve Conflicts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COPY DAY */}
      {/* ========================================================================= */}
      {copyDayModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-modal max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" />
              <span>Copy Daily Schedule to {selectedDay}</span>
            </h3>

            <p className="text-xs text-navy-600">
              Duplicate all lecture and practical slots from another day into <strong>{selectedDay}</strong> for {currentDivision?.name}:
            </p>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Source Day</label>
              <select
                value={copySourceDay}
                onChange={e => setCopySourceDay(e.target.value as DayOfWeek)}
                className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs bg-warm-50 font-bold"
              >
                {days.filter(d => d !== selectedDay).map(d => (
                  <option key={d} value={d}>
                    {d} ({currentDivisionSlots.filter(s => s.dayOfWeek === d).length} sessions)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-warm-200">
              <button
                type="button"
                onClick={() => setCopyDayModalOpen(false)}
                className="px-3 py-1.5 rounded border border-warm-300 text-xs text-navy-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCopyDay}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-subtle"
              >
                Copy Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COPY DIVISION */}
      {/* ========================================================================= */}
      {copyDivModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-modal max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" />
              <span>Copy Routine from Another Division</span>
            </h3>

            <p className="text-xs text-navy-600">
              Clone the entire weekly timetable template from an existing division into <strong>{currentDivision?.name}</strong>:
            </p>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Source Division</label>
              <select
                value={copySourceDivId}
                onChange={e => setCopySourceDivId(e.target.value)}
                className="w-full px-3 py-2 border border-warm-300 rounded-md text-xs bg-warm-50 font-bold"
              >
                {divisions.filter(d => d.id !== currentDivision?.id).map(d => {
                  const sCount = timetable.filter(s => s.divisionId === d.id).length;
                  return (
                    <option key={d.id} value={d.id}>
                      {d.departmentName} &bull; {d.yearOfStudy} &bull; {d.name} ({sCount} slots)
                    </option>
                  );
                })}
              </select>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
              Note: Copied schedule will be saved as <strong>Draft</strong> so you can review and resolve any faculty availability overlaps before publishing.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-warm-200">
              <button
                type="button"
                onClick={() => setCopyDivModalOpen(false)}
                className="px-3 py-1.5 rounded border border-warm-300 text-xs text-navy-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCopyDivision}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow-subtle"
              >
                Clone Division Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableSchedule;
