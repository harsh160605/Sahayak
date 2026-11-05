export type UserRole = 'teacher' | 'student';

export interface Organization {
  id: string; // e.g. "org_mit_pune"
  code: string; // e.g. "SA-7821" or "MIT2024" (unique uppercase join code)
  name: string; // e.g. "Apex Institute of Technology"
  city?: string;
  adminEmail: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  organizationId?: string; // Links user to their institution
  organizationCode?: string; // Easy human-readable code
  organizationName?: string;
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
  organizationId?: string;
  organizationCode?: string;
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
  organizationId?: string;
  organizationCode?: string;
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
  organizationId?: string;
  organizationCode?: string;
  courseId: string;
  studentUid: string;
  studentName: string;
  studentRollNo: string;
  studentEmail: string;
  enrolledAt: string;
  status: 'active' | 'suspended';
}

export interface GeoLocationConfig {
  enabled: boolean;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 50m, 100m, 200m
  locationName?: string;
}

export interface AttendanceSession {
  id: string;
  organizationId?: string;
  organizationCode?: string;
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
  // Geofencing additions
  geofence?: GeoLocationConfig;
}

export interface AttendanceRecord {
  id: string; // usually session_{sessionId}_student_{studentUid}
  organizationId?: string;
  organizationCode?: string;
  sessionId: string;
  courseId: string;
  studentUid: string;
  studentName: string;
  studentRollNo: string;
  markedAt: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  source: 'qr_scan' | 'manual_teacher';
  verified: boolean;
  studentCoordinates?: {
    latitude: number;
    longitude: number;
    distanceMeters?: number;
  };
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSlot {
  id: string;
  organizationId?: string;
  organizationCode?: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:00"
  room: string;      // e.g. "Hall 302" or "Lab 4"
  semester: string;
  department: string;
}
