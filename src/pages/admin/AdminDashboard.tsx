import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Building, 
  Users, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Briefcase, 
  GraduationCap, 
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  GitBranch,
  School
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { YearOfStudy } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { currentUser, currentOrg } = useAuth();
  const { 
    courses, 
    organizationUsers, 
    departments: registeredDepts,
    divisions,
    subjectAllocations,
    addDepartment, 
    removeDepartment, 
    assignFacultyDepartment, 
    removeFaculty,
    addDivision,
    deleteDivision
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'departments' | 'faculty' | 'courses'>('overview');
  
  // Department Form State
  const [newDeptInput, setNewDeptInput] = useState('');
  const [addingDept, setAddingDept] = useState(false);
  
  // Faculty Search & Reassign State
  const [facultySearch, setFacultySearch] = useState('');
  const [editingFacultyUid, setEditingFacultyUid] = useState<string | null>(null);
  const [newFacultyDept, setNewFacultyDept] = useState('');

  // Division Filter in Hierarchy
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  const orgName = currentOrg?.name || currentUser?.organizationName || 'Institute Administration';
  const orgCode = currentOrg?.code || currentUser?.organizationCode || 'APEX101';
  const orgCity = currentOrg?.city || 'Main Campus';

  const departments = currentOrg?.departments || [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  const facultyMembers = organizationUsers.filter(u => u.role === 'teacher' || u.role === 'admin');
  const studentMembers = organizationUsers.filter(u => u.role === 'student');

  const filteredFaculty = facultyMembers.filter(f => 
    f.fullName.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
    (f.facultyId && f.facultyId.toLowerCase().includes(facultySearch.toLowerCase()))
  );

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptInput.trim()) return;
    setAddingDept(true);
    await addDepartment(newDeptInput.trim());
    setNewDeptInput('');
    setAddingDept(false);
  };

  const handleSaveFacultyDept = async (facultyUid: string) => {
    if (!newFacultyDept) return;
    await assignFacultyDepartment(facultyUid, newFacultyDept);
    setEditingFacultyUid(null);
    setNewFacultyDept('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header Banner */}
      <div className="rounded-xl border border-warm-300 bg-surface p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
              INSTITUTE GOVERNANCE & ADMIN CONSOLE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
              JOIN CODE: {orgCode}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 flex items-center gap-2.5">
            <Building className="h-6 w-6 text-primary" />
            {orgName}
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Administered by {currentUser?.fullName} ({currentUser?.email}) &bull; Campus: {orgCity}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <NavLink
            to="/onboarding"
            className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <Sparkles className="h-4 w-4" />
            Launch Setup Wizard
          </NavLink>
          <NavLink
            to="/institute-directory"
            className="px-3.5 py-2 rounded-lg bg-navy-900 text-warm-50 text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <Users className="h-4 w-4" />
            View Public Directory
          </NavLink>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase">Departments</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{departments.length}</p>
          <span className="text-[10px] text-teal-700 font-medium">Academic disciplines</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase">Active Divisions</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{divisions.length}</p>
          <span className="text-[10px] text-teal-700 font-medium">FE, SE, TE, BE Classes</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase">Total Faculty</span>
          <p className="text-2xl font-bold text-navy-900 font-mono">{facultyMembers.length}</p>
          <span className="text-[10px] text-teal-700 font-medium">Professors & Instructors</span>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono font-semibold text-navy-500 uppercase">Enrolled Students</span>
          <p className="text-2xl font-bold text-primary font-mono">{studentMembers.length}</p>
          <span className="text-[10px] text-teal-700 font-medium">Across all divisions</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-warm-300 gap-6 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'overview' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          Overview & Quick Stats
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'hierarchy' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          Academic Hierarchy & Divisions ({divisions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'departments' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          Departments ({departments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faculty')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'faculty' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          Faculty Roster ({facultyMembers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`pb-3 transition-colors shrink-0 ${
            activeTab === 'courses' 
              ? 'border-b-2 border-primary text-navy-900 font-bold' 
              : 'text-navy-500 hover:text-navy-900'
          }`}
        >
          Institutional Courses ({courses.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organization Information Card */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-warm-200 pb-3">
              <Building className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-navy-900">Institute Credentials</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-navy-500 font-medium">Institution Name:</span>
                <span className="font-semibold text-navy-900">{orgName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-navy-500 font-medium">Unique Join Code:</span>
                <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                  {orgCode}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-navy-500 font-medium">Campus Location:</span>
                <span className="font-semibold text-navy-900">{orgCity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-navy-500 font-medium">Director / Admin Email:</span>
                <span className="font-mono text-navy-700">{currentOrg?.adminEmail || currentUser?.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-navy-500 font-medium">Established:</span>
                <span className="font-mono text-navy-600">
                  {currentOrg?.createdAt ? new Date(currentOrg.createdAt).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-xs text-teal-900">
              <p className="font-semibold mb-1">📢 How New Students & Teachers Join:</p>
              <p className="text-[11px] leading-relaxed">
                Share the code <strong className="font-mono font-bold text-primary">{orgCode}</strong> with your students and professors. When they sign up under <strong>"Join Institute"</strong>, they will automatically attach to this portal.
              </p>
            </div>
          </div>

          {/* Quick Department Distribution */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-navy-900">Academic Divisions</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveTab('departments')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {departments.map((dept, idx) => {
                const deptFaculty = facultyMembers.filter(f => f.department === dept).length;
                const deptCourses = courses.filter(c => c.department === dept).length;

                return (
                  <div key={idx} className="p-2.5 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-navy-900">{dept}</p>
                      <p className="text-[10px] text-navy-500 font-mono">
                        {deptFaculty} Faculty &bull; {deptCourses} Courses
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-warm-300 text-navy-700">
                      Active
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACADEMIC HIERARCHY & DIVISIONS */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Organizational Hierarchy: Departments &rarr; Academic Years &rarr; Divisions
              </h3>
              <p className="text-xs text-navy-600 mt-1">
                Each division operates with its own independent class teacher, student roster, classroom, and timetable.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-1.5 border border-warm-300 rounded-md text-xs bg-warm-50 text-navy-800 font-semibold focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
              <NavLink
                to="/onboarding"
                className="px-3 py-1.5 bg-navy-900 text-warm-100 hover:bg-navy-800 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-subtle"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                Add Hierarchy / Onboard
              </NavLink>
            </div>
          </div>

          {/* Hierarchical Grouping */}
          <div className="space-y-6">
            {departments
              .filter(dept => selectedDeptFilter === 'ALL' || dept.toLowerCase().includes(selectedDeptFilter.toLowerCase()) || selectedDeptFilter.toLowerCase().includes(dept.toLowerCase()))
              .map((deptName, deptIdx) => {
                const deptDivisions = divisions.filter(div => 
                  div.departmentName.toLowerCase().includes(deptName.toLowerCase()) || 
                  deptName.toLowerCase().includes(div.departmentName.toLowerCase()) ||
                  (div.departmentCode && deptName.toLowerCase().includes(div.departmentCode.toLowerCase()))
                );

                const yearsOfStudy: YearOfStudy[] = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

                return (
                  <div key={deptIdx} className="rounded-xl border border-warm-300 bg-surface overflow-hidden shadow-subtle">
                    {/* Department Header */}
                    <div className="bg-warm-100/70 px-5 py-3.5 border-b border-warm-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-navy-900 text-primary flex items-center justify-center font-mono font-bold text-xs">
                          {deptIdx + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-navy-900">{deptName}</h4>
                          <p className="text-[11px] text-navy-500 font-mono">
                            {deptDivisions.length} Active Divisions across 4 Academic Years
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-surface border border-warm-300 rounded text-teal-800">
                        Department
                      </span>
                    </div>

                    {/* Academic Years Breakdown */}
                    <div className="p-5 space-y-5">
                      {yearsOfStudy.map(year => {
                        const yearDivisions = deptDivisions.filter(d => d.yearOfStudy === year);

                        return (
                          <div key={year} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-primary"></span>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-navy-800 font-mono">
                                {year} ({year === 'First Year' ? 'FE' : year === 'Second Year' ? 'SE' : year === 'Third Year' ? 'TE' : 'BE'})
                              </h5>
                              <span className="text-[10px] text-navy-500">
                                ({yearDivisions.length} {yearDivisions.length === 1 ? 'Division' : 'Divisions'})
                              </span>
                            </div>

                            {yearDivisions.length === 0 ? (
                              <div className="p-3 bg-warm-50 rounded-lg border border-dashed border-warm-300 text-center">
                                <p className="text-[11px] text-navy-400">No divisions registered for this academic year.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {yearDivisions.map(div => {
                                  const divAllocations = subjectAllocations.filter(sa => sa.divisionId === div.id);

                                  return (
                                    <div 
                                      key={div.id}
                                      className="p-4 rounded-lg bg-warm-50/50 hover:bg-warm-50 border border-warm-200 transition-all space-y-2.5 relative group"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                            {div.name}
                                          </span>
                                          <p className="text-xs font-bold text-navy-900 mt-1">
                                            Classroom: {div.roomNumber || 'Room 101'}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => deleteDivision(div.id)}
                                          className="text-navy-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                          title="Delete Division"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      <div className="text-[11px] space-y-1 text-navy-700">
                                        <div className="flex items-center gap-1.5">
                                          <Users className="h-3 w-3 text-navy-400 shrink-0" />
                                          <span className="text-navy-500">Class Teacher:</span>
                                          <span className="font-semibold text-navy-900 truncate">
                                            {div.classTeacherName || 'Unassigned'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <GraduationCap className="h-3 w-3 text-navy-400 shrink-0" />
                                          <span className="text-navy-500">Enrolled:</span>
                                          <span className="font-mono font-bold text-primary">
                                            {div.enrolledCount || 0} / {div.capacity || 72}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Subject Allocations for this division */}
                                      {divAllocations.length > 0 && (
                                        <div className="pt-2 border-t border-warm-200">
                                          <span className="text-[10px] font-mono text-navy-500 block mb-1">
                                            Assigned Subjects ({divAllocations.length}):
                                          </span>
                                          <div className="flex flex-wrap gap-1">
                                            {divAllocations.map(sa => (
                                              <span 
                                                key={sa.id}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-warm-300 text-navy-800 font-mono"
                                                title={`Teacher: ${sa.teacherName}`}
                                              >
                                                {sa.courseCode} ({(sa.teacherName || '').split(' ')[0]})
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Add Department Form */}
          <div className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add New Academic Department
            </h3>
            <form onSubmit={handleAddDept} className="flex gap-2 max-w-xl">
              <input
                type="text"
                required
                placeholder="e.g. Artificial Intelligence & Data Science, Civil Engineering..."
                value={newDeptInput}
                onChange={e => setNewDeptInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-warm-300 rounded-lg text-xs bg-white text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
              />
              <button
                type="submit"
                disabled={addingDept}
                className="px-4 py-2 bg-navy-900 text-warm-50 rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors shadow-subtle shrink-0"
              >
                {addingDept ? 'Adding...' : 'Add Department'}
              </button>
            </form>
          </div>

          {/* Departments Table */}
          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200 bg-warm-50">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider font-mono">
                Current Registered Departments ({departments.length})
              </h3>
            </div>
            <div className="divide-y divide-warm-200">
              {departments.map((dept, idx) => {
                const deptFaculty = facultyMembers.filter(f => f.department === dept);
                const deptCourses = courses.filter(c => c.department === dept);

                return (
                  <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                        {dept}
                      </h4>
                      <p className="text-xs text-navy-600">
                        {deptFaculty.length} Assigned Professors &bull; {deptCourses.length} Active Courses
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeDepartment(dept)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FACULTY ROSTER */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
              <input
                type="text"
                placeholder="Search faculty by name, ID, or email..."
                value={facultySearch}
                onChange={e => setFacultySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-lg text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
              />
            </div>
            <span className="text-xs text-navy-500 font-mono">
              Showing {filteredFaculty.length} of {facultyMembers.length} Faculty Members
            </span>
          </div>

          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Faculty Name</th>
                  <th className="px-4 py-3">Faculty ID</th>
                  <th className="px-4 py-3">Assigned Department</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {filteredFaculty.map(faculty => {
                  const isEditing = editingFacultyUid === faculty.uid;

                  return (
                    <tr key={faculty.uid} className="hover:bg-warm-50/60">
                      <td className="px-4 py-3.5 font-bold text-navy-900">
                        <div className="flex items-center gap-2">
                          <span>{faculty.fullName}</span>
                          {faculty.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              DIRECTOR
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-navy-600">
                        {faculty.facultyId || 'FAC-01'}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={newFacultyDept}
                              onChange={e => setNewFacultyDept(e.target.value)}
                              className="px-2 py-1 border border-warm-300 rounded text-xs bg-white text-navy-900 focus:outline-none focus:border-primary"
                            >
                              <option value="">Select Department</option>
                              {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveFacultyDept(faculty.uid)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFacultyUid(null)}
                              className="px-2 py-1 bg-warm-200 text-navy-700 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-navy-800">
                            {faculty.department || 'Computer Science & Engineering'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-navy-600">
                        {faculty.email}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFacultyUid(faculty.uid);
                              setNewFacultyDept(faculty.department);
                            }}
                            className="px-2.5 py-1 rounded border border-warm-300 text-navy-700 hover:bg-warm-100 text-xs font-semibold"
                          >
                            Reassign Dept
                          </button>
                        )}
                        {faculty.uid !== currentUser?.uid && (
                          <button
                            type="button"
                            onClick={() => removeFaculty(faculty.uid)}
                            className="px-2 py-1 rounded text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALL COURSES */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100 border-b border-warm-300 font-mono text-[11px] text-navy-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Course Code</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3 text-right">Enrolled Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {courses.map(course => (
                  <tr key={course.id} className="hover:bg-warm-50/60">
                    <td className="px-4 py-3.5 font-mono font-bold text-navy-900">
                      {course.courseCode}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-navy-900">
                      {course.courseName}
                    </td>
                    <td className="px-4 py-3.5 text-navy-700">
                      {course.department}
                    </td>
                    <td className="px-4 py-3.5 text-navy-800 font-medium">
                      {course.teacherName}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-navy-600">
                      {course.semester}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-primary">
                      {course.enrolledCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

