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
  Layers, 
  ArrowRight, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  BarChart3, 
  TrendingUp 
} from 'lucide-react';
import { LectureConductStatus, DayOfWeek } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { currentUser, currentOrg } = useAuth();
  const { 
    courses, 
    organizationUsers, 
    departments: registeredDepts,
    divisions, 
    timetable,
    sessions,
    getSlotConductStatus,
    addDepartmentHierarchy,
    deleteDepartmentHierarchy,
    assignDepartmentHOD,
    assignFacultyDepartment, 
    removeFaculty
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'lectures' | 'faculty' | 'courses'>('overview');
  
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
  const [monitorDeptFilter, setMonitorDeptFilter] = useState('ALL');
  const [monitorFacultyFilter, setMonitorFacultyFilter] = useState('ALL');
  const [monitorSubjectFilter, setMonitorSubjectFilter] = useState('ALL');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState('ALL');
  const [monitorSearchQuery, setMonitorSearchQuery] = useState('');

  // Department Creation Form State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [addingDept, setAddingDept] = useState(false);
  const [deptFeedback, setDeptFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // HOD Assignment in Department Tab
  const [assigningHodDeptId, setAssigningHodDeptId] = useState<string | null>(null);
  const [selectedHodFacultyUid, setSelectedHodFacultyUid] = useState<string>('');
  const [assigningHodSubmitting, setAssigningHodSubmitting] = useState(false);
  
  // Faculty Search & Reassign State
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDeptFilter, setFacultyDeptFilter] = useState('ALL');
  const [editingFacultyUid, setEditingFacultyUid] = useState<string | null>(null);
  const [newFacultyDept, setNewFacultyDept] = useState('');

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  const orgName = currentOrg?.name || currentUser?.organizationName || 'Apex Institute of Technology';
  const orgCode = currentOrg?.code || currentUser?.organizationCode || 'APEX101';
  const orgCity = currentOrg?.city || 'Main Campus';

  const departmentsList = useMemo(() => {
    if (registeredDepts && registeredDepts.length > 0) {
      return registeredDepts;
    }
    const orgDepts = currentOrg?.departments || [
      'Computer Engineering',
      'Information Technology',
      'Electronics & Telecommunication',
      'Mechanical Engineering',
      'Civil Engineering'
    ];
    return orgDepts.map((d, i) => ({
      id: `dept_${i + 1}`,
      name: d,
      code: d.slice(0, 4).toUpperCase(),
      createdAt: new Date().toISOString()
    }));
  }, [registeredDepts, currentOrg]);

  const facultyMembers = organizationUsers.filter(u => u.role === 'teacher' || u.role === 'dept_admin' || u.role === 'admin');
  const studentMembers = organizationUsers.filter(u => u.role === 'student');

  const filteredFaculty = facultyMembers.filter(f => {
    const matchesDept = facultyDeptFilter === 'ALL' || f.department === facultyDeptFilter || f.departmentId === facultyDeptFilter;
    const matchesQuery = 
      f.fullName.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
      (f.facultyId && f.facultyId.toLowerCase().includes(facultySearch.toLowerCase()));
    return matchesDept && matchesQuery;
  });

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;
    setAddingDept(true);
    setDeptFeedback(null);
    try {
      await addDepartmentHierarchy({
        name: newDeptName.trim(),
        code: newDeptCode.trim().toUpperCase(),
        organizationId: currentOrg?.id || currentUser?.organizationId || 'org_apex_tech',
        organizationCode: currentOrg?.code || currentUser?.organizationCode || 'APEX101'
      });
      setDeptFeedback({ type: 'success', message: `Department "${newDeptName}" (${newDeptCode.toUpperCase()}) successfully created!` });
      setNewDeptName('');
      setNewDeptCode('');
    } catch (err: any) {
      setDeptFeedback({ type: 'error', message: err.message || 'Failed to create department.' });
    } finally {
      setAddingDept(false);
    }
  };

  const handleAppointHOD = async (deptId: string) => {
    if (!selectedHodFacultyUid) return;
    setAssigningHodSubmitting(true);
    setDeptFeedback(null);
    try {
      await assignDepartmentHOD(deptId, selectedHodFacultyUid);
      const faculty = organizationUsers.find(u => u.uid === selectedHodFacultyUid);
      setDeptFeedback({ 
        type: 'success', 
        message: `Successfully appointed Prof. ${faculty?.fullName} as Head of Department (HOD)!` 
      });
      setAssigningHodDeptId(null);
      setSelectedHodFacultyUid('');
    } catch (err: any) {
      setDeptFeedback({ type: 'error', message: err.message || 'Failed to appoint HOD.' });
    } finally {
      setAssigningHodSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${deptName}"? This will unlink department divisions and faculty.`)) {
      return;
    }
    try {
      await deleteDepartmentHierarchy(deptId);
      setDeptFeedback({ type: 'success', message: `Department "${deptName}" removed.` });
    } catch (err: any) {
      setDeptFeedback({ type: 'error', message: err.message || 'Failed to delete department.' });
    }
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

  // Overall Institute Attendance Turnout Calculation
  const overallInstituteAttendanceRate = useMemo(() => {
    if (sessions.length === 0) return 88;
    const completed = sessions.filter(s => s.status === 'ended' || (s.totalPresent || 0) > 0);
    if (completed.length === 0) return 88;
    let totalPresent = 0;
    let totalExpected = 0;
    completed.forEach(s => {
      totalPresent += (s.totalPresent || 0);
      const div = divisions.find(d => d.id === s.divisionId);
      totalExpected += (div?.studentCount || div?.enrolledCount || 45);
    });
    if (totalExpected === 0) return 88;
    return Math.min(100, Math.round((totalPresent / totalExpected) * 100));
  }, [sessions, divisions]);

  // Department Performance Comparison Matrix Data (Principal Executive View)
  const departmentPerformanceMatrix = useMemo(() => {
    return departmentsList.map(dept => {
      const deptFaculty = facultyMembers.filter(f => f.departmentId === dept.id || f.department === dept.name);
      const deptDivs = divisions.filter(d => d.departmentId === dept.id || d.departmentName === dept.name || d.departmentCode === dept.code);
      const deptStudents = studentMembers.filter(s => s.departmentId === dept.id || s.department === dept.name);
      const deptCourseList = courses.filter(c => c.department === dept.name || c.departmentId === dept.id);
      
      const deptDivIds = new Set(deptDivs.map(d => d.id));
      const deptCourseIds = new Set(deptCourseList.map(c => c.id));
      const deptSessions = sessions.filter(s => deptCourseIds.has(s.courseId) || (s.divisionId && deptDivIds.has(s.divisionId)));

      let attendanceRate = 85;
      if (deptSessions.length > 0) {
        let pres = 0;
        let exp = 0;
        deptSessions.forEach(s => {
          pres += (s.totalPresent || 0);
          const d = deptDivs.find(div => div.id === s.divisionId);
          exp += (d?.studentCount || d?.enrolledCount || 45);
        });
        if (exp > 0) {
          attendanceRate = Math.min(100, Math.round((pres / exp) * 100));
        }
      }

      // HOD Resolution
      const hodUser = deptFaculty.find(f => f.isHOD || f.role === 'dept_admin');
      const hodName = hodUser?.fullName || dept.hodName || 'Not Appointed';
      const hodEmail = hodUser?.email || dept.hodEmail || '—';

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code || 'DEPT',
        hodName,
        hodEmail,
        hasHod: Boolean(hodUser || dept.hodName),
        facultyCount: deptFaculty.length,
        divisionsCount: deptDivs.length,
        studentsCount: deptStudents.length,
        coursesCount: deptCourseList.length,
        sessionsCount: deptSessions.length,
        attendanceRate
      };
    });
  }, [departmentsList, facultyMembers, divisions, studentMembers, courses, sessions]);

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
    department?: string;
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
  }

  const monitoredLectures = useMemo(() => {
    const list: MonitoredLecture[] = [];

    slotsForSelectedDate.forEach(slot => {
      const conduct = getSlotConductStatus(slot, monitorDate);
      list.push({
        id: `slot_${slot.id}_${monitorDate}`,
        sourceType: 'timetable',
        courseId: slot.courseId,
        courseCode: slot.courseCode,
        courseName: slot.courseName,
        department: slot.department,
        teacherId: slot.teacherId,
        teacherName: slot.teacherName,
        divisionId: slot.divisionId,
        divisionName: slot.divisionName,
        batch: slot.batch,
        dayOfWeek: slot.dayOfWeek,
        date: monitorDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
        conductStatus: conduct.status,
        isExtraLecture: false,
        isLiveNow: conduct.isLiveNow,
        cancellationReason: conduct.cancellationReason
      });
    });

    extraSessionsForSelectedDate.forEach(s => {
      const course = courses.find(c => c.id === s.courseId);
      list.push({
        id: `extra_${s.id}`,
        sourceType: 'extra',
        courseId: s.courseId,
        courseCode: s.courseCode,
        courseName: s.courseName,
        department: course?.department,
        teacherId: s.teacherId,
        teacherName: s.teacherName,
        divisionId: s.divisionId,
        divisionName: s.divisionName,
        batch: s.batch,
        dayOfWeek: selectedDayOfWeek,
        date: s.lectureDate || monitorDate,
        startTime: s.scheduledStartTime || (s.startedAt ? s.startedAt.slice(11, 16) : '10:00'),
        endTime: s.scheduledEndTime || '11:00',
        room: s.room || 'Room 101',
        conductStatus: s.status === 'active' ? 'IN_PROGRESS' : 'COMPLETED',
        isExtraLecture: true,
        isLiveNow: s.status === 'active'
      });
    });

    return list.filter(item => {
      const matchesDept = monitorDeptFilter === 'ALL' || item.department === monitorDeptFilter;
      const matchesFaculty = monitorFacultyFilter === 'ALL' || item.teacherId === monitorFacultyFilter;
      const matchesSubject = monitorSubjectFilter === 'ALL' || item.courseId === monitorSubjectFilter;
      const matchesStatus = monitorStatusFilter === 'ALL' || item.conductStatus === monitorStatusFilter;
      const matchesQuery = !monitorSearchQuery || 
        item.courseCode.toLowerCase().includes(monitorSearchQuery.toLowerCase()) ||
        item.courseName.toLowerCase().includes(monitorSearchQuery.toLowerCase()) ||
        item.teacherName.toLowerCase().includes(monitorSearchQuery.toLowerCase());
      return matchesDept && matchesFaculty && matchesSubject && matchesStatus && matchesQuery;
    });
  }, [slotsForSelectedDate, extraSessionsForSelectedDate, monitorDate, courses, getSlotConductStatus, selectedDayOfWeek, monitorDeptFilter, monitorFacultyFilter, monitorSubjectFilter, monitorStatusFilter, monitorSearchQuery]);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.fullName?.split(' ')[0] || 'Principal';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header: Executive Principal Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-navy-500 mb-1">
            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              PRINCIPAL / INSTITUTE ADMIN
            </span>
            <span className="text-warm-400">&bull;</span>
            <span className="font-semibold text-navy-800 bg-warm-100 px-2 py-0.5 rounded border border-warm-200">
              {orgName}
            </span>
            <span className="text-warm-400">&bull;</span>
            <span className="text-navy-600">{orgCity}</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-navy-900">
            {timeGreeting}, {firstName}
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            College executive console: institutional analysis, department performance, and HOD appointments.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className="px-3.5 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <Plus className="h-4 w-4 text-primary" />
            <span>Create Department</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards (Institutional Turnout & Overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Departments</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{departmentsList.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Academic disciplines</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Active Divisions</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{divisions.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">FE, SE, TE, BE Classes</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Institute Faculty</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{facultyMembers.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Professors & Instructors</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Enrolled Students</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{studentMembers.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Verified enrolled</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Institute Turnout</span>
          <p className="text-2xl font-bold text-teal-800 font-mono">{overallInstituteAttendanceRate}%</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Overall attendance rate</span>
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
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Performance Overview & Analysis</span>
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
          <Layers className="h-3.5 w-3.5" />
          <span>Departments & HODs ({departmentsList.length})</span>
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
          <Radio className="h-3.5 w-3.5 text-primary" />
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
          onClick={() => setActiveTab('faculty')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'faculty' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Faculty Directory ({facultyMembers.length})</span>
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
          <BookOpen className="h-3.5 w-3.5" />
          <span>Master Courses ({courses.length})</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE PERFORMANCE OVERVIEW & ANALYSIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Department Performance Matrix (Principal's Comparative Overview) */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                    Department Comparative Performance Matrix
                  </h3>
                </div>
                <p className="text-xs text-navy-500 mt-0.5">
                  Comparative analysis of academic disciplines, appointed HODs, student strength, and attendance rates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('departments')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Manage Departments & HODs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Head of Department (HOD)</th>
                    <th className="px-4 py-3 text-center">Faculty</th>
                    <th className="px-4 py-3 text-center">Classes</th>
                    <th className="px-4 py-3 text-center">Students</th>
                    <th className="px-4 py-3">Attendance Turnout</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-200">
                  {departmentPerformanceMatrix.map(dept => (
                    <tr key={dept.id} className="hover:bg-warm-50/60">
                      <td className="px-4 py-3 font-semibold text-navy-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                            {dept.code}
                          </span>
                          <span>{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {dept.hasHod ? (
                          <div>
                            <span className="font-bold text-navy-900 flex items-center gap-1">
                              👨‍🏫 {dept.hodName}
                              <span className="text-[9px] bg-purple-100 text-purple-800 font-mono px-1 rounded">HOD</span>
                            </span>
                            <span className="text-[11px] text-navy-500 font-mono">{dept.hodEmail}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-mono text-[11px] font-semibold">
                            ⚠️ HOD Not Appointed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-center font-bold text-navy-800">
                        {dept.facultyCount}
                      </td>
                      <td className="px-4 py-3 font-mono text-center text-navy-700">
                        {dept.divisionsCount}
                      </td>
                      <td className="px-4 py-3 font-mono text-center font-bold text-primary">
                        {dept.studentsCount}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-warm-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                dept.attendanceRate >= 80 ? 'bg-teal-700' : dept.attendanceRate >= 75 ? 'bg-amber-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${dept.attendanceRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-navy-900">{dept.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('departments');
                            setAssigningHodDeptId(dept.id);
                          }}
                          className="px-2.5 py-1 rounded border border-warm-300 hover:bg-warm-100 text-navy-700 text-xs font-semibold"
                        >
                          Configure &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          </div>

          {/* Institutional Join Credentials */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                  Institute Join Credentials
                </h3>
              </div>
              <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                Active Organization
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
              Provide code <strong className="font-mono text-navy-900">{orgCode}</strong> to department HODs, faculty, and students during registration to attach them directly to {orgName}.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS & HOD GOVERNANCE */}
      {activeTab === 'departments' && (
        <div className="space-y-5">
          {/* Feedback banner */}
          {deptFeedback && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              deptFeedback.type === 'success' ? 'bg-teal-50 border border-teal-300 text-teal-900' : 'bg-red-50 border border-red-300 text-red-900'
            }`}>
              {deptFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{deptFeedback.message}</span>
            </div>
          )}

          {/* Department Creation Form */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              <span>Create New Academic Department</span>
            </h3>
            <p className="text-xs text-navy-600">
              Add an academic department to {orgName}. Each department can have an appointed HOD who oversees classes, timetable, and subject allocation.
            </p>

            <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-navy-700 block mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-navy-700 block mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIDS"
                  value={newDeptCode}
                  onChange={e => setNewDeptCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono uppercase font-bold bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={addingDept}
                  className="w-full px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors shadow-subtle disabled:opacity-50 min-h-[38px]"
                >
                  {addingDept ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>

          {/* Departments & HOD Roster */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentsList.map(dept => {
              const deptFaculty = facultyMembers.filter(f => f.departmentId === dept.id || f.department === dept.name);
              const deptDivs = divisions.filter(d => d.departmentId === dept.id || d.departmentName === dept.name || d.departmentCode === dept.code);
              const deptStudents = studentMembers.filter(s => s.departmentId === dept.id || s.department === dept.name);
              
              const hodUser = deptFaculty.find(f => f.isHOD || f.role === 'dept_admin');
              const hodName = hodUser?.fullName || dept.hodName;
              const hodEmail = hodUser?.email || dept.hodEmail;
              const isAssigningThis = assigningHodDeptId === dept.id;

              return (
                <div key={dept.id} className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20">
                          {dept.code || 'DEPT'}
                        </span>
                        <h4 className="text-base font-bold text-navy-900">{dept.name}</h4>
                      </div>
                      <p className="text-[11px] text-navy-500 font-mono mt-0.5">
                        {deptFaculty.length} Faculty &bull; {deptDivs.length} Classes &bull; {deptStudents.length} Students
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                      className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* HOD Status Banner */}
                  <div className="p-3 rounded-lg bg-warm-50 border border-warm-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-navy-500 font-bold uppercase tracking-wider">
                        Head of Department (HOD)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningHodDeptId(isAssigningThis ? null : dept.id);
                          setSelectedHodFacultyUid(hodUser?.uid || deptFaculty[0]?.uid || '');
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        {isAssigningThis ? 'Cancel' : (hodName ? 'Change HOD' : '+ Appoint HOD')}
                      </button>
                    </div>

                    {isAssigningThis ? (
                      <div className="space-y-2 pt-1 border-t border-warm-200">
                        <label className="text-[11px] font-semibold text-navy-700 block">
                          Select Faculty Member to appoint as HOD:
                        </label>
                        <select
                          value={selectedHodFacultyUid}
                          onChange={e => setSelectedHodFacultyUid(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-warm-300 rounded text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                        >
                          <option value="">-- Choose Department Faculty --</option>
                          {deptFaculty.map(f => (
                            <option key={f.uid} value={f.uid}>
                              👨‍🏫 {f.fullName} ({f.email})
                            </option>
                          ))}
                          {deptFaculty.length === 0 && (
                            facultyMembers.map(f => (
                              <option key={f.uid} value={f.uid}>
                                👨‍🏫 {f.fullName} ({f.department || 'Institute Faculty'})
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedHodFacultyUid || assigningHodSubmitting}
                          onClick={() => handleAppointHOD(dept.id)}
                          className="w-full py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-hover disabled:opacity-50 transition-colors"
                        >
                          {assigningHodSubmitting ? 'Appointing...' : 'Confirm HOD Appointment'}
                        </button>
                      </div>
                    ) : hodName ? (
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-navy-900">{hodName}</strong>
                          <span className="block text-[11px] text-navy-500 font-mono">{hodEmail}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200">
                          Active HOD
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 font-medium">
                        ⚠️ No HOD appointed yet. Appoint a faculty member to manage department operations.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INSTITUTIONAL LECTURE MONITOR */}
      {activeTab === 'lectures' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider font-mono">
                    Institutional Real-Time Lecture Monitor
                  </h3>
                  {todayMetrics.live > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300 animate-pulse">
                      {todayMetrics.live} LIVE NOW
                    </span>
                  )}
                </div>
                <p className="text-xs text-navy-500 mt-0.5">
                  Real-time audit across all departments, scheduled classes, extra lectures, and faculty conduct.
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
                <span className="text-xs font-mono font-bold text-navy-700 px-2 py-1 bg-warm-100 rounded border border-warm-200">
                  {selectedDayOfWeek}
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-warm-200">
              {/* Department Filter */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Department</label>
                <select
                  value={monitorDeptFilter}
                  onChange={e => setMonitorDeptFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Departments</option>
                  {departmentsList.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
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
                </select>
              </div>

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

              {/* Search Query */}
              <div>
                <label className="text-[10px] font-mono text-navy-500 font-semibold uppercase block mb-1">Search</label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-navy-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={monitorSearchQuery}
                    onChange={e => setMonitorSearchQuery(e.target.value)}
                    placeholder="Search subject or teacher..."
                    className="w-full pl-8 pr-2.5 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Monitored Lectures Table */}
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Time Slot</th>
                    <th className="px-4 py-3">Subject / Code</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Faculty Instructor</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-200">
                  {monitoredLectures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-navy-500 font-mono">
                        No lectures found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    monitoredLectures.map(lecture => (
                      <tr key={lecture.id} className="hover:bg-warm-50/60">
                        <td className="px-4 py-3 font-mono font-bold text-navy-900">
                          {lecture.startTime} – {lecture.endTime}
                        </td>
                        <td className="px-4 py-3 font-semibold text-navy-900">
                          <span className="font-mono font-bold text-primary block">{lecture.courseCode}</span>
                          <span>{lecture.courseName}</span>
                        </td>
                        <td className="px-4 py-3 text-navy-700">
                          {lecture.department || 'Computer Engineering'}
                        </td>
                        <td className="px-4 py-3 font-bold text-navy-800">
                          👨‍🏫 {lecture.teacherName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-navy-900">{lecture.divisionName || 'Division A'}</span>
                          <span className="block text-[10px] text-navy-500 font-mono">{lecture.batch ? `Batch ${lecture.batch}` : 'Full Class'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {lecture.conductStatus === 'IN_PROGRESS' && (
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                              LIVE NOW
                            </span>
                          )}
                          {lecture.conductStatus === 'COMPLETED' && (
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-teal-100 text-teal-800 border border-teal-300">
                              COMPLETED
                            </span>
                          )}
                          {lecture.conductStatus === 'SCHEDULED' && (
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-warm-100 text-navy-700 border border-warm-300">
                              SCHEDULED
                            </span>
                          )}
                          {lecture.conductStatus === 'CANCELLED' && (
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-300">
                              CANCELLED
                            </span>
                          )}
                          {lecture.conductStatus === 'NOT_CONDUCTED' && (
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-300">
                              NOT CONDUCTED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FACULTY DIRECTORY */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-navy-500">Filter Dept:</span>
              <select
                value={facultyDeptFilter}
                onChange={e => setFacultyDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-warm-300 rounded text-xs bg-white text-navy-800 font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Faculty Name</th>
                  <th className="px-4 py-3">Faculty ID</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role / Designation</th>
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
                              {departmentsList.map(d => (
                                <option key={d.id} value={d.name}>{d.name}</option>
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
                      <td className="px-4 py-3">
                        {faculty.isHOD ? (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200">
                            Head of Dept (HOD)
                          </span>
                        ) : faculty.role === 'admin' ? (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                            Institute Admin
                          </span>
                        ) : (
                          <span className="text-navy-600 font-medium">
                            Teaching Faculty
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
                              setNewFacultyDept(faculty.department || '');
                            }}
                            className="px-2.5 py-1 rounded border border-warm-300 text-navy-700 hover:bg-warm-100 text-xs font-medium"
                          >
                            Reassign Dept
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

      {/* TAB 5: MASTER COURSES */}
      {activeTab === 'courses' && (
        <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Course Title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3 text-right">Enrolled Students</th>
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
