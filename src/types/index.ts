export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  studentId?: string; // Roll number for students
  facultyId?: string; // ID for teachers
  department: string;
  semester?: string;
  academicYear?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  department: string;
  semester: string;
  academicYear: string;
  teacherId: string;
  teacherName: string;
  description: string;
  createdAt: string;
  status: 'active' | 'archived';
  enrolledCount?: number;
}

export interface EnrollmentRequest {
  id: string;
  studentId: string; // student's auth UID
  studentRollNo: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  decisionReason?: string;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentUid: string;
  studentName: string;
  studentRollNo: string;
  studentEmail: string;
  enrolledAt: string;
  status: 'active' | 'suspended';
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  lectureTopic: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'paused' | 'ended';
  qrRefreshIntervalSeconds: 3 | 5;
  currentQrToken?: string;
  tokenExpiresAt?: number;
  totalPresent?: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string; // usually session_{sessionId}_student_{studentUid}
  sessionId: string;
  courseId: string;
  studentUid: string;
  studentName: string;
  studentRollNo: string;
  markedAt: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  source: 'qr_scan' | 'manual_teacher';
  verified: boolean;
}

