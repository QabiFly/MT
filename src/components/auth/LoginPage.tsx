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
  Info,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'developer' | 'teacher' | 'student'>('developer');
  const [username, setUsername] = useState('zeaipc');
  const [password, setPassword] = useState('arman786');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: 'developer' | 'teacher' | 'student') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'developer') {
      setUsername('zeaipc');
      setPassword('arman786');
    } else if (tab === 'teacher') {
      setUsername('');
      setPassword('');
    } else {
      setRollNumber('');
      setDob('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    try {
      if (activeTab === 'developer') {
        if (!cleanUser || !cleanPass) {
          throw new Error('Please enter both Admin username and password.');
        }
        await login({ role: 'developer', username: cleanUser, password: cleanPass });
      } else if (activeTab === 'teacher') {
        if (!cleanUser || !cleanPass) {
          throw new Error('Please enter both Teacher username and password.');
        }
        await login({ role: 'teacher', username: cleanUser, password: cleanPass });
      } else {
        const cleanRoll = rollNumber.trim();
        if (!cleanRoll || isNaN(Number(cleanRoll))) {
          throw new Error('Please enter a valid numeric Roll Number (e.g. 1).');
        }
        if (!dob.trim()) {
          throw new Error('Please enter or select your Date of Birth.');
        }
        await login({ role: 'student', rollNumber: Number(cleanRoll), dob: dob.trim() });
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manasthali Tutions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Student, Attendance & Fee Management Portal
        </p>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-5">
        <button
          type="button"
          onClick={() => handleTabChange('developer')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
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
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
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
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
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
                {activeTab === 'developer' ? 'Developer / Admin Username' : 'Teacher Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'developer' ? 'zeaipc' : 'Enter teacher username'}
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
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
                Students log in securely using Roll Number + Date of Birth (YYYY-MM-DD).
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

      {/* Quick 1-Click Demo Login Helpers */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-[11px] font-medium text-slate-400 text-center uppercase tracking-wider mb-2.5">
          Or 1-Click Quick Demo Sign-In
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await login({ role: 'developer', username: 'zeaipc', password: 'arman786' });
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/70 rounded-lg text-[11px] font-medium transition cursor-pointer text-center"
          >
            Admin (zeaipc)
          </button>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await login({ role: 'teacher', username: 'teacher1', password: 'teach123' });
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/70 rounded-lg text-[11px] font-medium transition cursor-pointer text-center"
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await login({ role: 'student', rollNumber: 1, dob: '2009-05-14' });
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/70 rounded-lg text-[11px] font-medium transition cursor-pointer text-center"
          >
            Student (Roll 1)
          </button>
        </div>
      </div>
    </div>
  );
};
