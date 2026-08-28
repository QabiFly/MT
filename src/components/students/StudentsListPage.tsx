import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Eye,
  CreditCard,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Student } from '../../types/index.js';

export const StudentsListPage: React.FC = () => {
  const { user } = useAuth();
  const {
    setSelectedStudent,
    setIsAddStudentModalOpen,
    setIsFeeWarningModalOpen,
    setTargetFeeStudent,
  } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [className, setClassName] = useState('All');
  const [feeStatus, setFeeStatus] = useState('All');
  const [sortBy, setSortBy] = useState('roll-asc');
  const [isLoading, setIsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudents({
        search,
        className: className === 'All' ? undefined : className,
        feeStatus: feeStatus === 'All' ? undefined : feeStatus,
        sortBy,
        page,
        limit: 12,
      });
      setStudents(data.students);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setAllClasses(data.allClasses || []);
    } catch (err) {
      console.error('Error fetching students list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, className, feeStatus, sortBy, page]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}? All attendance and fee records will be removed.`)) {
      return;
    }
    try {
      await api.deleteStudent(id);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleOpenFeeModal = (student: Student) => {
    setTargetFeeStudent(student);
    setIsFeeWarningModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Master Student Roster</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {total} Students
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Sequential Roll Numbers, searchable by full name, DOB, and mobile.
          </p>
        </div>

        {(user?.role === 'developer' || user?.role === 'teacher') && (
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 space-y-2.5 shadow-2xs">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search student by Name, DOB (YYYY-MM-DD), Roll No, or Mobile..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter & Sort Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={className}
              onChange={(e) => {
                setClassName(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 focus:outline-none w-full text-xs cursor-pointer"
            >
              <option value="All" className="bg-white text-slate-900">All Classes</option>
              {allClasses.map((c) => (
                <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
              ))}
            </select>
          </div>

          {/* Fee Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={feeStatus}
              onChange={(e) => {
                setFeeStatus(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 focus:outline-none w-full text-xs cursor-pointer"
            >
              <option value="All" className="bg-white text-slate-900">All Fee Statuses</option>
              <option value="paid" className="bg-white text-slate-900">Paid Only</option>
              <option value="unpaid" className="bg-white text-slate-900">Unpaid Only</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 col-span-2 sm:col-span-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 focus:outline-none w-full text-xs cursor-pointer"
            >
              <option value="roll-asc" className="bg-white text-slate-900">Sort: Roll Number (Asc)</option>
              <option value="roll-desc" className="bg-white text-slate-900">Sort: Roll Number (Desc)</option>
              <option value="a-z" className="bg-white text-slate-900">Sort: A to Z</option>
              <option value="z-a" className="bg-white text-slate-900">Sort: Z to A</option>
              <option value="class" className="bg-white text-slate-900">Sort: Class</option>
              <option value="highest-attendance" className="bg-white text-slate-900">Sort: Highest Attendance</option>
              <option value="lowest-fees-due" className="bg-white text-slate-900">Sort: Lowest Fees Due</option>
              <option value="highest-fees-due" className="bg-white text-slate-900">Sort: Highest Fees Due</option>
              <option value="paid-first" className="bg-white text-slate-900">Sort: Paid First</option>
              <option value="unpaid-first" className="bg-white text-slate-900">Sort: Unpaid First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Card / Table View */}
      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading student roster...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No students found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students.map((stu) => (
            <div
              key={stu.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-start gap-3">
                  {/* Photo / Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 p-0.5 shrink-0 overflow-hidden">
                    {stu.photoUrl ? (
                      <img
                        src={stu.photoUrl}
                        alt={stu.fullName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-base">
                        {stu.fullName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-slate-900 truncate">{stu.fullName}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        Roll #{stu.rollNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{stu.className}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" /> DOB: {stu.dob}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{stu.mobileNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Badges Strip */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                  {/* Fee Status */}
                  <div className="flex items-center gap-1.5">
                    {stu.feePaidStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Due: ${stu.feeDueAmount || 350}
                      </span>
                    )}
                  </div>

                  {/* Attendance % */}
                  <div className="text-slate-500 text-[11px] font-medium">
                    Att: <span className="text-slate-900 font-semibold">{stu.attendancePercentage ?? 100}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedStudent(stu)}
                  title="View Student 360 Profile"
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Profile</span>
                </button>

                {(user?.role === 'developer' || user?.role === 'teacher') && (
                  <>
                    <button
                      onClick={() => handleOpenFeeModal(stu)}
                      title="Update Fee Status"
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Fee</span>
                    </button>

                    <button
                      onClick={() => handleDelete(stu.id, stu.fullName)}
                      title="Delete student"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Page {page} of {totalPages} ({total} students)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
