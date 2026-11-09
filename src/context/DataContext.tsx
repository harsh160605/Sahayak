import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Course, 
  CourseEnrollment, 
  EnrollmentRequest, 
  AttendanceSession, 
  AttendanceRecord, 
  TimetableSlot, 
  GeoLocationConfig,
  UserProfile,
  Department,
  Division,
  SubjectAllocation,
  YearOfStudy,
  Organization,
  DayOfWeek,
  LectureConductStatus,
  LectureSessionCategory,
  DeviceChangeRequest
} from '../types';
import { 
  INITIAL_COURSES, 
  INITIAL_ENROLLMENTS, 
  INITIAL_REQUESTS, 
  INITIAL_SESSIONS, 
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_TIMETABLE,
  INITIAL_DEPARTMENTS,
  INITIAL_DIVISIONS,
  INITIAL_SUBJECT_ALLOCATIONS,
  INITIAL_ORGANIZATION_USERS
} from '../data/initialData';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { calculateDistanceMeters } from '../lib/utils';
import { useAuth, DEMO_ADMIN, DEMO_TEACHER, DEMO_STUDENT } from './AuthContext';

interface DataContextType {
  courses: Course[];
  enrollments: CourseEnrollment[];
  requests: EnrollmentRequest[];
  sessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  timetable: TimetableSlot[];
  organizationUsers: UserProfile[];
  departments: Department[];
  divisions: Division[];
  subjectAllocations: SubjectAllocation[];
  
  // Academic Hierarchy CRUD
  addDepartmentHierarchy: (dept: Omit<Department, 'id'>) => Promise<Department>;
  updateDepartmentHierarchy: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartmentHierarchy: (id: string) => Promise<void>;
  
  addDivision: (div: Omit<Division, 'id'>) => Promise<Division>;
  updateDivision: (id: string, updates: Partial<Division>) => Promise<void>;
  deleteDivision: (id: string) => Promise<void>;
  
  allocateSubjectToDivision: (alloc: Omit<SubjectAllocation, 'id'>) => Promise<SubjectAllocation>;
  updateSubjectAllocation: (allocationId: string, updates: Partial<SubjectAllocation>) => Promise<void>;
  removeSubjectAllocation: (allocationId: string) => Promise<void>;
  isFacultyAuthorizedForCourse: (teacherId: string, courseId: string, divisionId?: string, batch?: string) => boolean;
  bulkAddStudentsToDivision: (divisionId: string, students: Array<{ fullName: string; email: string; rollNo: string; yearOfStudy?: YearOfStudy }>) => Promise<{ addedCount: number; message: string }>;
  bulkAddFacultyToDepartment: (departmentId: string, facultyList: Array<{ fullName: string; email: string; facultyId: string; role?: 'teacher' | 'admin' }>) => Promise<{ addedCount: number; message: string }>;
  
  completeInstituteOnboarding: (onboardingData: {
    institute: Partial<Organization>;
    departments: Array<{ name: string; code: string; hodName?: string; hodEmail?: string }>;
    divisions: Array<{ departmentCode: string; yearOfStudy: YearOfStudy; name: string; classTeacherName?: string; roomNumber?: string }>;
    faculty: Array<{ fullName: string; email: string; facultyId: string; departmentCode: string }>;
    students: Array<{ fullName: string; email: string; rollNo: string; departmentCode: string; yearOfStudy: YearOfStudy; divisionName: string }>;
  }) => Promise<void>;

