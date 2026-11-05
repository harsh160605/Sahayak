import { Course, CourseEnrollment, EnrollmentRequest, AttendanceSession, AttendanceRecord, TimetableSlot, Organization } from '../types';

export const INITIAL_ORGANIZATION: Organization = {
  id: 'org_apex_tech',
  code: 'APEX101',
  name: 'Apex Institute of Technology',
  city: 'Mumbai',
  adminEmail: 'admin@apex.edu',
  createdAt: '2024-01-01T00:00:00Z'
};

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course_cs301',
    organizationId: 'org_apex_tech',
    courseCode: 'CS301',
    courseName: 'Distributed Systems & Cloud Computing',
    department: 'Computer Science & Engineering',
    semester: '6th Semester',
    academicYear: '2024-2025',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    description: 'Principles of consensus, replication, virtualization, and distributed microservices architecture.',
    createdAt: '2024-01-08T09:00:00Z',
    status: 'active',
    enrolledCount: 42
  },
  {
    id: 'course_cs304',
    organizationId: 'org_apex_tech',
    courseCode: 'CS304',
    courseName: 'Advanced Database Systems',
    department: 'Computer Science & Engineering',
    semester: '6th Semester',
    academicYear: '2024-2025',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    description: 'Query optimization, distributed transactions, ACID vs BASE, and modern NoSQL architectures.',
    createdAt: '2024-01-10T09:00:00Z',
    status: 'active',
    enrolledCount: 38
  },
  {
    id: 'course_ai202',
    organizationId: 'org_apex_tech',
    courseCode: 'AI202',
    courseName: 'Machine Learning & Neural Foundations',
    department: 'Computer Science & Engineering',
    semester: '6th Semester',
    academicYear: '2024-2025',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    description: 'Supervised and unsupervised learning algorithms, backpropagation, and deep representation models.',
    createdAt: '2024-01-12T09:00:00Z',
    status: 'active',
    enrolledCount: 50
  }
];

export const INITIAL_ENROLLMENTS: CourseEnrollment[] = [
  {
    id: 'enr_1',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    studentUid: 'student_aarav_patel',
    studentName: 'Aarav Patel',
    studentRollNo: '22CS042',
    studentEmail: 'aarav.cs22@college.edu',
    enrolledAt: '2024-01-18T10:00:00Z',
    status: 'active'
  },
  {
    id: 'enr_2',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs304',
    studentUid: 'student_aarav_patel',
    studentName: 'Aarav Patel',
    studentRollNo: '22CS042',
    studentEmail: 'aarav.cs22@college.edu',
    enrolledAt: '2024-01-18T10:00:00Z',
    status: 'active'
  },
  {
    id: 'enr_3',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    studentUid: 'student_diya_sharma',
    studentName: 'Diya Sharma',
    studentRollNo: '22CS018',
    studentEmail: 'diya.s@college.edu',
    enrolledAt: '2024-01-18T10:05:00Z',
    status: 'active'
  },
  {
    id: 'enr_4',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    studentUid: 'student_rohan_verma',
    studentName: 'Rohan Verma',
    studentRollNo: '22CS089',
    studentEmail: 'rohan.v@college.edu',
    enrolledAt: '2024-01-18T10:10:00Z',
    status: 'active'
  },
  {
    id: 'enr_5',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    studentUid: 'student_ananya_iyer',
    studentName: 'Ananya Iyer',
    studentRollNo: '22CS012',
    studentEmail: 'ananya.i@college.edu',
    enrolledAt: '2024-01-18T10:15:00Z',
    status: 'active'
  }
];

export const INITIAL_REQUESTS: EnrollmentRequest[] = [
  {
    id: 'req_101',
    organizationId: 'org_apex_tech',
    studentId: 'student_priya_nair',
    studentRollNo: '22CS064',
    studentName: 'Priya Nair',
    studentEmail: 'priya.nair@college.edu',
    courseId: 'course_cs301',
    courseCode: 'CS301',
    courseName: 'Distributed Systems & Cloud Computing',
    teacherId: 'teacher_prof_sharma',
    status: 'pending',
    requestedAt: '2024-02-01T14:22:00Z'
  },
  {
    id: 'req_102',
    organizationId: 'org_apex_tech',
    studentId: 'student_kavya_menon',
    studentRollNo: '22CS051',
    studentName: 'Kavya Menon',
    studentEmail: 'kavya.m@college.edu',
    courseId: 'course_cs304',
    courseCode: 'CS304',
    courseName: 'Advanced Database Systems',
    teacherId: 'teacher_prof_sharma',
    status: 'pending',
    requestedAt: '2024-02-02T09:15:00Z'
  }
];

