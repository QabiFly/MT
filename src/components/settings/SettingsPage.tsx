import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import {
  Settings,
  Database,
  Cloud,
  Smartphone,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
} from 'lucide-react';
import { getOfflineQueue } from '../../services/offlineQueue.js';

export const SettingsPage: React.FC = () => {
  const { isOnline, queueCount, installPWA, deferredPrompt } = useApp();

  const [stats, setStats] = useState<any>(null);
  const [cloudinary, setCloudinary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSystemStats();
      setStats(data.stats);
      setCloudinary(data.cloudinary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleClearCache = () => {
    if (window.confirm('Clear local offline queue and cached student data?')) {
      localStorage.removeItem('tuition_offline_mutations');
      localStorage.removeItem('tuition_cached_students');
      alert('Local cache wiped.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System & Infrastructure Configuration</h2>
          <p className="text-slate-500">Manage PostgreSQL, Cloudinary media storage, offline sync queue, and PWA.</p>
        </div>
        <button
          onClick={fetchConfig}
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Cloudinary Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Cloudinary Storage Integration</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            cloudinary?.isConfigured ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
            {cloudinary?.isConfigured ? 'Active API Configuration' : 'Local Fallback Buffer'}
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Handles secure signed uploads for student profile pictures and homework doubt equation photos.
        </p>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 font-mono text-[11px] text-slate-700">
          <p>Cloud Name: <span className="text-indigo-600 font-semibold">{cloudinary?.cloudName || 'demo'}</span></p>
          <p>Signed Mode: <span className="text-emerald-700 font-semibold">SHA-256 Signature Generation Active</span></p>
          <p>Folders: <span className="text-slate-500">tuition_students / tuition_doubts</span></p>
        </div>
      </div>

      {/* Database Schema Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">PostgreSQL Database Schema</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Relational DB Mode
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-sans font-semibold">TABLE</span>
            <span className="text-slate-900 font-bold">students</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-sans font-semibold">TABLE</span>
            <span className="text-slate-900 font-bold">attendance</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-sans font-semibold">TABLE</span>
            <span className="text-slate-900 font-bold">fee_records</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-sans font-semibold">TABLE</span>
            <span className="text-slate-900 font-bold">notices</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-sans font-semibold">TABLE</span>
            <span className="text-slate-900 font-bold">doubts</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-sans font-semibold">TABLE</span>
            <span className="text-slate-900 font-bold">audit_logs</span>
          </div>
        </div>
      </div>

      {/* PWA & Offline Diagnostics Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">PWA & Offline Diagnostics</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {isOnline ? 'Network Online' : 'Network Offline'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] uppercase font-semibold">Service Worker</span>
            <p className="font-bold text-emerald-700 mt-0.5">Active & Caching</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] uppercase font-semibold">Pending Sync Queue</span>
            <p className="font-bold text-indigo-700 mt-0.5">{queueCount} action(s)</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {deferredPrompt ? (
            <button
              onClick={installPWA}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA App</span>
            </button>
          ) : (
            <span className="text-slate-500 text-[11px]">PWA Ready / Running Standalone</span>
          )}

          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Storage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
