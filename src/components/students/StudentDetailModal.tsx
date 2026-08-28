import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  CreditCard,
  CalendarCheck,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Student, AttendanceRecord, FeeRecord, Doubt } from '../../types/index.js';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
  const { user } = useAuth();
  const { setIsFeeWarningModalOpen, setTargetFeeStudent } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'fees' | 'doubts'>('profile');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const attRes = await api.getStudentAttendance(student.id);
        setAttendanceHistory(attRes.history || []);

        const feeRes = await api.getFeeRecords();
        setFeeRecords(feeRes.records.filter((f) => f.studentId === student.id));

        const doubtRes = await api.getDoubts({ studentId: student.id });
        setDoubts(doubtRes.doubts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [student]);

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 p-0.5 shrink-0 overflow-hidden">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {student.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{student.fullName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Roll #{student.rollNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {student.className} • Joined {student.dateOfJoining}
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 my-3 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'attendance' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Attendance ({attendanceHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'fees' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Fees & Receipts
          </button>
          <button
            onClick={() => setActiveTab('doubts')}
            className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'doubts' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Doubts ({doubts.length})
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {activeTab === 'profile' && (
            <div className="space-y-3">
              {/* Core Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Date of Birth</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{student.dob}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Mobile Number</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{student.mobileNumber}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Email</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{student.email || 'N/A'}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Fee Status</span>
                  <div className="mt-1">
                    {student.feePaidStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid in Full
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Due: ${student.feeDueAmount || 350}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Residential Address</span>
                <p className="text-xs text-slate-900 mt-0.5">{student.address}</p>
              </div>

              {/* Notes */}
              {student.notes && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Teacher Remarks</span>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{student.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Total Logged Sessions</p>
                  <p className="text-lg font-bold text-slate-900">{attendanceHistory.length} Days</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Attendance Rate</p>
                  <p className="text-lg font-bold text-emerald-700">{student.attendancePercentage ?? 96}%</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceHistory.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 text-slate-800 font-mono">{att.date}</td>
                        <td className="p-2.5 text-slate-500">{att.className}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              att.status === 'present'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : att.status === 'late'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-500">Current Status</p>
                  <p className="text-base font-bold text-slate-900 capitalize">
                    {student.feePaidStatus === 'paid' ? 'Paid in Full' : `Due: $${student.feeDueAmount || 350}`}
                  </p>
                </div>

                {(user?.role === 'developer' || user?.role === 'teacher') && (
                  <button
                    onClick={() => {
                      setTargetFeeStudent(student);
                      setIsFeeWarningModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Change Status
                  </button>
                )}
              </div>

              {/* Printable Official Tuition Receipt Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Official Tuition Fee Receipt</h4>
                    <p className="text-[10px] text-slate-400 font-mono">REC-{student.rollNumber}-2026</p>
                  </div>
                  <button
                    onClick={handlePrintReceipt}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500">Student Name:</span>
                    <p className="font-semibold text-slate-900">{student.fullName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Roll Number:</span>
                    <p className="font-semibold text-slate-900">#{student.rollNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Monthly Tuition:</span>
                    <p className="font-semibold text-slate-900">$400.00</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment Status:</span>
                    <p className="font-semibold text-emerald-700 uppercase">
                      {student.feePaidStatus === 'paid' ? 'VERIFIED PAID' : 'PENDING'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'doubts' && (
            <div className="space-y-2">
              {doubts.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No doubts submitted by this student.</p>
              ) : (
                doubts.map((dbt) => (
                  <div key={dbt.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-900">{dbt.title}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          dbt.status === 'answered'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {dbt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{dbt.description}</p>
                    {dbt.replies && dbt.replies.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-indigo-950 bg-indigo-50 border border-indigo-100 p-2 rounded-xl">
                        <span className="font-bold">{dbt.replies[0].authorName}: </span>
                        <span>{dbt.replies[0].content}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
