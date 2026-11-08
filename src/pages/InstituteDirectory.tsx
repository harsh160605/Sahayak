import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Building, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Search, 
  Mail, 
  ShieldCheck, 
  Filter,
  BadgeCheck,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types';

export const InstituteDirectory: React.FC = () => {
  const { currentUser, currentOrg } = useAuth();
  const { organizationUsers, courses, enrollments } = useData();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const orgName = currentOrg?.name || currentUser?.organizationName || 'Academic Institution';
  const orgCode = currentOrg?.code || currentUser?.organizationCode || 'APEX101';
  const orgCity = currentOrg?.city || 'Campus';

  // Available departments in this institute
  const departments = currentOrg?.departments || [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  // Filter users
  const filteredUsers = organizationUsers.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.facultyId && user.facultyId.toLowerCase().includes(search.toLowerCase())) ||
      (user.studentId && user.studentId.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDept = selectedDept === 'all' || user.department === selectedDept;

    return matchesSearch && matchesRole && matchesDept;
  });

  const facultyCount = organizationUsers.filter(u => u.role === 'teacher' || u.role === 'admin').length;
  const studentCount = organizationUsers.filter(u => u.role === 'student').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-warm-300 bg-surface p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
              INSTITUTE ROSTER & MEMBERS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-300">
              CODE: {orgCode}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            {orgName}
          </h1>
          <p className="text-xs text-navy-600 mt-0.5">
            Campus: {orgCity} &bull; All enrolled students and faculty members attached to this institution.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="px-2.5 sm:px-3.5 py-2 rounded-lg bg-warm-100 border border-warm-300 text-center sm:min-w-[90px]">
            <span className="text-base sm:text-lg font-bold text-navy-900 font-mono">{facultyCount}</span>
            <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wider">Faculty</p>
          </div>
          <div className="px-2.5 sm:px-3.5 py-2 rounded-lg bg-warm-100 border border-warm-300 text-center sm:min-w-[90px]">
            <span className="text-base sm:text-lg font-bold text-primary font-mono">{studentCount}</span>
            <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wider">Students</p>
          </div>
          <div className="px-2.5 sm:px-3.5 py-2 rounded-lg bg-warm-100 border border-warm-300 text-center sm:min-w-[90px]">
            <span className="text-base sm:text-lg font-bold text-navy-900 font-mono">{courses.length}</span>
            <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wider">Courses</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search member by name, roll no, faculty ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-lg text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-lg bg-warm-100 border border-warm-300 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`py-1 rounded-md transition-all ${
              roleFilter === 'all' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            All Members
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('teacher')}
            className={`py-1 rounded-md transition-all ${
              roleFilter === 'teacher' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            Faculty
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('student')}
            className={`py-1 rounded-md transition-all ${
              roleFilter === 'student' ? 'bg-surface text-navy-900 shadow-subtle' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            Students
          </button>
        </div>

        {/* Department Select */}
        <div className="relative">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 border border-warm-300 rounded-lg text-xs bg-surface text-navy-900 focus:outline-none focus:border-primary shadow-subtle"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const isUserFaculty = user.role === 'teacher' || user.role === 'admin';
          const userCourses = isUserFaculty 
            ? courses.filter(c => c.teacherId === user.uid)
            : enrollments.filter(e => e.studentUid === user.uid);

          return (
            <div 
              key={user.uid} 
              className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle flex flex-col justify-between hover:border-teal-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs tracking-wider shrink-0 ${
                      user.role === 'admin' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : isUserFaculty 
                          ? 'bg-navy-900 text-warm-50' 
                          : 'bg-teal-100 text-teal-800'
                    }`}>
                      {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                        {user.fullName}
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            ADMIN
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-navy-500 font-mono">
                        {isUserFaculty 
                          ? (user.facultyId || 'Faculty') 
                          : (user.studentId ? `Roll: ${user.studentId}` : 'Student')}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                    user.role === 'admin'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : isUserFaculty
                        ? 'bg-navy-100 text-navy-800'
                        : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <div className="pt-2 border-t border-warm-200/80 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-navy-700">
                    <Building className="h-3.5 w-3.5 text-navy-400 shrink-0" />
                    <span className="truncate">{user.department || 'General Academic'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-navy-600">
                    <Mail className="h-3.5 w-3.5 text-navy-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Courses snippet */}
              <div className="mt-4 pt-3 border-t border-warm-200/80 flex items-center justify-between text-xs text-navy-600">
                <span className="text-[11px] font-mono flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  {isUserFaculty ? `${userCourses.length} Courses Taught` : `${userCourses.length} Courses Enrolled`}
                </span>
                <span className="text-[10px] font-mono text-navy-400">
                  {user.semester || orgCode}
                </span>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface rounded-xl border border-warm-300">
            <Users className="h-10 w-10 text-navy-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-navy-900">No Members Match Search</h3>
            <p className="text-xs text-navy-600 mt-1">
              Try adjusting your department filter, role toggle, or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

