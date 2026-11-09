import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Building, 
  Layers, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Sparkles, 
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { YearOfStudy } from '../../types';

interface DeptDraft {
  name: string;
  code: string;
  hodName?: string;
  hodEmail?: string;
}

interface DivDraft {
  departmentCode: string;
  yearOfStudy: YearOfStudy;
  name: string;
  classTeacherName?: string;
  roomNumber?: string;
}

interface FacultyDraft {
  fullName: string;
  email: string;
  facultyId: string;
  departmentCode: string;
}

interface StudentDraft {
  fullName: string;
  email: string;
  rollNo: string;
  departmentCode: string;
  yearOfStudy: YearOfStudy;
  divisionName: string;
}

const DEFAULT_ENGINEERING_DEPTS: DeptDraft[] = [
  { name: 'Computer Engineering', code: 'COMP', hodName: 'Dr. Alok Sharma', hodEmail: 'alok.sharma@college.edu' },
  { name: 'Information Technology', code: 'IT', hodName: 'Dr. Sunita Mehta', hodEmail: 'sunita.mehta@college.edu' },
  { name: 'Mechanical Engineering', code: 'MECH', hodName: 'Dr. Arvind Deshmukh', hodEmail: 'arvind.d@college.edu' },
  { name: 'Electronics & Telecommunication', code: 'ENTC', hodName: 'Dr. Sneha Verma', hodEmail: 'sneha.v@college.edu' },
  { name: 'Civil Engineering', code: 'CIVIL', hodName: 'Dr. Manoj Patil', hodEmail: 'manoj.p@college.edu' },
];

const YEARS_OF_STUDY: YearOfStudy[] = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year'
];

