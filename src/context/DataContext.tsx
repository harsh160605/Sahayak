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

interface DataContextType {
  courses: Course[];
  enrollments: CourseEnrollment[];
  requests: EnrollmentRequest[];
  sessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  
  // Course actions
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'status' | 'enrolledCount'>) => Course;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  
  // Student Enrollment actions
  requestEnrollment: (studentUid: string, studentName: string, studentRollNo: string, studentEmail: string, courseId: string) => { success: boolean; message: string };
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason?: string) => void;
  manuallyEnrollStudent: (courseId: string, studentUid: string, studentName: string, studentRollNo: string, studentEmail: string) => { success: boolean; message: string };
  removeStudentFromCourse: (courseId: string, studentUid: string) => void;
  
  // Session & QR actions
  startAttendanceSession: (courseId: string, teacherId: string, lectureTopic: string, qrRefreshIntervalSeconds: 3 | 5) => AttendanceSession;
  updateSessionToken: (sessionId: string, token: string, expiresAt: number) => void;
  pauseSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  endSession: (sessionId: string) => void;
  
  // Live attendance verification & recording (Simulated Server-side validation)
  verifyAndRecordAttendance: (
    token: string, 
    studentUid: string, 
    studentName: string, 
    studentRollNo: string
  ) => { success: boolean; message: string; courseName?: string; sessionTopic?: string; markedAt?: string };
  
  // Correction & manual overrides
  updateAttendanceStatus: (recordId: string, newStatus: 'present' | 'absent' | 'late' | 'excused', reason: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('smartattend_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() => {
    const saved = localStorage.getItem('smartattend_enrollments');
    return saved ? JSON.parse(saved) : INITIAL_ENROLLMENTS;
  });

  const [requests, setRequests] = useState<EnrollmentRequest[]>(() => {
    const saved = localStorage.getItem('smartattend_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [sessions, setSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('smartattend_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('smartattend_attendance_records');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
  });

  // Sync to local storage for persistence across reloads
  useEffect(() => {
    localStorage.setItem('smartattend_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('smartattend_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('smartattend_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('smartattend_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('smartattend_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // Course actions
  const addCourse = (data: Omit<Course, 'id' | 'createdAt' | 'status' | 'enrolledCount'>) => {
    const newCourse: Course = {
      ...data,
      id: `course_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      enrolledCount: 0
    };
    setCourses(prev => [newCourse, ...prev]);
    return newCourse;
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Enrollment actions
  const requestEnrollment = (
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

    const newReq: EnrollmentRequest = {
      id: `req_${Date.now()}`,
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

    setRequests(prev => [newReq, ...prev]);
    return { success: true, message: 'Enrollment request submitted successfully.' };
  };

  const approveRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    // Check if enrollment exists
    const exists = enrollments.some(e => e.courseId === req.courseId && e.studentUid === req.studentId);
    if (!exists) {
      const newEnrollment: CourseEnrollment = {
        id: `enr_${Date.now()}`,
        courseId: req.courseId,
        studentUid: req.studentId,
        studentName: req.studentName,
        studentRollNo: req.studentRollNo,
        studentEmail: req.studentEmail,
        enrolledAt: new Date().toISOString(),
        status: 'active'
      };
      setEnrollments(prev => [...prev, newEnrollment]);

      // Update course count
      setCourses(prev => prev.map(c => c.id === req.courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c));
    }

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r));
  };

  const rejectRequest = (requestId: string, reason?: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { 
      ...r, 
      status: 'rejected', 
      reviewedAt: new Date().toISOString(),
      decisionReason: reason || 'Application criteria not met'
    } : r));
  };

  const manuallyEnrollStudent = (
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

    const newEnrollment: CourseEnrollment = {
      id: `enr_${Date.now()}`,
      courseId,
      studentUid,
      studentName,
      studentRollNo,
      studentEmail,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    };
    setEnrollments(prev => [...prev, newEnrollment]);
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c));
    return { success: true, message: `${studentName} was successfully enrolled.` };
  };

  const removeStudentFromCourse = (courseId: string, studentUid: string) => {
    // Soft removal from active enrollment (preserves historical attendance records per requirement #9)
    setEnrollments(prev => prev.filter(e => !(e.courseId === courseId && e.studentUid === studentUid)));
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrolledCount: Math.max(0, (c.enrolledCount || 1) - 1) } : c));
  };

  // Session actions
  const startAttendanceSession = (
    courseId: string, 
    teacherId: string, 
    lectureTopic: string, 
    qrRefreshIntervalSeconds: 3 | 5
  ) => {
    const course = courses.find(c => c.id === courseId);
    const newSession: AttendanceSession = {
      id: `sess_${Date.now()}`,
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
    setSessions(prev => [newSession, ...prev]);
    return newSession;
  };

  const updateSessionToken = (sessionId: string, token: string, expiresAt: number) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentQrToken: token, tokenExpiresAt: expiresAt } : s));
  };

  const pauseSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'paused' } : s));
  };

  const resumeSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'active' } : s));
  };

  const endSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'ended', endedAt: new Date().toISOString() } : s));
  };

  // Core Server-Side Validation Simulation for QR Scan
  const verifyAndRecordAttendance = (
    token: string, 
    studentUid: string, 
    studentName: string, 
    studentRollNo: string
  ) => {
    // 1. Parse token format: "SA_TOKEN::{sessionId}::{timestamp}::{nonce}"
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

    // 2. Locate active session
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

    // 3. Strict Server-Side Expiry Check
    // Token validity window: interval (3s or 5s) + 2.5s network leeway tolerance
    const maxAllowedAgeMs = (session.qrRefreshIntervalSeconds * 1000) + 2500;
    if (now - tokenTime > maxAllowedAgeMs) {
      return { 
        success: false, 
        message: 'QR code has expired. Please point your camera at the newly refreshed QR code on screen.' 
      };
    }

    // 4. Enrollment Check: verify student is enrolled in the course
    const isEnrolled = enrollments.some(e => e.courseId === session.courseId && e.studentUid === studentUid && e.status === 'active');
    if (!isEnrolled) {
      return { 
        success: false, 
        message: `You are not enrolled in ${session.courseCode}. Please submit an enrollment request first.` 
      };
    }

    // 5. Idempotency & Duplicate Check: prevent double-scanning
    const alreadyMarked = attendanceRecords.some(r => r.sessionId === sessionId && r.studentUid === studentUid);
    if (alreadyMarked) {
      return { 
        success: false, 
        message: 'Attendance already marked! Your presence for this session is already recorded.' 
      };
    }

    // 6. Record Attendance
    const markedAt = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      id: `rec_${sessionId}_${studentUid}`,
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

    setAttendanceRecords(prev => [newRecord, ...prev]);

    // Update session present count
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, totalPresent: (s.totalPresent || 0) + 1 } : s));

    return { 
      success: true, 
      message: 'Attendance recorded successfully!', 
      courseName: `${session.courseCode} — ${session.courseName}`,
      sessionTopic: session.lectureTopic,
      markedAt
    };
  };

  const updateAttendanceStatus = (recordId: string, newStatus: 'present' | 'absent' | 'late' | 'excused', reason: string) => {
    setAttendanceRecords(prev => prev.map(r => r.id === recordId ? { 
      ...r, 
      status: newStatus 
    } : r));
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

