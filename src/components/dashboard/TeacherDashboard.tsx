import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  Users,
  CalendarCheck,
  CreditCard,
  Bell,
  HelpCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Notice, Doubt } from '../../types/index.js';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab, setIsAddStudentModalOpen } = useApp();

  const [studentStats, setStudentStats] = useState({ total: 0, paid: 0, unpaid: 0 });
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [pendingDoubts, setPendingDoubts] = useState<Doubt[]>([]);
  const [classesList, setClassesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const studentsRes = await api.getStudents();
        setStudentStats({
          total: studentsRes.total,
          paid: studentsRes.students.filter((s) => s.feePaidStatus === 'paid').length,
          unpaid: studentsRes.students.filter((s) => s.feePaidStatus === 'unpaid').length,
        });
        setClassesList(studentsRes.allClasses || []);

        const noticesRes = await api.getNotices();
        setRecentNotices(noticesRes.notices.slice(0, 3));

        const doubtsRes = await api.getDoubts();
        setPendingDoubts(doubtsRes.doubts.filter((d) => d.status === 'pending').slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-4">
      {/* Teacher Hero Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] uppercase tracking-wider border border-indigo-100">
                Faculty Portal
              </span>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name || 'Teacher'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-md">
              Manage classes, take attendance, verify fee receipts, and broadcast notices in real time.
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fee Status</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Send Notice</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div
          onClick={() => setActiveTab('students')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Total Students</span>
            <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{studentStats.total}</p>
          <span className="text-[10px] text-slate-500">Across {classesList.length} classes</span>
        </div>

        <div
          onClick={() => setActiveTab('attendance')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Attendance</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">96%</p>
          <span className="text-[10px] text-emerald-600 font-medium">Average rate</span>
        </div>

        <div
          onClick={() => setActiveTab('fees')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Fees Paid</span>
            <CreditCard className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{studentStats.paid}/{studentStats.total}</p>
          <span className="text-[10px] text-amber-600 font-medium">{studentStats.unpaid} pending</span>
        </div>

        <div
          onClick={() => setActiveTab('doubts')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Unresolved Doubts</span>
            <HelpCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingDoubts.length}</p>
          <span className="text-[10px] text-amber-600 font-medium">Requires reply</span>
        </div>
      </div>

      {/* Pending Doubts Needs Attention */}
      {pendingDoubts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Student Doubts Awaiting Reply
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('doubts')}
              className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Reply Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {pendingDoubts.map((dbt) => (
              <div
                key={dbt.id}
                onClick={() => setActiveTab('doubts')}
                className="p-3 rounded-xl bg-white border border-amber-200/80 hover:border-amber-300 cursor-pointer transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-slate-900 truncate">{dbt.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold shrink-0 border border-indigo-100">
                    Roll #{dbt.studentRoll}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-1">{dbt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Classes Stream */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Assigned Classes</h3>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Master Roster</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {classesList.map((cls) => (
            <div
              key={cls}
              onClick={() => setActiveTab('students')}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all text-center"
            >
              <p className="font-bold text-sm text-slate-900">{cls}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Active Cohort</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
