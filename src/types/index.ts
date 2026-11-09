export type UserRole = 'teacher' | 'student' | 'admin';

export type YearOfStudy = 'First Year' | 'Second Year' | 'Third Year' | 'Fourth Year';

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  headOfDepartment?: string;
}

export interface Department {
  id: string; // e.g. "dept_comp"
  organizationId: string;
  organizationCode?: string;
  name: string; // e.g. "Computer Engineering"
  code: string; // e.g. "COMP"
  hodId?: string; // Faculty UID
  hodName?: string;
  hodEmail?: string;
  createdAt?: string;
}

export interface Division {
  id: string; // e.g. "div_comp_te_a"
  organizationId: string;
  organizationCode?: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  yearOfStudy: YearOfStudy; // e.g. "Third Year"
  name: string; // e.g. "Division A"
  academicYear: string; // e.g. "2026–27"
  classTeacherId?: string;
  classTeacherName?: string;
  classTeacherEmail?: string;
  roomNumber?: string;
  capacity?: number;
  enrolledCount?: number;
  studentCount?: number;
  createdAt?: string;
}

export interface SubjectAllocation {
  id: string;
  organizationId?: string;
  organizationCode?: string;
  departmentId?: string;
  departmentName?: string;
  academicYear?: string;
  yearOfStudy?: YearOfStudy;
  semester?: string;
  divisionId: string;
  divisionName?: string;
  batch?: string; // e.g. "All", "Batch 1", "Batch 2", etc.
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  teacherEmail?: string;
  weeklyHours?: number;
  assignedBy?: string;
  assignedAt?: string;
  status?: 'active' | 'archived';
}

export interface Organization {
  id: string; // e.g. "org_tcoer25"
  code: string; // e.g. "TCOER25" or "APEX101" (unique uppercase join code)
  name: string; // e.g. "Trinity College Of Engineering And Research"
  city?: string;
  address?: string;
  contactPhone?: string;
  adminEmail: string;
  adminName?: string;
  currentAcademicYear?: string; // e.g. "2026–27"
  departments?: string[]; // list of department names for legacy compatibility
  onboardingCompleted?: boolean;
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
  departmentId?: string;
  yearOfStudy?: YearOfStudy; // e.g. "Third Year"
  divisionId?: string; // Division mapping
  divisionName?: string; // e.g. "Division A"
  rollNo?: string; // e.g. "42" or "22CS042"
  isHOD?: boolean;
  isClassTeacher?: boolean;
  phone?: string;
  semester?: string;
  academicYear?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  faceBaselineVector?: number[]; // 64-D biometric baseline vector
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
  departmentId?: string;
  yearOfStudy?: YearOfStudy;
  divisionId?: string;
  divisionName?: string;
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

export type LectureConductStatus = 
  | 'SCHEDULED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'NOT_CONDUCTED' 
  | 'CANCELLED' 
  | 'RESCHEDULED';

export type LectureSessionCategory = 'regular' | 'extra';

export interface AttendanceSession {
  id: string;
  organizationId?: string;
  organizationCode?: string;
  departmentId?: string;
  departmentName?: string;
  academicYear?: string;
  yearOfStudy?: YearOfStudy;
  semester?: string;
  divisionId?: string;
  divisionName?: string;
  batch?: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  teacherName?: string;
  lectureTopic: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'paused' | 'ended';
  conductStatus?: LectureConductStatus;
  sessionCategory?: LectureSessionCategory;
  isExtraLecture?: boolean;
  timetableSlotId?: string;
  lectureDate?: string; // Format: YYYY-MM-DD
  scheduledStartTime?: string; // e.g. "09:15"
  scheduledEndTime?: string;   // e.g. "10:15"
  room?: string;
  cancellationReason?: string;
  rescheduledTo?: {
    date: string;
    startTime: string;
    endTime: string;
    room?: string;
    reason?: string;
  };
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
  verificationPhoto?: string; // Captured live selfie data URL
  faceConfidence?: number;    // Biometric match confidence percentage
  livenessConfirmed?: boolean;
  auditFlag?: 'VERIFIED_MATCH' | 'SUSPECT_MISMATCH' | 'FLAGGED_FOR_REVIEW';
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type SessionType = 'lecture' | 'practical' | 'break';

export interface DayScheduleConfig {
  dayOfWeek: DayOfWeek;
  isWorkingDay: boolean;
  holidayReason?: string;
}

export interface TimetableSlot {
  id: string;
  organizationId?: string;
  organizationCode?: string;
  courseId?: string;
  courseCode?: string;
  courseName?: string;
  teacherId?: string;
  teacherName?: string;
  additionalTeacherIds?: string[]; // for practicals with multiple lab teachers
  additionalTeacherNames?: string[];
  dayOfWeek: DayOfWeek;
  sessionType: SessionType;
  startTime: string; // e.g. "09:15"
  endTime: string;   // e.g. "10:15"
  room?: string;      // e.g. "Hall 302" or "Lab 4"
  semester?: string;
  department: string;
  departmentId?: string;
  divisionId?: string;
  divisionName?: string;
  yearOfStudy?: YearOfStudy;
  academicYear?: string;
  status?: 'draft' | 'published';
  notes?: string;
}
