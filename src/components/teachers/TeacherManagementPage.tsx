import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  Users,
  Plus,
  UserCheck,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';
import { Teacher } from '../../types/index.js';

export const TeacherManagementPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Mathematics & Physics');
  const [assignedClasses, setAssignedClasses] = useState('Class 9, Class 10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTeachers = async () => {
    try {
      const data = await api.getTeachers();
      setTeachers(data.teachers);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;

    setIsSubmitting(true);
    try {
      await api.createTeacher({
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        assignedClasses: assignedClasses.split(',').map((c) => c.trim()),
      });

      setName('');
      setUsername('');
      setPassword('');
      setEmail('');
      setPhone('');
      setIsModalOpen(false);
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to create teacher account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Faculty Management</h2>
          <p className="text-slate-500">Manage instructor accounts, subject specialties, and class assignments.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teachers.map((t) => (
          <div key={t.id} className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{t.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">@{t.username}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Active Faculty
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
              <p className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Specialization: <strong className="text-slate-900 font-semibold">{t.subject}</strong></span>
              </p>
              <p className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned: {t.assignedClasses.join(', ')}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-xl space-y-3 relative my-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Register Faculty Instructor</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Login Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="teacher2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Teaching Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assigned Classes (Comma separated)</label>
                <input
                  type="text"
                  value={assignedClasses}
                  onChange={(e) => setAssignedClasses(e.target.value)}
                  placeholder="Class 11, Class 12"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