export const InstituteOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { createOrganizationAndRegisterAdmin, currentOrg, currentUser } = useAuth();
  const { completeInstituteOnboarding } = useData();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1: Institute & Admin Account
  const [instName, setInstName] = useState(currentOrg?.name || 'Trinity College Of Engineering And Research');
  const [instCode, setInstCode] = useState(currentOrg?.code || 'TCOER25');
  const [instCity, setInstCity] = useState(currentOrg?.city || 'Pune');
  const [instAddress, setInstAddress] = useState(currentOrg?.address || 'Near Bopdev Ghat, Saswad Road, Kondhwa Annex, Pune 411048');
  const [instPhone, setInstPhone] = useState(currentOrg?.contactPhone || '+91 20 2693 4422');
  const [academicYear, setAcademicYear] = useState('2026–27');
  
  const [adminName, setAdminName] = useState(currentUser?.fullName || 'Dr. Abhijeet Auti');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || 'principal.tcoer@college.edu');
  const [adminPass, setAdminPass] = useState('Password@123');
  const [adminDirectorId, setAdminDirectorId] = useState('DIR-01');

  // STEP 2: Departments
  const [departments, setDepartments] = useState<DeptDraft[]>(DEFAULT_ENGINEERING_DEPTS);
  const [customDeptName, setCustomDeptName] = useState('');
  const [customDeptCode, setCustomDeptCode] = useState('');

  // STEP 3: Academic Years & Divisions Matrix
  const [divisions, setDivisions] = useState<DivDraft[]>([
    { departmentCode: 'COMP', yearOfStudy: 'Third Year', name: 'Division A', roomNumber: 'Hall 301', classTeacherName: 'Dr. Alok Sharma' },
    { departmentCode: 'COMP', yearOfStudy: 'Third Year', name: 'Division B', roomNumber: 'Hall 302', classTeacherName: 'Prof. Priya Iyer' },
    { departmentCode: 'COMP', yearOfStudy: 'Second Year', name: 'Division A', roomNumber: 'Hall 201', classTeacherName: 'Prof. Vikram Joshi' },
    { departmentCode: 'IT', yearOfStudy: 'Third Year', name: 'Division A', roomNumber: 'Lab 4', classTeacherName: 'Prof. Ananya Roy' },
    { departmentCode: 'MECH', yearOfStudy: 'Third Year', name: 'Division A', roomNumber: 'Workshop 1', classTeacherName: 'Dr. Arvind Deshmukh' },
  ]);

  const [activeDeptFilter, setActiveDeptFilter] = useState('COMP');

  // STEP 4: Faculty Roster
  const [facultyList, setFacultyList] = useState<FacultyDraft[]>([
    { fullName: 'Dr. Alok Sharma', email: 'alok.sharma@college.edu', facultyId: 'FAC-COMP-01', departmentCode: 'COMP' },
    { fullName: 'Prof. Priya Iyer', email: 'priya.i@college.edu', facultyId: 'FAC-COMP-02', departmentCode: 'COMP' },
    { fullName: 'Prof. Vikram Joshi', email: 'vikram.j@college.edu', facultyId: 'FAC-COMP-03', departmentCode: 'COMP' },
    { fullName: 'Prof. Ananya Roy', email: 'ananya.r@college.edu', facultyId: 'FAC-IT-01', departmentCode: 'IT' },
    { fullName: 'Dr. Arvind Deshmukh', email: 'arvind.d@college.edu', facultyId: 'FAC-MECH-01', departmentCode: 'MECH' },
  ]);

  const [newFacName, setNewFacName] = useState('');
  const [newFacEmail, setNewFacEmail] = useState('');
  const [newFacId, setNewFacId] = useState('');
  const [newFacDept, setNewFacDept] = useState('COMP');

  // STEP 5: Students & Bulk CSV
  const [studentsList, setStudentsList] = useState<StudentDraft[]>([
    { fullName: 'Aarav Patel', rollNo: '42', email: 'aarav.cs22@college.edu', departmentCode: 'COMP', yearOfStudy: 'Third Year', divisionName: 'Division A' },
    { fullName: 'Diya Sharma', rollNo: '18', email: 'diya.s@college.edu', departmentCode: 'COMP', yearOfStudy: 'Third Year', divisionName: 'Division A' },
    { fullName: 'Rohan Verma', rollNo: '88', email: 'rohan.cs22@college.edu', departmentCode: 'COMP', yearOfStudy: 'Third Year', divisionName: 'Division B' },
    { fullName: 'Snehal Kulkarni', rollNo: '24', email: 'snehal.k@college.edu', departmentCode: 'COMP', yearOfStudy: 'Second Year', divisionName: 'Division A' },
    { fullName: 'Aditya Patil', rollNo: '12', email: 'aditya.p@college.edu', departmentCode: 'IT', yearOfStudy: 'Third Year', divisionName: 'Division A' },
  ]);

  const [targetDivForStudent, setTargetDivForStudent] = useState<number>(0);
  const [csvText, setCsvText] = useState('');
  const [csvParsedNotice, setCsvParsedNotice] = useState<string | null>(null);

  // Manual student add state
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentRoll, setManualStudentRoll] = useState('');
  const [manualStudentEmail, setManualStudentEmail] = useState('');

  // Step names
  const steps = [
    { number: 1, title: 'Institute & Admin', desc: 'Root details & director account' },
    { number: 2, title: 'Departments', desc: 'Academic disciplines' },
    { number: 3, title: 'Years & Divisions', desc: 'Classrooms and sections' },
    { number: 4, title: 'Faculty Allocation', desc: 'Teachers & class teachers' },
    { number: 5, title: 'Student Roster', desc: 'Roll numbers & CSV bulk upload' },
    { number: 6, title: 'Hierarchy Tree & Launch', desc: 'Visual review & activation' }
  ];

  // Handlers
  const handleAddCustomDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDeptName.trim() || !customDeptCode.trim()) return;
    const code = customDeptCode.trim().toUpperCase();
    if (departments.some(d => d.code === code)) {
      setErrorMsg(`Department with code ${code} already exists.`);
      return;
    }
    setDepartments(prev => [...prev, { name: customDeptName.trim(), code }]);
    setCustomDeptName('');
    setCustomDeptCode('');
    setErrorMsg(null);
  };

  const handleRemoveDept = (code: string) => {
    setDepartments(prev => prev.filter(d => d.code !== code));
    setDivisions(prev => prev.filter(d => d.departmentCode !== code));
    setFacultyList(prev => prev.filter(f => f.departmentCode !== code));
    setStudentsList(prev => prev.filter(s => s.departmentCode !== code));
  };

  const handleAddDivision = (deptCode: string, year: YearOfStudy) => {
    const existingInYear = divisions.filter(d => d.departmentCode === deptCode && d.yearOfStudy === year);
    const nextLetter = String.fromCharCode(65 + existingInYear.length); // A, B, C...
    const newDivName = `Division ${nextLetter}`;
    setDivisions(prev => [
      ...prev,
      {
        departmentCode: deptCode,
        yearOfStudy: year,
        name: newDivName,
        roomNumber: `Hall ${100 + existingInYear.length + 1}`
      }
    ]);
  };

  const handleRemoveDivision = (deptCode: string, year: YearOfStudy, name: string) => {
    setDivisions(prev => prev.filter(d => !(d.departmentCode === deptCode && d.yearOfStudy === year && d.name === name)));
  };

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim() || !newFacEmail.trim()) return;
    setFacultyList(prev => [
      ...prev,
      {
        fullName: newFacName.trim(),
        email: newFacEmail.trim(),
        facultyId: newFacId.trim() || `FAC-${newFacDept}-${prev.length + 1}`,
        departmentCode: newFacDept
      }
    ]);
    setNewFacName('');
    setNewFacEmail('');
    setNewFacId('');
  };

  const handleAddManualStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const selDiv = divisions[targetDivForStudent];
    if (!selDiv) return;
    if (!manualStudentName.trim() || !manualStudentRoll.trim()) return;

    setStudentsList(prev => [
      ...prev,
      {
        fullName: manualStudentName.trim(),
        rollNo: manualStudentRoll.trim(),
        email: manualStudentEmail.trim() || `student${manualStudentRoll.trim()}@college.edu`,
        departmentCode: selDiv.departmentCode,
        yearOfStudy: selDiv.yearOfStudy,
        divisionName: selDiv.name
      }
    ]);
    setManualStudentName('');
    setManualStudentRoll('');
    setManualStudentEmail('');
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const selDiv = divisions[targetDivForStudent];
    if (!selDiv) return;

    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: StudentDraft[] = [];

    lines.forEach((line, idx) => {
      // Ignore header row if present
      if (idx === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('roll'))) {
        return;
      }
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const [name, roll, mail] = parts;
        parsed.push({
          fullName: name,
          rollNo: roll,
          email: mail || `student_${roll.toLowerCase()}@college.edu`,
          departmentCode: selDiv.departmentCode,
          yearOfStudy: selDiv.yearOfStudy,
          divisionName: selDiv.name
        });
      }
    });

    if (parsed.length > 0) {
      setStudentsList(prev => [...prev, ...parsed]);
      setCsvParsedNotice(`Successfully parsed and added ${parsed.length} students to ${selDiv.departmentCode} - ${selDiv.yearOfStudy} (${selDiv.name})!`);
      setCsvText('');
      setTimeout(() => setCsvParsedNotice(null), 4000);
    } else {
      setErrorMsg('No valid rows found. Please use format: Full Name, Roll Number, Email');
    }
  };

  const handleLaunchInstitute = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create Organization & Primary Admin Profile
      const cleanCode = instCode.trim().toUpperCase();
      const res = await createOrganizationAndRegisterAdmin(
        instName.trim(),
        cleanCode,
        instCity.trim(),
        adminEmail.trim(),
        adminPass,
        adminName.trim(),
        departments[0]?.name || 'Engineering',
        adminDirectorId
      );

      if (!res.success && res.error && !res.error.includes('already registered')) {
        setErrorMsg(res.error);
        setSubmitting(false);
        return;
      }

      // 2. Batch Persist Academic Hierarchy: Departments, Divisions, Faculty, Students
      await completeInstituteOnboarding({
        institute: {
          name: instName.trim(),
          code: cleanCode,
          city: instCity.trim(),
          address: instAddress.trim(),
          contactPhone: instPhone.trim(),
          adminEmail: adminEmail.trim(),
          adminName: adminName.trim(),
          currentAcademicYear: academicYear
        },
        departments,
        divisions,
        faculty: facultyList,
        students: studentsList
      });

      // Redirect directly to the Institute Admin Console!
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            EDUCATIONAL INSTITUTION ONBOARDING WIZARD
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy-900">
            Setup Your Institute Hierarchy
          </h1>
          <p className="text-xs text-navy-600 max-w-xl mx-auto">
            Configure your college root, academic years, departments, classes, divisions, faculty, and student rosters in a simple guided flow.
          </p>
        </div>

        {/* Multi-Step Stepper Progress Bar */}
        <div className="bg-surface rounded-xl border border-warm-300 p-4 shadow-subtle">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {steps.map((s) => {
              const isPassed = currentStep > s.number;
              const isCurrent = currentStep === s.number;

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => s.number < currentStep && setCurrentStep(s.number)}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    isCurrent 
                      ? 'bg-teal-50/70 border-primary ring-1 ring-primary' 
                      : isPassed 
                        ? 'bg-warm-100/70 border-warm-300 text-navy-900 cursor-pointer' 
                        : 'bg-warm-50/40 border-warm-200 text-navy-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isCurrent 
                        ? 'bg-primary text-white' 
                        : isPassed 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-warm-200 text-navy-600'
                    }`}>
                      {isPassed ? '✓' : s.number}
                    </span>
                    <span className="text-[11px] font-bold text-navy-900 truncate">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-navy-500 truncate hidden md:block">
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP CONTENT CONTAINER */}
        <div className="bg-surface rounded-2xl border border-warm-300 shadow-card p-6 sm:p-9 space-y-6">

          {/* ======================================================== */}
          {/* STEP 1: INSTITUTE ROOT & ADMIN CREDENTIALS              */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3">
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">LEVEL 1: ROOT ENTITY</span>
                <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Institute Profile & Primary Administrator
                </h2>
                <p className="text-xs text-navy-600 mt-1">
                  The Institute is the top-level entity. The primary Institute Admin holds master control over all departments, faculty, and student rosters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 font-mono">
                    Institute Details
                  </h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Institute / University Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={instName}
                      onChange={e => setInstName(e.target.value)}
                      placeholder="e.g. Trinity College Of Engineering And Research"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                        Unique Join Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={instCode}
                        onChange={e => setInstCode(e.target.value.toUpperCase())}
                        placeholder="e.g. TCOER25"
                        className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono font-bold uppercase bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                        Current Academic Year *
                      </label>
                      <input
                        type="text"
                        required
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        placeholder="e.g. 2026–27"
                        className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono font-bold bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Campus City / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={instCity}
                      onChange={e => setInstCity(e.target.value)}
                      placeholder="e.g. Pune"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Campus Full Address
                    </label>
                    <input
                      type="text"
                      value={instAddress}
                      onChange={e => setInstAddress(e.target.value)}
                      placeholder="e.g. Saswad Road, Kondhwa Annex, Pune 411048"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-warm-50 p-4 rounded-xl border border-warm-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Primary Institute Admin Account
                  </h3>
                  <p className="text-[11px] text-navy-600">
                    This account will be the Director / Principal with full control over all divisions, faculty, and timetables.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      placeholder="e.g. Dr. Abhijeet Auti (Principal)"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                        Director / Admin ID
                      </label>
                      <input
                        type="text"
                        value={adminDirectorId}
                        onChange={e => setAdminDirectorId(e.target.value)}
                        placeholder="DIR-01"
                        className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={instPhone}
                        onChange={e => setInstPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Admin Email (Login ID) *
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="principal@college.edu"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Account Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={adminPass}
                      onChange={e => setAdminPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: DEPARTMENT SETUP                                */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">LEVEL 2: ACADEMIC DIVISIONS</span>
                  <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Institute Departments ({departments.length})
                  </h2>
                  <p className="text-xs text-navy-600 mt-1">
                    Each department has its own faculty roster, academic years, and student divisions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDepartments(DEFAULT_ENGINEERING_DEPTS)}
                  className="px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors shrink-0"
                >
                  Reset to Standard 5 Engineering Depts
                </button>
              </div>

              {/* Add Custom Department Form */}
              <form onSubmit={handleAddCustomDept} className="p-3.5 rounded-xl bg-warm-100 border border-warm-300 flex flex-col md:flex-row gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder="Department Name (e.g. Artificial Intelligence & Data Science)"
                  value={customDeptName}
                  onChange={e => setCustomDeptName(e.target.value)}
                  className="flex-1 w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (e.g. AIDS)"
                  value={customDeptCode}
                  onChange={e => setCustomDeptCode(e.target.value.toUpperCase())}
                  className="w-full md:w-32 px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono font-bold uppercase bg-white text-navy-900 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="w-full md:w-auto px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5 shadow-subtle shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Department
                </button>
              </form>

              {/* Departments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept) => (
                  <div key={dept.code} className="p-4 rounded-xl bg-white border border-warm-300 shadow-subtle flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-navy-100 text-navy-800">
                          {dept.code}
                        </span>
                        <h4 className="text-sm font-bold text-navy-900">{dept.name}</h4>
                      </div>
                      <p className="text-[11px] text-navy-500 mt-1 font-mono">
                        HOD: {dept.hodName || 'Not Assigned Yet'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDept(dept.code)}
                      className="p-1.5 text-navy-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: ACADEMIC YEARS & DIVISIONS MATRIX                */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3">
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">LEVEL 3 & 4: CLASSES & DIVISIONS</span>
                <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Academic Years & Division Structure
                </h2>
                <p className="text-xs text-navy-600 mt-1">
                  Every year of study (FE, SE, TE, BE) contains multiple independent divisions. Each division has its own timetable, student roster, and assigned class teacher.
                </p>
              </div>

              {/* Department Selector Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-warm-200">
                {departments.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => setActiveDeptFilter(d.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      activeDeptFilter === d.code
                        ? 'bg-navy-900 text-white shadow-subtle'
                        : 'bg-warm-100 text-navy-700 hover:bg-warm-200'
                    }`}
                  >
                    {d.name} ({d.code})
                  </button>
                ))}
              </div>

              {/* Year-by-Year Division Breakdown for active department */}
              <div className="space-y-4">
                {YEARS_OF_STUDY.map((year) => {
                  const yearDivs = divisions.filter(
                    d => d.departmentCode === activeDeptFilter && d.yearOfStudy === year
                  );

                  return (
                    <div key={year} className="p-4 rounded-xl bg-warm-50 border border-warm-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 font-mono">
                            {year}
                          </h4>
                          <span className="text-[11px] text-navy-500 font-mono">
                            ({yearDivs.length} Divisions Active)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddDivision(activeDeptFilter, year)}
                          className="px-2.5 py-1 bg-white border border-warm-300 hover:border-primary text-primary rounded-md text-xs font-semibold flex items-center gap-1 shadow-subtle transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Division
                        </button>
                      </div>

                      {/* Division Chips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {yearDivs.map((div) => (
                          <div key={div.name} className="p-3 bg-white rounded-lg border border-warm-300 shadow-subtle flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-navy-900">{div.name}</p>
                              <p className="text-[10px] text-navy-500 font-mono">
                                Room: {div.roomNumber || 'TBD'} &bull; Teacher: {div.classTeacherName || 'Unassigned'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDivision(activeDeptFilter, year, div.name)}
                              className="text-navy-400 hover:text-red-600 p-1"
                              title="Remove division"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {yearDivs.length === 0 && (
                          <p className="text-[11px] text-navy-400 italic py-1 col-span-full">
                            No divisions set for {year} yet. Click &quot;Add Division&quot; above to create Division A, B, etc.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: FACULTY ALLOCATION & CLASS TEACHERS              */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3">
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">LEVEL 5: TEACHING STAFF</span>
                <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Faculty Roster & Class Teacher Assignments
                </h2>
                <p className="text-xs text-navy-600 mt-1">
                  Onboard professors into their respective departments and assign them as Class Teachers for divisions.
                </p>
              </div>

              {/* Add Faculty Form */}
              <form onSubmit={handleAddFaculty} className="p-4 rounded-xl bg-warm-100 border border-warm-300 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-navy-700 mb-1">Professor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Gupta"
                    value={newFacName}
                    onChange={e => setNewFacName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-warm-300 rounded-md text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh.g@college.edu"
                    value={newFacEmail}
                    onChange={e => setNewFacEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-warm-300 rounded-md text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-navy-700 mb-1">Department</label>
                  <select
                    value={newFacDept}
                    onChange={e => setNewFacDept(e.target.value)}
                    className="w-full px-3 py-1.5 border border-warm-300 rounded-md text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                  >
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 text-white rounded-md text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5 shadow-subtle"
                >
                  <Plus className="h-4 w-4" />
                  Add Faculty
                </button>
              </form>

              {/* Faculty Table with Division Assignment */}
              <div className="bg-white rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-100 font-mono text-[10px] text-navy-700 uppercase border-b border-warm-300">
                    <tr>
                      <th className="px-4 py-2.5">Faculty Name</th>
                      <th className="px-4 py-2.5">Department</th>
                      <th className="px-4 py-2.5">Assigned Class Teacher Role</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200">
                    {facultyList.map((f, idx) => (
                      <tr key={idx} className="hover:bg-warm-50/60">
                        <td className="px-4 py-2.5 font-bold text-navy-900">{f.fullName}</td>
                        <td className="px-4 py-2.5 font-mono text-navy-700">
                          <span className="px-2 py-0.5 rounded bg-warm-200 text-navy-800 font-bold">
                            {f.departmentCode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            onChange={(e) => {
                              const chosenDivIndex = parseInt(e.target.value, 10);
                              if (!isNaN(chosenDivIndex)) {
                                setDivisions(prev => prev.map((d, i) => 
                                  i === chosenDivIndex ? { ...d, classTeacherName: f.fullName } : d
                                ));
                              }
                            }}
                            className="px-2 py-1 border border-warm-300 rounded text-[11px] bg-white text-navy-900 focus:outline-none focus:border-primary"
                          >
                            <option value="">Assign as Class Teacher...</option>
                            {divisions
                              .filter(d => d.departmentCode === f.departmentCode)
                              .map((d, dIdx) => (
                                <option key={dIdx} value={dIdx}>
                                  {d.yearOfStudy} - {d.name}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-navy-600">{f.email}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setFacultyList(prev => prev.filter((_, i) => i !== idx))}
                            className="text-navy-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: STUDENT ROSTER & BULK CSV UPLOAD                 */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">LEVEL 6: STUDENT ROSTER</span>
                  <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Student Enrollment & Bulk CSV Upload
                  </h2>
                  <p className="text-xs text-navy-600 mt-1">
                    Add students directly into their specific division, or use the bulk upload tool below.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-navy-700">Target Division:</span>
                  <select
                    value={targetDivForStudent}
                    onChange={e => setTargetDivForStudent(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 border border-primary rounded-lg text-xs font-mono font-bold bg-teal-50 text-teal-900 focus:outline-none"
                  >
                    {divisions.map((d, idx) => (
                      <option key={idx} value={idx}>
                        {d.departmentCode} &bull; {d.yearOfStudy} &bull; {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk CSV Box */}
              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>Bulk Upload via CSV / Excel Text</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText("Aarav Joshi, 01, aarav.j@college.edu\nNeha Patil, 02, neha.p@college.edu\nSiddharth Rao, 03, siddharth.r@college.edu\nPooja Kulkarni, 04, pooja.k@college.edu");
                    }}
                    className="text-[10px] font-mono text-primary hover:underline"
                  >
                    Insert Sample 4 Students
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder="Paste rows: Full Name, Roll Number, Email&#10;e.g. John Doe, 22CS001, john@college.edu"
                  className="w-full p-2.5 border border-warm-300 rounded-lg text-xs font-mono bg-white text-navy-900 focus:outline-none focus:border-primary"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-teal-800">
                    Format: <code>Student Name, Roll Number, Email</code> (one per line)
                  </span>
                  <button
                    type="button"
                    onClick={handleParseCsv}
                    className="px-4 py-1.5 bg-primary text-white rounded-md text-xs font-semibold hover:bg-teal-700 transition-colors shadow-subtle"
                  >
                    Import Students to Division
                  </button>
                </div>

                {csvParsedNotice && (
                  <div className="p-2.5 rounded bg-emerald-100 text-emerald-900 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>{csvParsedNotice}</span>
                  </div>
                )}
              </div>

              {/* Single Student Manual Quick-Add */}
              <form onSubmit={handleAddManualStudent} className="p-3 bg-warm-100 rounded-lg border border-warm-300 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-navy-700 mb-0.5">Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={manualStudentName}
                    onChange={e => setManualStudentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-warm-300 rounded text-xs bg-white text-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-navy-700 mb-0.5">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 45"
                    value={manualStudentRoll}
                    onChange={e => setManualStudentRoll(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-warm-300 rounded text-xs font-mono bg-white text-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-navy-700 mb-0.5">Email</label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={manualStudentEmail}
                    onChange={e => setManualStudentEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-warm-300 rounded text-xs bg-white text-navy-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-navy-900 text-white rounded text-xs font-semibold hover:bg-navy-800"
                >
                  Add Student
                </button>
              </form>

              {/* Current Student Roster Preview */}
              <div className="bg-white rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
                <div className="px-4 py-2.5 bg-warm-50 border-b border-warm-300 flex justify-between items-center text-xs">
                  <span className="font-bold text-navy-900 font-mono">
                    Total Enrolled Students ({studentsList.length})
                  </span>
                  <span className="text-[10px] text-navy-500 font-mono">
                    Students will be mapped to division attendance logs
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-warm-200 text-xs">
                  {studentsList.map((s, idx) => (
                    <div key={idx} className="px-4 py-2 flex items-center justify-between hover:bg-warm-50/60">
                      <div className="flex items-center gap-3">
                        <span className="w-8 font-mono font-bold text-navy-600 text-[11px]">
                          #{s.rollNo}
                        </span>
                        <div>
                          <p className="font-bold text-navy-900">{s.fullName}</p>
                          <p className="text-[10px] text-navy-500 font-mono">
                            {s.departmentCode} &bull; {s.yearOfStudy} &bull; {s.divisionName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-navy-500">{s.email}</span>
                        <button
                          type="button"
                          onClick={() => setStudentsList(prev => prev.filter((_, i) => i !== idx))}
                          className="text-navy-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 6: VISUAL HIERARCHY TREE & LAUNCH                   */}
          {/* ======================================================== */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3">
                <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold tracking-wider">LEVEL 7: HIERARCHY VERIFICATION</span>
                <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Visual Institutional Organizational Tree
                </h2>
                <p className="text-xs text-navy-600 mt-1">
                  Review the complete organizational breakdown of your college before publishing into production.
                </p>
              </div>

              {/* Visual Tree Component */}
              <div className="p-6 rounded-xl bg-warm-100/60 border border-warm-300 space-y-6">
                {/* Root Institute Node */}
                <div className="p-4 rounded-xl bg-navy-900 text-white shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-warm-800 px-1.5 py-0.2 rounded text-primary-light">
                          INSTITUTE ROOT
                        </span>
                        <span className="font-mono text-xs text-amber-300 font-bold">
                          CODE: {instCode}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{instName}</h3>
                      <p className="text-[11px] text-warm-300">
                        Director / Admin: {adminName} ({adminEmail}) &bull; Academic Year: {academicYear}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded bg-navy-800 text-xs font-mono text-warm-100">
                      {departments.length} Departments
                    </span>
                    <span className="px-2.5 py-1 rounded bg-navy-800 text-xs font-mono text-teal-300">
                      {divisions.length} Divisions
                    </span>
                  </div>
                </div>

                {/* Departments Sub-tree */}
                <div className="space-y-4 pl-4 md:pl-8 border-l-2 border-primary/40">
                  {departments.map((dept) => {
                    const deptDivs = divisions.filter(d => d.departmentCode === dept.code);
                    const deptFaculty = facultyList.filter(f => f.departmentCode === dept.code);
                    const deptStudents = studentsList.filter(s => s.departmentCode === dept.code);

                    return (
                      <div key={dept.code} className="p-4 rounded-xl bg-white border border-warm-300 shadow-subtle space-y-3">
                        <div className="flex items-center justify-between border-b border-warm-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-navy-100 text-navy-800">
                              {dept.code}
                            </span>
                            <h4 className="text-sm font-bold text-navy-900">{dept.name}</h4>
                            <span className="text-[11px] text-navy-500 font-mono">
                              HOD: {dept.hodName || 'Assigned via Portal'}
                            </span>
                          </div>

                          <div className="flex gap-1.5 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-warm-100 text-navy-700">
                              {deptFaculty.length} Faculty
                            </span>
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold">
                              {deptStudents.length} Students
                            </span>
                          </div>
                        </div>

                        {/* Divisions under this Department */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {deptDivs.map((div, dIdx) => {
                            const divStudents = deptStudents.filter(s => s.yearOfStudy === div.yearOfStudy && s.divisionName === div.name);

                            return (
                              <div key={dIdx} className="p-2.5 rounded-lg bg-warm-50 border border-warm-200 text-xs flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-navy-900">
                                    {div.yearOfStudy} &bull; {div.name}
                                  </p>
                                  <p className="text-[10px] text-navy-500 font-mono">
                                    Class Teacher: {div.classTeacherName || 'To Be Assigned'}
                                  </p>
                                </div>
                                <span className="font-mono text-[11px] font-bold text-primary px-2 py-0.5 bg-white rounded border border-warm-300">
                                  {divStudents.length} Students
                                </span>
                              </div>
                            );
                          })}

                          {deptDivs.length === 0 && (
                            <p className="text-[11px] text-navy-400 italic py-1 col-span-full">
                              No divisions allocated for this department.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ready to Publish Info */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Ready to Initialize Educational Portal</p>
                  <p className="text-[11px] leading-relaxed">
                    Clicking <strong>&quot;Publish &amp; Launch Institute&quot;</strong> will establish your Institute hierarchy in production, create the master admin account for <strong>{adminEmail}</strong>, and unlock the live interactive dashboards for departments, faculty, and students.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEPPER NAVIGATION BUTTONS                              */}
          {/* ======================================================== */}
          <div className="border-t border-warm-200 pt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => { setCurrentStep(prev => prev - 1); setErrorMsg(null); }}
                className="px-4 py-2.5 min-h-[44px] border border-warm-300 rounded-lg text-xs font-semibold text-navy-700 hover:bg-warm-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              {currentStep < 6 && (
                <button
                  type="button"
                  onClick={() => { setCurrentStep(prev => prev + 1); setErrorMsg(null); }}
                  className="px-3 py-2 text-navy-500 hover:text-navy-900 text-xs font-semibold transition-colors text-center"
                >
                  Skip this step for now &rarr;
                </button>
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1 && (!instName.trim() || !instCode.trim() || !adminEmail.trim())) {
                      setErrorMsg('Please fill in institute name, unique join code, and administrator credentials.');
                      return;
                    }
                    setErrorMsg(null);
                    setCurrentStep(prev => prev + 1);
                  }}
                  className="px-5 py-2.5 min-h-[44px] bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-all shadow-subtle flex items-center justify-center gap-2"
                >
                  <span>Save &amp; Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleLaunchInstitute}
                  className="px-6 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{submitting ? 'Initializing Institute...' : 'Publish & Launch Institute'}</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

