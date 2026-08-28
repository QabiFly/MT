import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Printer,
  Calendar,
  Phone,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Student, FeeRecord } from '../../types/index.js';

export const FeeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { setIsFeeWarningModalOpen, setTargetFeeStudent, setSelectedStudent } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [filter, setFilter] = useState<'All' | 'paid' | 'unpaid'>('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const stuRes = await api.getStudents({ limit: 100 });
      setStudents(stuRes.students);

      const feeRes = await api.getFeeRecords();
      setFeeRecords(feeRes.records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenFeeModal = (student: Student) => {
    setTargetFeeStudent(student);
    setIsFeeWarningModalOpen(true);
  };

  // Student specific view
  if (user?.role === 'student') {
    const studentId = user.studentId || user.id;
    const myStudent = students.find((s) => s.id === studentId || s.rollNumber === user.rollNumber);
    const myFees = feeRecords.filter((f) => f.studentId === studentId || f.studentRoll === user.rollNumber);

    return (
      <div className="space-y-4 text-xs">
        {/* Status Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Current Tuition Fee Status</p>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {myStudent?.feePaidStatus === 'paid' ? 'Paid in Full' : `Due: $${myStudent?.feeDueAmount || 350}`}
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">Term: Spring 2026 Academic Session</p>
            </div>
            {myStudent?.feePaidStatus === 'paid' ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>

        {/* Printable Official Receipt */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Digital Fee Receipt</h3>
              <p className="text-[10px] text-slate-500 font-mono">Invoice #TF-{user.rollNumber || 1}-2026</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Student Name</span>
              <p className="font-semibold text-slate-900">{user.name}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Roll Number</span>
              <p className="font-semibold text-slate-900">#{user.rollNumber}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Course / Class</span>
              <p className="font-semibold text-slate-900">{myStudent?.className || 'Class 10'}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Fee Plan</span>
              <p className="font-semibold text-slate-900">$400.00 / Monthly</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher / Superadmin view
  const paidCount = students.filter((s) => s.feePaidStatus === 'paid').length;
  const unpaidCount = students.filter((s) => s.feePaidStatus === 'unpaid').length;
  const totalBilled = students.length * 400;
  const totalCollected = paidCount * 400;

  const filteredStudents = students.filter((s) => {
    if (filter !== 'All' && s.feePaidStatus !== filter) return false;
    if (search && !s.fullName.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber.toString().includes(search)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Fee Collection & Ledgers</h2>
        <p className="text-xs text-slate-500">
          Enforces mandatory confirmation warnings before marking paid and security traces on overrides.
        </p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Billed</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">${totalBilled}</p>
          <span className="text-[10px] text-slate-500">All enrolled</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-semibold text-emerald-700 uppercase">Total Collected</span>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">${totalCollected}</p>
          <span className="text-[10px] text-emerald-700 font-medium">{paidCount} students paid</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-semibold text-amber-700 uppercase">Outstanding Due</span>
          <p className="text-xl font-bold text-amber-700 mt-0.5">${unpaidCount * 400}</p>
          <span className="text-[10px] text-amber-700 font-medium">{unpaidCount} pending</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-semibold text-indigo-700 uppercase">Collection Rate</span>
          <p className="text-xl font-bold text-indigo-700 mt-0.5">
            {students.length > 0 ? Math.round((paidCount / students.length) * 100) : 0}%
          </p>
          <span className="text-[10px] text-indigo-700 font-medium">Session targets</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll #..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filter === 'All' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Paid ({paidCount})
          </button>
          <button
            onClick={() => setFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filter === 'unpaid' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Unpaid ({unpaidCount})
          </button>
        </div>
      </div>

      {/* Student List with Quick Fee Update Action */}
      <div className="space-y-2">
        {filteredStudents.map((stu) => (
          <div
            key={stu.id}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 font-mono font-bold text-xs text-indigo-700 flex items-center justify-center shrink-0">
                #{stu.rollNumber}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{stu.fullName}</p>
                <p className="text-[11px] text-slate-500">
                  {stu.className} • {stu.mobileNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {stu.feePaidStatus === 'paid' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Due: ${stu.feeDueAmount || 350}
                </span>
              )}

              <button
                onClick={() => handleOpenFeeModal(stu)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
