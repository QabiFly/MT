import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Bell,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import { Student, AttendanceRecord, Notice, Doubt } from '../../types/index.js';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useApp();

  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [myDoubts, setMyDoubts] = useState<Doubt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const studentId = user.studentId || user.id;
        // Fetch student full details
        const stuRes = await api.getStudent(studentId).catch(() => null);
        if (stuRes?.student) {
          setStudent(stuRes.student);
        } else {
          // Fallback search by roll number
          const listRes = await api.getStudents({ search: user.rollNumber?.toString() });
          if (listRes.students.length > 0) {
            setStudent(listRes.students[0]);
          }
        }

        // Attendance history
        const attRes = await api.getStudentAttendance(studentId);
        setAttendance(attRes.history.slice(0, 7));

        // Notices targeting student class
        const notRes = await api.getNotices(student?.className || 'Class 10');
        setNotices(notRes.notices.slice(0, 3));

        // Doubts submitted by this student
        const dbtRes = await api.getDoubts({ studentId });
        setMyDoubts(dbtRes.doubts);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [user]);

  const totalPresent = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Student Identity Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-2xs">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50 border border-indigo-100 p-0.5 shadow-xs shrink-0 overflow-hidden">
            {student?.photoUrl || user?.avatarUrl ? (
              <img
                src={student?.photoUrl || user?.avatarUrl}
                alt={student?.fullName || user?.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full h-full bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                {student?.fullName ? student.fullName.charAt(0) : 'S'}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                Roll #{student?.rollNumber || user?.rollNumber || 1}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{student?.className || 'Class 10'}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1 truncate">
              {student?.fullName || user?.name}
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> DOB: {student?.dob || '2009-05-14'}
              </span>
              {student?.mobileNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {student.mobileNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Student Badges */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
          {/* Fee Status Badge */}
          <div
            onClick={() => setActiveTab('fees')}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              student?.feePaidStatus === 'paid'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            <div>
              <p className="text-[10px] uppercase font-semibold">Tuition Fee</p>
              <p className="text-xs font-bold capitalize">
                {student?.feePaidStatus === 'paid' ? 'Paid in Full' : `Due: $${student?.feeDueAmount || 350}`}
              </p>
            </div>
            {student?.feePaidStatus === 'paid' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
          </div>

          {/* Attendance Rate */}
          <div
            onClick={() => setActiveTab('attendance')}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-all"
          >
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-500">Attendance</p>
              <p className="text-xs font-bold text-slate-900">{attendanceRate}% Rate</p>
            </div>
            <CalendarCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* Realtime Notices For Me */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Class Notices</h3>
          </div>
          <button
            onClick={() => setActiveTab('notices')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Notice Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {notices.length > 0 ? (
            notices.map((not) => (
              <div
                key={not.id}
                onClick={() => setActiveTab('notices')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-slate-900 truncate">{not.title}</span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      not.priority === 'urgent'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {not.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{not.content}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-3">No new notices for your class.</p>
          )}
        </div>
      </div>

      {/* Ask a Doubt Action Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900">Have a homework doubt?</h3>
          </div>
          <p className="text-[11px] text-slate-600">
            Submit text or photo of math/science equations for direct teacher guidance.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('doubts')}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ask Doubt</span>
        </button>
      </div>
    </div>
  );
};
