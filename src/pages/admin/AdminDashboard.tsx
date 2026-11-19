import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Building, 
  Users, 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  GraduationCap, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  GitBranch, 
  Calendar,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Copy,
  Check,
  Edit2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  X,
  Clock,
  Radio,
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { YearOfStudy, SubjectAllocation, LectureConductStatus, DayOfWeek } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { currentUser, currentOrg } = useAuth();
  const { 
    courses, 
    organizationUsers, 
    departments: registeredDepts,
    divisions, 
    subjectAllocations, 
    timetable,
    sessions,
    attendanceRecords,
    getSlotConductStatus,
    addDepartment, 
    removeDepartment, 
    assignFacultyDepartment, 
    removeFaculty, 
    deleteDivision,
    allocateSubjectToDivision,
    updateSubjectAllocation,
    removeSubjectAllocation
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'lectures' | 'allocations' | 'hierarchy' | 'departments' | 'faculty' | 'courses'>('overview');
  
  // Date helper
  const getTodayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Institutional Lecture Monitor State
  const [monitorDate, setMonitorDate] = useState<string>(todayStr);
  const [monitorFacultyFilter, setMonitorFacultyFilter] = useState('ALL');
  const [monitorSubjectFilter, setMonitorSubjectFilter] = useState('ALL');
  const [monitorDivisionFilter, setMonitorDivisionFilter] = useState('ALL');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState('ALL');
  const [monitorCategoryFilter, setMonitorCategoryFilter] = useState('ALL');
  const [monitorSearchQuery, setMonitorSearchQuery] = useState('');

  // Department Form State
  const [newDeptInput, setNewDeptInput] = useState('');
  const [addingDept, setAddingDept] = useState(false);
  
  // Faculty Search & Reassign State
  const [facultySearch, setFacultySearch] = useState('');
  const [editingFacultyUid, setEditingFacultyUid] = useState<string | null>(null);
  const [newFacultyDept, setNewFacultyDept] = useState('');

  // Division Filter in Hierarchy
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Subject Allocation Management State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAllocId, setEditingAllocId] = useState<string | null>(null);
  const [allocCourseId, setAllocCourseId] = useState('');
  const [allocTeacherId, setAllocTeacherId] = useState('');
  const [allocDivisionId, setAllocDivisionId] = useState('');
  const [allocBatch, setAllocBatch] = useState('All');
  const [allocSemester, setAllocSemester] = useState('Semester 6');
  const [allocAcademicYear, setAllocAcademicYear] = useState(currentOrg?.currentAcademicYear || '2026–27');
  const [allocWeeklyHours, setAllocWeeklyHours] = useState(4);
  const [allocSearch, setAllocSearch] = useState('');
  const [allocDeptFilter, setAllocDeptFilter] = useState('ALL');
  const [allocError, setAllocError] = useState<string | null>(null);
  const [allocSuccess, setAllocSuccess] = useState<string | null>(null);
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  const orgName = currentOrg?.name || currentUser?.organizationName || 'Institute Administration';
  const orgCode = currentOrg?.code || currentUser?.organizationCode || 'APEX101';
  const orgCity = currentOrg?.city || 'Main Campus';

  const departments = currentOrg?.departments || [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  const facultyMembers = organizationUsers.filter(u => u.role === 'teacher' || u.role === 'admin');
  const studentMembers = organizationUsers.filter(u => u.role === 'student');

  const filteredFaculty = facultyMembers.filter(f => 
    f.fullName.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
    (f.facultyId && f.facultyId.toLowerCase().includes(facultySearch.toLowerCase()))
  );

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptInput.trim()) return;
    setAddingDept(true);
    await addDepartment(newDeptInput.trim());
    setNewDeptInput('');
    setAddingDept(false);
  };

  const handleSaveFacultyDept = async (facultyUid: string) => {
    if (!newFacultyDept) return;
    await assignFacultyDepartment(facultyUid, newFacultyDept);
    setEditingFacultyUid(null);
    setNewFacultyDept('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orgCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Date and Time helpers for Institutional Lecture Monitor
  const getDayOfWeekFromDate = (dateStr: string): string => {
    if (!dateStr) return 'Monday';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dateObj.getDay()] || 'Monday';
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Today's stats for Executive Overview Card
  const todayDayOfWeek = getDayOfWeekFromDate(todayStr);
  const todayTimetableSlots = todayDayOfWeek === 'Sunday'
    ? []
    : timetable.filter(slot => slot.dayOfWeek === (todayDayOfWeek as DayOfWeek));
  const todayExtraSessions = sessions.filter(s => 
    (s.isExtraLecture || s.sessionCategory === 'extra') &&
    (s.lectureDate === todayStr || (s.startedAt && s.startedAt.startsWith(todayStr)))
  );

  const todayMetrics = useMemo(() => {
    let completed = 0;
    let live = 0;
    let cancelled = 0;
    let notConducted = 0;
    let scheduled = 0;

    todayTimetableSlots.forEach(slot => {
      const conduct = getSlotConductStatus(slot, todayStr);
      if (conduct.status === 'COMPLETED') completed++;
      else if (conduct.status === 'IN_PROGRESS') live++;
      else if (conduct.status === 'CANCELLED') cancelled++;
      else if (conduct.status === 'NOT_CONDUCTED') notConducted++;
      else if (conduct.status === 'SCHEDULED') scheduled++;
    });

    const extraCount = todayExtraSessions.length;
    todayExtraSessions.forEach(s => {
      if (s.status === 'active') live++;
      else if (s.status === 'ended') completed++;
    });

    return {
      totalScheduledToday: todayTimetableSlots.length,
      completed,
      live,
      cancelled,
      notConducted,
      scheduled,
      extraCount
    };
  }, [todayTimetableSlots, todayExtraSessions, todayStr, getSlotConductStatus]);

  // Monitored lectures for selected date
  const selectedDayOfWeek = getDayOfWeekFromDate(monitorDate);
  const slotsForSelectedDate = selectedDayOfWeek === 'Sunday'
    ? []
    : timetable.filter(slot => slot.dayOfWeek === (selectedDayOfWeek as DayOfWeek));
  const extraSessionsForSelectedDate = sessions.filter(s => 
    (s.isExtraLecture || s.sessionCategory === 'extra') &&
    (s.lectureDate === monitorDate || (s.startedAt && s.startedAt.startsWith(monitorDate)))
  );

  interface MonitoredLecture {
    id: string;
    sourceType: 'timetable' | 'extra';
    courseId: string;
    courseCode: string;
    courseName: string;
    teacherId: string;
    teacherName: string;
    divisionId?: string;
    divisionName?: string;
    batch?: string;
    dayOfWeek: string;
    date: string;
    startTime: string;
    endTime: string;
    room?: string;
    conductStatus: LectureConductStatus;
    isExtraLecture: boolean;
    isLiveNow: boolean;
    cancellationReason?: string;
    rescheduledTo?: { date: string; startTime: string; endTime: string; room?: string; reason?: string };
    attendanceCount?: number;
    session?: any;
  }

  const monitoredLectures = useMemo(() => {
    const list: MonitoredLecture[] = [];

    // 1. Regular timetable slots
    slotsForSelectedDate.forEach(slot => {
      const conduct = getSlotConductStatus(slot, monitorDate);
      const attendeeCount = conduct.session
        ? attendanceRecords.filter(r => r.sessionId === conduct.session?.id && r.status === 'present').length
        : 0;

      list.push({
        id: `slot_${slot.id}_${monitorDate}`,
        sourceType: 'timetable',
        courseId: slot.courseId,
        courseCode: slot.courseCode,
        courseName: slot.courseName,
        teacherId: slot.teacherId,
        teacherName: slot.teacherName,
        divisionId: slot.divisionId,
        divisionName: slot.divisionName,
        batch: 'All',
        dayOfWeek: slot.dayOfWeek,
        date: monitorDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room || 'Classroom',
        conductStatus: conduct.status,
        isExtraLecture: false,
        isLiveNow: conduct.isLiveNow,
        cancellationReason: conduct.cancellationReason,
        rescheduledTo: conduct.session?.rescheduledTo,
        attendanceCount: attendeeCount,
        session: conduct.session
      });
    });

    // 2. Extra lecture sessions
    extraSessionsForSelectedDate.forEach(s => {
      const course = courses.find(c => c.id === s.courseId);
      const division = divisions.find(d => d.id === s.divisionId);
      const teacher = facultyMembers.find(f => f.uid === s.teacherId);
      const attendeeCount = attendanceRecords.filter(r => r.sessionId === s.id && r.status === 'present').length;

      list.push({
        id: `extra_${s.id}`,
        sourceType: 'extra',
        courseId: s.courseId,
        courseCode: course?.courseCode || 'EXTRA',
        courseName: course?.courseName || s.lectureTopic || 'Extra Lecture',
        teacherId: s.teacherId,
        teacherName: s.teacherName || teacher?.fullName || 'Faculty Instructor',
        divisionId: s.divisionId,
        divisionName: division?.name || 'Assigned Division',
        batch: s.batch || 'All',
        dayOfWeek: selectedDayOfWeek,
        date: monitorDate,
        startTime: s.scheduledStartTime || (s.startedAt ? s.startedAt.slice(11, 16) : '00:00'),
        endTime: s.scheduledEndTime || '—',
        room: s.room || 'Classroom',
        conductStatus: s.status === 'active' ? 'IN_PROGRESS' : 'COMPLETED',
        isExtraLecture: true,
        isLiveNow: s.status === 'active',
        cancellationReason: s.cancellationReason,
        rescheduledTo: s.rescheduledTo,
        attendanceCount: attendeeCount,
        session: s
      });
    });

    // Sort chronologically by start time
    return list.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [slotsForSelectedDate, extraSessionsForSelectedDate, monitorDate, selectedDayOfWeek, courses, divisions, facultyMembers, attendanceRecords, getSlotConductStatus]);

  // Filtered lectures for the table
  const filteredMonitoredLectures = useMemo(() => {
    return monitoredLectures.filter(item => {
      const matchesFaculty = monitorFacultyFilter === 'ALL' || item.teacherId === monitorFacultyFilter;
      const matchesSubject = monitorSubjectFilter === 'ALL' || item.courseId === monitorSubjectFilter;
      const matchesDivision = monitorDivisionFilter === 'ALL' || item.divisionId === monitorDivisionFilter;
      const matchesStatus = monitorStatusFilter === 'ALL' || item.conductStatus === monitorStatusFilter;
      const matchesCategory = 
        monitorCategoryFilter === 'ALL' ||
        (monitorCategoryFilter === 'REGULAR' && !item.isExtraLecture) ||
        (monitorCategoryFilter === 'EXTRA' && item.isExtraLecture);
      
      const q = monitorSearchQuery.trim().toLowerCase();
      const matchesQuery = !q || 
        item.courseCode.toLowerCase().includes(q) ||
        item.courseName.toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q) ||
        (item.divisionName && item.divisionName.toLowerCase().includes(q)) ||
        (item.room && item.room.toLowerCase().includes(q)) ||
        (item.cancellationReason && item.cancellationReason.toLowerCase().includes(q));

      return matchesFaculty && matchesSubject && matchesDivision && matchesStatus && matchesCategory && matchesQuery;
    });
  }, [monitoredLectures, monitorFacultyFilter, monitorSubjectFilter, monitorDivisionFilter, monitorStatusFilter, monitorCategoryFilter, monitorSearchQuery]);

  // Selected date statistics (across all items before text search or filter)
  const selectedDateStats = useMemo(() => {
    return {
      total: monitoredLectures.length,
      scheduled: monitoredLectures.filter(i => i.conductStatus === 'SCHEDULED').length,
      completed: monitoredLectures.filter(i => i.conductStatus === 'COMPLETED').length,
      live: monitoredLectures.filter(i => i.conductStatus === 'IN_PROGRESS').length,
      cancelled: monitoredLectures.filter(i => i.conductStatus === 'CANCELLED').length,
      notConducted: monitoredLectures.filter(i => i.conductStatus === 'NOT_CONDUCTED').length,
      rescheduled: monitoredLectures.filter(i => i.conductStatus === 'RESCHEDULED').length,
      extra: monitoredLectures.filter(i => i.isExtraLecture).length
    };
  }, [monitoredLectures]);

  // Subject Allocation Logic
  const allocatedCourseIdsSet = new Set(subjectAllocations.map(a => a.courseId));
  const unallocatedCourses = courses.filter(c => !allocatedCourseIdsSet.has(c.id));
  const uniqueAssignedTeachers = new Set(subjectAllocations.map(a => a.teacherId));

  const filteredAllocations = subjectAllocations.filter(alloc => {
    const matchesDept = allocDeptFilter === 'ALL' || alloc.departmentName === allocDeptFilter || alloc.departmentId === allocDeptFilter;
    const matchesQuery = 
      alloc.courseCode.toLowerCase().includes(allocSearch.toLowerCase()) ||
      alloc.courseName.toLowerCase().includes(allocSearch.toLowerCase()) ||
      alloc.teacherName.toLowerCase().includes(allocSearch.toLowerCase()) ||
      (alloc.divisionName && alloc.divisionName.toLowerCase().includes(allocSearch.toLowerCase()));
    return matchesDept && matchesQuery;
  });

  const handleOpenNewAllocation = (prefilledCourseId?: string) => {
    setEditingAllocId(null);
    setAllocCourseId(prefilledCourseId || courses[0]?.id || '');
    setAllocTeacherId(facultyMembers[0]?.uid || '');
    setAllocDivisionId(divisions[0]?.id || '');
    setAllocBatch('All');
    setAllocSemester('Semester 6');
    setAllocAcademicYear(currentOrg?.currentAcademicYear || '2026–27');
    setAllocWeeklyHours(4);
    setAllocError(null);
    setAllocSuccess(null);
    setIsAssignModalOpen(true);
  };

  const handleEditAllocation = (alloc: SubjectAllocation) => {
    setEditingAllocId(alloc.id);
    setAllocCourseId(alloc.courseId);
    setAllocTeacherId(alloc.teacherId);
    setAllocDivisionId(alloc.divisionId);
    setAllocBatch(alloc.batch || 'All');
    setAllocSemester(alloc.semester || 'Semester 6');
    setAllocAcademicYear(alloc.academicYear || currentOrg?.currentAcademicYear || '2026–27');
    setAllocWeeklyHours(alloc.weeklyHours || 4);
    setAllocError(null);
    setAllocSuccess(null);
    setIsAssignModalOpen(true);
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocError(null);
    setAllocSuccess(null);

    const course = courses.find(c => c.id === allocCourseId);
    const teacher = facultyMembers.find(f => f.uid === allocTeacherId);
    const division = divisions.find(d => d.id === allocDivisionId);

    if (!course || !teacher || !division) {
      setAllocError('Please select a valid Subject, Faculty Instructor, and Division.');
      return;
    }

    setAllocSubmitting(true);
    try {
      if (editingAllocId) {
        await updateSubjectAllocation(editingAllocId, {
          courseId: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          teacherId: teacher.uid,
          teacherName: teacher.fullName,
          teacherEmail: teacher.email,
          divisionId: division.id,
          divisionName: division.name,
          departmentId: division.departmentId,
          departmentName: division.departmentName,
          yearOfStudy: division.yearOfStudy,
          academicYear: allocAcademicYear,
          semester: allocSemester,
          batch: allocBatch,
          weeklyHours: allocWeeklyHours
        });
        setAllocSuccess(`Successfully updated subject assignment for ${course.courseCode}.`);
      } else {
        await allocateSubjectToDivision({
          courseId: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          teacherId: teacher.uid,
          teacherName: teacher.fullName,
          teacherEmail: teacher.email,
          divisionId: division.id,
          divisionName: division.name,
          departmentId: division.departmentId,
          departmentName: division.departmentName,
          yearOfStudy: division.yearOfStudy,
          academicYear: allocAcademicYear,
          semester: allocSemester,
          batch: allocBatch,
          weeklyHours: allocWeeklyHours
        });
        setAllocSuccess(`Successfully allocated ${course.courseCode} to Prof. ${teacher.fullName}.`);
      }

      setTimeout(() => {
        setIsAssignModalOpen(false);
        setAllocSuccess(null);
      }, 1200);
    } catch (err: any) {
      setAllocError(err.message || 'Failed to save subject assignment.');
    } finally {
      setAllocSubmitting(false);
    }
  };

  const handleDeleteAllocation = async (allocId: string, courseCode: string, teacherName: string) => {
    if (!window.confirm(`Are you sure you want to remove the subject allocation for ${courseCode} (${teacherName})? The instructor will immediately lose authorization to take attendance for this division.`)) {
      return;
    }
    try {
      await removeSubjectAllocation(allocId);
    } catch (err: any) {
      alert(err.message || 'Failed to remove allocation.');
    }
  };

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.fullName?.split(' ')[0] || 'Administrator';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header: Executive Personalized Greeting & Key Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-navy-500 mb-1">
            <span className="hidden sm:inline font-semibold text-primary">ADMIN CONSOLE &bull;</span>
            <span className="font-semibold text-navy-800 bg-warm-100 px-2 py-0.5 rounded border border-warm-200 text-[11px] truncate max-w-[220px] sm:max-w-none">
              {orgName}
            </span>
            <span className="hidden sm:inline text-warm-400">&bull;</span>
            <span className="hidden sm:inline text-navy-600">{orgCity}</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-navy-900">
            {timeGreeting}, {firstName}
          </h1>
          <p className="hidden sm:block text-xs text-navy-600 mt-0.5">
            Institutional overview, academic hierarchy, and administrative controls.
          </p>
        </div>

        {/* Global Action Anchors */}
        <div className="flex items-center gap-2.5 shrink-0">
          <NavLink
            to="/onboarding"
            className="px-4 py-2.5 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-semibold shadow-subtle transition-all duration-150 inline-flex items-center gap-2 active:scale-95"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Setup Wizard</span>
          </NavLink>
          <NavLink
            to="/institute-directory"
            className="px-3.5 py-2.5 min-h-[44px] rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            title="Institute Public Directory"
          >
            <Users className="h-4 w-4 text-navy-500" aria-hidden="true" />
            <span className="hidden sm:inline">Directory</span>
          </NavLink>
        </div>
      </div>

      {/* 2. 4 Meaningful KPI Cards (Executive Snapshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Departments</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{departments.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Academic disciplines</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Active Divisions</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{divisions.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">FE, SE, TE, BE Classes</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Faculty Roster</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{facultyMembers.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Professors & Instructors</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Enrolled Students</span>
          <p className="text-2xl font-bold text-teal-800 font-mono">{studentMembers.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Verified enrolled</span>
        </div>
      </div>

      {/* 3. Navigation Tabs (Progressive Disclosure) */}
      <div className="flex border-b border-warm-300 gap-6 text-xs font-semibold overflow-x-auto touch-scroll no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'overview' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <Building className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Overview & Quick Access</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lectures')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'lectures' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <Radio className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Lecture Monitor</span>
          {todayMetrics.live > 0 ? (
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded-full animate-pulse border border-emerald-300">
              {todayMetrics.live} LIVE
            </span>
          ) : (
            <span className="text-[10px] font-mono text-navy-400">
              ({monitoredLectures.length})
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('allocations')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'allocations' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Subject Allocations ({subjectAllocations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'hierarchy' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Hierarchy & Divisions ({divisions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'departments' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faculty')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'faculty' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Faculty Roster ({facultyMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'courses' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Courses ({courses.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & QUICK ACCESS (Clean, Action-Oriented) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Access Control Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('lectures')}
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group text-left"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <Radio className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Lecture Monitor</span>
                {todayMetrics.live > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </h3>
              <p className="text-[11px] text-navy-500">
                Live attendance sessions, extra classes & cancellations.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('allocations')}
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group text-left"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors">
                Subject Allocations
              </h3>
              <p className="text-[11px] text-navy-500">
                Assign subjects to faculty for attendance rights.
              </p>
            </button>

            <NavLink
              to="/admin/timetable"
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <Calendar className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors">
                Master Timetable
              </h3>
              <p className="text-[11px] text-navy-500">
                Weekly schedules and conflict detection.
              </p>
            </NavLink>

            <NavLink
              to="/institute-directory"
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors">
                Institute Directory
              </h3>
              <p className="text-[11px] text-navy-500">
                Faculty and student membership directory.
              </p>
            </NavLink>
          </div>

          {/* Today's Institutional Lecture Status Snapshot Banner */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-primary/10 text-primary">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                    Today's Lecture Operations ({todayDayOfWeek}, {todayStr})
                  </h3>
                  <p className="text-[11px] text-navy-500">
                    Real-time conduct tracking across all assigned faculty & timetable slots.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMonitorDate(todayStr);
                  setActiveTab('lectures');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors self-start sm:self-auto"
              >
                <span>Open Detailed Monitor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Scheduled</span>
                <span className="text-xl font-bold font-mono text-navy-900">{todayMetrics.totalScheduledToday}</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Live Now</span>
                <span className={`text-xl font-bold font-mono ${todayMetrics.live > 0 ? 'text-emerald-700 animate-pulse' : 'text-navy-900'}`}>
                  {todayMetrics.live}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Completed</span>
                <span className="text-xl font-bold font-mono text-teal-800">{todayMetrics.completed}</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Extra Classes</span>
                <span className="text-xl font-bold font-mono text-indigo-700">+{todayMetrics.extraCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Cancelled</span>
                <span className={`text-xl font-bold font-mono ${todayMetrics.cancelled > 0 ? 'text-rose-700' : 'text-navy-900'}`}>
                  {todayMetrics.cancelled}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Missed / Not Held</span>
                <span className={`text-xl font-bold font-mono ${todayMetrics.notConducted > 0 ? 'text-amber-700' : 'text-navy-900'}`}>
                  {todayMetrics.notConducted}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-200/60 text-[11px] text-teal-900 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Attendance Fairness Protection Active:</strong> Cancelled or missed lectures never mark students absent. Zero penalty is applied to student records for faculty absence.
              </span>
            </div>
          </div>

          {/* 2-Column Overview Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Institution Credentials & Join Code */}
            <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-warm-200 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                    Institute Join Credentials
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                  Active
                </span>
              </div>

              <div className="p-4 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-navy-500 font-mono block">Unique Organization Join Code</span>
                  <span className="text-xl font-bold font-mono text-navy-900 tracking-wider">{orgCode}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 min-h-[38px] rounded-lg border border-warm-300 bg-surface hover:bg-warm-100 text-navy-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-teal-700" />
                      <span className="text-teal-800">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-navy-600" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-navy-600 leading-relaxed">
                Provide code <strong className="font-mono text-navy-900">{orgCode}</strong> to faculty and students during registration to attach them directly to {orgName}.
              </p>
            </div>

            {/* Department Roster Quick List */}
            <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-warm-200 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                    Registered Disciplines
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('departments')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Manage ({departments.length}) &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {departments.slice(0, 4).map((dept, idx) => {
                  const deptFaculty = facultyMembers.filter(f => f.department === dept).length;
                  const deptCourses = courses.filter(c => c.department === dept).length;

                  return (
                    <div key={idx} className="p-2.5 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-navy-900">{dept}</p>
                        <p className="text-[11px] text-navy-500 font-mono">
                          {deptFaculty} Faculty &bull; {deptCourses} Courses
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-warm-200 text-navy-700">
                        Active
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INSTITUTIONAL LECTURE MONITOR (Timetable Tracking & Extra Lectures) */}
      {activeTab === 'lectures' && (
        <div className="space-y-5">
          {/* Header & Date Selector */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider font-mono">
                    Institutional Lecture Monitor
                  </h3>
                  {selectedDateStats.live > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300 animate-pulse">
                      {selectedDateStats.live} LIVE NOW
                    </span>
                  )}
                </div>
                <p className="text-xs text-navy-500 mt-0.5">
                  Real-time audit across scheduled classes, extra lectures, cancellations, and faculty conduct.
                </p>
              </div>

              {/* Date Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={monitorDate}
                  onChange={e => setMonitorDate(e.target.value)}
                  className="px-3 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-900 font-mono font-semibold focus:outline-none focus:border-primary shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setMonitorDate(todayStr)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-colors ${
                    monitorDate === todayStr 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-warm-100 text-navy-700 border-warm-300 hover:bg-warm-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(monitorDate);
                    d.setDate(d.getDate() - 1);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setMonitorDate(`${y}-${m}-${day}`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-warm-100 text-navy-700 border border-warm-300 hover:bg-warm-200 transition-colors"
                  title="Previous Day"
                >
                  &larr; Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(monitorDate);
                    d.setDate(d.getDate() + 1);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setMonitorDate(`${y}-${m}-${day}`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-warm-100 text-navy-700 border border-warm-300 hover:bg-warm-200 transition-colors"
                  title="Next Day"
                >
                  Next &rarr;
                </button>
                <span className="text-xs font-mono font-bold text-navy-700 px-2 py-1 bg-warm-100 rounded border border-warm-200">
                  {selectedDayOfWeek}
                </span>
              </div>
            </div>

            {/* KPI Summary for the Selected Day */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 space-y-0.5">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Total Classes</span>
                <span className="text-xl font-bold font-mono text-navy-900">{selectedDateStats.total}</span>
                <span className="text-[10px] text-navy-500 font-mono block">Timetable & Extra</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 space-y-0.5">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Completed</span>
                <span className="text-xl font-bold font-mono text-teal-800">{selectedDateStats.completed}</span>
                <span className="text-[10px] text-teal-700 font-mono block">Attendance Taken</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 space-y-0.5">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Extra Lectures</span>
                <span className="text-xl font-bold font-mono text-indigo-700">+{selectedDateStats.extra}</span>
                <span className="text-[10px] text-indigo-700 font-mono block">Manual Sessions</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 space-y-0.5">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Live Now</span>
                <span className={`text-xl font-bold font-mono ${selectedDateStats.live > 0 ? 'text-emerald-700 animate-pulse' : 'text-navy-900'}`}>
                  {selectedDateStats.live}
                </span>
                <span className="text-[10px] text-emerald-700 font-mono block">Broadcasting QR</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 space-y-0.5">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Cancelled</span>
                <span className={`text-xl font-bold font-mono ${selectedDateStats.cancelled > 0 ? 'text-rose-700' : 'text-navy-900'}`}>
                  {selectedDateStats.cancelled}
                </span>
                <span className="text-[10px] text-rose-700 font-mono block">With Faculty Reason</span>
              </div>
              <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 space-y-0.5">
                <span className="text-[10px] font-mono text-navy-500 uppercase tracking-wider block">Not Conducted</span>
                <span className={`text-xl font-bold font-mono ${selectedDateStats.notConducted > 0 ? 'text-slate-700' : 'text-navy-900'}`}>
                  {selectedDateStats.notConducted}
                </span>
                <span className="text-[10px] text-slate-600 font-mono block">Slot Expired / Missed</span>
              </div>
            </div>

            {/* Attendance Fairness Guarantee Notice */}
            <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-200/60 text-xs text-teal-900 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Strict Fairness Policy:</strong> Student attendance records are recorded only via verified scans. When faculty members cancel or miss lectures, the lecture status is marked as <code className="text-rose-700 font-mono font-bold">CANCELLED</code> or <code className="text-slate-700 font-mono font-bold">NOT_CONDUCTED</code> and zero student absent penalties are generated.
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-2 border-t border-warm-200">
              {/* Faculty Filter */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Faculty</label>
                <select
                  value={monitorFacultyFilter}
                  onChange={e => setMonitorFacultyFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Faculty ({facultyMembers.length})</option>
                  {facultyMembers.map(f => (
                    <option key={f.uid} value={f.uid}>{f.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Subject</label>
                <select
                  value={monitorSubjectFilter}
                  onChange={e => setMonitorSubjectFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Subjects ({courses.length})</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName.slice(0, 18)}...</option>
                  ))}
                </select>
              </div>

              {/* Division Filter */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Division</label>
                <select
                  value={monitorDivisionFilter}
                  onChange={e => setMonitorDivisionFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Divisions ({divisions.length})</option>
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.yearOfStudy})</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Conduct Status</label>
                <select
                  value={monitorStatusFilter}
                  onChange={e => setMonitorStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">Live Now (Active)</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="SCHEDULED">Upcoming / Scheduled</option>
                  <option value="NOT_CONDUCTED">Not Conducted</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Category</label>
                <select
                  value={monitorCategoryFilter}
                  onChange={e => setMonitorCategoryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Categories</option>
                  <option value="REGULAR">Regular Timetable</option>
                  <option value="EXTRA">Extra Lectures Only</option>
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Search Query</label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-navy-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={monitorSearchQuery}
                    onChange={e => setMonitorSearchQuery(e.target.value)}
                    placeholder="Subject, faculty, room..."
                    className="w-full pl-8 pr-7 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary"
                  />
                  {monitorSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMonitorSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Clear Filters Reset */}
            {(monitorFacultyFilter !== 'ALL' || monitorSubjectFilter !== 'ALL' || monitorDivisionFilter !== 'ALL' || monitorStatusFilter !== 'ALL' || monitorCategoryFilter !== 'ALL' || monitorSearchQuery) && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-navy-500">
                  Showing <strong>{filteredMonitoredLectures.length}</strong> of <strong>{monitoredLectures.length}</strong> classes on {monitorDate}.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMonitorFacultyFilter('ALL');
                    setMonitorSubjectFilter('ALL');
                    setMonitorDivisionFilter('ALL');
                    setMonitorStatusFilter('ALL');
                    setMonitorCategoryFilter('ALL');
                    setMonitorSearchQuery('');
                  }}
                  className="text-primary hover:underline font-semibold text-xs inline-flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Monitored Lectures List / Table */}
          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-warm-200 flex items-center justify-between bg-warm-50/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                  Lectures for {selectedDayOfWeek}, {monitorDate}
                </h4>
                <span className="text-xs font-mono text-navy-500">
                  ({filteredMonitoredLectures.length} total)
                </span>
              </div>

              <NavLink
                to="/admin/timetable"
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Edit Weekly Master Timetable</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </NavLink>
            </div>

            {filteredMonitoredLectures.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Calendar className="h-10 w-10 text-warm-400 mx-auto" />
                <p className="text-sm font-semibold text-navy-800">
                  No lectures found for {monitorDate}.
                </p>
                <p className="text-xs text-navy-500 max-w-md mx-auto">
                  {selectedDayOfWeek === 'Sunday' 
                    ? 'Sunday is an institute rest day. No regular timetable lectures are scheduled.'
                    : 'No classes match the selected date and filters. Try adjusting your faculty, subject, or status filter.'}
                </p>
                {(monitorFacultyFilter !== 'ALL' || monitorSubjectFilter !== 'ALL' || monitorDivisionFilter !== 'ALL' || monitorStatusFilter !== 'ALL' || monitorCategoryFilter !== 'ALL' || monitorSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMonitorFacultyFilter('ALL');
                      setMonitorSubjectFilter('ALL');
                      setMonitorDivisionFilter('ALL');
                      setMonitorStatusFilter('ALL');
                      setMonitorCategoryFilter('ALL');
                      setMonitorSearchQuery('');
                    }}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-subtle"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto touch-scroll">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                    <tr>
                      <th className="px-4 py-3">Timing & Room</th>
                      <th className="px-4 py-3">Subject / Topic</th>
                      <th className="px-4 py-3">Faculty Instructor</th>
                      <th className="px-4 py-3">Division</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Conduct Status & Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200">
                    {filteredMonitoredLectures.map(item => {
                      return (
                        <tr key={item.id} className="hover:bg-warm-50/60 transition-colors">
                          {/* Timing & Room */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-navy-900 text-xs">
                              {item.startTime} - {item.endTime}
                            </div>
                            <div className="text-[11px] font-mono text-navy-500 flex items-center gap-1 mt-0.5">
                              <span>Room:</span>
                              <strong className="text-navy-800">{item.room || 'Classroom'}</strong>
                            </div>
                          </td>

                          {/* Subject / Topic */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-primary">
                                {item.courseCode}
                              </span>
                              <span className="text-navy-400">&bull;</span>
                              <span className="font-semibold text-navy-900">
                                {item.courseName}
                              </span>
                            </div>
                            {item.isExtraLecture && item.session?.lectureTopic && (
                              <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                                Topic: {item.session.lectureTopic}
                              </p>
                            )}
                          </td>

                          {/* Faculty Instructor */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-navy-900">
                              {item.teacherName}
                            </div>
                            <div className="text-[11px] font-mono text-navy-500">
                              ID: {item.teacherId.slice(0, 10)}...
                            </div>
                          </td>

                          {/* Division & Batch */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded bg-warm-100 text-navy-800 font-mono font-semibold text-[11px] border border-warm-200">
                              {item.divisionName || 'All Divisions'}
                            </span>
                            {item.batch && item.batch !== 'All' && (
                              <span className="ml-1 text-[10px] font-mono text-navy-500">
                                Batch {item.batch}
                              </span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {item.isExtraLecture ? (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono text-[10px] font-bold inline-flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-indigo-600" />
                                <span>EXTRA LECTURE</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-warm-100 text-navy-700 border border-warm-300 font-mono text-[10px] font-medium">
                                TIMETABLE
                              </span>
                            )}
                          </td>

                          {/* Conduct Status & Notes */}
                          <td className="px-4 py-3">
                            {item.conductStatus === 'IN_PROGRESS' && (
                              <div className="space-y-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-300 inline-flex items-center gap-1.5 animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                  <span>LIVE NOW</span>
                                </span>
                                <p className="text-[11px] text-emerald-700 font-medium">
                                  Attendance broadcast is currently active.
                                </p>
                              </div>
                            )}

                            {item.conductStatus === 'COMPLETED' && (
                              <div className="space-y-0.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono font-bold text-[10px] border border-teal-200 inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-teal-700" />
                                  <span>COMPLETED</span>
                                </span>
                                <div className="text-[11px] font-mono text-navy-600">
                                  {item.attendanceCount !== undefined && item.attendanceCount > 0 ? (
                                    <span className="text-teal-800 font-semibold font-mono">
                                      {item.attendanceCount} verified attendees
                                    </span>
                                  ) : (
                                    <span className="text-navy-500">Session finalized</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.conductStatus === 'CANCELLED' && (
                              <div className="space-y-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 font-mono font-bold text-[10px] border border-rose-200 inline-flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-rose-600" />
                                  <span>CANCELLED</span>
                                </span>
                                <p className="text-[11px] text-rose-700 font-medium bg-rose-50/60 p-1.5 rounded border border-rose-200/60">
                                  <strong>Reason:</strong> {item.cancellationReason || 'Faculty unavailable / official leave'}
                                </p>
                                <span className="text-[10px] font-mono text-teal-800 block">
                                  &bull; Students protected (0 absent marked)
                                </span>
                              </div>
                            )}

                            {item.conductStatus === 'RESCHEDULED' && (
                              <div className="space-y-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono font-bold text-[10px] border border-amber-200 inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-amber-600" />
                                  <span>RESCHEDULED</span>
                                </span>
                                {item.rescheduledTo && (
                                  <p className="text-[11px] text-amber-800 bg-amber-50/60 p-1.5 rounded border border-amber-200/60">
                                    Moved to <strong>{item.rescheduledTo.date}</strong> at{' '}
                                    <strong>{item.rescheduledTo.startTime}</strong> in{' '}
                                    <strong>{item.rescheduledTo.room || item.room}</strong>
                                    {item.rescheduledTo.reason && ` (${item.rescheduledTo.reason})`}
                                  </p>
                                )}
                              </div>
                            )}

                            {item.conductStatus === 'NOT_CONDUCTED' && (
                              <div className="space-y-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium text-[10px] border border-slate-300 inline-flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-slate-500" />
                                  <span>NOT CONDUCTED</span>
                                </span>
                                <p className="text-[11px] text-slate-600">
                                  Slot expired without attendance session being initiated.
                                </p>
                                <span className="text-[10px] font-mono text-teal-800 block">
                                  &bull; Students protected (0 absent marked)
                                </span>
                              </div>
                            )}

                            {item.conductStatus === 'SCHEDULED' && (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-full bg-warm-100 text-navy-600 font-mono text-[10px] border border-warm-200">
                                  SCHEDULED
                                </span>
                                <p className="text-[11px] text-navy-500">
                                  Eligible for QR code at {item.startTime}.
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC HIERARCHY & DIVISIONS */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <span>Department Divisions & Allocations</span>
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Manage divisions, class teachers, and subject allocations.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {departments
              .filter(dept => selectedDeptFilter === 'ALL' || dept.toLowerCase().includes(selectedDeptFilter.toLowerCase()) || selectedDeptFilter.toLowerCase().includes(dept.toLowerCase()))
              .map((deptName, deptIdx) => {
                const deptDivisions = divisions.filter(div => 
                  div.departmentName.toLowerCase().includes(deptName.toLowerCase()) || 
                  deptName.toLowerCase().includes(div.departmentName.toLowerCase()) ||
                  (div.departmentCode && deptName.toLowerCase().includes(div.departmentCode.toLowerCase()))
                );

                const yearsOfStudy: YearOfStudy[] = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

                return (
                  <div key={deptIdx} className="rounded-xl border border-warm-300 bg-surface overflow-hidden shadow-subtle">
                    <div className="bg-warm-100/70 px-5 py-3 border-b border-warm-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded bg-navy-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                          {deptIdx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">{deptName}</h4>
                      </div>
                      <span className="text-xs font-mono text-navy-500">
                        {deptDivisions.length} divisions
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {yearsOfStudy.map(year => {
                        const yearDivisions = deptDivisions.filter(d => d.yearOfStudy === year);
                        if (yearDivisions.length === 0) return null;

                        return (
                          <div key={year} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="text-xs font-bold font-mono text-navy-800 uppercase">
                                {year}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {yearDivisions.map(div => {
                                const divAllocations = subjectAllocations.filter(sa => sa.divisionId === div.id);

                                return (
                                  <div
                                    key={div.id}
                                    className="p-3.5 rounded-lg border border-warm-200 bg-warm-50/50 hover:bg-white transition-all space-y-2 relative group"
                                  >
                                    <div className="flex items-start justify-between">
                                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                        {div.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => deleteDivision(div.id)}
                                        className="text-navy-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Division"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    <div className="text-xs text-navy-600 space-y-0.5 font-mono">
                                      <p>Room: <strong className="text-navy-900">{div.roomNumber || 'Room 101'}</strong></p>
                                      <p>Teacher: <span className="text-navy-900">{div.classTeacherName || 'Unassigned'}</span></p>
                                      <p>Enrolled: <strong className="text-primary">{div.enrolledCount || 0}</strong>/{div.capacity || 72}</p>
                                    </div>

                                    {divAllocations.length > 0 && (
                                      <div className="pt-2 border-t border-warm-200 flex flex-wrap gap-1">
                                        {divAllocations.map(sa => (
                                          <span
                                            key={sa.id}
                                            className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-warm-300 text-navy-800 font-mono"
                                          >
                                            {sa.courseCode}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB: SUBJECT ALLOCATIONS & FACULTY AUTHORIZATION */}
      {activeTab === 'allocations' && (
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                  ACADEMIC GOVERNANCE
                </span>
                <span className="text-xs text-navy-400">&bull;</span>
                <span className="text-[11px] font-mono text-teal-800 font-semibold">
                  Department Admin Authority
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-navy-900">
                Subject Allocation & Attendance Authorization
              </h2>
              <p className="text-xs text-navy-600 max-w-2xl leading-relaxed">
                Assign subjects to faculty members with division, batch, and semester bounds. Faculty members can <strong>only</strong> take attendance for subjects assigned to them by the Department Admin.
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => handleOpenNewAllocation()}
                className="px-4 py-2.5 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-semibold shadow-subtle inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Assign Subject</span>
              </button>
            </div>
          </div>

          {/* Allocation Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
              <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Allocations</span>
              <p className="text-2xl font-bold text-navy-900 font-mono">{subjectAllocations.length}</p>
              <span className="text-[11px] text-teal-700 font-medium font-mono block">Authorized mappings</span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
              <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Assigned Faculty</span>
              <p className="text-2xl font-bold text-navy-900 font-mono">
                {uniqueAssignedTeachers.size} <span className="text-xs font-normal text-navy-500">/ {facultyMembers.length}</span>
              </p>
              <span className="text-[11px] text-teal-700 font-medium font-mono block">Instructors assigned</span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
              <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Total Courses</span>
              <p className="text-2xl font-bold text-navy-900 font-mono">{courses.length}</p>
              <span className="text-[11px] text-teal-700 font-medium font-mono block">Curriculum catalog</span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
              <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Unassigned Courses</span>
              <p className={`text-2xl font-bold font-mono ${unallocatedCourses.length > 0 ? 'text-amber-600' : 'text-teal-800'}`}>
                {unallocatedCourses.length}
              </p>
              <span className="text-[11px] text-navy-500 font-mono block">
                {unallocatedCourses.length > 0 ? 'Action required' : 'Fully allocated'}
              </span>
            </div>
          </div>

          {/* Unassigned Subjects Advisory (Progressive Disclosure) */}
          {unallocatedCourses.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-bold text-amber-900">
                    {unallocatedCourses.length} Unallocated Subject{unallocatedCourses.length === 1 ? '' : 's'} Detected
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-800">
                  Faculty cannot take attendance until assigned
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {unallocatedCourses.slice(0, 6).map(course => (
                  <div key={course.id} className="p-2.5 rounded-lg bg-surface border border-amber-200 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-navy-900 block truncate">
                        {course.courseCode} — {course.courseName}
                      </span>
                      <span className="text-[10px] text-navy-500 font-mono">
                        {course.department}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenNewAllocation(course.id)}
                      className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold shrink-0 transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-3.5 w-3.5 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject code, title, faculty, division..."
                value={allocSearch}
                onChange={e => setAllocSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 min-h-[38px] rounded-lg border border-warm-300 text-xs bg-warm-50/50 text-navy-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-navy-500" />
              <select
                value={allocDeptFilter}
                onChange={e => setAllocDeptFilter(e.target.value)}
                className="px-3 py-2 min-h-[38px] border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Allocations Table */}
          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Subject / Code</th>
                  <th className="px-4 py-3">Assigned Faculty</th>
                  <th className="px-4 py-3">Division & Cohort</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Term / Academic Year</th>
                  <th className="px-4 py-3 text-center">Weekly Hrs</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-navy-500 italic">
                      No subject allocations found matching your search. Tap &ldquo;+ Assign Subject&rdquo; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map(alloc => (
                    <tr key={alloc.id} className="hover:bg-warm-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-navy-900 block">
                          {alloc.courseCode}
                        </span>
                        <span className="text-navy-700 text-[11px] block truncate max-w-xs">
                          {alloc.courseName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-navy-900 block">
                          Prof. {alloc.teacherName}
                        </span>
                        <span className="text-[11px] font-mono text-navy-500 block">
                          {alloc.teacherEmail || 'Faculty'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-navy-900 block">
                          {alloc.divisionName || 'Classroom Division'}
                        </span>
                        <span className="text-[11px] font-mono text-teal-700 block">
                          {alloc.yearOfStudy || 'All Years'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono px-2 py-0.5 rounded text-[11px] bg-warm-100 border border-warm-300 text-navy-800 font-medium">
                          {alloc.batch || 'All'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-600 text-[11px]">
                        <div>{alloc.semester || 'Semester 6'}</div>
                        <div className="text-navy-400">{alloc.academicYear || '2026–27'}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-navy-800">
                        {alloc.weeklyHours || 4}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditAllocation(alloc)}
                            className="p-1.5 rounded hover:bg-warm-200 text-navy-700 transition-colors"
                            title="Edit Assignment"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAllocation(alloc.id, alloc.courseCode, alloc.teacherName)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                            title="Remove Assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Allocation Creation / Edit Modal */}
          {isAssignModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
              <div className="bg-surface rounded-2xl border border-warm-300 shadow-elevated w-full max-w-lg p-6 space-y-5 animate-in fade-in-50 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-warm-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-navy-900">
                      {editingAllocId ? 'Edit Subject Assignment' : 'Assign Subject to Faculty'}
                    </h3>
                    <p className="text-xs text-navy-500">
                      Establish official authorization relationship for live attendance sessions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="p-1 rounded-lg hover:bg-warm-200 text-navy-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {allocError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{allocError}</span>
                  </div>
                )}

                {allocSuccess && (
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-300 text-teal-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                    <span>{allocSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAllocation} className="space-y-4">
                  {/* Subject Dropdown */}
                  <div>
                    <label className="text-xs font-semibold text-navy-700 block mb-1">
                      Subject / Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={allocCourseId}
                      onChange={e => setAllocCourseId(e.target.value)}
                      required
                      className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.courseCode} — {c.courseName} ({c.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Faculty Member Dropdown */}
                  <div>
                    <label className="text-xs font-semibold text-navy-700 block mb-1">
                      Faculty Member / Instructor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={allocTeacherId}
                      onChange={e => setAllocTeacherId(e.target.value)}
                      required
                      className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                    >
                      {facultyMembers.map(f => (
                        <option key={f.uid} value={f.uid}>
                          Prof. {f.fullName} ({f.department} • {f.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Division Dropdown */}
                  <div>
                    <label className="text-xs font-semibold text-navy-700 block mb-1">
                      Target Division <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={allocDivisionId}
                      onChange={e => setAllocDivisionId(e.target.value)}
                      required
                      className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                    >
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.departmentName} — {d.name} ({d.yearOfStudy})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch & Semester Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-navy-700 block mb-1">
                        Batch Scope
                      </label>
                      <select
                        value={allocBatch}
                        onChange={e => setAllocBatch(e.target.value)}
                        className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                      >
                        <option value="All">Full Class (All Students)</option>
                        <option value="Batch 1">Batch 1 (Lab / Practical)</option>
                        <option value="Batch 2">Batch 2 (Lab / Practical)</option>
                        <option value="Batch 3">Batch 3 (Lab / Practical)</option>
                        <option value="Batch 4">Batch 4 (Lab / Practical)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-navy-700 block mb-1">
                        Academic Semester
                      </label>
                      <select
                        value={allocSemester}
                        onChange={e => setAllocSemester(e.target.value)}
                        className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                      >
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                  </div>

                  {/* Academic Year & Weekly Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-navy-700 block mb-1">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        value={allocAcademicYear}
                        onChange={e => setAllocAcademicYear(e.target.value)}
                        placeholder="e.g. 2026–27"
                        required
                        className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 font-mono focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-navy-700 block mb-1">
                        Weekly Hours (Lecture / Lab)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={allocWeeklyHours}
                        onChange={e => setAllocWeeklyHours(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 min-h-[44px] rounded-lg border border-warm-300 text-xs bg-white text-navy-900 font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-warm-200 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-4 py-2 min-h-[44px] rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-700 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={allocSubmitting}
                      className="px-5 py-2 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold shadow-subtle transition-all active:scale-95 disabled:opacity-50"
                    >
                      {allocSubmitting ? 'Saving Assignment...' : (editingAllocId ? 'Save Changes' : 'Confirm Assignment')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              <span>Add New Department</span>
            </h3>
            <form onSubmit={handleAddDept} className="flex gap-2 max-w-xl">
              <input
                type="text"
                required
                placeholder="Department name..."
                value={newDeptInput}
                onChange={e => setNewDeptInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
              />
              <button
                type="submit"
                disabled={addingDept}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors shadow-subtle shrink-0"
              >
                {addingDept ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>

          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
            <div className="divide-y divide-warm-200">
              {departments.map((dept, idx) => {
                const deptFaculty = facultyMembers.filter(f => f.department === dept);
                const deptCourses = courses.filter(c => c.department === dept);

                return (
                  <div key={idx} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-navy-900">{dept}</h4>
                      <p className="text-navy-500 font-mono text-[11px]">
                        {deptFaculty.length} Faculty &bull; {deptCourses.length} Courses
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDepartment(dept)}
                      className="px-2.5 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FACULTY ROSTER */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
              <input
                type="text"
                placeholder="Search faculty by name, ID, or email..."
                value={facultySearch}
                onChange={e => setFacultySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-lg text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
              />
            </div>
            <span className="text-xs text-navy-500 font-mono">
              {filteredFaculty.length} Faculty Members
            </span>
          </div>

          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[580px]">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Faculty Name</th>
                  <th className="px-4 py-3">Faculty ID</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {filteredFaculty.map(faculty => {
                  const isEditing = editingFacultyUid === faculty.uid;

                  return (
                    <tr key={faculty.uid} className="hover:bg-warm-50/60">
                      <td className="px-4 py-3 font-bold text-navy-900">
                        {faculty.fullName}
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-600">
                        {faculty.facultyId || 'FAC-01'}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={newFacultyDept}
                              onChange={e => setNewFacultyDept(e.target.value)}
                              className="px-2 py-1 border border-warm-300 rounded text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                            >
                              <option value="">Select Dept</option>
                              {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveFacultyDept(faculty.uid)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFacultyUid(null)}
                              className="px-2 py-1 bg-warm-200 text-navy-700 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-navy-800">
                            {faculty.department || 'Computer Engineering'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-600">
                        {faculty.email}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFacultyUid(faculty.uid);
                              setNewFacultyDept(faculty.department);
                            }}
                            className="px-2.5 py-1 rounded border border-warm-300 text-navy-700 hover:bg-warm-100 text-xs font-medium"
                          >
                            Reassign
                          </button>
                        )}
                        {faculty.uid !== currentUser?.uid && (
                          <button
                            type="button"
                            onClick={() => removeFaculty(faculty.uid)}
                            className="px-2 py-1 rounded text-red-600 hover:bg-red-50 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: COURSES */}
      {activeTab === 'courses' && (
        <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Course Title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3 text-right">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-200">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-warm-50/60">
                  <td className="px-4 py-3 font-mono font-bold text-navy-900">
                    {course.courseCode}
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy-900">
                    {course.courseName}
                  </td>
                  <td className="px-4 py-3 text-navy-700">
                    {course.department}
                  </td>
                  <td className="px-4 py-3 text-navy-800">
                    {course.teacherName}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                    {course.enrolledCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
