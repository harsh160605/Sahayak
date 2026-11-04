import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Course, 
  CourseEnrollment, 
  EnrollmentRequest, 
  AttendanceSession, 
  AttendanceRecord 
} from '../types';
import { 
  INITIAL_COURSES, 
  INITIAL_ENROLLMENTS, 
  INITIAL_REQUESTS, 
  INITIAL_SESSIONS, 
  INITIAL_ATTENDANCE_RECORDS 
} from '../data/initialData';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';

interface DataContextType {
  courses: Course[];
  enrollments: CourseEnrollment[];
  requests: EnrollmentRequest[];
  sessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  
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
  startAttendanceSession: (courseId: string, teacherId: string, lectureTopic: string, qrRefreshIntervalSeconds: 3 | 5) => Promise<AttendanceSession>;
  updateSessionToken: (sessionId: string, token: string, expiresAt: number) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  
  // Live attendance verification & recording
  verifyAndRecordAttendance: (
    token: string, 
    studentUid: string, 
    studentName: string, 
    studentRollNo: string
  ) => Promise<{ success: boolean; message: string; courseName?: string; sessionTopic?: string; markedAt?: string }>;
  
  // Correction & manual overrides
  updateAttendanceStatus: (recordId: string, newStatus: 'present' | 'absent' | 'late' | 'excused', reason: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    if (isLiveFirebaseConfigured) return [];
    const saved = localStorage.getItem('smartattend_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() => {
    if (isLiveFirebaseConfigured) return [];
    const saved = localStorage.getItem('smartattend_enrollments');
    return saved ? JSON.parse(saved) : INITIAL_ENROLLMENTS;
  });

