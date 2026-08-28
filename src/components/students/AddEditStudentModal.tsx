import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  Camera,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { Student } from '../../types/index.js';

interface AddEditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
  onSuccess?: () => void;
}

export const AddEditStudentModal: React.FC<AddEditStudentModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nextRoll, setNextRoll] = useState<number>(1);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [className, setClassName] = useState('Class 10');
  const [dob, setDob] = useState('2009-01-15');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [feeStatus, setFeeStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [feeDueAmount, setFeeDueAmount] = useState('400');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.fullName);
      setMobileNumber(studentToEdit.mobileNumber);
      setEmail(studentToEdit.email || '');
      setAddress(studentToEdit.address);
      setClassName(studentToEdit.className);
      setDob(studentToEdit.dob);
      setDateOfJoining(studentToEdit.dateOfJoining);
      setPhotoUrl(studentToEdit.photoUrl || '');
      setNotes(studentToEdit.notes || '');
      setFeeStatus(studentToEdit.feePaidStatus === 'paid' ? 'paid' : 'unpaid');
      setFeeDueAmount(studentToEdit.feeDueAmount?.toString() || '0');
    } else {
      // Fetch next sequential roll number
      api.getNextRollNumber().then((r) => setNextRoll(r)).catch(() => setNextRoll(1));
    }
  }, [studentToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64Data, 'tuition_students');
        setPhotoUrl(uploadedUrl);
      } catch (err: any) {
        setError(err.message || 'Image upload failed. Using local preview.');
        setPhotoUrl(reader.result as string);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side Validation Checks
    if (!fullName.trim()) {
      setError('Student Full Name is required.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.trim().length < 8) {
      setError('A valid Mobile Number (minimum 8 digits) is required.');
      return;
    }
    if (!address.trim()) {
      setError('Address is required.');
      return;
    }
    if (!className.trim()) {
      setError('Class is required.');
      return;
    }
    if (!dob) {
      setError('Date of Birth is required.');
      return;
    }
    if (!dateOfJoining) {
      setError('Date of Joining is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        className: className.trim(),
        dob,
        dateOfJoining,
        photoUrl: photoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        feePaidStatus: feeStatus,
        feeDueAmount: feeStatus === 'paid' ? 0 : Number(feeDueAmount || 0),
        feePaidAmount: feeStatus === 'paid' ? Number(feeDueAmount || 400) : 0,
      };

      if (studentToEdit) {
        await api.updateStudent(studentToEdit.id, payload);
      } else {
        await api.createStudent(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {studentToEdit ? 'Edit Student Record' : 'Register New Student'}
              </h2>
              {!studentToEdit && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Auto Roll #{nextRoll}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {studentToEdit ? `Updating Roll #${studentToEdit.rollNumber}` : 'Sequential Roll Number assigned automatically.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
          {/* Photo Upload (Optional) */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="relative w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-xs">Student Photo (Optional)</p>
              <p className="text-[11px] text-slate-500">Cloudinary upload with local fallback</p>
              <div className="flex items-center gap-2 mt-1.5">
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
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-indigo-600" />
                  <span>Choose Photo</span>
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name & Mobile Number (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Patel"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Email (Optional) & Class (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Email Address <span className="text-slate-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Class / Grade <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Foundation">Foundation Course</option>
                  <option value="Competitive Exam Batch">Competitive Exam Batch</option>
                </select>
                <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Date of Birth & Date of Joining (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Date of Birth (DOB) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <span className="text-[10px] text-slate-500">Required for student login</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Date of Joining <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dateOfJoining}
                  onChange={(e) => setDateOfJoining(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Address (Required) */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Street, Area, City"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Fee Initial Status (Optional for creation) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Initial Fee Status</label>
              <select
                value={feeStatus}
                onChange={(e) => setFeeStatus(e.target.value as any)}
                className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="unpaid">Unpaid (Due)</option>
                <option value="paid">Paid in Full</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {feeStatus === 'paid' ? 'Amount Paid ($)' : 'Amount Due ($)'}
              </label>
              <input
                type="number"
                min="0"
                value={feeDueAmount}
                onChange={(e) => setFeeDueAmount(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Teacher Remarks / Academic Notes <span className="text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Strengths, weaknesses, special coaching requirements..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{studentToEdit ? 'Save Changes' : 'Create Student'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
