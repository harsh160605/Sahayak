import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Building, 
  Layers, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Key, 
  AlertCircle,
  Mail,
  UserCheck
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

const DEFAULT_ENGINEERING_DEPTS: DeptDraft[] = [
  { name: 'Computer Engineering', code: 'COMP', hodName: 'Dr. Alok Sharma', hodEmail: 'alok.sharma@college.edu' },
  { name: 'Information Technology', code: 'IT', hodName: 'Dr. Sunita Mehta', hodEmail: 'sunita.mehta@college.edu' },
  { name: 'Mechanical Engineering', code: 'MECH', hodName: 'Dr. Arvind Deshmukh', hodEmail: 'arvind.d@college.edu' },
  { name: 'Electronics & Telecommunication', code: 'ENTC', hodName: 'Dr. Sneha Verma', hodEmail: 'sneha.v@college.edu' },
  { name: 'Civil Engineering', code: 'CIVIL', hodName: 'Dr. Manoj Patil', hodEmail: 'manoj.p@college.edu' },
];

export const InstituteOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { createOrganizationAndRegisterAdmin, currentOrg, currentUser } = useAuth();
  const { completeInstituteOnboarding } = useData();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  // STEP 2: Departments & HOD Allocation
  const [departments, setDepartments] = useState<DeptDraft[]>(DEFAULT_ENGINEERING_DEPTS);
  const [customDeptName, setCustomDeptName] = useState('');
  const [customDeptCode, setCustomDeptCode] = useState('');
  const [customHodName, setCustomHodName] = useState('');
  const [customHodEmail, setCustomHodEmail] = useState('');

  // 3-Step Guided Flow
  const steps = [
    { number: 1, title: 'Institute & Principal', desc: 'Root entity & administrator credentials' },
    { number: 2, title: 'Departments & HODs', desc: 'Select disciplines & assign department heads' },
    { number: 3, title: 'Access Keys & Launch', desc: 'Generate department keys & launch live portal' }
  ];

  // Department Handlers
  const handleAddCustomDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDeptName.trim() || !customDeptCode.trim()) return;
    const code = customDeptCode.trim().toUpperCase();
    if (departments.some(d => d.code === code)) {
      setErrorMsg(`Department with code ${code} already exists.`);
      return;
    }
    setDepartments(prev => [
      ...prev, 
      { 
        name: customDeptName.trim(), 
        code, 
        hodName: customHodName.trim() || undefined, 
        hodEmail: customHodEmail.trim() || undefined 
      }
    ]);
    setCustomDeptName('');
    setCustomDeptCode('');
    setCustomHodName('');
    setCustomHodEmail('');
    setErrorMsg(null);
  };

  const handleUpdateDeptHod = (code: string, hodName: string, hodEmail: string) => {
    setDepartments(prev => prev.map(d => d.code === code ? { ...d, hodName, hodEmail } : d));
  };

  const handleRemoveDept = (code: string) => {
    if (departments.length <= 1) {
      setErrorMsg('An institute must have at least one department.');
      return;
    }
    setDepartments(prev => prev.filter(d => d.code !== code));
    setErrorMsg(null);
  };

  const handleCopyKey = (keyString: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKey(keyString);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Launch Institute Execution
  const handleLaunchInstitute = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanCode = instCode.trim().toUpperCase();
      
      // 1. Create Organization & Primary Admin Profile
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

      // 2. Automatically generate clean division shells (SE-A, TE-A, BE-A) for each department
      // with NO dummy teachers or students. HOD assigns teachers when faculty actually join!
      const standardDivisions: DivDraft[] = [];
      departments.forEach(dept => {
        standardDivisions.push(
          { departmentCode: dept.code, yearOfStudy: 'Second Year', name: 'Division A', roomNumber: 'Hall 201' },
          { departmentCode: dept.code, yearOfStudy: 'Third Year', name: 'Division A', roomNumber: 'Hall 301' },
          { departmentCode: dept.code, yearOfStudy: 'Fourth Year', name: 'Division A', roomNumber: 'Hall 401' }
        );
      });

      // 3. Batch persist clean academic hierarchy
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
        divisions: standardDivisions,
        faculty: [],
        students: []
      });

      // Redirect directly to the Admin / HOD Console
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            EDUCATIONAL INSTITUTION ONBOARDING
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900">
            Setup Your College &amp; Departments
          </h1>
          <p className="text-xs text-navy-600 max-w-xl mx-auto">
            Establish your institute root and departments in under 2 minutes. Department HODs then independently assign class teachers and allocate subjects when faculty register.
          </p>
        </div>

        {/* 3-Step Stepper Progress Bar */}
        <div className="bg-surface rounded-xl border border-warm-300 p-3.5 shadow-subtle">
          <div className="grid grid-cols-3 gap-2">
            {steps.map((s) => {
              const isPassed = currentStep > s.number;
              const isCurrent = currentStep === s.number;

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => s.number < currentStep && setCurrentStep(s.number)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isCurrent 
                      ? 'bg-teal-50/70 border-primary ring-1 ring-primary' 
                      : isPassed 
                        ? 'bg-warm-100/70 border-warm-300 text-navy-900 cursor-pointer' 
                        : 'bg-warm-50/40 border-warm-200 text-navy-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      isCurrent 
                        ? 'bg-primary text-white' 
                        : isPassed 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-warm-200 text-navy-600'
                    }`}>
                      {isPassed ? '✓' : s.number}
                    </span>
                    <span className="text-xs font-bold text-navy-900 truncate">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-navy-500 truncate hidden sm:block">
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP CONTENT CONTAINER */}
        <div className="bg-surface rounded-2xl border border-warm-300 shadow-card p-6 sm:p-8 space-y-6">

          {/* ======================================================== */}
          {/* STEP 1: INSTITUTE ROOT & PRINCIPAL ACCOUNT              */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3">
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">STAGE 1: ROOT ENTITY</span>
                <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Institute Details &amp; Principal Account
                </h2>
                <p className="text-xs text-navy-600 mt-0.5">
                  The Principal / Director holds institute governance and oversees academic departments.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: College Details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 font-mono">
                    College Information
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
                        Academic Year *
                      </label>
                      <input
                        type="text"
                        required
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        placeholder="e.g. 2026–27"
                        className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                        City / Region
                      </label>
                      <input
                        type="text"
                        value={instCity}
                        onChange={e => setInstCity(e.target.value)}
                        placeholder="e.g. Pune"
                        className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
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
                        placeholder="+91 20 2693 4422"
                        className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Campus Physical Address
                    </label>
                    <input
                      type="text"
                      value={instAddress}
                      onChange={e => setInstAddress(e.target.value)}
                      placeholder="e.g. Kondhwa Annex, Pune 411048"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
                    />
                  </div>
                </div>

                {/* Right: Principal / Master Admin */}
                <div className="space-y-3 p-4 rounded-xl bg-warm-50/60 border border-warm-300">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Principal / Director Account</span>
                  </h3>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Principal Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      placeholder="e.g. Dr. Abhijeet Auti"
                      className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-navy-700 mb-1">
                      Institutional ID / Employee Code
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
                      Principal Email (Master Login ID) *
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
          {/* STEP 2: DEPARTMENTS & HOD ASSIGNMENT                     */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">STAGE 2: ACADEMIC DISCIPLINES</span>
                  <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Departments &amp; Appointed HODs ({departments.length})
                  </h2>
                  <p className="text-xs text-navy-600 mt-0.5">
                    Each department operates autonomously. The appointed HOD will assign class teachers and distribute subjects to faculty.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDepartments(DEFAULT_ENGINEERING_DEPTS)}
                  className="px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors shrink-0"
                >
                  Reset to 5 Standard Depts
                </button>
              </div>

              {/* Add Custom Department Inline Form */}
              <form onSubmit={handleAddCustomDept} className="p-3.5 rounded-xl bg-warm-100 border border-warm-300 space-y-2">
                <span className="text-xs font-bold text-navy-800 block">Add New Department:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Department Name (e.g. AI & Data Science)"
                    value={customDeptName}
                    onChange={e => setCustomDeptName(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Code (e.g. AIDS)"
                    value={customDeptCode}
                    onChange={e => setCustomDeptCode(e.target.value.toUpperCase())}
                    className="px-3 py-2 border border-warm-300 rounded-lg text-xs font-mono font-bold uppercase bg-white text-navy-900 focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5 shadow-subtle shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Dept</span>
                  </button>
                </div>
              </form>

              {/* Department Cards with HOD Name & Email inputs */}
              <div className="space-y-3">
                {departments.map((dept) => (
                  <div key={dept.code} className="p-4 rounded-xl bg-white border border-warm-300 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 sm:w-1/3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-navy-900 text-white">
                          {dept.code}
                        </span>
                        <h4 className="text-xs font-bold text-navy-900">{dept.name}</h4>
                      </div>
                      <span className="text-[10px] text-navy-400 font-mono block">
                        Dept Key: {instCode || 'ORG'}-{dept.code}
                      </span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-navy-600 mb-0.5">Appointed HOD Name</label>
                        <input
                          type="text"
                          value={dept.hodName || ''}
                          onChange={e => handleUpdateDeptHod(dept.code, e.target.value, dept.hodEmail || '')}
                          placeholder="e.g. Dr. Alok Sharma"
                          className="w-full px-2.5 py-1.5 border border-warm-300 rounded-md text-xs bg-warm-50 text-navy-900 focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-navy-600 mb-0.5">HOD Official Email</label>
                        <input
                          type="email"
                          value={dept.hodEmail || ''}
                          onChange={e => handleUpdateDeptHod(dept.code, dept.hodName || '', e.target.value)}
                          placeholder="hod@college.edu"
                          className="w-full px-2.5 py-1.5 border border-warm-300 rounded-md text-xs font-mono bg-warm-50 text-navy-900 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDept(dept.code)}
                      className="p-2 text-navy-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors self-end sm:self-center shrink-0"
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
          {/* STEP 3: DEPARTMENT ACCESS KEYS & LAUNCH                 */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-warm-200 pb-3">
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">STAGE 3: ACCESS KEYS &amp; LAUNCH</span>
                <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Department Access Keys Ready
                </h2>
                <p className="text-xs text-navy-600 mt-0.5">
                  Share these Department Join Keys with your HODs and faculty. When teachers register with these codes, they appear on the Department Academic Desk for class teacher and subject assignments.
                </p>
              </div>

              {/* Department Keys Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departments.map((dept) => {
                  const deptKey = `${instCode.trim().toUpperCase()}-${dept.code}`;
                  const isCopied = copiedKey === deptKey;

                  return (
                    <div key={dept.code} className="p-3.5 rounded-xl border border-warm-300 bg-warm-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-navy-900 block">{dept.name}</span>
                          <span className="text-[11px] text-navy-500 font-medium">HOD: {dept.hodName || 'Pending Assignment'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-navy-100 text-navy-800">
                          {dept.code}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-surface border border-warm-300 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-navy-400 font-mono block">Department Join Code</span>
                          <span className="font-mono text-xs font-bold text-primary">{deptKey}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(deptKey)}
                          className="px-2.5 py-1 rounded bg-warm-100 hover:bg-warm-200 text-navy-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informational Guidance Callout */}
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start gap-3 text-xs text-teal-950">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Next Steps After Portal Initialization:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-teal-900">
                    <li>Send the Department Code to your HODs and faculty to register.</li>
                    <li>As faculty join, HODs assign Class Teachers to divisions from the Department Console.</li>
                    <li>Class Teachers will then share division codes (e.g. <code>COMP-TE-A</code>) with their students.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEPPER NAVIGATION BUTTONS                              */}
          {/* ======================================================== */}
          <div className="border-t border-warm-200 pt-5 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => { setCurrentStep(prev => prev - 1); setErrorMsg(null); }}
                className="px-4 py-2 min-h-[40px] border border-warm-300 rounded-lg text-xs font-semibold text-navy-700 hover:bg-warm-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1 && (!instName.trim() || !instCode.trim() || !adminEmail.trim())) {
                      setErrorMsg('Please enter Institute Name, Join Code, and Principal Email.');
                      return;
                    }
                    if (currentStep === 2 && departments.length === 0) {
                      setErrorMsg('Please configure at least one department.');
                      return;
                    }
                    setErrorMsg(null);
                    setCurrentStep(prev => prev + 1);
                  }}
                  className="px-5 py-2.5 min-h-[40px] bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-all shadow-subtle flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Save &amp; Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleLaunchInstitute}
                  className="px-6 py-2.5 min-h-[40px] bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all shadow-subtle flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{submitting ? 'Initializing Portal...' : 'Initialize Portal & Open Console'}</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
