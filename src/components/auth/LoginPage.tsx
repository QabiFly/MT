import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  GraduationCap,
  Shield,
  UserCheck,
  User,
  KeyRound,
  Calendar,
  Hash,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchUserRolePreset, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'developer' | 'teacher' | 'student'>('developer');
  const [username, setUsername] = useState('zeaipc');
  const [password, setPassword] = useState('arman786');
  const [rollNumber, setRollNumber] = useState('1');
  const [dob, setDob] = useState('2009-05-14');
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: 'developer' | 'teacher' | 'student') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'developer') {
      setUsername('zeaipc');
      setPassword('arman786');
    } else if (tab === 'teacher') {
      setUsername('teacher1');
      setPassword('teach123');
    } else {
      setRollNumber('1');
      setDob('2009-05-14');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (activeTab === 'developer') {
        await login({ role: 'developer', username, password });
      } else if (activeTab === 'teacher') {
        await login({ role: 'teacher', username, password });
      } else {
        if (!rollNumber || isNaN(Number(rollNumber))) {
          throw new Error('Please enter a valid numeric Roll Number.');
        }
        if (!dob) {
          throw new Error('Please enter your Date of Birth.');
        }
        await login({ role: 'student', rollNumber: Number(rollNumber), dob });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">TuitionPro Portal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Production-grade student, attendance & fee management
        </p>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-5">
        <button
          type="button"
          onClick={() => handleTabChange('developer')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'developer'
              ? 'bg-white text-amber-800 border border-amber-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span>Admin</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('teacher')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'teacher'
              ? 'bg-white text-indigo-700 border border-indigo-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Teacher</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('student')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'student'
              ? 'bg-white text-emerald-800 border border-emerald-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 text-emerald-600" />
          <span>Student</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {activeTab !== 'student' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {activeTab === 'developer' ? 'Developer Username' : 'Teacher Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'developer' ? 'zeaipc' : 'teacher1'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student Roll Number
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Birth (DOB)
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Students log in securely using Roll Number + Date of Birth only.
              </p>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Access Badges */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            One-Click Test Accounts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => switchUserRolePreset('developer')}
            className="p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 text-left transition-colors group cursor-pointer"
          >
            <p className="font-semibold text-amber-900 group-hover:text-amber-950">Developer / Admin</p>
            <p className="text-[10px] text-slate-500 font-mono">zeaipc : arman786</p>
          </button>

          <button
            onClick={() => switchUserRolePreset('teacher')}
            className="p-2 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-200/80 text-left transition-colors group cursor-pointer"
          >
            <p className="font-semibold text-indigo-900 group-hover:text-indigo-950">Teacher Account</p>
            <p className="text-[10px] text-slate-500 font-mono">teacher1 : teach123</p>
          </button>

          <button
            onClick={() => switchUserRolePreset('student1')}
            className="p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-200/80 text-left transition-colors group cursor-pointer"
          >
            <p className="font-semibold text-emerald-900 group-hover:text-emerald-950">Student Roll #1</p>
            <p className="text-[10px] text-slate-500 font-mono">Roll: 1 | 2009-05-14</p>
          </button>

          <button
            onClick={() => switchUserRolePreset('student2')}
            className="p-2 rounded-xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-200/80 text-left transition-colors group cursor-pointer"
          >
            <p className="font-semibold text-purple-900 group-hover:text-purple-950">Student Roll #2</p>
            <p className="text-[10px] text-slate-500 font-mono">Roll: 2 | 2009-08-22</p>
          </button>
        </div>
      </div>
    </div>
  );
};
