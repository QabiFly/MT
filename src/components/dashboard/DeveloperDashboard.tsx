import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  Shield,
  Users,
  CalendarCheck,
  CreditCard,
  Bell,
  HelpCircle,
  Database,
  Cloud,
  RefreshCw,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileCode2,
} from 'lucide-react';
import { AuditLog } from '../../types/index.js';

export const DeveloperDashboard: React.FC = () => {
  const { setActiveTab, setIsAddStudentModalOpen } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [cloudinary, setCloudinary] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSystemStats();
      if (data) {
        setStats(data.stats);
        setCloudinary(data.cloudinary);
      }
      const logsData = await api.getAuditLogs({ limit: 5 });
      setRecentLogs(logsData.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleResetSeed = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all data to default pristine demo seed? This will restore sample students, attendance, fee records, and doubts.'
      )
    ) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetSystemDatabase();
      await fetchStats();
      alert('System database reset to initial demo state.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Superadmin Welcome Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <Shield className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Superadmin Control Center</h2>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Full developer oversight with PostgreSQL schema, signed Cloudinary storage, real-time WebSocket bus, and comprehensive audit logs.
            </p>
          </div>
          <button
            onClick={fetchStats}
            title="Refresh System Metrics"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Faculty Management</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={handleResetSeed}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200 transition-colors ml-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Seed</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div
          onClick={() => setActiveTab('students')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold">Total Students</span>
            <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats?.studentsCount ?? 5}</p>
          <span className="text-[10px] text-slate-500 font-medium">Sequential Roll #1 to #{stats?.studentsCount ?? 5}</span>
        </div>

        <div
          onClick={() => setActiveTab('attendance')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold">Attendance Logs</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats?.attendanceRecordsCount ?? 55}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Past 14 Days Logged</span>
        </div>

        <div
          onClick={() => setActiveTab('fees')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold">Fee Records</span>
            <CreditCard className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats?.feeRecordsCount ?? 3}</p>
          <span className="text-[10px] text-slate-500 font-medium">Receipt Safeguards Active</span>
        </div>

        <div
          onClick={() => setActiveTab('doubts')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold">Doubts & Queries</span>
            <HelpCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats?.doubtsCount ?? 3}</p>
          <span className="text-[10px] text-amber-600 font-medium">{stats?.pendingDoubtsCount ?? 1} Pending Reply</span>
        </div>

        <div
          onClick={() => setActiveTab('notices')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold">Notices Broadcast</span>
            <Bell className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats?.noticesCount ?? 3}</p>
          <span className="text-[10px] text-indigo-600 font-medium">Realtime Push Active</span>
        </div>

        <div
          onClick={() => setActiveTab('audit')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold">Audit Trail</span>
            <Shield className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats?.auditLogsCount ?? 4}</p>
          <span className="text-[10px] text-slate-500 font-medium">Full Security Trace</span>
        </div>
      </div>

      {/* Storage & Database Diagnostics Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Cloudinary Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cloudinary Media Storage</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              cloudinary?.isConfigured ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              {cloudinary?.isConfigured ? 'Cloud Connected' : 'Local Fallback Storage'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Cloud Name</span>
              <span className="font-mono text-slate-900 font-medium">{cloudinary?.cloudName || 'demo'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Signed Uploads</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enabled (SHA-256)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Upload Target</span>
              <span className="text-slate-800">Student Photos & Doubt Attachments</span>
            </div>
          </div>
        </div>

        {/* PostgreSQL Schema Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">PostgreSQL ORM Tables</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              9 Models Loaded
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] text-slate-700">
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">users</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">teachers</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">students</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">attendance</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">fee_records</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">notices</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">doubts</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">replies</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-center font-mono border border-slate-200">audit_logs</span>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Audit Trail</h3>
          </div>
          <button
            onClick={() => setActiveTab('audit')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 font-mono text-[11px]">{log.action}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 font-medium capitalize">
                    {log.actorRole}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5 line-clamp-1">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
