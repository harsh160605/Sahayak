import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Calendar, Clock, Plus, Trash2, MapPin, BookOpen, User } from 'lucide-react';
import { DayOfWeek, TimetableSlot } from '../types';

export const TimetableSchedule: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, timetable, addTimetableSlot, deleteTimetableSlot, enrollments } = useData();

  const isTeacher = currentUser?.role === 'teacher';
  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active');
  const studentCourseIds = myEnrollments.map(e => e.courseId);

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New slot form state
  const myCourses = isTeacher 
    ? courses.filter(c => c.teacherId === currentUser?.uid)
    : courses;

  const [courseId, setCourseId] = useState(myCourses[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('Hall 302');

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const selectedCourse = courses.find(c => c.id === courseId);
    if (!selectedCourse) return;

    await addTimetableSlot({
      courseId: selectedCourse.id,
      courseCode: selectedCourse.courseCode,
      courseName: selectedCourse.courseName,
      teacherId: currentUser.uid,
      teacherName: currentUser.fullName,
      dayOfWeek,
      startTime,
      endTime,
      room: room.trim() || 'Classroom',
      semester: selectedCourse.semester,
      department: selectedCourse.department
    });

    setIsModalOpen(false);
  };

  // Filter slots for the current view
  const visibleSlots = timetable.filter(slot => {
    const dayMatches = slot.dayOfWeek === selectedDay;
    if (!dayMatches) return false;
    if (isTeacher) {
      return slot.teacherId === currentUser?.uid;
    } else {
      return studentCourseIds.includes(slot.courseId);
    }
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-300 pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            ACADEMIC SCHEDULE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 mt-0.5">
            Weekly Timetable & Schedule
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            {isTeacher 
              ? 'Organize lecture periods, classroom locations, and department timings.' 
              : 'View your weekly classes and room allocations for your enrolled courses.'}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-surface text-xs font-semibold shadow-subtle transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class Period</span>
          </button>
        )}
      </div>

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

      {/* Schedule Arena */}
      <div className="space-y-3">
        {visibleSlots.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-warm-300 rounded-xl space-y-2">
            <Calendar className="h-10 w-10 text-navy-400 mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-navy-900">No Classes Scheduled for {selectedDay}</h3>
            <p className="text-xs text-navy-500 max-w-sm mx-auto">
              {isTeacher 
                ? 'Click "Add Class Period" above to assign courses to this day.' 
                : 'You have no enrolled courses holding classes on this day.'}
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
                      <span>{slot.teacherName}</span>
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

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-warm-300 shadow-elevated w-full max-w-md p-6 space-y-4">
            <div className="border-b border-warm-200 pb-3">
              <h3 className="text-base font-bold text-navy-900">Add Class Period to Timetable</h3>
              <p className="text-xs text-navy-500">Configure lecture timing and room assignment.</p>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Select Course</label>
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-surface"
                  required
                >
                  {myCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value as DayOfWeek)}
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
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
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
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium text-navy-700 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-subtle"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
