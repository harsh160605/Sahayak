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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class Period</span>
          </button>
        )}
      </div>

      {/* Day Selector Tabs with counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-warm-300 no-scrollbar">
        {days.map(d => {
          const count = getDayCount(d);
          const isToday = (todayIndex >= 1 && todayIndex <= 6 && days[todayIndex - 1] === d);

          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                selectedDay === d
                  ? 'bg-navy-900 text-white shadow-subtle'
                  : 'bg-surface text-navy-700 hover:bg-warm-200 border border-warm-300'
              }`}
            >
              <span>{d}</span>
              {isToday && (
                <span className={`w-1.5 h-1.5 rounded-full ${selectedDay === d ? 'bg-teal-400' : 'bg-primary'}`} />
              )}
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  selectedDay === d ? 'bg-navy-800 text-teal-300' : 'bg-warm-200 text-navy-700'
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
          <div className="p-12 text-center bg-surface border border-warm-300 rounded-xl space-y-2">
            <Calendar className="h-10 w-10 text-navy-400 mx-auto opacity-50 mb-1" />
            <h3 className="text-sm font-bold text-navy-900">No Classes Scheduled for {selectedDay}</h3>
            <p className="text-xs text-navy-500 max-w-sm mx-auto">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-md shadow-subtle mt-2"
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
                className="p-5 rounded-xl bg-surface border border-warm-300 shadow-subtle hover:border-warm-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-warm-200 text-navy-900 border border-warm-300">
                      {slot.courseCode}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-navy-900 leading-snug">{slot.courseName}</h3>
                  <div className="space-y-1.5 text-xs text-navy-600 pt-1">
                    <p className="flex items-center gap-1.5 font-mono text-navy-800 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Room: {slot.room}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-navy-600">
                      <User className="h-3.5 w-3.5 text-navy-400 shrink-0" />
                      <span>{slot.teacherName} ({slot.department})</span>
                    </p>
                  </div>
                </div>

                {isTeacher && (
                  <div className="pt-2 border-t border-warm-200 flex justify-end">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete the ${slot.courseCode} class slot on ${slot.dayOfWeek}?`)) {
                          deleteTimetableSlot(slot.id);
                        }
                      }}
                      className="p-1.5 text-navy-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors text-xs flex items-center gap-1 font-medium"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-surface rounded-xl border border-warm-300 shadow-elevated w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-warm-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-900">Add Class Period to Timetable</h3>
                <p className="text-xs text-navy-500">Configure lecture timing and room assignment.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-navy-400 hover:text-navy-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Select Course</label>
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-surface text-navy-900 font-medium"
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
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs bg-surface text-navy-900"
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
                  className="w-full px-3 py-2 rounded-md border border-warm-300 text-xs text-navy-900"
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
                  disabled={submitting}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-subtle disabled:opacity-50"
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
