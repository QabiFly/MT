import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  Shield,
  FileCode2,
  Download,
  RefreshCw,
  Search,
  Filter,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AuditLog } from '../../types/index.js';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterRole, setFilterRole] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs({ limit: 100 });
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterRole !== 'All' && l.actorRole !== filterRole) return false;
    if (
      search &&
      !l.action.toLowerCase().includes(search.toLowerCase()) &&
      !l.details.toLowerCase().includes(search.toLowerCase()) &&
      !l.actorName.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = 'ID,Timestamp,ActorName,ActorRole,Action,Entity,EntityID,Details\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.entity}","${l.entityId || ''}","${l.details.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Security Audit Logs</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {filteredLogs.length} Events Logged
            </span>
          </div>
          <p className="text-slate-500">
            Immutable log of student registrations, fee status overrides, attendance submissions, and faculty actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, details, actor..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs w-full sm:w-auto focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Roles</option>
            <option value="developer">Developer / Superadmin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{l.actorName}</span>
                      <span className="block text-[10px] text-slate-400 capitalize">{l.actorRole}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 capitalize">{l.entity}</td>
                    <td className="p-3 text-slate-700 max-w-xs truncate" title={l.details}>
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