  // Course actions
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'status' | 'enrolledCount'>) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  
  // Student Enrollment actions
  requestEnrollment: (studentUid: string, studentName: string, studentRollNo: string, studentEmail: string, courseId: string) => Promise<{ success: boolean; message: string }>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string, reason?: string) => Promise<void>;
  manuallyEnrollStudent: (courseId: string, studentUid: string, studentName: string, studentRollNo: string, studentEmail: string) => Promise<{ success: boolean; message: string }>;
  removeStudentFromCourse: (courseId: string, studentUid: string) => Promise<void>;
  
  // Session & QR actions
  startAttendanceSession: (
    courseId: string, 
    teacherId: string, 
    lectureTopic: string, 
    qrRefreshIntervalSeconds: 3 | 5,
    geofence?: GeoLocationConfig,
    divisionId?: string,
    batch?: string,
    options?: {
      sessionCategory?: 'regular' | 'extra';
      timetableSlotId?: string;
      lectureDate?: string;
      scheduledStartTime?: string;
      scheduledEndTime?: string;
      room?: string;
    }
  ) => Promise<AttendanceSession>;
  cancelScheduledLecture: (slotId: string, date: string, reason: string) => Promise<AttendanceSession>;
  rescheduleLecture: (slotId: string, date: string, rescheduledTo: { date: string; startTime: string; endTime: string; room?: string; reason?: string }) => Promise<AttendanceSession>;
  scheduleExtraLecture: (data: {
    courseId: string;
    divisionId: string;
    batch?: string;
    lectureDate: string;
    startTime: string;
    endTime: string;
    topic: string;
    room?: string;
    qrRefreshIntervalSeconds?: 3 | 5;
    geofence?: GeoLocationConfig;
  }) => Promise<AttendanceSession>;
  getSlotConductStatus: (slot: TimetableSlot, dateStr?: string) => {
    status: LectureConductStatus;
    session?: AttendanceSession;
    cancellationReason?: string;
    isLiveNow: boolean;
    isEligibleForQR: boolean;
    eligibilityReason?: string;
  };
  updateSessionToken: (sessionId: string, token: string, expiresAt: number) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  
  // Live attendance verification & recording (with Geofencing coordinates)
  verifyAndRecordAttendance: (
    token: string, 
    studentUid: string, 
    studentName: string, 
    studentRollNo: string,
    studentCoords?: { latitude: number; longitude: number }
  ) => Promise<{ success: boolean; message: string; courseName?: string; sessionTopic?: string; markedAt?: string; distanceMeters?: number }>;
  
  // Intelligent Timetable Actions
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<TimetableSlot>;
  updateTimetableSlot: (slotId: string, updates: Partial<TimetableSlot>) => Promise<void>;
  saveWeeklyScheduleBatch: (slots: Omit<TimetableSlot, 'id'>[]) => Promise<void>;
  deleteTimetableSlot: (slotId: string) => Promise<void>;
  clearDepartmentSchedule: (department: string, semester: string) => Promise<void>;
  clearDivisionTimetable: (divisionId: string, day?: DayOfWeek) => Promise<void>;
  publishDivisionTimetable: (divisionId: string) => Promise<void>;
  unpublishDivisionTimetable: (divisionId: string) => Promise<void>;
  copyDayTimetable: (fromDay: DayOfWeek, toDay: DayOfWeek, divisionId: string) => Promise<number>;
  copyDivisionTimetable: (fromDivisionId: string, toDivisionId: string) => Promise<number>;
  checkFacultyAvailability: (
    teacherId: string, 
    day: DayOfWeek, 
    startTime: string, 
    endTime: string, 
    currentSlotId?: string
  ) => { available: boolean; conflictReason?: string };
  validateTimetableConflicts: (
    slots: TimetableSlot[]
  ) => { hasConflicts: boolean; errors: string[] };
  dayConfigs: Record<string, { isWorkingDay: boolean; holidayReason?: string }>;
  setDayConfig: (divisionId: string, day: DayOfWeek, isWorkingDay: boolean, holidayReason?: string) => Promise<void>;

  // Correction & manual overrides
  updateAttendanceStatus: (recordId: string, newStatus: 'present' | 'absent' | 'late' | 'excused', reason: string) => Promise<void>;

  // Admin Department & Faculty Management
  addDepartment: (deptName: string) => Promise<void>;
  removeDepartment: (deptName: string) => Promise<void>;
  assignFacultyDepartment: (facultyUid: string, department: string) => Promise<void>;
  removeFaculty: (facultyUid: string) => Promise<void>;

  // 1-Student = 1-Device Binding & Change Requests (Department Teacher Approval)
  deviceChangeRequests: DeviceChangeRequest[];
  requestDeviceChange: (reason: string, newDevice: { deviceId: string; deviceName: string; platform?: string }) => Promise<{ success: boolean; message: string }>;
  approveDeviceChange: (requestId: string, teacherId: string, teacherName: string) => Promise<void>;
  rejectDeviceChange: (requestId: string, teacherId: string, teacherName: string, reason?: string) => Promise<void>;
  resetStudentDevice: (studentUid: string, teacherId: string, teacherName: string) => Promise<void>;
  bindCurrentDevice: (studentUid: string, device: { deviceId: string; deviceName: string; platform?: string }) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const currentOrgId = currentUser?.organizationId || 'org_apex_tech';

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('smartattend_courses');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_COURSES;
  });

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() => {
    const saved = localStorage.getItem('smartattend_enrollments');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_ENROLLMENTS;
  });

  const [requests, setRequests] = useState<EnrollmentRequest[]>(() => {
    const saved = localStorage.getItem('smartattend_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_REQUESTS;
  });

  const [sessions, setSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('smartattend_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_SESSIONS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('smartattend_attendance_records');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_ATTENDANCE_RECORDS;
  });

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('smartattend_timetable');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed.length >= 8) return parsed;
      } catch {}
    }
    return INITIAL_TIMETABLE;
  });

  const [organizationUsers, setOrganizationUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('smartattend_all_users');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed.length >= 5) return parsed;
      } catch {}
    }
    return INITIAL_ORGANIZATION_USERS;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('smartattend_departments');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_DEPARTMENTS;
  });

  const [divisions, setDivisions] = useState<Division[]>(() => {
    const saved = localStorage.getItem('smartattend_divisions');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_DIVISIONS;
  });

  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>(() => {
    const saved = localStorage.getItem('smartattend_subject_allocations');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_SUBJECT_ALLOCATIONS;
  });

  const [deviceChangeRequests, setDeviceChangeRequests] = useState<DeviceChangeRequest[]>(() => {
    const saved = localStorage.getItem('smartattend_device_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'dreq_demo_101',
        studentUid: 'student_aarav_patel',
        studentName: 'Aarav Patel',
        studentRollNo: '22CS042',
        studentEmail: 'aarav.cs22@college.edu',
        department: 'Computer Engineering',
        departmentId: 'dept_comp',
        divisionId: 'div_comp_te_a',
        divisionName: 'Division A',
        yearOfStudy: 'Third Year',
        oldDeviceId: 'dev_old_samsung_a54',
        oldDeviceName: 'Google Chrome on Android (Samsung Galaxy A54)',
        newDeviceId: 'dev_new_oneplus_12',
        newDeviceName: 'Google Chrome on Android (OnePlus 12)',
        newDevicePlatform: 'Android',
        reason: 'Upgraded to a new phone; old screen was cracked and unresponsive.',
        status: 'pending',
        requestedAt: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];
  });

  const [dayConfigs, setDayConfigs] = useState<Record<string, { isWorkingDay: boolean; holidayReason?: string }>>(() => {
    const saved = localStorage.getItem('smartattend_day_configs');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      'div_comp_te_a_Sunday': { isWorkingDay: false, holidayReason: 'Weekly Off' }
    };
  });

  const setDayConfig = async (divisionId: string, day: DayOfWeek, isWorkingDay: boolean, holidayReason?: string) => {
    const key = `${divisionId}_${day}`;
    setDayConfigs(prev => {
      const next = { ...prev, [key]: { isWorkingDay, holidayReason } };
      localStorage.setItem('smartattend_day_configs', JSON.stringify(next));
      return next;
    });
  };

  // Always keep localStorage updated
  useEffect(() => {
    localStorage.setItem('smartattend_courses', JSON.stringify(courses));
    localStorage.setItem('smartattend_enrollments', JSON.stringify(enrollments));
    localStorage.setItem('smartattend_requests', JSON.stringify(requests));
    localStorage.setItem('smartattend_sessions', JSON.stringify(sessions));
    localStorage.setItem('smartattend_attendance_records', JSON.stringify(attendanceRecords));
    localStorage.setItem('smartattend_timetable', JSON.stringify(timetable));
    localStorage.setItem('smartattend_all_users', JSON.stringify(organizationUsers));
    localStorage.setItem('smartattend_departments', JSON.stringify(departments));
    localStorage.setItem('smartattend_divisions', JSON.stringify(divisions));
    localStorage.setItem('smartattend_subject_allocations', JSON.stringify(subjectAllocations));
    localStorage.setItem('smartattend_device_requests', JSON.stringify(deviceChangeRequests));
  }, [courses, enrollments, requests, sessions, attendanceRecords, timetable, organizationUsers, departments, divisions, subjectAllocations, deviceChangeRequests]);

  // Real-time Firestore Sync Listeners
  useEffect(() => {
    if (!isLiveFirebaseConfigured) return;

    // 1. Courses
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const items: Course[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setCourses(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Courses sync notice:', err));

    // 2. Enrollments
    const unsubEnrollments = onSnapshot(collection(db, 'enrollments'), (snapshot) => {
      const items: CourseEnrollment[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        setEnrollments(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Enrollments sync notice:', err));

    // 3. Requests
    const unsubRequests = onSnapshot(collection(db, 'enrollmentRequests'), (snapshot) => {
      const items: EnrollmentRequest[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        items.sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
        setRequests(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Requests sync notice:', err));

    // 4. Sessions
    const unsubSessions = onSnapshot(collection(db, 'attendanceSessions'), (snapshot) => {
      const items: AttendanceSession[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        items.sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
        setSessions(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Sessions sync notice:', err));

    // 5. Attendance Records
    const unsubAttendance = onSnapshot(collection(db, 'attendanceRecords'), (snapshot) => {
      const items: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        items.sort((a, b) => new Date(b.markedAt || 0).getTime() - new Date(a.markedAt || 0).getTime());
        setAttendanceRecords(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Attendance sync notice:', err));

    // 6. Timetable Slots
    const unsubTimetable = onSnapshot(collection(db, 'timetable'), (snapshot) => {
      const items: TimetableSlot[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        setTimetable(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Timetable sync notice:', err));

    // 7. Users Directory
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const items: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ uid: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        setOrganizationUsers(prev => {
          const ids = new Set(items.map(i => i.uid));
          const localOnly = prev.filter(p => !ids.has(p.uid));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Users directory sync notice:', err));

    // 8. Departments
    const unsubDepartments = onSnapshot(collection(db, 'departments'), (snapshot) => {
      const items: Department[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        setDepartments(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Departments sync notice:', err));

    // 9. Divisions
    const unsubDivisions = onSnapshot(collection(db, 'divisions'), (snapshot) => {
      const items: Division[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        setDivisions(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Divisions sync notice:', err));

    // 10. Subject Allocations
    const unsubAllocations = onSnapshot(collection(db, 'subjectAllocations'), (snapshot) => {
      const items: SubjectAllocation[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        setSubjectAllocations(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Subject allocations sync notice:', err));

    // 11. Device Change Requests (Real-time sync to Department Faculty)
    const unsubDeviceRequests = onSnapshot(collection(db, 'deviceChangeRequests'), (snapshot) => {
      const items: DeviceChangeRequest[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      if (items.length > 0) {
        items.sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
        setDeviceChangeRequests(prev => {
          const ids = new Set(items.map(i => i.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...items, ...localOnly];
        });
      }
    }, err => console.warn('Device change requests sync notice:', err));

    return () => {
      unsubCourses();
      unsubEnrollments();
      unsubRequests();
      unsubSessions();
      unsubAttendance();
      unsubTimetable();
      unsubUsers();
      unsubDepartments();
      unsubDivisions();
      unsubAllocations();
      unsubDeviceRequests();
    };
  }, [isLiveFirebaseConfigured]);

  // Synchronize cross-tab and cross-window local state changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartattend_device_requests' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setDeviceChangeRequests(parsed);
        } catch {}
      }
      if (e.key === 'smartattend_all_users' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setOrganizationUsers(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Course actions
  const addCourse = async (data: Omit<Course, 'id' | 'createdAt' | 'status' | 'enrolledCount'>) => {
    const courseId = `course_${Date.now()}`;
    const newCourse: Course = {
      ...data,
      id: courseId,
      createdAt: new Date().toISOString(),
      status: 'active',
      enrolledCount: 0,
      organizationId: data.organizationId || currentUser?.organizationId || 'org_apex_tech',
      organizationCode: data.organizationCode || currentUser?.organizationCode || 'APEX101'
    };

    try {
      if (isLiveFirebaseConfigured) {
        await setDoc(doc(db, 'courses', courseId), newCourse);
      }
    } catch (err) {
      console.warn('Firestore setDoc notice:', err);
    }

    setCourses(prev => [newCourse, ...prev.filter(c => c.id !== courseId)]);
    return newCourse;
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'courses', id), updates);
    } else {
      setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  };

  // Enrollment actions
  const requestEnrollment = async (
    studentUid: string, 
    studentName: string, 
    studentRollNo: string, 
    studentEmail: string, 
    courseId: string
  ) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return { success: false, message: 'Course not found.' };

    const alreadyEnrolled = enrollments.some(e => e.courseId === courseId && e.studentUid === studentUid && e.status === 'active');
    if (alreadyEnrolled) return { success: false, message: 'You are already enrolled in this course.' };

    const existingPending = requests.some(r => r.courseId === courseId && r.studentId === studentUid && r.status === 'pending');
    if (existingPending) return { success: false, message: 'An enrollment request is already pending for this course.' };

    const reqId = `req_${Date.now()}`;
    const newReq: EnrollmentRequest = {
      id: reqId,
      studentId: studentUid,
      studentName,
      studentRollNo,
      studentEmail,
      courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      teacherId: course.teacherId,
      organizationId: course.organizationId || currentUser?.organizationId || 'org_apex_tech',
      organizationCode: course.organizationCode || currentUser?.organizationCode || 'APEX101',
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    if (isLiveFirebaseConfigured) {
      await setDoc(doc(db, 'enrollmentRequests', reqId), newReq);
    } else {
      setRequests(prev => [newReq, ...prev]);
    }

    return { success: true, message: 'Enrollment request submitted successfully to instructor.' };
  };

  const approveRequest = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    const exists = enrollments.some(e => e.courseId === req.courseId && e.studentUid === req.studentId);
    const enrId = `enr_${Date.now()}`;

    if (!exists) {
      const newEnrollment: CourseEnrollment = {
        id: enrId,
        courseId: req.courseId,
        studentUid: req.studentId,
        studentName: req.studentName,
        studentRollNo: req.studentRollNo,
        studentEmail: req.studentEmail,
        enrolledAt: new Date().toISOString(),
        status: 'active'
      };

      if (isLiveFirebaseConfigured) {
        await setDoc(doc(db, 'enrollments', enrId), newEnrollment);
        const course = courses.find(c => c.id === req.courseId);
        if (course) {
          await updateDoc(doc(db, 'courses', req.courseId), {
            enrolledCount: (course.enrolledCount || 0) + 1
          });
        }
      } else {
        setEnrollments(prev => [...prev, newEnrollment]);
        setCourses(prev => prev.map(c => c.id === req.courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c));
      }
    }

    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'enrollmentRequests', requestId), {
        status: 'approved',
        reviewedAt: new Date().toISOString()
      });
    } else {
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r));
    }
  };

  const rejectRequest = async (requestId: string, reason?: string) => {
    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'enrollmentRequests', requestId), {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        decisionReason: reason || 'Application criteria not met'
      });
    } else {
      setRequests(prev => prev.map(r => r.id === requestId ? { 
        ...r, 
        status: 'rejected', 
        reviewedAt: new Date().toISOString(),
        decisionReason: reason || 'Application criteria not met'
      } : r));
    }
  };

  const manuallyEnrollStudent = async (
    courseId: string, 
    studentUid: string, 
    studentName: string, 
    studentRollNo: string, 
    studentEmail: string
  ) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return { success: false, message: 'Course not found.' };

    const exists = enrollments.some(e => e.courseId === courseId && e.studentUid === studentUid && e.status === 'active');
    if (exists) return { success: false, message: 'Student is already enrolled.' };

    const enrId = `enr_${Date.now()}`;
    const newEnrollment: CourseEnrollment = {
      id: enrId,
      courseId,
      studentUid,
      studentName,
      studentRollNo,
      studentEmail,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    };

    if (isLiveFirebaseConfigured) {
      await setDoc(doc(db, 'enrollments', enrId), newEnrollment);
      await updateDoc(doc(db, 'courses', courseId), {
        enrolledCount: (course.enrolledCount || 0) + 1
      });
    } else {
      setEnrollments(prev => [...prev, newEnrollment]);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c));
    }

    return { success: true, message: `${studentName} was successfully enrolled.` };
  };

  const removeStudentFromCourse = async (courseId: string, studentUid: string) => {
    const enr = enrollments.find(e => e.courseId === courseId && e.studentUid === studentUid);
    const course = courses.find(c => c.id === courseId);

    if (isLiveFirebaseConfigured && enr) {
      await deleteDoc(doc(db, 'enrollments', enr.id));
      if (course) {
        await updateDoc(doc(db, 'courses', courseId), {
          enrolledCount: Math.max(0, (course.enrolledCount || 1) - 1)
        });
      }
    } else {
      setEnrollments(prev => prev.filter(e => !(e.courseId === courseId && e.studentUid === studentUid)));
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrolledCount: Math.max(0, (c.enrolledCount || 1) - 1) } : c));
    }
  };

  // Faculty Subject Authorization Validation
  const isFacultyAuthorizedForCourse = (
    teacherId: string, 
    courseId: string, 
    divisionId?: string, 
    batch?: string
  ): boolean => {
    if (!teacherId || !courseId) return false;
    
    // Admins have institutional authority to supervise/conduct all courses
    if (currentUser?.role === 'admin') return true;

    // Check 1: Direct course assignment
    const course = courses.find(c => c.id === courseId);
    if (course && (course.teacherId === teacherId || (currentUser?.fullName && course.teacherName === currentUser.fullName))) {
      return true;
    }

    // Check 2: Subject Allocation established by Department Admin
    const hasAllocation = subjectAllocations.some(a => {
      if (a.courseId !== courseId) return false;
      const matchesTeacher = a.teacherId === teacherId || (currentUser?.email && a.teacherEmail === currentUser.email);
      if (!matchesTeacher) return false;
      if (divisionId && a.divisionId && a.divisionId !== divisionId) return false;
      if (batch && a.batch && a.batch !== 'All' && a.batch !== batch) return false;
      return true;
    });

    if (hasAllocation) return true;

    // Check 3: Timetable slot assignment
    const hasSlot = timetable.some(t => {
      if (t.courseId !== courseId) return false;
      const isPrimary = t.teacherId === teacherId;
      const isAdditional = t.additionalTeacherIds?.includes(teacherId);
      if (!isPrimary && !isAdditional) return false;
      if (divisionId && t.divisionId && t.divisionId !== divisionId) return false;
      return true;
    });

    return Boolean(hasSlot);
  };

  // Date and Time calculation helpers for intelligent timetable resolution
  const getTodayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Determines real-time conduct status of a timetable slot without penalizing student attendance
  const getSlotConductStatus = (
    slot: TimetableSlot, 
    dateStr?: string
  ): {
    status: LectureConductStatus;
    session?: AttendanceSession;
    cancellationReason?: string;
    isLiveNow: boolean;
    isEligibleForQR: boolean;
    eligibilityReason?: string;
  } => {
    const targetDate = dateStr || getTodayDateString();
    const today = getTodayDateString();

    // Check if an explicit attendance session, cancellation, or reschedule already exists
    const matchingSession = sessions.find(s => 
      (s.timetableSlotId === slot.id || (s.courseId === slot.courseId && s.divisionId === slot.divisionId && s.scheduledStartTime === slot.startTime)) &&
      (s.lectureDate === targetDate || (s.startedAt && s.startedAt.startsWith(targetDate)))
    );

    if (matchingSession) {
      if (matchingSession.conductStatus === 'CANCELLED') {
        return {
          status: 'CANCELLED',
          session: matchingSession,
          cancellationReason: matchingSession.cancellationReason || 'Lecture cancelled by faculty.',
          isLiveNow: false,
          isEligibleForQR: false,
          eligibilityReason: 'This lecture was explicitly cancelled.'
        };
      }
      if (matchingSession.conductStatus === 'RESCHEDULED') {
        return {
          status: 'RESCHEDULED',
          session: matchingSession,
          cancellationReason: matchingSession.cancellationReason,
          isLiveNow: false,
          isEligibleForQR: false,
          eligibilityReason: 'This lecture was rescheduled.'
        };
      }
      if (matchingSession.status === 'active') {
        return {
          status: 'IN_PROGRESS',
          session: matchingSession,
          isLiveNow: true,
          isEligibleForQR: true,
          eligibilityReason: 'Attendance session currently active and broadcasting.'
        };
      }
      if (matchingSession.status === 'ended') {
        return {
          status: 'COMPLETED',
          session: matchingSession,
          isLiveNow: false,
          isEligibleForQR: false,
          eligibilityReason: 'Attendance session has already been completed for this lecture.'
        };
      }
    }

    // Determine based on slot time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotStartMinutes = parseTimeToMinutes(slot.startTime);
    const slotEndMinutes = parseTimeToMinutes(slot.endTime);

    const isPastDate = targetDate < today;
    const isFutureDate = targetDate > today;

    if (isPastDate) {
      // Historical slot without attendance conducted -> NOT CONDUCTED (Never marks students absent)
      return {
        status: 'NOT_CONDUCTED',
        isLiveNow: false,
        isEligibleForQR: false,
        eligibilityReason: 'Scheduled time passed without attendance being conducted.'
      };
    }

    if (isFutureDate) {
      return {
        status: 'SCHEDULED',
        isLiveNow: false,
        isEligibleForQR: false,
        eligibilityReason: 'Scheduled for an upcoming date.'
      };
    }

    // Target date is TODAY
    // Allow launching attendance 15 minutes prior to start until 20 minutes after scheduled end
    const earliestEligible = slotStartMinutes - 15;
    const latestEligible = slotEndMinutes + 20;

    const isLiveNow = currentMinutes >= slotStartMinutes && currentMinutes <= slotEndMinutes;
    const isEligibleWindow = currentMinutes >= earliestEligible && currentMinutes <= latestEligible;

    if (currentMinutes > latestEligible) {
      // Slot window expired without attendance started -> NOT CONDUCTED
      return {
        status: 'NOT_CONDUCTED',
        isLiveNow: false,
        isEligibleForQR: currentUser?.role === 'admin', // Admins can override for simulation/testing
        eligibilityReason: 'Lecture time slot has expired without attendance being conducted.'
      };
    }

    if (isEligibleWindow) {
      return {
        status: isLiveNow ? 'IN_PROGRESS' : 'SCHEDULED',
        isLiveNow,
        isEligibleForQR: true,
        eligibilityReason: 'Eligible for live QR attendance.'
      };
    }

    // Class is scheduled later today
    return {
      status: 'SCHEDULED',
      isLiveNow: false,
      isEligibleForQR: currentUser?.role === 'admin', // Admin bypass for preview
      eligibilityReason: `Scheduled for ${slot.startTime}. QR generation opens 15 minutes before class.`
    };
  };

  // Session actions with Geofence configuration & strict timetable-based authorization enforcement
  const startAttendanceSession = async (
    courseId: string, 
    teacherId: string, 
    lectureTopic: string, 
    qrRefreshIntervalSeconds: 3 | 5,
    geofence?: GeoLocationConfig,
    divisionId?: string,
    batch?: string,
    options?: {
      sessionCategory?: 'regular' | 'extra';
      timetableSlotId?: string;
      lectureDate?: string;
      scheduledStartTime?: string;
      scheduledEndTime?: string;
      room?: string;
    }
  ) => {
    if (!currentUser) {
      throw new Error('Authentication required to start an attendance session.');
    }

    // Security check: Teacher cannot start session on behalf of another teacher unless admin
    if (currentUser.role !== 'admin' && currentUser.uid !== teacherId) {
      throw new Error('Unauthorized: You cannot start an attendance session on behalf of another faculty member.');
    }

    // Authorization check: Verify faculty is assigned and authorized for this course & division
    const isAuthorized = isFacultyAuthorizedForCourse(teacherId, courseId, divisionId, batch);
    if (!isAuthorized) {
      throw new Error('Unauthorized: You are not assigned to conduct attendance for this subject.');
    }

    // Timetable-based QR check for regular sessions
    if (options?.timetableSlotId && options.sessionCategory !== 'extra') {
      const slot = timetable.find(t => t.id === options.timetableSlotId);
      if (slot) {
        const slotCheck = getSlotConductStatus(slot, options.lectureDate);
        if (slotCheck.status === 'COMPLETED') {
          throw new Error('Duplicate Session Prevented: Attendance has already been completed for this scheduled lecture today.');
        }
        if (slotCheck.status === 'CANCELLED') {
          throw new Error('Lecture Cancelled: This scheduled lecture was marked as cancelled.');
        }
        if (!slotCheck.isEligibleForQR && currentUser.role !== 'admin') {
          throw new Error(`Schedule Restriction: ${slotCheck.eligibilityReason || 'This lecture slot is not currently eligible for attendance.'}`);
        }
      }
    }

    const course = courses.find(c => c.id === courseId);
    const div = divisionId ? divisions.find(d => d.id === divisionId) : undefined;
    const sessId = `sess_${Date.now()}`;
    const newSession: AttendanceSession = {
      id: sessId,
      courseId,
      courseCode: course?.courseCode || 'CRS',
      courseName: course?.courseName || 'Lecture Session',
      teacherId,
      teacherName: currentUser.fullName,
      lectureTopic: lectureTopic.trim() || 'Scheduled Lecture',
      startedAt: new Date().toISOString(),
      status: 'active',
      conductStatus: 'IN_PROGRESS',
      sessionCategory: options?.sessionCategory || 'regular',
      isExtraLecture: options?.sessionCategory === 'extra',
      timetableSlotId: options?.timetableSlotId,
      lectureDate: options?.lectureDate || getTodayDateString(),
      scheduledStartTime: options?.scheduledStartTime,
      scheduledEndTime: options?.scheduledEndTime,
      room: options?.room,
      qrRefreshIntervalSeconds,
      totalPresent: 0,
      createdAt: new Date().toISOString(),
      organizationId: course?.organizationId || currentUser?.organizationId || 'org_apex_tech',
      organizationCode: course?.organizationCode || currentUser?.organizationCode || 'APEX101',
      departmentId: course?.departmentId || div?.departmentId,
      departmentName: course?.department || div?.departmentName,
      academicYear: course?.academicYear || div?.academicYear || '2026–27',
      yearOfStudy: course?.yearOfStudy || div?.yearOfStudy,
      semester: course?.semester,
      divisionId: divisionId || course?.divisionId,
      divisionName: div?.name || course?.divisionName,
      batch: batch || 'All',
      ...(geofence ? { geofence } : {})
    };

    // Always update in-memory state and localStorage immediately
    setSessions(prev => [newSession, ...prev]);
    try {
      const saved = localStorage.getItem('smartattend_sessions');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('smartattend_sessions', JSON.stringify([newSession, ...list.filter((s: any) => s.id !== sessId)]));
    } catch {}

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'attendanceSessions', sessId), newSession);
      } catch (err) {
        console.warn('Firestore setDoc notice for attendanceSessions (fallback to local state):', err);
      }
    }

    return newSession;
  };

  // Faculty Cancellation of a Scheduled Lecture with Reason (Students not marked absent)
  const cancelScheduledLecture = async (
    slotId: string, 
    date: string, 
    reason: string
  ): Promise<AttendanceSession> => {
    if (!currentUser) throw new Error('Authentication required.');

    const slot = timetable.find(t => t.id === slotId);
    if (!slot) throw new Error('Timetable slot not found.');

    const isOwner = slot.teacherId === currentUser.uid || 
      slot.additionalTeacherIds?.includes(currentUser.uid) || 
      currentUser.role === 'admin';
    if (!isOwner) throw new Error('Unauthorized: You can only cancel your own scheduled lectures.');

    const course = courses.find(c => c.id === slot.courseId);
    const div = slot.divisionId ? divisions.find(d => d.id === slot.divisionId) : undefined;
    const sessId = `sess_cancel_${slot.id}_${date.replace(/[^0-9]/g, '')}`;

    const cancelRecord: AttendanceSession = {
      id: sessId,
      courseId: slot.courseId || '',
      courseCode: slot.courseCode || course?.courseCode || 'CRS',
      courseName: slot.courseName || course?.courseName || 'Lecture Session',
      teacherId: currentUser.uid,
      teacherName: currentUser.fullName,
      lectureTopic: slot.notes || 'Scheduled Lecture',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      status: 'ended',
      conductStatus: 'CANCELLED',
      sessionCategory: 'regular',
      timetableSlotId: slot.id,
      lectureDate: date,
      scheduledStartTime: slot.startTime,
      scheduledEndTime: slot.endTime,
      room: slot.room,
      cancellationReason: reason.trim() || 'Faculty officially unavailable / on approved institutional leave.',
      qrRefreshIntervalSeconds: 3,
      totalPresent: 0,
      createdAt: new Date().toISOString(),
      organizationId: slot.organizationId || currentUser.organizationId || 'org_apex_tech',
      organizationCode: slot.organizationCode || currentUser.organizationCode || 'APEX101',
      divisionId: slot.divisionId,
      divisionName: slot.divisionName || div?.name,
      departmentId: slot.departmentId,
      departmentName: slot.department,
      academicYear: slot.academicYear || '2026–27',
      yearOfStudy: slot.yearOfStudy,
      semester: slot.semester
    };

    setSessions(prev => [cancelRecord, ...prev.filter(s => s.id !== sessId)]);
    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'attendanceSessions', sessId), cancelRecord);
      } catch (err) {
        console.warn('cancelScheduledLecture setDoc notice:', err);
      }
    }

    return cancelRecord;
  };

  // Faculty Rescheduling of a Scheduled Lecture with Notification Reason
  const rescheduleLecture = async (
    slotId: string, 
    date: string, 
    rescheduledTo: { date: string; startTime: string; endTime: string; room?: string; reason?: string }
  ): Promise<AttendanceSession> => {
    if (!currentUser) throw new Error('Authentication required.');

    const slot = timetable.find(t => t.id === slotId);
    if (!slot) throw new Error('Timetable slot not found.');

    const isOwner = slot.teacherId === currentUser.uid || 
      slot.additionalTeacherIds?.includes(currentUser.uid) || 
      currentUser.role === 'admin';
    if (!isOwner) throw new Error('Unauthorized: You can only reschedule your own scheduled lectures.');

    const course = courses.find(c => c.id === slot.courseId);
    const div = slot.divisionId ? divisions.find(d => d.id === slot.divisionId) : undefined;
    const sessId = `sess_resched_${slot.id}_${date.replace(/[^0-9]/g, '')}`;

    const reschedRecord: AttendanceSession = {
      id: sessId,
      courseId: slot.courseId || '',
      courseCode: slot.courseCode || course?.courseCode || 'CRS',
      courseName: slot.courseName || course?.courseName || 'Lecture Session',
      teacherId: currentUser.uid,
      teacherName: currentUser.fullName,
      lectureTopic: slot.notes || 'Scheduled Lecture',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      status: 'ended',
      conductStatus: 'RESCHEDULED',
      sessionCategory: 'regular',
      timetableSlotId: slot.id,
      lectureDate: date,
      scheduledStartTime: slot.startTime,
      scheduledEndTime: slot.endTime,
      room: slot.room,
      cancellationReason: rescheduledTo.reason || `Rescheduled to ${rescheduledTo.date} (${rescheduledTo.startTime}–${rescheduledTo.endTime})`,
      rescheduledTo,
      qrRefreshIntervalSeconds: 3,
      totalPresent: 0,
      createdAt: new Date().toISOString(),
      organizationId: slot.organizationId || currentUser.organizationId || 'org_apex_tech',
      organizationCode: slot.organizationCode || currentUser.organizationCode || 'APEX101',
      divisionId: slot.divisionId,
      divisionName: slot.divisionName || div?.name,
      departmentId: slot.departmentId,
      departmentName: slot.department,
      academicYear: slot.academicYear || '2026–27',
      yearOfStudy: slot.yearOfStudy,
      semester: slot.semester
    };

    setSessions(prev => [reschedRecord, ...prev.filter(s => s.id !== sessId)]);
    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'attendanceSessions', sessId), reschedRecord);
      } catch (err) {
        console.warn('rescheduleLecture setDoc notice:', err);
      }
    }

    return reschedRecord;
  };

  // Schedule and Launch an Extra Lecture (Manual Scheduling without modifying official timetable)
  const scheduleExtraLecture = async (data: {
    courseId: string;
    divisionId: string;
    batch?: string;
    lectureDate: string;
    startTime: string;
    endTime: string;
    topic: string;
    room?: string;
    qrRefreshIntervalSeconds?: 3 | 5;
    geofence?: GeoLocationConfig;
  }): Promise<AttendanceSession> => {
    if (!currentUser) throw new Error('Authentication required.');

    // 1. Authorization check: Course and division must be allocated to logged-in faculty (or admin)
    const isAuthorized = isFacultyAuthorizedForCourse(currentUser.uid, data.courseId, data.divisionId, data.batch);
    if (!isAuthorized) {
      throw new Error('Unauthorized: You can only conduct extra lectures for subjects and divisions allocated to you by your Department Admin.');
    }

    // 2. Validate time boundaries
    if (data.startTime >= data.endTime) {
      throw new Error('Invalid Time Window: Start time must be strictly earlier than end time.');
    }

    // 3. Prevent duplicate active extra lecture for same teacher + course + date + start time
    const existing = sessions.find(s => 
      s.isExtraLecture && 
      s.teacherId === currentUser.uid && 
      s.courseId === data.courseId && 
      s.divisionId === data.divisionId && 
      s.lectureDate === data.lectureDate &&
      s.scheduledStartTime === data.startTime &&
      s.status !== 'ended'
    );
    if (existing) {
      throw new Error('Duplicate Extra Lecture: An extra lecture session is already active or scheduled for this time.');
    }

    const course = courses.find(c => c.id === data.courseId);
    const div = divisions.find(d => d.id === data.divisionId);
    const sessId = `sess_extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const extraSession: AttendanceSession = {
      id: sessId,
      courseId: data.courseId,
      courseCode: course?.courseCode || 'CRS',
      courseName: course?.courseName || 'Extra Lecture',
      teacherId: currentUser.uid,
      teacherName: currentUser.fullName,
      lectureTopic: `[EXTRA LECTURE] ${data.topic.trim() || 'Additional Academic Session'}`,
      startedAt: new Date().toISOString(),
      status: 'active',
      conductStatus: 'IN_PROGRESS',
      sessionCategory: 'extra',
      isExtraLecture: true,
      lectureDate: data.lectureDate,
      scheduledStartTime: data.startTime,
      scheduledEndTime: data.endTime,
      room: data.room || 'Classroom Hall',
      qrRefreshIntervalSeconds: data.qrRefreshIntervalSeconds || 3,
      totalPresent: 0,
      createdAt: new Date().toISOString(),
      organizationId: course?.organizationId || currentUser.organizationId || 'org_apex_tech',
      organizationCode: course?.organizationCode || currentUser.organizationCode || 'APEX101',
      divisionId: data.divisionId,
      divisionName: div?.name || course?.divisionName,
      batch: data.batch || 'All',
      departmentId: course?.departmentId || div?.departmentId,
      departmentName: course?.department || div?.departmentName,
      academicYear: course?.academicYear || div?.academicYear || '2026–27',
      yearOfStudy: course?.yearOfStudy || div?.yearOfStudy,
      semester: course?.semester,
      ...(data.geofence ? { geofence: data.geofence } : {})
    };

    setSessions(prev => [extraSession, ...prev]);
    try {
      const saved = localStorage.getItem('smartattend_sessions');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('smartattend_sessions', JSON.stringify([extraSession, ...list.filter((s: any) => s.id !== sessId)]));
    } catch {}

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'attendanceSessions', sessId), extraSession);
      } catch (err) {
        console.warn('scheduleExtraLecture setDoc notice:', err);
      }
    }

    return extraSession;
  };

  const updateSessionToken = async (sessionId: string, token: string, expiresAt: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && currentUser?.role !== 'admin' && session.teacherId !== currentUser?.uid) {
      console.warn(`[SECURITY] Blocked unauthorized token update on session ${sessionId} by ${currentUser?.uid}`);
      return;
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentQrToken: token, tokenExpiresAt: expiresAt } : s));
    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'attendanceSessions', sessionId), {
          currentQrToken: token,
          tokenExpiresAt: expiresAt
        });
      } catch (err) {
        console.warn('Firestore updateDoc notice for session token (fallback to local state):', err);
      }
    }
  };

  const pauseSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && currentUser?.role !== 'admin' && session.teacherId !== currentUser?.uid) {
      throw new Error('Unauthorized: You can only control your own attendance sessions.');
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'paused' } : s));
    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'attendanceSessions', sessionId), { status: 'paused' });
      } catch (err) {
        console.warn('Firestore updateDoc notice for pause session (fallback to local state):', err);
      }
    }
  };

  const resumeSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && currentUser?.role !== 'admin' && session.teacherId !== currentUser?.uid) {
      throw new Error('Unauthorized: You can only control your own attendance sessions.');
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'active' } : s));
    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'attendanceSessions', sessionId), { status: 'active' });
      } catch (err) {
        console.warn('Firestore updateDoc notice for resume session (fallback to local state):', err);
      }
    }
  };

  const endSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && currentUser?.role !== 'admin' && session.teacherId !== currentUser?.uid) {
      throw new Error('Unauthorized: You can only end your own attendance sessions.');
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? { 
      ...s, 
      status: 'ended', 
      conductStatus: 'COMPLETED',
      endedAt: new Date().toISOString() 
    } : s));

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'attendanceSessions', sessionId), { 
          status: 'ended', 
          conductStatus: 'COMPLETED',
          endedAt: new Date().toISOString() 
        });
      } catch (err) {
        console.warn('Firestore updateDoc notice for end session (fallback to local state):', err);
      }
    }
  };

  // Real-time verification with GPS Geofencing
  const verifyAndRecordAttendance = async (
    token: string, 
    studentUid: string, 
    studentName: string, 
    studentRollNo: string,
    studentCoords?: { latitude: number; longitude: number }
  ) => {
    if (!token || !token.startsWith('SA_TOKEN::')) {
      return { success: false, message: 'Invalid QR code format. Please scan an authentic SmartAttend QR code.' };
    }

    const parts = token.split('::');
    if (parts.length < 4) {
      return { success: false, message: 'Malformed QR code data.' };
    }

    const [, sessionId, tokenTimestampStr] = parts;
    const tokenTime = parseInt(tokenTimestampStr, 10);
    const now = Date.now();

    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, message: 'Attendance session not found.' };
    }

    if (session.status === 'ended') {
      return { success: false, message: 'This attendance session has ended. Submissions are closed.' };
    }

    if (session.status === 'paused') {
      return { success: false, message: 'The attendance session is temporarily paused by the instructor.' };
    }

    // 1. Server-Side Expiry Check
    const maxAllowedAgeMs = (session.qrRefreshIntervalSeconds * 1000) + 2500;
    if (now - tokenTime > maxAllowedAgeMs) {
      return { 
        success: false, 
        message: 'QR code has expired. Please point your camera at the newly refreshed QR code on screen.' 
      };
    }

    // 2. Geofence Perimeter Validation
    let distanceMeters: number | undefined;
    if (session.geofence?.enabled) {
      if (!studentCoords) {
        return {
          success: false,
          message: 'GPS location is required for this lecture. Please enable location permissions on your device.'
        };
      }

      distanceMeters = calculateDistanceMeters(
        session.geofence.latitude,
        session.geofence.longitude,
        studentCoords.latitude,
        studentCoords.longitude
      );

      if (distanceMeters > session.geofence.radiusMeters) {
        return {
          success: false,
          message: `Location check failed: You are ${distanceMeters}m away from the classroom perimeter (Maximum allowed: ${session.geofence.radiusMeters}m). Attendance rejected.`,
          distanceMeters
        };
      }
    }

    // 3. Enrollment Check
    const isEnrolled = enrollments.some(e => e.courseId === session.courseId && e.studentUid === studentUid && e.status === 'active');
    if (!isEnrolled) {
      return { 
        success: false, 
        message: `You are not enrolled in ${session.courseCode}. Please submit an enrollment request first.` 
      };
    }

    // 4. Idempotency Check
    const alreadyMarked = attendanceRecords.some(r => r.sessionId === sessionId && r.studentUid === studentUid);
    if (alreadyMarked) {
      return { 
        success: false, 
        message: 'Attendance already marked! Your presence for this session is already recorded.' 
      };
    }

    // 5. Record Attendance
    const markedAt = new Date().toISOString();
    const recordId = `rec_${sessionId}_${studentUid}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      sessionId,
      courseId: session.courseId,
      studentUid,
      studentName,
      studentRollNo,
      markedAt,
      status: 'present',
      source: 'qr_scan',
      verified: true,
      ...(studentCoords ? {
        studentCoordinates: {
          latitude: studentCoords.latitude,
          longitude: studentCoords.longitude,
          distanceMeters
        }
      } : {})
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, totalPresent: (s.totalPresent || 0) + 1 } : s));
    try {
      const savedRecs = localStorage.getItem('smartattend_attendance_records');
      const list = savedRecs ? JSON.parse(savedRecs) : [];
      localStorage.setItem('smartattend_attendance_records', JSON.stringify([newRecord, ...list]));
    } catch {}

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'attendanceRecords', recordId), newRecord);
        await updateDoc(doc(db, 'attendanceSessions', sessionId), {
          totalPresent: (session.totalPresent || 0) + 1
        });
      } catch (err) {
        console.warn('Firestore write notice for attendanceRecords (fallback to local state):', err);
      }
    }

    return { 
      success: true, 
      message: session.geofence?.enabled 
        ? `Attendance verified! Physical presence confirmed (${distanceMeters}m from instructor).`
        : 'Attendance recorded successfully!', 
      courseName: `${session.courseCode} — ${session.courseName}`,
      sessionTopic: session.lectureTopic,
      markedAt,
      distanceMeters
    };
  };

  // Timetable slot management
  const addTimetableSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSlot: TimetableSlot = { 
      ...slotData, 
      id: slotId,
      organizationId: slotData.organizationId || currentUser?.organizationId || 'org_apex_tech',
      organizationCode: slotData.organizationCode || currentUser?.organizationCode || 'APEX101'
    };

    try {
      if (isLiveFirebaseConfigured) {
        await setDoc(doc(db, 'timetable', slotId), newSlot);
      }
    } catch (err) {
      console.warn('Firestore timetable setDoc notice:', err);
    }

    setTimetable(prev => [...prev.filter(s => s.id !== slotId), newSlot]);
    return newSlot;
  };

  // Bulk save whole week schedule at once
  const saveWeeklyScheduleBatch = async (slots: Omit<TimetableSlot, 'id'>[]) => {
    const newSlots: TimetableSlot[] = slots.map((s, idx) => ({
      ...s,
      id: `slot_${Date.now()}_${idx}`,
      organizationId: s.organizationId || currentUser?.organizationId || 'org_apex_tech',
      organizationCode: s.organizationCode || currentUser?.organizationCode || 'APEX101'
    }));

    try {
      if (isLiveFirebaseConfigured) {
        const batch = writeBatch(db);
        for (const slot of newSlots) {
          batch.set(doc(db, 'timetable', slot.id), slot);
        }
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore timetable batch set notice:', err);
    }

    setTimetable(prev => [...prev, ...newSlots]);
  };

  const updateTimetableSlot = async (slotId: string, updates: Partial<TimetableSlot>) => {
    try {
      if (isLiveFirebaseConfigured) {
        await updateDoc(doc(db, 'timetable', slotId), updates);
      }
    } catch (err) {
      console.warn('Firestore timetable updateDoc notice:', err);
    }
    setTimetable(prev => prev.map(s => s.id === slotId ? { ...s, ...updates } : s));
  };

  const deleteTimetableSlot = async (slotId: string) => {
    try {
      if (isLiveFirebaseConfigured) {
        await deleteDoc(doc(db, 'timetable', slotId));
      }
    } catch (err) {
      console.warn('Firestore timetable deleteDoc notice:', err);
    }
    setTimetable(prev => prev.filter(s => s.id !== slotId));
  };

  const clearDivisionTimetable = async (divisionId: string, day?: DayOfWeek) => {
    if (isLiveFirebaseConfigured) {
      const batch = writeBatch(db);
      const toDelete = timetable.filter(s => {
        if (s.divisionId !== divisionId) return false;
        if (day && s.dayOfWeek !== day) return false;
        return true;
      });
      toDelete.forEach(s => batch.delete(doc(db, 'timetable', s.id)));
      await batch.commit();
    }
    setTimetable(prev => prev.filter(s => {
      if (s.divisionId !== divisionId) return true;
      if (day && s.dayOfWeek !== day) return true;
      return false;
    }));
  };

  const publishDivisionTimetable = async (divisionId: string) => {
    try {
      if (isLiveFirebaseConfigured) {
        const batch = writeBatch(db);
        const toPublish = timetable.filter(s => s.divisionId === divisionId);
        toPublish.forEach(s => batch.update(doc(db, 'timetable', s.id), { status: 'published' }));
        if (toPublish.length > 0) {
          await batch.commit();
        }
      }
    } catch (err) {
      console.warn('Firestore publishDivisionTimetable notice:', err);
    }
    setTimetable(prev => prev.map(s => s.divisionId === divisionId ? { ...s, status: 'published' as const } : s));
  };

  const unpublishDivisionTimetable = async (divisionId: string) => {
    try {
      if (isLiveFirebaseConfigured) {
        const batch = writeBatch(db);
        const toUnpublish = timetable.filter(s => s.divisionId === divisionId);
        toUnpublish.forEach(s => batch.update(doc(db, 'timetable', s.id), { status: 'draft' }));
        if (toUnpublish.length > 0) {
          await batch.commit();
        }
      }
    } catch (err) {
      console.warn('Firestore unpublishDivisionTimetable notice:', err);
    }
    setTimetable(prev => prev.map(s => s.divisionId === divisionId ? { ...s, status: 'draft' as const } : s));
  };

  const copyDayTimetable = async (fromDay: DayOfWeek, toDay: DayOfWeek, divisionId: string): Promise<number> => {
    const sourceSlots = timetable.filter(s => s.divisionId === divisionId && s.dayOfWeek === fromDay);
    if (sourceSlots.length === 0) return 0;

    // Filter out existing slots on destination day
    const cleanExisting = timetable.filter(s => !(s.divisionId === divisionId && s.dayOfWeek === toDay));

    const copiedSlots: TimetableSlot[] = sourceSlots.map((s, idx) => ({
      ...s,
      id: `slot_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      dayOfWeek: toDay,
      status: 'draft'
    }));

    try {
      if (isLiveFirebaseConfigured) {
        const batch = writeBatch(db);
        const oldDest = timetable.filter(s => s.divisionId === divisionId && s.dayOfWeek === toDay);
        oldDest.forEach(s => batch.delete(doc(db, 'timetable', s.id)));
        copiedSlots.forEach(s => batch.set(doc(db, 'timetable', s.id), s));
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore copyDayTimetable notice:', err);
    }

    setTimetable([...cleanExisting, ...copiedSlots]);
    return copiedSlots.length;
  };

  const copyDivisionTimetable = async (fromDivisionId: string, toDivisionId: string): Promise<number> => {
    const targetDivision = divisions.find(d => d.id === toDivisionId);
    if (!targetDivision) return 0;

    const sourceSlots = timetable.filter(s => s.divisionId === fromDivisionId);
    if (sourceSlots.length === 0) return 0;

    const cleanExisting = timetable.filter(s => s.divisionId !== toDivisionId);

    const copiedSlots: TimetableSlot[] = sourceSlots.map((s, idx) => ({
      ...s,
      id: `slot_${Date.now()}_div_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      divisionId: toDivisionId,
      divisionName: targetDivision.name,
      departmentId: targetDivision.departmentId,
      department: targetDivision.departmentName,
      yearOfStudy: targetDivision.yearOfStudy,
      status: 'draft'
    }));

    try {
      if (isLiveFirebaseConfigured) {
        const batch = writeBatch(db);
        const oldDest = timetable.filter(s => s.divisionId === toDivisionId);
        oldDest.forEach(s => batch.delete(doc(db, 'timetable', s.id)));
        copiedSlots.forEach(s => batch.set(doc(db, 'timetable', s.id), s));
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore copyDivisionTimetable notice:', err);
    }

    setTimetable([...cleanExisting, ...copiedSlots]);
    return copiedSlots.length;
  };

  // Smart Faculty Availability Check across entire institute
  const isTimeOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
    return startA < endB && endA > startB;
  };

  const checkFacultyAvailability = (
    teacherId: string, 
    day: DayOfWeek, 
    startTime: string, 
    endTime: string, 
    currentSlotId?: string
  ): { available: boolean; conflictReason?: string } => {
    if (!teacherId || !startTime || !endTime) return { available: true };

    for (const slot of timetable) {
      if (currentSlotId && slot.id === currentSlotId) continue;
      if (slot.dayOfWeek !== day) continue;
      if (slot.sessionType === 'break') continue;

      if (isTimeOverlapping(startTime, endTime, slot.startTime, slot.endTime)) {
        const isPrimary = slot.teacherId === teacherId;
        const isAdditional = slot.additionalTeacherIds?.includes(teacherId);

        if (isPrimary || isAdditional) {
          const divInfo = slot.divisionName ? `${slot.yearOfStudy ? slot.yearOfStudy + ' ' : ''}${slot.divisionName}` : (slot.department || 'another class');
          const role = isPrimary ? 'Teaching' : 'Assisting in';
          const reason = `${role} ${slot.courseCode || 'Lecture'} (${slot.startTime}–${slot.endTime}) in ${divInfo} [${slot.room || 'Room'}]`;
          return { available: false, conflictReason: reason };
        }
      }
    }

    return { available: true };
  };

  // Comprehensive Timetable Conflict Validation
  const validateTimetableConflicts = (
    slots: TimetableSlot[]
  ): { hasConflicts: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. Validate time boundaries
    for (const s of slots) {
      if (s.startTime >= s.endTime) {
        errors.push(`Invalid slot on ${s.dayOfWeek}: Start time (${s.startTime}) must be strictly earlier than end time (${s.endTime}).`);
      }
    }

    // 2. Division internal overlaps
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];

        if (a.dayOfWeek === b.dayOfWeek && a.divisionId === b.divisionId) {
          if (isTimeOverlapping(a.startTime, a.endTime, b.startTime, b.endTime)) {
            const descA = a.sessionType === 'break' ? `Break (${a.notes || 'Break'})` : `${a.courseCode || 'Session'} (${a.startTime}–${a.endTime})`;
            const descB = b.sessionType === 'break' ? `Break (${b.notes || 'Break'})` : `${b.courseCode || 'Session'} (${b.startTime}–${b.endTime})`;
            errors.push(`Overlap in ${a.divisionName || 'Division'} on ${a.dayOfWeek}: ${descA} clashes with ${descB}.`);
          }
        }
      }
    }

    // 3. Faculty and Room availability across entire institute
    for (const s of slots) {
      if (s.sessionType === 'break') continue;

      if (s.teacherId) {
        const check = checkFacultyAvailability(s.teacherId, s.dayOfWeek, s.startTime, s.endTime, s.id);
        if (!check.available) {
          errors.push(`Faculty Clashing: ${s.teacherName} is unavailable on ${s.dayOfWeek} (${s.startTime}–${s.endTime}) &bull; ${check.conflictReason}`);
        }
      }

      if (s.additionalTeacherIds && s.additionalTeacherIds.length > 0) {
        s.additionalTeacherIds.forEach((secId, idx) => {
          const secName = s.additionalTeacherNames?.[idx] || 'Co-Faculty';
          const check = checkFacultyAvailability(secId, s.dayOfWeek, s.startTime, s.endTime, s.id);
          if (!check.available) {
            errors.push(`Co-Faculty Clashing: ${secName} is unavailable on ${s.dayOfWeek} (${s.startTime}–${s.endTime}) &bull; ${check.conflictReason}`);
          }
        });
      }

      // Room check against OTHER divisions
      if (s.room && s.room.trim() !== '') {
        const cleanRoom = s.room.trim().toLowerCase();
        for (const other of timetable) {
          if (other.id === s.id) continue;
          if (other.divisionId === s.divisionId) continue; // Same division internal overlap is handled above
          if (other.dayOfWeek !== s.dayOfWeek) continue;
          if (!other.room || other.room.trim().toLowerCase() !== cleanRoom) continue;

          if (isTimeOverlapping(s.startTime, s.endTime, other.startTime, other.endTime)) {
            errors.push(`Room Clashing: "${s.room}" is already reserved on ${s.dayOfWeek} (${other.startTime}–${other.endTime}) by ${other.divisionName || other.department}.`);
          }
        }
      }
    }

    return {
      hasConflicts: errors.length > 0,
      errors: Array.from(new Set(errors))
    };
  };

  const clearDepartmentSchedule = async (department: string, semester: string) => {
    const toDelete = timetable.filter(
      s => s.department === department && 
           s.semester === semester &&
           (s.organizationId || 'org_apex_tech') === currentOrgId
    );

    if (isLiveFirebaseConfigured) {
      const batch = writeBatch(db);
      toDelete.forEach(s => {
        batch.delete(doc(db, 'timetable', s.id));
      });
      await batch.commit();
    } else {
      setTimetable(prev => prev.filter(
        s => !(s.department === department && s.semester === semester)
      ));
    }
  };

  const updateAttendanceStatus = async (recordId: string, newStatus: 'present' | 'absent' | 'late' | 'excused', reason: string) => {
    const record = attendanceRecords.find(r => r.id === recordId);
    if (record) {
      const session = sessions.find(s => s.id === record.sessionId);
      if (session && currentUser?.role !== 'admin' && session.teacherId !== currentUser?.uid) {
        throw new Error('Unauthorized: You can only modify attendance records for your own sessions.');
      }
    }

    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'attendanceRecords', recordId), { status: newStatus });
    } else {
      setAttendanceRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: newStatus } : r));
    }
    console.info(`[AUDIT] Record ${recordId} changed to ${newStatus}. Reason: ${reason}`);
  };

  // Admin Department & Faculty Management
  const addDepartment = async (deptName: string) => {
    const cleanDept = deptName.trim();
    if (!cleanDept) return;
    try {
      const currentOrgData = localStorage.getItem('smartattend_current_org');
      const org = currentOrgData ? JSON.parse(currentOrgData) : null;
      if (org) {
        const currentDepts = org.departments || [];
        if (!currentDepts.includes(cleanDept)) {
          const updatedDepts = [...currentDepts, cleanDept];
          const updatedOrg = { ...org, departments: updatedDepts };
          localStorage.setItem('smartattend_current_org', JSON.stringify(updatedOrg));
          if (isLiveFirebaseConfigured) {
            await updateDoc(doc(db, 'organizations', org.id), { departments: updatedDepts });
          }
        }
      }
    } catch (e) {
      console.warn('addDepartment notice:', e);
    }
  };

  const removeDepartment = async (deptName: string) => {
    try {
      const currentOrgData = localStorage.getItem('smartattend_current_org');
      const org = currentOrgData ? JSON.parse(currentOrgData) : null;
      if (org) {
        const updatedDepts = (org.departments || []).filter((d: string) => d !== deptName);
        const updatedOrg = { ...org, departments: updatedDepts };
        localStorage.setItem('smartattend_current_org', JSON.stringify(updatedOrg));
        if (isLiveFirebaseConfigured) {
          await updateDoc(doc(db, 'organizations', org.id), { departments: updatedDepts });
        }
      }
    } catch (e) {
      console.warn('removeDepartment notice:', e);
    }
  };

  const assignFacultyDepartment = async (facultyUid: string, department: string) => {
    try {
      if (isLiveFirebaseConfigured) {
        await updateDoc(doc(db, 'users', facultyUid), { department });
      }
    } catch (e) {
      console.warn('assignFacultyDepartment notice:', e);
    }
    setOrganizationUsers(prev => prev.map(u => u.uid === facultyUid ? { ...u, department } : u));
  };

  const removeFaculty = async (facultyUid: string) => {
    try {
      if (isLiveFirebaseConfigured) {
        await deleteDoc(doc(db, 'users', facultyUid));
      }
    } catch (e) {
      console.warn('removeFaculty notice:', e);
    }
    setOrganizationUsers(prev => prev.filter(u => u.uid !== facultyUid));
  };

  // Department Hierarchy CRUD
  const addDepartmentHierarchy = async (data: Omit<Department, 'id'>) => {
    const deptId = `dept_${data.code.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`;
    const newDept: Department = {
      ...data,
      id: deptId,
      organizationId: data.organizationId || userOrgId,
      organizationCode: data.organizationCode || userOrgCode || 'APEX101',
      createdAt: new Date().toISOString()
    };
    try {
      if (isLiveFirebaseConfigured) {
        await setDoc(doc(db, 'departments', deptId), newDept);
      }
    } catch (e) {
      console.warn('addDepartmentHierarchy firestore notice:', e);
    }
    setDepartments(prev => [newDept, ...prev.filter(d => d.id !== deptId)]);
    addDepartment(newDept.name);
    return newDept;
  };

  const updateDepartmentHierarchy = async (id: string, updates: Partial<Department>) => {
    try {
      if (isLiveFirebaseConfigured) {
        await updateDoc(doc(db, 'departments', id), updates);
      }
    } catch (e) {
      console.warn('updateDepartmentHierarchy firestore notice:', e);
    }
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDepartmentHierarchy = async (id: string) => {
    const dept = departments.find(d => d.id === id);
    try {
      if (isLiveFirebaseConfigured) {
        await deleteDoc(doc(db, 'departments', id));
      }
    } catch (e) {
      console.warn('deleteDepartmentHierarchy firestore notice:', e);
    }
    setDepartments(prev => prev.filter(d => d.id !== id));
    if (dept) {
      removeDepartment(dept.name);
    }
  };

  // Division CRUD
  const addDivision = async (data: Omit<Division, 'id'>) => {
    const divId = `div_${data.departmentCode.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDiv: Division = {
      ...data,
      id: divId,
      organizationId: data.organizationId || userOrgId,
      organizationCode: data.organizationCode || userOrgCode || 'APEX101',
      createdAt: new Date().toISOString()
    };
    try {
      if (isLiveFirebaseConfigured) {
        await setDoc(doc(db, 'divisions', divId), newDiv);
      }
    } catch (e) {
      console.warn('addDivision firestore notice:', e);
    }
    setDivisions(prev => [newDiv, ...prev.filter(d => d.id !== divId)]);
    return newDiv;
  };

  const updateDivision = async (id: string, updates: Partial<Division>) => {
    try {
      if (isLiveFirebaseConfigured) {
        await updateDoc(doc(db, 'divisions', id), updates);
      }
    } catch (e) {
      console.warn('updateDivision firestore notice:', e);
    }
    setDivisions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDivision = async (id: string) => {
    try {
      if (isLiveFirebaseConfigured) {
        await deleteDoc(doc(db, 'divisions', id));
      }
    } catch (e) {
      console.warn('deleteDivision firestore notice:', e);
    }
    setDivisions(prev => prev.filter(d => d.id !== id));
  };

  // Subject Allocation with Duplicate Protection & Admin Authorization
  const allocateSubjectToDivision = async (allocData: Omit<SubjectAllocation, 'id'>) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Department Administrators can assign subjects to faculty members.');
    }

    if (!allocData.courseId || !allocData.teacherId || !allocData.divisionId) {
      throw new Error('Missing required fields: Subject, Faculty, and Division are required.');
    }

    // Duplicate check: Prevent assigning the exact same course to the same division and batch
    const targetBatch = allocData.batch || 'All';
    const targetAcademicYear = allocData.academicYear || '';
    const isDuplicate = subjectAllocations.some(a => 
      a.divisionId === allocData.divisionId &&
      a.courseId === allocData.courseId &&
      (a.batch || 'All') === targetBatch &&
      (!targetAcademicYear || !a.academicYear || a.academicYear === targetAcademicYear)
    );

    if (isDuplicate) {
      throw new Error(`Duplicate assignment: This subject is already assigned to this division (${targetBatch === 'All' ? 'Full Class' : targetBatch}). Please edit or remove the existing assignment.`);
    }

    const allocId = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAlloc: SubjectAllocation = {
      ...allocData,
      id: allocId,
      organizationId: allocData.organizationId || userOrgId,
      organizationCode: allocData.organizationCode || userOrgCode || 'APEX101',
      batch: targetBatch,
      assignedBy: currentUser.uid,
      assignedAt: new Date().toISOString(),
      status: 'active'
    };

    try {
      if (isLiveFirebaseConfigured) {
        await setDoc(doc(db, 'subjectAllocations', allocId), newAlloc);
      }
    } catch (e) {
      console.warn('allocateSubjectToDivision firestore notice:', e);
    }
    setSubjectAllocations(prev => [newAlloc, ...prev]);
    return newAlloc;
  };

  const updateSubjectAllocation = async (allocationId: string, updates: Partial<SubjectAllocation>) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Department Administrators can edit subject assignments.');
    }

    try {
      if (isLiveFirebaseConfigured) {
        await updateDoc(doc(db, 'subjectAllocations', allocationId), updates);
      }
    } catch (e) {
      console.warn('updateSubjectAllocation firestore notice:', e);
    }
    setSubjectAllocations(prev => prev.map(a => a.id === allocationId ? { ...a, ...updates } : a));
  };

  const removeSubjectAllocation = async (allocationId: string) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Only Department Administrators can remove subject assignments.');
    }

    try {
      if (isLiveFirebaseConfigured) {
        await deleteDoc(doc(db, 'subjectAllocations', allocationId));
      }
    } catch (e) {
      console.warn('removeSubjectAllocation firestore notice:', e);
    }
    setSubjectAllocations(prev => prev.filter(a => a.id !== allocationId));
  };

  // Bulk Operations
  const bulkAddStudentsToDivision = async (
    divisionId: string, 
    studentsList: Array<{ fullName: string; email: string; rollNo: string; yearOfStudy?: YearOfStudy }>
  ) => {
    const targetDivision = divisions.find(d => d.id === divisionId);
    if (!targetDivision) return { addedCount: 0, message: 'Division not found' };

    const newUsers: UserProfile[] = [];
    for (const s of studentsList) {
      const studentUid = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const profile: UserProfile = {
        uid: studentUid,
        fullName: s.fullName.trim(),
        email: s.email.trim(),
        role: 'student',
        studentId: s.rollNo.trim(),
        rollNo: s.rollNo.trim(),
        organizationId: userOrgId,
        organizationCode: userOrgCode || 'APEX101',
        organizationName: currentUser?.organizationName || 'Institute',
        department: targetDivision.departmentName,
        departmentId: targetDivision.departmentId,
        yearOfStudy: s.yearOfStudy || targetDivision.yearOfStudy,
        divisionId: targetDivision.id,
        divisionName: targetDivision.name,
        academicYear: targetDivision.academicYear,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newUsers.push(profile);
      try {
        if (isLiveFirebaseConfigured) {
          await setDoc(doc(db, 'users', studentUid), profile);
        }
      } catch (e) {
        console.warn('bulk student firestore notice:', e);
      }
    }

    setOrganizationUsers(prev => [...newUsers, ...prev]);
    await updateDivision(divisionId, {
      studentCount: (targetDivision.studentCount || 0) + newUsers.length
    });

    return { 
      addedCount: newUsers.length, 
      message: `Successfully added ${newUsers.length} students to ${targetDivision.departmentName} - ${targetDivision.name}` 
    };
  };

  const bulkAddFacultyToDepartment = async (
    departmentId: string, 
    facultyList: Array<{ fullName: string; email: string; facultyId: string; role?: 'teacher' | 'admin' }>
  ) => {
    const targetDept = departments.find(d => d.id === departmentId);
    const deptName = targetDept?.name || 'General';

    const newFaculty: UserProfile[] = [];
    for (const f of facultyList) {
      const facultyUid = `faculty_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const profile: UserProfile = {
        uid: facultyUid,
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        role: f.role || 'teacher',
        facultyId: f.facultyId.trim(),
        organizationId: userOrgId,
        organizationCode: userOrgCode || 'APEX101',
        organizationName: currentUser?.organizationName || 'Institute',
        department: deptName,
        departmentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newFaculty.push(profile);
      try {
        if (isLiveFirebaseConfigured) {
          await setDoc(doc(db, 'users', facultyUid), profile);
        }
      } catch (e) {
        console.warn('bulk faculty firestore notice:', e);
      }
    }

    setOrganizationUsers(prev => [...newFaculty, ...prev]);
    return {
      addedCount: newFaculty.length,
      message: `Successfully onboarded ${newFaculty.length} faculty to ${deptName}`
    };
  };

  // Complete Institute Onboarding Wizard Batch Execution
  const completeInstituteOnboarding = async (onboardingData: {
    institute: Partial<Organization>;
    departments: Array<{ name: string; code: string; hodName?: string; hodEmail?: string }>;
    divisions: Array<{ departmentCode: string; yearOfStudy: YearOfStudy; name: string; classTeacherName?: string; roomNumber?: string }>;
    faculty: Array<{ fullName: string; email: string; facultyId: string; departmentCode: string }>;
    students: Array<{ fullName: string; email: string; rollNo: string; departmentCode: string; yearOfStudy: YearOfStudy; divisionName: string }>;
  }) => {
    const currentOrgData = localStorage.getItem('smartattend_current_org');
    const existingOrg = currentOrgData ? JSON.parse(currentOrgData) : {};
    const updatedOrg = {
      ...existingOrg,
      ...onboardingData.institute,
      departments: onboardingData.departments.map(d => d.name),
      onboardingCompleted: true
    };
    localStorage.setItem('smartattend_current_org', JSON.stringify(updatedOrg));
    if (isLiveFirebaseConfigured && updatedOrg.id) {
      try {
        await updateDoc(doc(db, 'organizations', updatedOrg.id), updatedOrg);
      } catch (e) {
        console.warn('Onboarding org update notice:', e);
      }
    }

    const createdDepts: Department[] = [];
    for (const d of onboardingData.departments) {
      const deptId = `dept_${d.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const newD: Department = {
        id: deptId,
        organizationId: userOrgId,
        organizationCode: userOrgCode || updatedOrg.code || 'APEX101',
        name: d.name,
        code: d.code,
        hodName: d.hodName,
        hodEmail: d.hodEmail,
        createdAt: new Date().toISOString()
      };
      createdDepts.push(newD);
      if (isLiveFirebaseConfigured) {
        try { await setDoc(doc(db, 'departments', deptId), newD); } catch {}
      }
    }
    setDepartments(prev => [...createdDepts, ...prev.filter(p => !createdDepts.some(c => c.id === p.id))]);

    const createdDivs: Division[] = [];
    for (const div of onboardingData.divisions) {
      const dept = createdDepts.find(d => d.code === div.departmentCode) || createdDepts[0];
      const divId = `div_${div.departmentCode.toLowerCase()}_${div.yearOfStudy.replace(/\s+/g, '_').toLowerCase()}_${div.name.replace(/\s+/g, '_').toLowerCase()}`;
      const newDiv: Division = {
        id: divId,
        organizationId: userOrgId,
        organizationCode: userOrgCode || updatedOrg.code || 'APEX101',
        departmentId: dept ? dept.id : 'dept_general',
        departmentCode: div.departmentCode,
        departmentName: dept ? dept.name : 'Engineering',
        yearOfStudy: div.yearOfStudy,
        name: div.name,
        academicYear: updatedOrg.currentAcademicYear || '2026–27',
        classTeacherName: div.classTeacherName,
        roomNumber: div.roomNumber || 'Room 101',
        studentCount: onboardingData.students.filter(s => s.departmentCode === div.departmentCode && s.yearOfStudy === div.yearOfStudy && s.divisionName === div.name).length,
        createdAt: new Date().toISOString()
      };
      createdDivs.push(newDiv);
      if (isLiveFirebaseConfigured) {
        try { await setDoc(doc(db, 'divisions', divId), newDiv); } catch {}
      }
    }
    setDivisions(prev => [...createdDivs, ...prev.filter(p => !createdDivs.some(c => c.id === p.id))]);

    const newFacultyUsers: UserProfile[] = [];
    for (const f of onboardingData.faculty) {
      const dept = createdDepts.find(d => d.code === f.departmentCode) || createdDepts[0];
      const facultyUid = `faculty_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const profile: UserProfile = {
        uid: facultyUid,
        fullName: f.fullName,
        email: f.email,
        role: 'teacher',
        facultyId: f.facultyId,
        department: dept ? dept.name : 'General',
        departmentId: dept ? dept.id : undefined,
        organizationId: userOrgId,
        organizationCode: userOrgCode || updatedOrg.code || 'APEX101',
        organizationName: updatedOrg.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newFacultyUsers.push(profile);
      if (isLiveFirebaseConfigured) {
        try { await setDoc(doc(db, 'users', facultyUid), profile); } catch {}
      }
    }

    const newStudentUsers: UserProfile[] = [];
    for (const s of onboardingData.students) {
      const dept = createdDepts.find(d => d.code === s.departmentCode) || createdDepts[0];
      const div = createdDivs.find(d => d.departmentCode === s.departmentCode && d.yearOfStudy === s.yearOfStudy && d.name === s.divisionName);
      const studentUid = `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const profile: UserProfile = {
        uid: studentUid,
        fullName: s.fullName,
        email: s.email,
        role: 'student',
        studentId: s.rollNo,
        rollNo: s.rollNo,
        department: dept ? dept.name : 'General',
        departmentId: dept ? dept.id : undefined,
        yearOfStudy: s.yearOfStudy,
        divisionId: div ? div.id : undefined,
        divisionName: s.divisionName,
        academicYear: updatedOrg.currentAcademicYear || '2026–27',
        organizationId: userOrgId,
        organizationCode: userOrgCode || updatedOrg.code || 'APEX101',
        organizationName: updatedOrg.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newStudentUsers.push(profile);
      if (isLiveFirebaseConfigured) {
        try { await setDoc(doc(db, 'users', studentUid), profile); } catch {}
      }
    }

    setOrganizationUsers(prev => [...newFacultyUsers, ...newStudentUsers, ...prev]);
  };

  // 1-Student = 1-Device Binding & Change Requests (Department Teacher Approval)
  const bindCurrentDevice = async (
    studentUid: string, 
    device: { deviceId: string; deviceName: string; platform?: string }
  ) => {
    const boundAt = new Date().toISOString();
    const updates: Partial<UserProfile> = {
      boundDeviceId: device.deviceId,
      boundDeviceName: device.deviceName,
      boundDevicePlatform: device.platform || 'Mobile',
      boundAt,
      deviceStatus: 'active'
    };

    setOrganizationUsers(prev => prev.map(u => u.uid === studentUid ? { ...u, ...updates } : u));

    if (currentUser?.uid === studentUid) {
      const updatedUser = { ...currentUser, ...updates, updatedAt: boundAt };
      localStorage.setItem('smartattend_current_user', JSON.stringify(updatedUser));
    }

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', studentUid), updates);
      } catch (err) {
        console.warn('Failed to bind device in Firestore:', err);
      }
    }
  };

  const requestDeviceChange = async (
    reason: string, 
    newDevice: { deviceId: string; deviceName: string; platform?: string }
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'You must be logged in to request a device change.' };

    const existingPending = deviceChangeRequests.some(
      r => r.studentUid === currentUser.uid && r.status === 'pending'
    );
    if (existingPending) {
      return { success: false, message: 'You already have a device change request pending approval from your Department Teacher.' };
    }

    const reqId = `dreq_${Date.now()}`;
    const newReq: DeviceChangeRequest = {
      id: reqId,
      organizationId: currentUser.organizationId || 'org_apex_tech',
      organizationCode: currentUser.organizationCode || 'APEX101',
      studentUid: currentUser.uid,
      studentName: currentUser.fullName,
      studentRollNo: currentUser.studentId || currentUser.rollNo || 'N/A',
      studentEmail: currentUser.email,
      department: currentUser.department || 'General',
      departmentId: currentUser.departmentId,
      divisionId: currentUser.divisionId,
      divisionName: currentUser.divisionName,
      yearOfStudy: currentUser.yearOfStudy,
      oldDeviceId: currentUser.boundDeviceId,
      oldDeviceName: currentUser.boundDeviceName,
      newDeviceId: newDevice.deviceId,
      newDeviceName: newDevice.deviceName,
      newDevicePlatform: newDevice.platform,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    setDeviceChangeRequests(prev => {
      const next = [newReq, ...prev.filter(r => r.id !== reqId)];
      try {
        localStorage.setItem('smartattend_device_requests', JSON.stringify(next));
      } catch {}
      return next;
    });

    setOrganizationUsers(prev => prev.map(u => u.uid === currentUser.uid ? { ...u, deviceStatus: 'change_pending' } : u));
    if (currentUser) {
      const updatedUser = { ...currentUser, deviceStatus: 'change_pending' as const };
      localStorage.setItem('smartattend_current_user', JSON.stringify(updatedUser));
    }

    if (isLiveFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'deviceChangeRequests', reqId), newReq);
        await updateDoc(doc(db, 'users', currentUser.uid), { deviceStatus: 'change_pending' });
      } catch (err) {
        console.warn('Firestore deviceChangeRequest error:', err);
      }
    }

    return { success: true, message: 'Device change request sent to Department Teacher.' };
  };

  const approveDeviceChange = async (requestId: string, teacherId: string, teacherName: string): Promise<void> => {
    const req = deviceChangeRequests.find(r => r.id === requestId);
    if (!req) return;

    const reviewedAt = new Date().toISOString();
    setDeviceChangeRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'approved',
      reviewedByTeacherId: teacherId,
      reviewedByTeacherName: teacherName,
      reviewedAt
    } : r));

    const studentUpdates: Partial<UserProfile> = {
      boundDeviceId: req.newDeviceId,
      boundDeviceName: req.newDeviceName,
      boundDevicePlatform: req.newDevicePlatform || 'Mobile',
      boundAt: reviewedAt,
      deviceStatus: 'active'
    };

    setOrganizationUsers(prev => prev.map(u => u.uid === req.studentUid ? { ...u, ...studentUpdates } : u));

    if (currentUser?.uid === req.studentUid) {
      const updatedUser = { ...currentUser, ...studentUpdates, updatedAt: reviewedAt };
      localStorage.setItem('smartattend_current_user', JSON.stringify(updatedUser));
    }

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'deviceChangeRequests', requestId), {
          status: 'approved',
          reviewedByTeacherId: teacherId,
          reviewedByTeacherName: teacherName,
          reviewedAt
        });
        await updateDoc(doc(db, 'users', req.studentUid), studentUpdates);
      } catch (err) {
        console.warn('Firestore approveDeviceChange error:', err);
      }
    }
  };

  const rejectDeviceChange = async (requestId: string, teacherId: string, teacherName: string, reason?: string): Promise<void> => {
    const req = deviceChangeRequests.find(r => r.id === requestId);
    if (!req) return;

    const reviewedAt = new Date().toISOString();
    setDeviceChangeRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'rejected',
      rejectionReason: reason || 'Suspicious proxy attempt / Invalid request',
      reviewedByTeacherId: teacherId,
      reviewedByTeacherName: teacherName,
      reviewedAt
    } : r));

    setOrganizationUsers(prev => prev.map(u => u.uid === req.studentUid ? { ...u, deviceStatus: 'active' } : u));

    if (currentUser?.uid === req.studentUid) {
      const updatedUser = { ...currentUser, deviceStatus: 'active' as const };
      localStorage.setItem('smartattend_current_user', JSON.stringify(updatedUser));
    }

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'deviceChangeRequests', requestId), {
          status: 'rejected',
          rejectionReason: reason || 'Suspicious proxy attempt / Invalid request',
          reviewedByTeacherId: teacherId,
          reviewedByTeacherName: teacherName,
          reviewedAt
        });
        await updateDoc(doc(db, 'users', req.studentUid), { deviceStatus: 'active' });
      } catch (err) {
        console.warn('Firestore rejectDeviceChange error:', err);
      }
    }
  };

  const resetStudentDevice = async (studentUid: string, teacherId: string, teacherName: string): Promise<void> => {
    const studentUpdates: Partial<UserProfile> = {
      boundDeviceId: undefined,
      boundDeviceName: undefined,
      boundDevicePlatform: undefined,
      boundAt: undefined,
      deviceStatus: 'unlinked'
    };

    setOrganizationUsers(prev => prev.map(u => u.uid === studentUid ? { ...u, ...studentUpdates } : u));

    if (currentUser?.uid === studentUid) {
      const updatedUser = { ...currentUser, ...studentUpdates };
      localStorage.setItem('smartattend_current_user', JSON.stringify(updatedUser));
    }

    if (isLiveFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', studentUid), {
          boundDeviceId: null,
          boundDeviceName: null,
          boundDevicePlatform: null,
          boundAt: null,
          deviceStatus: 'unlinked'
        });
      } catch (err) {
        console.warn('Firestore resetStudentDevice error:', err);
      }
    }
  };

  // Multi-tenant organization scoping:
  // Scopes courses, enrollments, requests, sessions, and timetable to the logged-in user's institution.
  const userOrgId = currentUser?.organizationId || 'org_apex_tech';
  const userOrgCode = currentUser?.organizationCode?.toUpperCase();

  const isOrgMatch = (itemOrgId?: string, itemOrgCode?: string) => {
    if (itemOrgId && userOrgId && itemOrgId === userOrgId) return true;
    if (itemOrgCode && userOrgCode && itemOrgCode.toUpperCase() === userOrgCode) return true;
    if (!itemOrgId && userOrgId === 'org_apex_tech') return true;
    return false;
  };

  const scopedCourses = courses.filter(c => isOrgMatch(c.organizationId, c.organizationCode));
  const scopedCourseIds = new Set(scopedCourses.map(c => c.id));

  const scopedEnrollments = enrollments.filter(e => scopedCourseIds.has(e.courseId));
  const scopedRequests = requests.filter(r => isOrgMatch(r.organizationId, r.organizationCode) || scopedCourseIds.has(r.courseId));
  const scopedSessions = sessions.filter(s => isOrgMatch(s.organizationId, s.organizationCode) || scopedCourseIds.has(s.courseId));
  const scopedAttendanceRecords = attendanceRecords.filter(r => scopedCourseIds.has(r.courseId));
  const scopedTimetable = timetable.filter(t => isOrgMatch(t.organizationId, t.organizationCode));
  const scopedUsers = organizationUsers.filter(u => isOrgMatch(u.organizationId, u.organizationCode));
  const scopedDepartments = departments.filter(d => isOrgMatch(d.organizationId, d.organizationCode));
  const scopedDepartmentIds = new Set(scopedDepartments.map(d => d.id));
  const scopedDivisions = divisions.filter(div => isOrgMatch(div.organizationId, div.organizationCode) || scopedDepartmentIds.has(div.departmentId));
  const scopedDivisionIds = new Set(scopedDivisions.map(d => d.id));
  const scopedAllocations = subjectAllocations.filter(a => 
    isOrgMatch(a.organizationId, a.organizationCode) || 
    scopedDivisionIds.has(a.divisionId) ||
    scopedCourseIds.has(a.courseId)
  );

  return (
    <DataContext.Provider
      value={{
        courses: scopedCourses,
        enrollments: scopedEnrollments,
        requests: scopedRequests,
        sessions: scopedSessions,
        attendanceRecords: scopedAttendanceRecords,
        timetable: scopedTimetable,
        organizationUsers: scopedUsers,
        departments: scopedDepartments,
        divisions: scopedDivisions,
        subjectAllocations: scopedAllocations,
        addCourse,
        updateCourse,
        requestEnrollment,
        approveRequest,
        rejectRequest,
        manuallyEnrollStudent,
        removeStudentFromCourse,
        startAttendanceSession,
        updateSessionToken,
        pauseSession,
        resumeSession,
        endSession,
        verifyAndRecordAttendance,
        addTimetableSlot,
        updateTimetableSlot,
        saveWeeklyScheduleBatch,
        deleteTimetableSlot,
        clearDepartmentSchedule,
        clearDivisionTimetable,
        publishDivisionTimetable,
        unpublishDivisionTimetable,
        copyDayTimetable,
        copyDivisionTimetable,
        checkFacultyAvailability,
        validateTimetableConflicts,
        dayConfigs,
        setDayConfig,
        updateAttendanceStatus,
        addDepartment,
        removeDepartment,
        assignFacultyDepartment,
        removeFaculty,
        addDepartmentHierarchy,
        updateDepartmentHierarchy,
        deleteDepartmentHierarchy,
        addDivision,
        updateDivision,
        deleteDivision,
        allocateSubjectToDivision,
        updateSubjectAllocation,
        removeSubjectAllocation,
        isFacultyAuthorizedForCourse,
        cancelScheduledLecture,
        rescheduleLecture,
        scheduleExtraLecture,
        getSlotConductStatus,
        bulkAddStudentsToDivision,
        bulkAddFacultyToDepartment,
        completeInstituteOnboarding,
        deviceChangeRequests,
        requestDeviceChange,
        approveDeviceChange,
        rejectDeviceChange,
        resetStudentDevice,
        bindCurrentDevice
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
