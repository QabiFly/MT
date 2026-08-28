import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  CalendarCheck,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Student, AttendanceRecord } from '../../types/index.js';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [students, setStudents] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<string[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);

  // If student is logged in, fetch their own attendance
  useEffect(() => {
    if (user?.role === 'student') {
      const studentId = user.studentId || user.id;
      api.getStudentAttendance(studentId).then((res) => {
        setStudentHistory(res.history || []);
      });
    }
  }, [user]);

  // If teacher or admin, fetch students roster and today's existing attendance
  const loadClassAttendance = async () => {
    if (user?.role === 'student') return;
    setIsLoading(true);
    try {
      const stuRes = await api.getStudents({
        className: selectedClass === 'All' ? undefined : selectedClass,
        limit: 100,
      });
      setStudents(stuRes.students);
      setClassesList(stuRes.allClasses || []);

      const attRes = await api.getAttendanceRecords({
        date,
        className: selectedClass === 'All' ? undefined : selectedClass,
      });

      // Map existing records or default to present
      const map: Record<string, 'present' | 'absent' | 'late'> = {};
      stuRes.students.forEach((s) => {
        const existing = attRes.records.find((r) => r.studentId === s.id);
        map[s.id] = existing ? existing.status : 'present';
      });
      setAttendanceState(map);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassAttendance();
  }, [date, selectedClass]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        date,
        status: attendanceState[s.id] || 'present',
      }));

      await api.saveAttendanceBatch(records);
      alert(`Successfully saved attendance for ${records.length} students.`);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  // If viewing as Student:
  if (user?.role === 'student') {
    const totalPresent = studentHistory.filter((a) => a.status === 'present' || a.status === 'late').length;
    const rate = studentHistory.length > 0 ? Math.round((totalPresent / studentHistory.length) * 100) : 100;

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Attendance Log</h2>
              <p className="text-xs text-slate-500">Class participation and punctuality record</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-700">{rate}%</span>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Attendance Rate</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Subject / Class</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-slate-900 font-medium">{rec.date}</td>
                    <td className="p-3 text-slate-600">{rec.className}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : rec.status === 'late'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Calculate live stats
  const total = students.length;
  const presentCount = Object.values(attendanceState).filter((v) => v === 'present').length;
  const lateCount = Object.values(attendanceState).filter((v) => v === 'late').length;
  const absentCount = Object.values(attendanceState).filter((v) => v === 'absent').length;
  const presentPercentage = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header & Date / Class Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Daily Attendance Register</h2>
          <p className="text-xs text-slate-500">
            Batch marking with offline queue sync and realtime notification push.
          </p>
        </div>

        {/* Date & Class Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none text-xs cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none text-xs cursor-pointer"
            >
              <option value="All" className="bg-white text-slate-900">All Classes</option>
              {classesList.map((c) => (
                <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Scorecard & Batch Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total Enrolled</span>
            <p className="text-lg font-bold text-slate-900">{total}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-emerald-700">Present</span>
            <p className="text-lg font-bold text-emerald-700">{presentCount}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-amber-700">Late</span>
            <p className="text-lg font-bold text-amber-700">{lateCount}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-rose-700">Absent</span>
            <p className="text-lg font-bold text-rose-700">{absentCount}</p>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleMarkAll('present')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold transition-colors cursor-pointer"
          >
            All Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold transition-colors cursor-pointer"
          >
            All Absent
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save & Broadcast'}</span>
          </button>
        </div>
      </div>

      {/* Student Attendance List */}
      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading student attendance roster...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((stu) => {
            const currentStatus = attendanceState[stu.id] || 'present';

            return (
              <div
                key={stu.id}
                className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 font-mono font-bold text-[11px] text-indigo-700 flex items-center justify-center shrink-0">
                    #{stu.rollNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{stu.fullName}</p>
                    <p className="text-[11px] text-slate-500">{stu.className}</p>
                  </div>
                </div>

                {/* Status Toggle Radio Group */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    onClick={() => handleStatusChange(stu.id, 'present')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      currentStatus === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={() => handleStatusChange(stu.id, 'late')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      currentStatus === 'late'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Late
                  </button>

                  <button
                    onClick={() => handleStatusChange(stu.id, 'absent')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      currentStatus === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
