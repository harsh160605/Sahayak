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
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Filter,
  X,
  Edit2,
  BarChart3,
  QrCode,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { YearOfStudy, SubjectAllocation, DayOfWeek } from '../../types';

export const DepartmentAdminDashboard: React.FC = () => {
  const { currentUser, currentOrg } = useAuth();
  const { 
    courses, 
    organizationUsers, 
    departments,
    divisions, 
    subjectAllocations, 
    timetable,
    sessions,
    attendanceRecords,
    addDivision,
    updateDivision,
    deleteDivision,
    allocateSubjectToDivision,
    updateSubjectAllocation,
    removeSubjectAllocation,
    bulkAddStudentsToDivision
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'divisions' | 'allocations' | 'timetable' | 'faculty' | 'attendance'>('overview');

  // Determine which department this admin/HOD oversees
  // Default to currentUser's department, or if Admin, first available department
  const userDeptName = currentUser?.department || 'Computer Engineering';
  const userDeptId = currentUser?.departmentId || 'dept_comp';
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
    const matching = departments.find(d => d.id === userDeptId || d.name === userDeptName);
    return matching?.id || departments[0]?.id || 'dept_comp';
  });

  const activeDept = useMemo(() => {
    return departments.find(d => d.id === selectedDeptId) || 
      departments.find(d => d.name === userDeptName) || 
      departments[0] || {
        id: 'dept_comp',
        name: 'Computer Engineering',
        code: 'COMP',
        hodName: currentUser?.fullName || 'Dr. Alok Sharma',
        hodEmail: currentUser?.email || 'alok.sharma@college.edu'
      };
  }, [departments, selectedDeptId, userDeptName, currentUser]);

  // Scoped Department Data
  const deptFaculty = useMemo(() => {
    return organizationUsers.filter(u => 
      (u.role === 'teacher' || u.role === 'dept_admin' || u.role === 'admin') &&
      (u.departmentId === activeDept.id || u.department === activeDept.name)
    );
  }, [organizationUsers, activeDept]);

  const deptDivisions = useMemo(() => {
    return divisions.filter(d => 
      d.departmentId === activeDept.id || 
      d.departmentName === activeDept.name ||
      d.departmentCode === activeDept.code
    );
  }, [divisions, activeDept]);

  const deptCourses = useMemo(() => {
    return courses.filter(c => 
      c.department === activeDept.name || 
      c.departmentId === activeDept.id ||
      c.departmentCode === activeDept.code
    );
  }, [courses, activeDept]);

  const deptAllocations = useMemo(() => {
    const divIds = new Set(deptDivisions.map(d => d.id));
    const courseIds = new Set(deptCourses.map(c => c.id));
    return subjectAllocations.filter(a => 
      a.departmentId === activeDept.id || 
      a.departmentName === activeDept.name ||
      divIds.has(a.divisionId) ||
      courseIds.has(a.courseId)
    );
  }, [subjectAllocations, activeDept, deptDivisions, deptCourses]);

  const deptStudents = useMemo(() => {
    const divIds = new Set(deptDivisions.map(d => d.id));
    return organizationUsers.filter(u => 
      u.role === 'student' && 
      ((u.divisionId && divIds.has(u.divisionId)) || u.department === activeDept.name || u.departmentId === activeDept.id)
    );
  }, [organizationUsers, deptDivisions, activeDept]);

  const deptSessions = useMemo(() => {
    const courseIds = new Set(deptCourses.map(c => c.id));
    const divIds = new Set(deptDivisions.map(d => d.id));
    return sessions.filter(s => 
      courseIds.has(s.courseId) || 
      (s.divisionId && divIds.has(s.divisionId))
    );
  }, [sessions, deptCourses, deptDivisions]);

  const deptAttendanceRate = useMemo(() => {
    if (deptSessions.length === 0) return 86; // sensible baseline
    const completedSessions = deptSessions.filter(s => s.status === 'ended' || (s.totalPresent || 0) > 0);
    if (completedSessions.length === 0) return 86;
    let totalPresent = 0;
    let totalExpected = 0;
    completedSessions.forEach(s => {
      totalPresent += (s.totalPresent || 0);
      const div = deptDivisions.find(d => d.id === s.divisionId);
      totalExpected += (div?.studentCount || div?.enrolledCount || 45);
    });
    if (totalExpected === 0) return 86;
    return Math.min(100, Math.round((totalPresent / totalExpected) * 100));
  }, [deptSessions, deptDivisions]);

  // Division Form State
  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null);
  const [divYear, setDivYear] = useState<YearOfStudy>('Third Year');
  const [divName, setDivName] = useState('Division A');
  const [divRoom, setDivRoom] = useState('Room 301');
  const [divClassTeacherId, setDivClassTeacherId] = useState('');
  const [divSubmitting, setDivSubmitting] = useState(false);
  const [divError, setDivError] = useState<string | null>(null);

  // Bulk Student Modal State
  const [isBulkStudentModalOpen, setIsBulkStudentModalOpen] = useState(false);
  const [bulkTargetDivId, setBulkTargetDivId] = useState('');
  const [bulkStudentsText, setBulkStudentsText] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  // Subject Allocation Form State
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [editingAllocId, setEditingAllocId] = useState<string | null>(null);
  const [allocCourseId, setAllocCourseId] = useState('');
  const [allocTeacherId, setAllocTeacherId] = useState('');
  const [allocDivisionId, setAllocDivisionId] = useState('');
  const [allocBatch, setAllocBatch] = useState('All');
  const [allocSemester, setAllocSemester] = useState('Semester 6');
  const [allocAcademicYear, setAllocAcademicYear] = useState(currentOrg?.currentAcademicYear || '2026–27');
  const [allocWeeklyHours, setAllocWeeklyHours] = useState(4);
  const [allocSearch, setAllocSearch] = useState('');
  const [allocDivFilter, setAllocDivFilter] = useState('ALL');
  const [allocError, setAllocError] = useState<string | null>(null);
  const [allocSuccess, setAllocSuccess] = useState<string | null>(null);
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  // Timetable State
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<DayOfWeek>('Monday');
  const [timetableDivFilter, setTimetableDivFilter] = useState<string>('ALL');

  // Handle Division Save
  const handleOpenNewDivision = () => {
    setEditingDivisionId(null);
    setDivYear('Third Year');
    setDivName('Division A');
    setDivRoom('Room 301');
    setDivClassTeacherId(deptFaculty[0]?.uid || '');
    setDivError(null);
    setIsDivisionModalOpen(true);
  };

  const handleEditDivision = (div: any) => {
    setEditingDivisionId(div.id);
    setDivYear(div.yearOfStudy);
    setDivName(div.name);
    setDivRoom(div.roomNumber || 'Room 301');
    setDivClassTeacherId(div.classTeacherId || '');
    setDivError(null);
    setIsDivisionModalOpen(true);
  };

  const handleSaveDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    setDivError(null);
    setDivSubmitting(true);

    try {
      const classTeacher = deptFaculty.find(f => f.uid === divClassTeacherId);
      const yrShort = divYear === 'First Year' ? 'FE' : divYear === 'Second Year' ? 'SE' : divYear === 'Third Year' ? 'TE' : 'BE';
      const divLetter = divName.replace(/Division\s*/i, '').trim() || 'A';
      const divCode = `${activeDept.code}-${yrShort}-${divLetter.toUpperCase()}`;

      if (editingDivisionId) {
        await updateDivision(editingDivisionId, {
          name: divName,
          yearOfStudy: divYear,
          roomNumber: divRoom,
          divisionCode: divCode,
          classTeacherId: classTeacher?.uid,
          classTeacherName: classTeacher?.fullName,
          classTeacherEmail: classTeacher?.email
        });
      } else {
        await addDivision({
          name: divName,
          yearOfStudy: divYear,
          divisionCode: divCode,
          departmentId: activeDept.id,
          departmentCode: activeDept.code,
          departmentName: activeDept.name,
          organizationId: currentOrg?.id || currentUser?.organizationId || 'org_apex_tech',
          organizationCode: currentOrg?.code || currentUser?.organizationCode || 'APEX101',
          academicYear: currentOrg?.currentAcademicYear || '2026–27',
          roomNumber: divRoom,
          classTeacherId: classTeacher?.uid,
          classTeacherName: classTeacher?.fullName,
          classTeacherEmail: classTeacher?.email,
          studentCount: 0
        });
      }
      setIsDivisionModalOpen(false);
    } catch (err: any) {
      setDivError(err.message || 'Failed to save division.');
    } finally {
      setDivSubmitting(false);
    }
  };

  const handleDeleteDivision = async (divId: string, divName: string) => {
    if (!window.confirm(`Are you sure you want to remove division ${divName}? All subject mappings for this class will need to be re-assigned.`)) {
      return;
    }
    try {
      await deleteDivision(divId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete division.');
    }
  };

  // Bulk Students Handlers
  const handleOpenBulkModal = (divId?: string) => {
    setBulkTargetDivId(divId || deptDivisions[0]?.id || '');
    setBulkStudentsText('');
    setBulkResult(null);
    setIsBulkStudentModalOpen(true);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTargetDivId || !bulkStudentsText.trim()) return;

    setBulkSubmitting(true);
    setBulkResult(null);

    try {
      const lines = bulkStudentsText.split('\n').filter(l => l.trim().length > 0);
      const studentEntries: Array<{ fullName: string; email: string; rollNo: string }> = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          studentEntries.push({
            fullName: parts[0],
            email: parts[1],
            rollNo: parts[2] || `${studentEntries.length + 1}`
          });
        }
      }

      if (studentEntries.length === 0) {
        throw new Error('Please enter at least one valid line in format: Name, Email, RollNo');
      }

      const res = await bulkAddStudentsToDivision(bulkTargetDivId, studentEntries);
      setBulkResult(`Success: ${res.message}`);
      setTimeout(() => {
        setIsBulkStudentModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setBulkResult(`Error: ${err.message}`);
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Subject Allocation Handlers
  const handleOpenNewAllocation = (prefilledCourseId?: string) => {
    setEditingAllocId(null);
    setAllocCourseId(prefilledCourseId || deptCourses[0]?.id || courses[0]?.id || '');
    setAllocTeacherId(deptFaculty[0]?.uid || '');
    setAllocDivisionId(deptDivisions[0]?.id || '');
    setAllocBatch('All');
    setAllocSemester('Semester 6');
    setAllocAcademicYear(currentOrg?.currentAcademicYear || '2026–27');
    setAllocWeeklyHours(4);
    setAllocError(null);
    setAllocSuccess(null);
    setIsAllocModalOpen(true);
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
    setIsAllocModalOpen(true);
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocError(null);
    setAllocSuccess(null);

    const course = courses.find(c => c.id === allocCourseId);
    const teacher = organizationUsers.find(f => f.uid === allocTeacherId);
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
          departmentId: activeDept.id,
          departmentName: activeDept.name,
          yearOfStudy: division.yearOfStudy,
          academicYear: allocAcademicYear,
          semester: allocSemester,
          batch: allocBatch,
          weeklyHours: allocWeeklyHours
        });
        setAllocSuccess(`Updated allocation for ${course.courseCode}.`);
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
          departmentId: activeDept.id,
          departmentName: activeDept.name,
          yearOfStudy: division.yearOfStudy,
          academicYear: allocAcademicYear,
          semester: allocSemester,
          batch: allocBatch,
          weeklyHours: allocWeeklyHours
        });
        setAllocSuccess(`Allocated ${course.courseCode} to Prof. ${teacher.fullName}.`);
      }

      setTimeout(() => {
        setIsAllocModalOpen(false);
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

  // Timetable slots for active department
  const deptTimetableSlots = useMemo(() => {
    const divIds = new Set(deptDivisions.map(d => d.id));
    return timetable.filter(slot => {
      const matchesDay = slot.dayOfWeek === selectedTimetableDay;
      const matchesDiv = timetableDivFilter === 'ALL' || slot.divisionId === timetableDivFilter;
      const belongsToDept = (slot.divisionId && divIds.has(slot.divisionId)) || slot.department === activeDept.name;
      return matchesDay && matchesDiv && belongsToDept;
    });
  }, [timetable, selectedTimetableDay, timetableDivFilter, deptDivisions, activeDept]);

  // Defaulter students (< 75% attendance)
  const deptDefaulters = useMemo(() => {
    const studentAttendanceMap = new Map<string, { present: number; total: number; student: any }>();
    
    // Group records by student
    attendanceRecords.forEach(rec => {
      const student = deptStudents.find(s => s.uid === rec.studentUid);
      if (!student) return;
      const existing = studentAttendanceMap.get(rec.studentUid) || { present: 0, total: 0, student };
      existing.total++;
      if (rec.status === 'present') existing.present++;
      studentAttendanceMap.set(rec.studentUid, existing);
    });

    const defaulters: Array<{ student: any; rate: number; total: number; present: number }> = [];
    studentAttendanceMap.forEach(({ present, total, student }) => {
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
      if (rate < 75) {
        defaulters.push({ student, rate, total, present });
      }
    });

    return defaulters.sort((a, b) => a.rate - b.rate);
  }, [attendanceRecords, deptStudents]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header: Department Identity & HOD Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warm-300 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono mb-1">
            <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              DEPARTMENT ADMINISTRATION
            </span>
            <span className="text-navy-400">&bull;</span>
            <span className="font-semibold text-navy-800 bg-warm-100 px-2 py-0.5 rounded border border-warm-200">
              {activeDept.code}
            </span>
            <span className="text-navy-400">&bull;</span>
            <span className="text-navy-600">{currentOrg?.name || 'Apex Institute of Technology'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
            {activeDept.name}
          </h1>

          <p className="text-xs text-navy-600 mt-1 flex items-center gap-2">
            <span>Head of Department:</span>
            <strong className="text-navy-900 font-semibold">{activeDept.hodName || currentUser?.fullName || 'HOD'}</strong>
            <span className="text-navy-400">({activeDept.hodEmail || currentUser?.email})</span>
          </p>
        </div>

        {/* Multi-department switcher if principal or superadmin */}
        {currentUser?.role === 'admin' && (
          <div className="flex items-center gap-2 self-start md:self-auto bg-warm-100 p-1.5 rounded-lg border border-warm-300">
            <span className="text-[11px] font-mono text-navy-600 font-semibold px-2">Switch Dept:</span>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-warm-300 rounded text-navy-900 focus:outline-none focus:border-primary"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Department Key Performance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Divisions / Classes</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{deptDivisions.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">FE, SE, TE, BE</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Assigned Subjects</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{deptAllocations.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Allocated mappings</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Dept Faculty</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{deptFaculty.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Under HOD</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Students Enrolled</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{deptStudents.length}</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Verified members</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase tracking-wider">Dept Attendance</span>
          <p className="text-2xl font-bold text-teal-800 font-mono">{deptAttendanceRate}%</p>
          <span className="text-[11px] text-teal-700 font-medium font-mono block">Turnout rate</span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
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
          <Building className="h-3.5 w-3.5" />
          <span>Department Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('divisions')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'divisions' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Divisions & Classes ({deptDivisions.length})</span>
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
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Subject Allocations ({deptAllocations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timetable')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'timetable' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Department Timetable</span>
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
          <span>Department Faculty ({deptFaculty.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'attendance' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Attendance Audit & Defaulters ({deptDefaulters.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={handleOpenNewDivision}
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group text-left"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <Plus className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors">
                Add New Division
              </h3>
              <p className="text-[11px] text-navy-500">
                Create FE/SE/TE/BE classes and assign Class Teachers.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleOpenNewAllocation()}
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group text-left"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors">
                Allocate Subject
              </h3>
              <p className="text-[11px] text-navy-500">
                Assign department faculty to subjects and classes.
              </p>
            </button>

            <NavLink
              to="/teacher/timetable"
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group text-left"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors">
                Manage Timetable
              </h3>
              <p className="text-[11px] text-navy-500">
                Setup periods, lecture slots, and labs for divisions.
              </p>
            </NavLink>

            <button
              type="button"
              onClick={() => handleOpenBulkModal()}
              className="p-4 rounded-xl bg-surface border border-warm-300 hover:border-primary/50 shadow-subtle transition-all space-y-1.5 group text-left"
            >
              <div className="p-2 rounded-lg bg-warm-100 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-navy-900 group-hover:text-primary transition-colors">
                Bulk Add Students
              </h3>
              <p className="text-[11px] text-navy-500">
                Paste student list with name, email, and roll numbers.
              </p>
            </button>
          </div>

          {/* Department Structure Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Classes & Class Teachers */}
            <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-warm-200 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                    Classes & Divisions ({deptDivisions.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('divisions')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Manage &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {deptDivisions.map(div => {
                  const divAllocCount = deptAllocations.filter(a => a.divisionId === div.id).length;
                  return (
                    <div key={div.id} className="p-3 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900">{div.yearOfStudy} - {div.name}</span>
                          <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-white border border-warm-300 text-navy-700">
                            {div.divisionCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-navy-600 mt-0.5">
                          Class Teacher: <strong>{div.classTeacherName || 'Not Assigned'}</strong> &bull; Room {div.roomNumber || '301'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-primary block">
                          {div.studentCount || div.enrolledCount || 0} Students
                        </span>
                        <span className="text-[10px] text-navy-500 font-mono">
                          {divAllocCount} Subjects Assigned
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Faculty Supervision */}
            <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-warm-200 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
                    Department Faculty ({deptFaculty.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('faculty')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {deptFaculty.slice(0, 5).map(f => {
                  const fAllocs = deptAllocations.filter(a => a.teacherId === f.uid);
                  const totalWeeklyHours = fAllocs.reduce((sum, a) => sum + (a.weeklyHours || 4), 0);

                  return (
                    <div key={f.uid} className="p-2.5 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-navy-900">{f.fullName}</span>
                          {f.isHOD && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 font-mono font-bold px-1.5 py-0.2 rounded border border-purple-200">
                              HOD
                            </span>
                          )}
                          {f.isClassTeacher && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-mono px-1 py-0.2 rounded">
                              Class Teacher
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-navy-500 font-mono">{f.email}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-navy-900 block">
                          {fAllocs.length} Courses
                        </span>
                        <span className="text-[10px] text-navy-500 font-mono">
                          {totalWeeklyHours} hrs/week
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIVISIONS & CLASSES */}
      {activeTab === 'divisions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
            <div>
              <h3 className="text-sm font-bold text-navy-900">
                Department Classes & Divisions
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Manage academic divisions for FE, SE, TE, and BE under {activeDept.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenBulkModal()}
                className="px-3 py-2 rounded-lg border border-warm-300 hover:bg-warm-100 text-navy-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-navy-600" />
                <span>Bulk Import Students</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewDivision}
                className="px-3.5 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span>Add Division</span>
              </button>
            </div>
          </div>

          {/* Divisions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deptDivisions.map(div => {
              const divAllocations = deptAllocations.filter(a => a.divisionId === div.id);
              const divStudents = deptStudents.filter(s => s.divisionId === div.id || s.divisionName === div.name);

              return (
                <div key={div.id} className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-primary tracking-wider">
                        {div.yearOfStudy}
                      </span>
                      <h4 className="text-base font-bold text-navy-900">{div.name}</h4>
                      <span className="text-xs font-mono text-navy-500 bg-warm-100 px-2 py-0.5 rounded border border-warm-200">
                        {div.divisionCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditDivision(div)}
                        className="p-1.5 rounded hover:bg-warm-100 text-navy-600 hover:text-navy-900 transition-colors"
                        title="Edit Division"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDivision(div.id, div.name)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Division"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-navy-700 pt-2 border-t border-warm-200">
                    <div className="flex items-center justify-between">
                      <span className="text-navy-500">Class Teacher:</span>
                      <strong className="text-navy-900">{div.classTeacherName || 'Not Assigned'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy-500">Classroom:</span>
                      <strong className="text-navy-900">{div.roomNumber || 'Room 301'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy-500">Student Strength:</span>
                      <strong className="text-primary font-mono">{divStudents.length || div.studentCount || 0} Enrolled</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy-500">Assigned Subjects:</span>
                      <strong className="text-navy-900 font-mono">{divAllocations.length} Courses</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-warm-200">
                    <button
                      type="button"
                      onClick={() => handleOpenBulkModal(div.id)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Students</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAllocDivisionId(div.id);
                        handleOpenNewAllocation();
                      }}
                      className="text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
                    >
                      Assign Subject &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                  DEPARTMENT HOD GOVERNANCE
                </span>
                <span className="text-xs text-navy-400">&bull;</span>
                <span className="text-[11px] font-mono text-teal-800 font-semibold">
                  Faculty Authorization
                </span>
              </div>
              <h3 className="text-base font-bold text-navy-900 mt-1">
                Subject Allocation & Attendance Rights
              </h3>
              <p className="text-xs text-navy-600 max-w-2xl leading-relaxed mt-0.5">
                Assign subjects to department faculty for specific divisions/batches. Teachers can <strong>only</strong> conduct attendance for their allocated courses.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewAllocation()}
              className="px-4 py-2 min-h-[40px] rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-semibold shadow-subtle inline-flex items-center gap-2 transition-all self-start md:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Subject to Faculty</span>
            </button>
          </div>

          {/* Search & Division Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-3.5 w-3.5 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject code, title, faculty..."
                value={allocSearch}
                onChange={e => setAllocSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-warm-300 text-xs bg-warm-50/50 text-navy-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-navy-500" />
              <select
                value={allocDivFilter}
                onChange={e => setAllocDivFilter(e.target.value)}
                className="px-3 py-1.5 border border-warm-300 rounded-lg text-xs bg-surface text-navy-800 font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Divisions ({deptDivisions.length})</option>
                {deptDivisions.map(d => (
                  <option key={d.id} value={d.id}>{d.yearOfStudy} - {d.name}</option>
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
                  <th className="px-4 py-3">Target Division</th>
                  <th className="px-4 py-3">Batch & Semester</th>
                  <th className="px-4 py-3">Weekly Hours</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {deptAllocations
                  .filter(a => {
                    const matchesDiv = allocDivFilter === 'ALL' || a.divisionId === allocDivFilter;
                    const matchesQuery = 
                      a.courseCode.toLowerCase().includes(allocSearch.toLowerCase()) ||
                      a.courseName.toLowerCase().includes(allocSearch.toLowerCase()) ||
                      a.teacherName.toLowerCase().includes(allocSearch.toLowerCase());
                    return matchesDiv && matchesQuery;
                  })
                  .map(alloc => (
                    <tr key={alloc.id} className="hover:bg-warm-50/60">
                      <td className="px-4 py-3 font-semibold text-navy-900">
                        <span className="font-mono font-bold text-primary block">{alloc.courseCode}</span>
                        <span>{alloc.courseName}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-navy-900">
                        👨‍🏫 {alloc.teacherName}
                        <span className="block text-[11px] font-normal text-navy-500 font-mono">{alloc.teacherEmail}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-navy-800">{alloc.divisionName || 'Division A'}</span>
                        <span className="block text-[11px] text-navy-500">{alloc.yearOfStudy || 'Third Year'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-navy-800">{alloc.batch || 'All Students'}</span>
                        <span className="block text-[10px] text-navy-500">{alloc.semester || 'Sem 6'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-navy-900">
                        {alloc.weeklyHours || 4} hrs/wk
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditAllocation(alloc)}
                          className="px-2.5 py-1 rounded border border-warm-300 hover:bg-warm-100 text-navy-700 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAllocation(alloc.id, alloc.courseCode, alloc.teacherName)}
                          className="px-2 py-1 rounded text-red-600 hover:bg-red-50 text-xs font-semibold"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENT TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
            <div>
              <h3 className="text-sm font-bold text-navy-900">
                Department Timetable & Schedules
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Review weekly lectures and practicals across {activeDept.name} divisions.
              </p>
            </div>

            <NavLink
              to="/teacher/timetable"
              className="px-3.5 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle self-start sm:self-auto"
            >
              <Calendar className="h-4 w-4 text-primary" />
              <span>Open Timetable Scheduler</span>
            </NavLink>
          </div>

          {/* Day & Division Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
            {/* Day Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as DayOfWeek[]).map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedTimetableDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                    selectedTimetableDay === day
                      ? 'bg-navy-900 text-white'
                      : 'bg-warm-100 text-navy-700 hover:bg-warm-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Division Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-navy-500">Division:</span>
              <select
                value={timetableDivFilter}
                onChange={e => setTimetableDivFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-warm-300 rounded text-xs bg-white text-navy-800 font-medium focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Divisions</option>
                {deptDivisions.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.yearOfStudy})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots Table */}
          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Time Slot</th>
                  <th className="px-4 py-3">Subject / Code</th>
                  <th className="px-4 py-3">Faculty Instructor</th>
                  <th className="px-4 py-3">Class / Division</th>
                  <th className="px-4 py-3">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {deptTimetableSlots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-navy-500 font-mono">
                      No timetable slots scheduled for {selectedTimetableDay}.
                    </td>
                  </tr>
                ) : (
                  deptTimetableSlots.map(slot => (
                    <tr key={slot.id} className="hover:bg-warm-50/60">
                      <td className="px-4 py-3 font-mono font-bold text-navy-900">
                        <Clock className="inline h-3.5 w-3.5 text-primary mr-1 -mt-0.5" />
                        {slot.startTime} – {slot.endTime}
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy-900">
                        <span className="font-mono font-bold text-primary block">{slot.courseCode}</span>
                        <span>{slot.courseName}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-navy-800">
                        👨‍🏫 {slot.teacherName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-navy-900">{slot.divisionName || 'Division A'}</span>
                        <span className="block text-[11px] text-navy-500 font-mono">{slot.batch ? `Batch ${slot.batch}` : 'Full Class'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-700">
                        {slot.room || 'Hall 301'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FACULTY */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle">
            <div>
              <h3 className="text-sm font-bold text-navy-900">
                Department Faculty Directory
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                All professors and instructors working under the {activeDept.name} Department.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">
              {deptFaculty.length} Instructors
            </span>
          </div>

          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Faculty Name</th>
                  <th className="px-4 py-3">Faculty ID</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Assigned Courses</th>
                  <th className="px-4 py-3">Workload</th>
                  <th className="px-4 py-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {deptFaculty.map(f => {
                  const fAllocs = deptAllocations.filter(a => a.teacherId === f.uid);
                  const totalWeeklyHours = fAllocs.reduce((sum, a) => sum + (a.weeklyHours || 4), 0);

                  return (
                    <tr key={f.uid} className="hover:bg-warm-50/60">
                      <td className="px-4 py-3 font-bold text-navy-900">
                        {f.fullName}
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-600">
                        {f.facultyId || 'FAC-COMP-01'}
                      </td>
                      <td className="px-4 py-3">
                        {f.isHOD ? (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200">
                            Head of Dept (HOD)
                          </span>
                        ) : f.isClassTeacher ? (
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                            Class Teacher ({f.divisionName || 'Div A'})
                          </span>
                        ) : (
                          <span className="text-navy-600 font-medium">
                            Assistant Professor
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {fAllocs.map(a => (
                            <span key={a.id} className="px-1.5 py-0.2 rounded bg-warm-100 border border-warm-300 font-mono text-[10px] text-navy-800">
                              {a.courseCode} ({a.divisionName})
                            </span>
                          ))}
                          {fAllocs.length === 0 && (
                            <span className="text-[10px] text-amber-700 italic">No courses allocated</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-navy-900">
                        {totalWeeklyHours} hrs/wk
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-600">
                        {f.email}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: ATTENDANCE AUDIT & DEFAULTERS */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
            <h3 className="text-sm font-bold text-navy-900">
              Department Attendance Audit & Defaulter List
            </h3>
            <p className="text-xs text-navy-500">
              Students falling below the mandatory 75% attendance threshold in {activeDept.name}.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">Year of Study</th>
                  <th className="px-4 py-3">Attendance Rate</th>
                  <th className="px-4 py-3">Sessions Attended</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {deptDefaulters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-teal-800 font-mono">
                      🎉 Excellent standing! Zero student defaulters below 75% in {activeDept.name}.
                    </td>
                  </tr>
                ) : (
                  deptDefaulters.map(({ student, rate, total, present }) => (
                    <tr key={student.uid} className="hover:bg-warm-50/60">
                      <td className="px-4 py-3 font-bold text-navy-900">
                        {student.fullName}
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-600">
                        {student.studentId || student.rollNo || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy-800">
                        {student.divisionName || 'Division A'}
                      </td>
                      <td className="px-4 py-3 text-navy-600">
                        {student.yearOfStudy || 'Third Year'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-red-600">
                        {rate}%
                      </td>
                      <td className="px-4 py-3 font-mono text-navy-600">
                        {present} / {total} lectures
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-100 text-red-800 border border-red-200">
                          DEFAULTER (&lt;75%)
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT DIVISION */}
      {isDivisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-modal max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <h3 className="text-sm font-bold text-navy-900">
                {editingDivisionId ? 'Edit Division' : 'Add New Division'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDivisionModalOpen(false)}
                className="p-1 rounded hover:bg-warm-100 text-navy-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {divError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{divError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDivision} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Year of Study <span className="text-red-500">*</span>
                </label>
                <select
                  value={divYear}
                  onChange={e => setDivYear(e.target.value as YearOfStudy)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                >
                  <option value="First Year">First Year (FE)</option>
                  <option value="Second Year">Second Year (SE)</option>
                  <option value="Third Year">Third Year (TE)</option>
                  <option value="Final Year">Final Year (BE)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Division Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Division A, Division B"
                  value={divName}
                  onChange={e => setDivName(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Room / Classroom Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hall 301, Room 204"
                  value={divRoom}
                  onChange={e => setDivRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Class Teacher (from {activeDept.code} Faculty)
                </label>
                <select
                  value={divClassTeacherId}
                  onChange={e => setDivClassTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                >
                  <option value="">-- None (Assign Later) --</option>
                  {deptFaculty.map(f => (
                    <option key={f.uid} value={f.uid}>
                      👨‍🏫 {f.fullName} ({f.facultyId || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-warm-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDivisionModalOpen(false)}
                  className="px-4 py-2 border border-warm-300 rounded-lg text-xs font-semibold text-navy-700 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={divSubmitting}
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {divSubmitting ? 'Saving...' : (editingDivisionId ? 'Save Changes' : 'Create Division')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK ADD STUDENTS */}
      {isBulkStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-modal max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <h3 className="text-sm font-bold text-navy-900">
                Bulk Add Students to Division
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkStudentModalOpen(false)}
                className="p-1 rounded hover:bg-warm-100 text-navy-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {bulkResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                bulkResult.startsWith('Success') ? 'bg-teal-50 border border-teal-300 text-teal-900' : 'bg-red-50 border border-red-300 text-red-900'
              }`}>
                {bulkResult.startsWith('Success') ? (
                  <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{bulkResult}</span>
              </div>
            )}

            <form onSubmit={handleBulkSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Target Division <span className="text-red-500">*</span>
                </label>
                <select
                  value={bulkTargetDivId}
                  onChange={e => setBulkTargetDivId(e.target.value)}
                  className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                >
                  {deptDivisions.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.yearOfStudy} - {d.name} ({d.divisionCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Student List (Format: Name, Email, RollNumber)
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`Rohan Verma, rohan.v@college.edu, 22CS051\nSneha Patel, sneha.p@college.edu, 22CS052\nAniket Rao, aniket.r@college.edu, 22CS053`}
                  value={bulkStudentsText}
                  onChange={e => setBulkStudentsText(e.target.value)}
                  className="w-full p-3 border border-warm-300 rounded-lg text-xs font-mono bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
                <span className="text-[11px] text-navy-500 font-mono mt-1 block">
                  One student per line. Separated by commas.
                </span>
              </div>

              <div className="pt-3 border-t border-warm-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkStudentModalOpen(false)}
                  className="px-4 py-2 border border-warm-300 rounded-lg text-xs font-semibold text-navy-700 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {bulkSubmitting ? 'Importing...' : 'Import Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUBJECT ALLOCATION */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-modal max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <h3 className="text-sm font-bold text-navy-900">
                {editingAllocId ? 'Edit Subject Assignment' : 'Assign Subject to Department Faculty'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAllocModalOpen(false)}
                className="p-1 rounded hover:bg-warm-100 text-navy-500"
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

            <form onSubmit={handleSaveAllocation} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Subject / Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={allocCourseId}
                  onChange={e => setAllocCourseId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseName} ({c.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Faculty Member / Instructor ({activeDept.code}) <span className="text-red-500">*</span>
                </label>
                <select
                  value={allocTeacherId}
                  onChange={e => setAllocTeacherId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                >
                  {deptFaculty.map(f => (
                    <option key={f.uid} value={f.uid}>
                      Prof. {f.fullName} ({f.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">
                  Target Division <span className="text-red-500">*</span>
                </label>
                <select
                  value={allocDivisionId}
                  onChange={e => setAllocDivisionId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                >
                  {deptDivisions.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.yearOfStudy} — {d.name} ({d.divisionCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Batch Scope
                  </label>
                  <select
                    value={allocBatch}
                    onChange={e => setAllocBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-300 text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                  >
                    <option value="All">Full Class (All Students)</option>
                    <option value="Batch 1">Batch 1 (Lab)</option>
                    <option value="Batch 2">Batch 2 (Lab)</option>
                    <option value="Batch 3">Batch 3 (Lab)</option>
                    <option value="Batch 4">Batch 4 (Lab)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">
                    Weekly Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={allocWeeklyHours}
                    onChange={e => setAllocWeeklyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-warm-300 text-xs bg-white text-navy-900 font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-warm-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllocModalOpen(false)}
                  className="px-4 py-2 border border-warm-300 rounded-lg text-xs font-semibold text-navy-700 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {allocSubmitting ? 'Saving...' : (editingAllocId ? 'Save Changes' : 'Confirm Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
