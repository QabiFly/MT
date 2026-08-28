import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Student } from '../../types/index.js';

interface FeeWarningModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FeeWarningModal: React.FC<FeeWarningModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const isCurrentPaid = student.feePaidStatus === 'paid';
  const [targetStatus, setTargetStatus] = useState<'paid' | 'unpaid'>(isCurrentPaid ? 'unpaid' : 'paid');
  const [amount, setAmount] = useState<string>(student.feeDueAmount ? student.feeDueAmount.toString() : '400');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.updateFeeStatus(student.id, {
        status: targetStatus,
        amount: Number(amount || 0),
        paymentMode,
        remarks: remarks.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update fee status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative my-6 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Update Student Fee Status</h2>
              <p className="text-[11px] text-slate-500">
                {student.fullName} (Roll #{student.rollNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Notification Banner */}
        {targetStatus === 'paid' ? (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Mandatory Fee Confirmation Safeguard</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Once marked as <strong>PAID</strong>, an official receipt will be generated and broadcast in real time to the student portal. Please confirm receipt of funds before proceeding.
            </p>
          </div>
        ) : (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Privileged Override Warning</span>
            </div>
            <p className="text-[11px] text-rose-800/90 leading-relaxed">
              Reverting a fee record back to <strong>UNPAID</strong> will log a high-priority security entry in the system audit trail under actor: <strong>{user?.name}</strong>.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Fee Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus('paid')}
                className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Paid</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('unpaid')}
                className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetStatus === 'unpaid'
                    ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mark as Unpaid</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Amount ($)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Cash">Cash at Counter</option>
                <option value="UPI / QR">Online UPI / QR</option>
                <option value="Bank Transfer">Bank Wire / NEFT</option>
                <option value="Card">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Receipt / Audit Note (Optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Paid in full for March term / Ref #9871"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xl font-semibold shadow-xs text-white flex items-center gap-1.5 transition-all cursor-pointer ${
                targetStatus === 'paid'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Save Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
