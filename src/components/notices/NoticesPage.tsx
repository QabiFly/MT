import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Bell,
  Plus,
  Send,
  Calendar,
  User,
  AlertCircle,
  Megaphone,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { Notice } from '../../types/index.js';

export const NoticesPage: React.FC = () => {
  const { user } = useAuth();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetClass, setTargetClass] = useState('All');
  const [priority, setPriority] = useState<'normal' | 'announcement' | 'urgent'>('announcement');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotices();
      setNotices(data.notices);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createNotice({
        title: title.trim(),
        content: content.trim(),
        targetClass,
        priority,
      });

      setTitle('');
      setContent('');
      setIsModalOpen(false);
      loadNotices();
    } catch (err: any) {
      alert(err.message || 'Failed to post notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Manasthali Tutions Notice Board</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Radio className="w-3 h-3 text-indigo-600 animate-pulse" /> Live Broadcast
            </span>
          </div>
          <p className="text-slate-500">Real-time instant push notifications to all enrolled students.</p>
        </div>

        {(user?.role === 'developer' || user?.role === 'teacher') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Notice</span>
          </button>
        )}
      </div>

      {/* Notices Stream */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No notices posted yet</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Class cancellations, holiday schedules, and exam dates will appear here.
            </p>
          </div>
        ) : (
          notices.map((n) => {
            const isUrgent = n.priority === 'urgent';
            const isAnnouncement = n.priority === 'announcement';

            return (
              <div
                key={n.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isUrgent
                    ? 'bg-rose-50/70 border-rose-200 shadow-2xs'
                    : isAnnouncement
                    ? 'bg-white border-slate-200/80 shadow-2xs'
                    : 'bg-white border-slate-200/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isAnnouncement
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {n.priority}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        Target: {n.targetClass}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1.5">{n.title}</h3>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="text-slate-600 text-xs mt-2 leading-relaxed whitespace-pre-line">{n.content}</p>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Posted by {n.authorName} ({n.authorRole})
                  </span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Broadcast Class Notice</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Extra Physics Doubt Session Tomorrow"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Cohort</label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="All">All Classes (Everyone)</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="urgent">Urgent Alert</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notice Body Content</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detailed instructions, timing, syllabus, homework guidelines..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs resize-none"
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
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Broadcast Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