export const INITIAL_SESSIONS: AttendanceSession[] = [
  {
    id: 'sess_1',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    courseCode: 'CS301',
    courseName: 'Distributed Systems & Cloud Computing',
    teacherId: 'teacher_prof_sharma',
    lectureTopic: 'Raft Consensus Protocol & Leader Election',
    startedAt: '2024-02-03T10:00:00Z',
    endedAt: '2024-02-03T11:00:00Z',
    status: 'ended',
    qrRefreshIntervalSeconds: 3,
    totalPresent: 39,
    createdAt: '2024-02-03T09:55:00Z'
  },
  {
    id: 'sess_2',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    courseCode: 'CS301',
    courseName: 'Distributed Systems & Cloud Computing',
    teacherId: 'teacher_prof_sharma',
    lectureTopic: 'CAP Theorem and Vector Clocks',
    startedAt: '2024-02-05T10:00:00Z',
    endedAt: '2024-02-05T11:00:00Z',
    status: 'ended',
    qrRefreshIntervalSeconds: 3,
    totalPresent: 38,
    createdAt: '2024-02-05T09:55:00Z'
  }
];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'rec_1',
    organizationId: 'org_apex_tech',
    sessionId: 'sess_1',
    courseId: 'course_cs301',
    studentUid: 'student_aarav_patel',
    studentName: 'Aarav Patel',
    studentRollNo: '22CS042',
    markedAt: '2024-02-03T10:02:14Z',
    status: 'present',
    source: 'qr_scan',
    verified: true
  },
  {
    id: 'rec_2',
    organizationId: 'org_apex_tech',
    sessionId: 'sess_1',
    courseId: 'course_cs301',
    studentUid: 'student_diya_sharma',
    studentName: 'Diya Sharma',
    studentRollNo: '22CS018',
    markedAt: '2024-02-03T10:02:40Z',
    status: 'present',
    source: 'qr_scan',
    verified: true
  },
  {
    id: 'rec_3',
    organizationId: 'org_apex_tech',
    sessionId: 'sess_2',
    courseId: 'course_cs301',
    studentUid: 'student_aarav_patel',
    studentName: 'Aarav Patel',
    studentRollNo: '22CS042',
    markedAt: '2024-02-05T10:01:50Z',
    status: 'present',
    source: 'qr_scan',
    verified: true
  }
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  {
    id: 'slot_1',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    courseCode: 'CS301',
    courseName: 'Distributed Systems & Cloud Computing',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: 'Hall 302',
    semester: '6th Semester',
    department: 'Computer Science & Engineering'
  },
  {
    id: 'slot_2',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs304',
    courseCode: 'CS304',
    courseName: 'Advanced Database Systems',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    dayOfWeek: 'Monday',
    startTime: '11:15',
    endTime: '12:15',
    room: 'Lab 4',
    semester: '6th Semester',
    department: 'Computer Science & Engineering'
  },
  {
    id: 'slot_3',
    organizationId: 'org_apex_tech',
    courseId: 'course_ai202',
    courseCode: 'AI202',
    courseName: 'Machine Learning & Neural Foundations',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    dayOfWeek: 'Tuesday',
    startTime: '10:00',
    endTime: '11:00',
    room: 'Hall 105',
    semester: '6th Semester',
    department: 'Computer Science & Engineering'
  },
  {
    id: 'slot_4',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs301',
    courseCode: 'CS301',
    courseName: 'Distributed Systems & Cloud Computing',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    dayOfWeek: 'Wednesday',
    startTime: '09:00',
    endTime: '10:00',
    room: 'Hall 302',
    semester: '6th Semester',
    department: 'Computer Science & Engineering'
  },
  {
    id: 'slot_5',
    organizationId: 'org_apex_tech',
    courseId: 'course_cs304',
    courseCode: 'CS304',
    courseName: 'Advanced Database Systems',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    dayOfWeek: 'Thursday',
    startTime: '14:00',
    endTime: '15:00',
    room: 'Seminar Room B',
    semester: '6th Semester',
    department: 'Computer Science & Engineering'
  },
  {
    id: 'slot_6',
    organizationId: 'org_apex_tech',
    courseId: 'course_ai202',
    courseCode: 'AI202',
    courseName: 'Machine Learning & Neural Foundations',
    teacherId: 'teacher_prof_sharma',
    teacherName: 'Dr. Alok Sharma',
    dayOfWeek: 'Friday',
    startTime: '11:15',
    endTime: '12:15',
    room: 'Hall 105',
    semester: '6th Semester',
    department: 'Computer Science & Engineering'
  }
];
