import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  MapPin, 
  BookOpen, 
  User, 
  Sparkles, 
  Check, 
  Building,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DayOfWeek, TimetableSlot } from '../types';

interface MatrixRow {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  courseId: string;
  room: string;
}

export const TimetableSchedule: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    courses, 
    timetable, 
    addTimetableSlot, 
    saveWeeklyScheduleBatch, 
    deleteTimetableSlot, 
    clearDepartmentSchedule, 
    enrollments 
  } = useData();

  const isTeacher = currentUser?.role === 'teacher';
  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active');
  const studentCourseIds = myEnrollments.map(e => e.courseId);

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [activeTab, setActiveTab] = useState<'view' | 'master_planner'>('view');
  const [singleModalOpen, setSingleModalOpen] = useState(false);

  // Department Master Organization Filters
  const [selectedDept, setSelectedDept] = useState(currentUser?.department || 'Computer Science & Engineering');
  const [selectedSemester, setSelectedSemester] = useState('6th Semester');

  // Courses available under this department organization
  const deptCourses = courses.filter(c => c.department === selectedDept);

  // Master Whole-Week Grid Builder State
  const [scheduleRows, setScheduleRows] = useState<MatrixRow[]>([
    { dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', courseId: deptCourses[0]?.id || '', room: 'Hall 301' },
    { dayOfWeek: 'Monday', startTime: '10:15', endTime: '11:15', courseId: deptCourses[1]?.id || deptCourses[0]?.id || '', room: 'Hall 301' },
    { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '10:00', courseId: deptCourses[0]?.id || '', room: 'Hall 301' },
    { dayOfWeek: 'Wednesday', startTime: '11:15', endTime: '12:15', courseId: deptCourses[1]?.id || deptCourses[0]?.id || '', room: 'Lab 2' },
    { dayOfWeek: 'Thursday', startTime: '14:00', endTime: '15:00', courseId: deptCourses[0]?.id || '', room: 'Hall 301' },
    { dayOfWeek: 'Friday', startTime: '10:00', endTime: '11:00', courseId: deptCourses[1]?.id || deptCourses[0]?.id || '', room: 'Lab 2' },
  ]);

  const [savingBatch, setSavingBatch] = useState(false);
  const [batchSavedSuccess, setBatchSavedSuccess] = useState(false);

  // Single Slot Add Form
  const [singleCourseId, setSingleCourseId] = useState(courses[0]?.id || '');
  const [singleDay, setSingleDay] = useState<DayOfWeek>('Monday');
  const [singleStart, setSingleStart] = useState('09:00');
  const [singleEnd, setSingleEnd] = useState('10:00');
  const [singleRoom, setSingleRoom] = useState('Hall 302');

  const addRow = () => {
    setScheduleRows(prev => [
      ...prev,
      {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        courseId: deptCourses[0]?.id || '',
        room: 'Hall 301'
      }
    ]);
  };

  const removeRow = (index: number) => {
    setScheduleRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateRow = (index: number, field: keyof MatrixRow, val: any) => {
    setScheduleRows(prev => prev.map((row, idx) => idx === index ? { ...row, [field]: val } : row));
  };

  const handleSaveWholeWeek = async () => {
    setSavingBatch(true);
    setBatchSavedSuccess(false);

    const slotsToSave = scheduleRows
      .filter(r => r.courseId)
      .map(r => {
        const course = courses.find(c => c.id === r.courseId);
        return {
          courseId: r.courseId,
          courseCode: course?.courseCode || 'CRS',
          courseName: course?.courseName || 'Lecture',
          teacherId: course?.teacherId || currentUser?.uid || '',
          teacherName: course?.teacherName || currentUser?.fullName || '',
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
          room: r.room.trim() || 'Classroom',
          semester: selectedSemester,
          department: selectedDept,
          organizationId: currentUser?.organizationId || 'org_apex_tech',
          organizationCode: currentUser?.organizationCode || 'APEX101'
        };
      });

    await saveWeeklyScheduleBatch(slotsToSave);
    setSavingBatch(false);
    setBatchSavedSuccess(true);
    setTimeout(() => {
      setBatchSavedSuccess(false);
      setActiveTab('view');
    }, 1500);
  };

  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find(c => c.id === singleCourseId);
    if (!course) return;

    await addTimetableSlot({
      courseId: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      dayOfWeek: singleDay,
      startTime: singleStart,
      endTime: singleEnd,
      room: singleRoom.trim() || 'Classroom',
      semester: course.semester,
      department: course.department,
      organizationId: currentUser?.organizationId || 'org_apex_tech',
      organizationCode: currentUser?.organizationCode || 'APEX101'
    });

    setSingleModalOpen(false);
  };

  // Filter slots for the current view
  const visibleSlots = timetable.filter(slot => {
    const dayMatches = slot.dayOfWeek === selectedDay;
    if (!dayMatches) return false;

    if (isTeacher) {
      // Teacher sees any lecture where they are the instructor
      return slot.teacherId === currentUser?.uid;
    } else {
      // Student sees lectures for their enrolled courses OR matching their department & semester
      return (
        studentCourseIds.includes(slot.courseId) ||
        (slot.department === currentUser?.department && slot.semester === currentUser?.semester)
      );
    }
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" />
            <span>ORGANIZATION ACADEMIC SCHEDULE</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Master Timetable & Weekly Routine
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            {isTeacher 
              ? 'Institutional schedule: Professors automatically see their assigned lectures; students see their cohort routine.' 
              : `Your personalized lecture routine for ${currentUser?.department || 'Department'}.`}
          </p>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'view' ? 'master_planner' : 'view')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-semibold shadow-subtle transition-all ${
                activeTab === 'master_planner'
                  ? 'bg-navy-900 text-white'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>{activeTab === 'master_planner' ? 'Return to Timetable View' : 'Master Week Planner (Bulk Set)'}</span>
            </button>
            <button
              onClick={() => setSingleModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-md bg-surface border border-warm-300 text-navy-800 hover:bg-warm-100 text-xs font-semibold shadow-subtle"
            >
              <Plus className="h-4 w-4" />
              <span>Single Period</span>
            </button>
          </div>
        )}
      </div>

      {/* MASTER BULK WEEK PLANNER TAB */}
      {activeTab === 'master_planner' && isTeacher ? (
        <div className="p-6 bg-surface rounded-xl border border-warm-300 shadow-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Configure Whole-Week Schedule At Once</span>
              </h2>
              <p className="text-xs text-navy-600 mt-0.5">
                Assign subjects, rooms, and professors. Each professor will automatically see their scheduled classes upon login.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-warm-300 text-xs bg-warm-50 font-medium"
              >
                <option value="Computer Science & Engineering">CS & Engineering</option>
                <option value="Information Technology">Information Tech</option>
                <option value="Electronics & Communication">Electronics</option>
              </select>

              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-warm-300 text-xs bg-warm-50 font-mono"
              >
                <option value="6th Semester">6th Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="2nd Semester">2nd Semester</option>
              </select>
            </div>
          </div>

          {/* Table of Rows */}
          <div className="border border-warm-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100 border-b border-warm-300 text-navy-700 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Day of Week</th>
                  <th className="p-3">Time Period</th>
                  <th className="p-3">Course / Subject & Professor</th>
                  <th className="p-3">Room / Hall</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200">
                {scheduleRows.map((row, index) => {
                  const selectedCourse = courses.find(c => c.id === row.courseId);
                  return (
                    <tr key={index} className="hover:bg-warm-50">
                      <td className="p-2.5">
                        <select
                          value={row.dayOfWeek}
                          onChange={e => updateRow(index, 'dayOfWeek', e.target.value)}
                          className="px-2 py-1.5 rounded border border-warm-300 text-xs bg-surface font-medium"
                        >
                          {days.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 font-mono">
                          <input
                            type="time"
                            value={row.startTime}
                            onChange={e => updateRow(index, 'startTime', e.target.value)}
                            className="px-1.5 py-1 rounded border border-warm-300 text-xs"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={row.endTime}
                            onChange={e => updateRow(index, 'endTime', e.target.value)}
                            className="px-1.5 py-1 rounded border border-warm-300 text-xs"
                          />
                        </div>
                      </td>

                      <td className="p-2.5">
                        <select
                          value={row.courseId}
                          onChange={e => updateRow(index, 'courseId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-warm-300 text-xs bg-surface"
                        >
                          <option value="">-- Choose Subject --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.courseCode} — {c.courseName} (Prof. {c.teacherName})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2.5">
                        <input
                          type="text"
                          placeholder="e.g. Hall 301"
                          value={row.room}
                          onChange={e => updateRow(index, 'room', e.target.value)}
                          className="w-28 px-2 py-1.5 rounded border border-warm-300 text-xs font-mono"
                        />
                      </td>

                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-1 rounded text-navy-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-warm-300 text-xs font-semibold hover:bg-warm-100 text-navy-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Another Lecture Slot</span>
            </button>

            <div className="flex items-center gap-3">
              {batchSavedSuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  <span>Whole Week Timetable Saved & Assigned to Faculty!</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveWholeWeek}
                disabled={savingBatch || scheduleRows.length === 0}
                className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-subtle disabled:opacity-50"
              >
                {savingBatch ? 'Publishing Schedule...' : 'Save & Publish Whole-Week Schedule'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* STANDARD WEEK VIEW & DAY SELECTOR */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          {/* Day Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-warm-300">
            {days.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedDay === d
                    ? 'bg-navy-900 text-white shadow-subtle'
                    : 'bg-surface text-navy-700 hover:bg-warm-200 border border-warm-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Schedule Slots Grid */}
          <div className="space-y-3">
            {visibleSlots.length === 0 ? (
              <div className="p-12 text-center bg-surface border border-warm-300 rounded-xl space-y-2">
                <Calendar className="h-10 w-10 text-navy-400 mx-auto opacity-60" />
                <h3 className="text-sm font-bold text-navy-900">No Lectures Scheduled on {selectedDay}</h3>
                <p className="text-xs text-navy-500 max-w-sm mx-auto">
                  {isTeacher 
                    ? 'You have no assigned lectures for this day. Use "Master Week Planner" to batch-set department routines.' 
                    : 'No classes scheduled for your enrolled courses on this day.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleSlots.map(slot => (
                  <div 
                    key={slot.id} 
                    className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle hover:border-warm-400 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-warm-200 text-navy-900 border border-warm-300">
                          {slot.courseCode}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-mono font-semibold text-teal-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-navy-900">{slot.courseName}</h3>
                      <div className="space-y-1 text-xs text-navy-600">
                        <p className="flex items-center gap-1.5 font-mono">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{slot.room}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-navy-400" />
                          <span>Instructor: {slot.teacherName}</span>
                        </p>
                      </div>
                    </div>

                    {isTeacher && (
                      <div className="pt-2 border-t border-warm-200 flex justify-end">
                        <button
                          onClick={() => deleteTimetableSlot(slot.id)}
                          className="p-1.5 text-navy-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-xs flex items-center gap-1"
                          title="Delete slot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Single Slot Add Modal */}
      {singleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-elevated w-full max-w-md p-6 space-y-4">
            <div className="border-b border-warm-200 pb-3">
              <h3 className="text-base font-bold text-navy-900">Add Individual Lecture Period</h3>
              <p className="text-xs text-navy-500">Assign a course period directly to the weekly timetable.</p>
            </div>

            <form onSubmit={handleSingleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Select Course & Assigned Faculty</label>
                <select
                  value={singleCourseId}
                  onChange={e => setSingleCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-surface"
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseName} (Prof. {c.teacherName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Day of Week</label>
                <select
                  value={singleDay}
                  onChange={e => setSingleDay(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-surface"
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={singleStart}
                    onChange={e => setSingleStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={singleEnd}
                    onChange={e => setSingleEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Classroom / Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hall 302 or Lab 2"
                  value={singleRoom}
                  onChange={e => setSingleRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => setSingleModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium text-navy-700 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-subtle"
                >
                  Add Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