  const [requests, setRequests] = useState<EnrollmentRequest[]>(() => {
    if (isLiveFirebaseConfigured) return [];
    const saved = localStorage.getItem('smartattend_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [sessions, setSessions] = useState<AttendanceSession[]>(() => {
    if (isLiveFirebaseConfigured) return [];
    const saved = localStorage.getItem('smartattend_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    if (isLiveFirebaseConfigured) return [];
    const saved = localStorage.getItem('smartattend_attendance_records');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
  });

  // Real-time Firestore Sync Listeners
  useEffect(() => {
    if (!isLiveFirebaseConfigured) {
      // Offline fallback: sync to localStorage
      localStorage.setItem('smartattend_courses', JSON.stringify(courses));
      localStorage.setItem('smartattend_enrollments', JSON.stringify(enrollments));
      localStorage.setItem('smartattend_requests', JSON.stringify(requests));
      localStorage.setItem('smartattend_sessions', JSON.stringify(sessions));
      localStorage.setItem('smartattend_attendance_records', JSON.stringify(attendanceRecords));
      return;
    }

    // 1. Listen to Courses collection in Cloud Firestore
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const items: Course[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setCourses(items);
    });

    // 2. Listen to Enrollments
    const unsubEnrollments = onSnapshot(collection(db, 'enrollments'), (snapshot) => {
      const items: CourseEnrollment[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setEnrollments(items);
    });

    // 3. Listen to Enrollment Requests
    const unsubRequests = onSnapshot(collection(db, 'enrollmentRequests'), (snapshot) => {
      const items: EnrollmentRequest[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
      setRequests(items);
    });

    // 4. Listen to Attendance Sessions
    const unsubSessions = onSnapshot(collection(db, 'attendanceSessions'), (snapshot) => {
      const items: AttendanceSession[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
      setSessions(items);
    });

    // 5. Listen to Attendance Records
    const unsubAttendance = onSnapshot(collection(db, 'attendanceRecords'), (snapshot) => {
      const items: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      items.sort((a, b) => new Date(b.markedAt || 0).getTime() - new Date(a.markedAt || 0).getTime());
      setAttendanceRecords(items);
    });

    return () => {
      unsubCourses();
      unsubEnrollments();
      unsubRequests();
      unsubSessions();
      unsubAttendance();
    };
  }, [isLiveFirebaseConfigured]);

  // Course actions
  const addCourse = async (data: Omit<Course, 'id' | 'createdAt' | 'status' | 'enrolledCount'>) => {
    const courseId = `course_${Date.now()}`;
    const newCourse: Course = {
      ...data,
      id: courseId,
      createdAt: new Date().toISOString(),
      status: 'active',
      enrolledCount: 0
    };

    if (isLiveFirebaseConfigured) {
      await setDoc(doc(db, 'courses', courseId), newCourse);
    } else {
      setCourses(prev => [newCourse, ...prev]);
    }
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

  // Session actions
  const startAttendanceSession = async (
    courseId: string, 
    teacherId: string, 
    lectureTopic: string, 
    qrRefreshIntervalSeconds: 3 | 5
  ) => {
    const course = courses.find(c => c.id === courseId);
    const sessId = `sess_${Date.now()}`;
    const newSession: AttendanceSession = {
      id: sessId,
      courseId,
      courseCode: course?.courseCode || 'CRS',
      courseName: course?.courseName || 'Lecture Session',
      teacherId,
      lectureTopic: lectureTopic.trim() || 'Scheduled Lecture',
      startedAt: new Date().toISOString(),
      status: 'active',
      qrRefreshIntervalSeconds,
      totalPresent: 0,
      createdAt: new Date().toISOString()
    };

    if (isLiveFirebaseConfigured) {
      await setDoc(doc(db, 'attendanceSessions', sessId), newSession);
    } else {
      setSessions(prev => [newSession, ...prev]);
    }

    return newSession;
  };

  const updateSessionToken = async (sessionId: string, token: string, expiresAt: number) => {
    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'attendanceSessions', sessionId), {
        currentQrToken: token,
        tokenExpiresAt: expiresAt
      });
    } else {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentQrToken: token, tokenExpiresAt: expiresAt } : s));
    }
  };

  const pauseSession = async (sessionId: string) => {
    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'attendanceSessions', sessionId), { status: 'paused' });
    } else {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'paused' } : s));
    }
  };

  const resumeSession = async (sessionId: string) => {
    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'attendanceSessions', sessionId), { status: 'active' });
    } else {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'active' } : s));
    }
  };

  const endSession = async (sessionId: string) => {
    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'attendanceSessions', sessionId), { 
        status: 'ended', 
        endedAt: new Date().toISOString() 
      });
    } else {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'ended', endedAt: new Date().toISOString() } : s));
    }
  };

  // Real-time verification
  const verifyAndRecordAttendance = async (
    token: string, 
    studentUid: string, 
    studentName: string, 
    studentRollNo: string
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

    // Server-Side Expiry Check
    const maxAllowedAgeMs = (session.qrRefreshIntervalSeconds * 1000) + 2500;
    if (now - tokenTime > maxAllowedAgeMs) {
      return { 
        success: false, 
        message: 'QR code has expired. Please point your camera at the newly refreshed QR code on screen.' 
      };
    }

    // Enrollment Check
    const isEnrolled = enrollments.some(e => e.courseId === session.courseId && e.studentUid === studentUid && e.status === 'active');
    if (!isEnrolled) {
      return { 
        success: false, 
        message: `You are not enrolled in ${session.courseCode}. Please submit an enrollment request first.` 
      };
    }

    // Idempotency Check
    const alreadyMarked = attendanceRecords.some(r => r.sessionId === sessionId && r.studentUid === studentUid);
    if (alreadyMarked) {
      return { 
        success: false, 
        message: 'Attendance already marked! Your presence for this session is already recorded.' 
      };
    }

    // Record Attendance
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
      verified: true
    };

    if (isLiveFirebaseConfigured) {
      await setDoc(doc(db, 'attendanceRecords', recordId), newRecord);
      await updateDoc(doc(db, 'attendanceSessions', sessionId), {
        totalPresent: (session.totalPresent || 0) + 1
      });
    } else {
      setAttendanceRecords(prev => [newRecord, ...prev]);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, totalPresent: (s.totalPresent || 0) + 1 } : s));
    }

    return { 
      success: true, 
      message: 'Attendance recorded successfully!', 
      courseName: `${session.courseCode} — ${session.courseName}`,
      sessionTopic: session.lectureTopic,
      markedAt
    };
  };

  const updateAttendanceStatus = async (recordId: string, newStatus: 'present' | 'absent' | 'late' | 'excused', reason: string) => {
    if (isLiveFirebaseConfigured) {
      await updateDoc(doc(db, 'attendanceRecords', recordId), { status: newStatus });
    } else {
      setAttendanceRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: newStatus } : r));
    }
    console.info(`[AUDIT] Record ${recordId} changed to ${newStatus}. Reason: ${reason}`);
  };

  return (
    <DataContext.Provider
      value={{
        courses,
        enrollments,
        requests,
        sessions,
        attendanceRecords,
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
        updateAttendanceStatus
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
