import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  HelpCircle,
  Plus,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  MessageSquare,
  Upload,
  X,
  User,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Doubt } from '../../types/index.js';

export const DoubtsPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  const loadDoubts = async () => {
    try {
      const data = await api.getDoubts();
      setDoubts(data.doubts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const uploaded = await api.uploadImage(reader.result as string, 'tuition_doubts');
        setImageUrl(uploaded);
      } catch (err) {
        setImageUrl(reader.result as string);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createDoubt({
        title: title.trim(),
        subject,
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      setTitle('');
      setDescription('');
      setImageUrl('');
      setIsNewModalOpen(false);
      loadDoubts();
    } catch (err: any) {
      alert(err.message || 'Failed to submit doubt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (doubtId: string) => {
    const content = replyTextMap[doubtId];
    if (!content || !content.trim()) return;

    try {
      await api.replyToDoubt(doubtId, content.trim());
      setReplyTextMap((prev) => ({ ...prev, [doubtId]: '' }));
      loadDoubts();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    }
  };

  const handleStatusChange = async (doubtId: string, status: 'pending' | 'answered' | 'closed') => {
    try {
      await api.updateDoubtStatus(doubtId, status);
      loadDoubts();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Doubts & Solutions</h2>
          <p className="text-slate-500">Ask homework questions with equation screenshots and get faculty guidance.</p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ask Doubt</span>
        </button>
      </div>

      {/* Doubts Stream */}
      <div className="space-y-3">
        {doubts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No questions posted yet</p>
            <p className="text-slate-500 text-[11px] mt-1">Submit your first question or equation photo above.</p>
          </div>
        ) : (
          doubts.map((d) => (
            <div key={d.id} className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                      {d.subject}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Student: {d.studentName} (Roll #{d.studentRoll})
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1">{d.title}</h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      d.status === 'answered'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : d.status === 'closed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {d.status}
                  </span>

                  {(user?.role === 'developer' || user?.role === 'teacher') && (
                    <select
                      value={d.status}
                      onChange={(e) => handleStatusChange(d.id, e.target.value as any)}
                      className="bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] px-1 py-0.5"
                    >
                      <option value="pending">Pending</option>
                      <option value="answered">Answered</option>
                      <option value="closed">Closed</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">{d.description}</p>

              {/* Image attachment if exists */}
              {d.imageUrl && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Attached Problem Photo (Click to Zoom)
                  </p>
                  <img
                    src={d.imageUrl}
                    alt="Problem attachment"
                    onClick={() => setActiveImageZoom(d.imageUrl || null)}
                    className="max-h-48 rounded-xl border border-slate-200 object-contain bg-slate-50 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}

              {/* Threaded Discussion Replies */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Solutions & Discussion ({d.replies?.length || 0})
                </p>

                {d.replies && d.replies.length > 0 ? (
                  d.replies.map((r) => (
                    <div
                      key={r.id}
                      className={`p-2.5 rounded-2xl border text-xs ${
                        r.authorRole === 'teacher' || r.authorRole === 'developer'
                          ? 'bg-indigo-50/70 border-indigo-100 text-indigo-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-900">
                          {r.authorName} ({r.authorRole})
                        </span>
                        <span className="text-slate-400 font-mono">
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line">{r.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No replies yet. Teachers will answer shortly.</p>
                )}

                {/* Reply Input Box */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={replyTextMap[d.id] || ''}
                    onChange={(e) => setReplyTextMap({ ...replyTextMap, [d.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendReply(d.id);
                    }}
                    placeholder="Type step-by-step solution or answer..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleSendReply(d.id)}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit New Doubt Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-xl space-y-3 relative my-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Ask a Homework Doubt</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoubt} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Question Topic / Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quadratic Formula Derivation Question 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Detailed Explanation of Doubt</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe where you got stuck or what formula was confusing..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs resize-none focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Photo Upload for Equation Screenshot */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-700 text-xs">Attach Equation / Problem Photo</span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 text-[11px] border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Image</span>
                  </button>
                  {imageUrl && (
                    <span className="text-emerald-700 font-semibold text-[10px]">Photo Attached</span>
                  )}
                  {isUploading && (
                    <span className="text-indigo-600 text-[10px] animate-pulse">Uploading to Cloudinary...</span>
                  )}
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="Attached" className="h-20 rounded-xl object-contain border border-slate-200 bg-white" />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Submit Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {activeImageZoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setActiveImageZoom(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={activeImageZoom} alt="Enlarged" className="rounded-2xl max-h-[80vh] w-auto shadow-2xl" />
            <button
              onClick={() => setActiveImageZoom(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
