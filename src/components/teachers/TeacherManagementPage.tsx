import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import {
  Users,
  Plus,
  UserCheck,
  Mail,
  Phone,
  BookOpen,
  X,
  Trash2,
  Edit2,
  Shield,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Teacher } from '../../types/index.js';

export const TeacherManagementPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Mathematics & Physics');
  const [assignedClasses, setAssignedClasses] = useState('Class 9, Class 10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeachers();
      setTeachers(data.teachers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const openAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
    setSubject('Mathematics & Science');
    setAssignedClasses('Class 9, Class 10');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setName(t.name);
    setUsername(t.username);
    setPassword(t.password || '');
    setEmail(t.email || '');
    setPhone(t.mobile || t.phone || t.mobileNumber || '');
    setSubject(t.subject || (t.subjects ? t.subjects.join(', ') : ''));
    setAssignedClasses(t.assignedClasses ? t.assignedClasses.join(', ') : '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !username.trim()) {
      setErrorMessage('Full name and username are required.');
      return;
    }

    if (!editingTeacher && !password.trim()) {
      setErrorMessage('Initial login password is required for new teacher accounts.');
      return;
    }

    setIsSubmitting(true);
    try {
      const classesArray = assignedClasses
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, {
          name: name.trim(),
          email: email.trim() || undefined,
          mobile: phone.trim() || undefined,
          phone: phone.trim() || undefined,
          mobileNumber: phone.trim() || undefined,
          subject: subject.trim(),
          assignedClasses: classesArray.length > 0 ? classesArray : ['Class 10'],
          password: password.trim() || undefined,
        });
      } else {
        await api.createTeacher({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim() || 'teach123',
          email: email.trim() || `${username.trim().toLowerCase()}@tuition.local`,
          phone: phone.trim() || undefined,
          mobile: phone.trim() || undefined,
          mobileNumber: phone.trim() || undefined,
          subject: subject.trim(),
          assignedClasses: classesArray.length > 0 ? classesArray : ['Class 10'],
        });
      }

      setIsModalOpen(false);
      await loadTeachers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save teacher record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string, teacherName: string) => {
    if (!window.confirm(`Are you sure you want to remove faculty account for "${teacherName}"?`)) {
      return;
    }

    try {
      await api.deleteTeacher(id);
      await loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete teacher account.');
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Faculty Management</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Admin Only
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Register and manage teacher logins, assigned classes, and credentials.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Teachers List or Empty State */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <span className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading faculty members...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <UserCheck className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-slate-900 text-sm">No Faculty Accounts Yet</h3>
            <p className="text-slate-500 text-xs mt-1">
              All mock teachers have been removed. Click the button below to add your first real faculty instructor.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Teacher</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3 transition-all hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm overflow-hidden">
                    {t.photoUrl ? (
                      <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      t.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{t.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Username: <span className="text-indigo-600 font-semibold">@{t.username}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit Teacher"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(t.id, t.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Teacher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-slate-600">
                {t.subject && (
                  <p className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Specialization: <strong className="text-slate-900 font-semibold">{t.subject}</strong>
                    </span>
                  </p>
                )}

                <p className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Assigned Classes:{' '}
                    <strong className="text-slate-900 font-semibold">
                      {t.assignedClasses && t.assignedClasses.length > 0
                        ? t.assignedClasses.join(', ')
                        : 'None'}
                    </strong>
                  </span>
                </p>

                {(t.email || t.mobile || t.phone || t.mobileNumber) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                    {t.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{t.email}</span>
                      </span>
                    )}
                    {(t.mobile || t.phone || t.mobileNumber) && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{t.mobile || t.phone || t.mobileNumber}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-4 relative my-6 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingTeacher ? 'Edit Faculty Account' : 'Register Faculty Instructor'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prof. Rajesh Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTeacher}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rajesh1"
                    className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Password {editingTeacher ? '(Optional)' : <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingTeacher}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingTeacher ? 'Keep current' : '••••••••'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Teaching Subjects / Specialty</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Physics"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Assigned Classes (Comma separated)
                </label>
                <input
                  type="text"
                  value={assignedClasses}
                  onChange={(e) => setAssignedClasses(e.target.value)}
                  placeholder="e.g. Class 9, Class 10, Class 12"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingTeacher ? 'Update Faculty' : 'Create Faculty Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
