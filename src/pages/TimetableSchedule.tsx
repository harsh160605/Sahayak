import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Calendar, Clock, Plus, Trash2, MapPin, BookOpen, User, X } from 'lucide-react';
import { DayOfWeek, TimetableSlot } from '../types';

export const TimetableSchedule: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, timetable, addTimetableSlot, deleteTimetableSlot, enrollments } = useData();

  const isTeacher = currentUser?.role === 'teacher';
  const myEnrollments = enrollments.filter(e => e.studentUid === currentUser?.uid && e.status === 'active');
  const studentCourseIds = myEnrollments.map(e => e.courseId);

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Default to today's day if Monday-Saturday, else Monday
  const todayIndex = new Date().getDay();
  const defaultDay = (todayIndex >= 1 && todayIndex <= 6) ? days[todayIndex - 1] : 'Monday';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultDay);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New slot form state
  const myCourses = isTeacher 
    ? courses.filter(c => c.teacherId === currentUser?.uid)
    : courses;

  const [courseId, setCourseId] = useState(myCourses[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(selectedDay);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('Hall 302');

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const selectedCourse = courses.find(c => c.id === courseId);
    if (!selectedCourse) return;

    setSubmitting(true);
    try {
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
    } catch (err: any) {
      alert('Failed to add slot: ' + err.message);
    } finally {
      setSubmitting(false);
    }
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

  // Count classes per day for badges
  const getDayCount = (d: DayOfWeek) => {
    return timetable.filter(slot => {
      if (slot.dayOfWeek !== d) return false;
      return isTeacher ? slot.teacherId === currentUser?.uid : studentCourseIds.includes(slot.courseId);
    }).length;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              ACADEMIC SCHEDULE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Weekly Timetable & Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isTeacher 
              ? 'Organize faculty lecture periods, classroom locations, and department timings.' 
              : 'View your weekly classes and room allocations across your enrolled courses.'}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => {
              setDayOfWeek(selectedDay);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class Period</span>
          </button>
        )}
      </div>

      {/* Day Selector Tabs with counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {days.map(d => {
          const count = getDayCount(d);
          const isToday = (todayIndex >= 1 && todayIndex <= 6 && days[todayIndex - 1] === d);

          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 ${
                selectedDay === d
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{d}</span>
              {isToday && (
                <span className={`w-1.5 h-1.5 rounded-full ${selectedDay === d ? 'bg-blue-400' : 'bg-blue-600'}`} />
              )}
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  selectedDay === d ? 'bg-slate-800 dark:bg-slate-700 text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule Arena */}
      <div className="space-y-4">
        {visibleSlots.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <Calendar className="h-10 w-10 text-slate-400 mx-auto opacity-50 mb-1" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Classes Scheduled for {selectedDay}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isTeacher 
                ? 'Assign course periods to this day to organize your weekly teaching schedule.' 
                : 'You have no lectures scheduled on this day across your enrolled courses.'}
            </p>
            {isTeacher && (
              <button
                onClick={() => {
                  setDayOfWeek(selectedDay);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Class to {selectedDay}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSlots.map(slot => (
              <div 
                key={slot.id} 
                className="erp-box p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                      {slot.courseCode}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{slot.courseName}</h3>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <p className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Room: {slot.room}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{slot.teacherName} ({slot.department})</span>
                    </p>
                  </div>
                </div>

                {isTeacher && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete the ${slot.courseCode} class slot on ${slot.dayOfWeek}?`)) {
                          deleteTimetableSlot(slot.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors text-xs flex items-center gap-1 font-medium"
                      title="Remove class period"
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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Class Period to Timetable</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure lecture timing and room assignment.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Course</label>
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Classroom / Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hall 302 or Lab 2"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
