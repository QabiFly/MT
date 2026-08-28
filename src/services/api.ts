import {
  Student,
  AttendanceRecord,
  FeeRecord,
  Notice,
  Doubt,
  Teacher,
  AuditLog,
  UserSession,
  FeeStatus,
  AttendanceStatus,
} from '../types/index.js';
import { enqueueOfflineAction, flushOfflineQueue } from './offlineQueue.js';
import { authenticateLocally, getLocalStore, saveLocalStore } from './localDataStore.js';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const sessionRaw = localStorage.getItem('tuition_user_session');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionRaw) {
    headers['x-user-session'] = encodeURIComponent(sessionRaw);
  }
  return headers;
}

// Local cache helper for offline resilience
function cacheData(key: string, data: any) {
  try {
    localStorage.setItem(`tuition_cache_${key}`, JSON.stringify(data));
  } catch (e) {}
}

function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`tuition_cache_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export const api = {
  // Auth
  async login(payload: {
    role: string;
    username?: string;
    password?: string;
    rollNumber?: number;
    dob?: string;
  }): Promise<{ session: UserSession }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          localStorage.setItem('tuition_user_session', JSON.stringify(data.session));
          return data;
        }
      }
    } catch (e) {
      // Backend not running / offline / static hosting (Vercel)
    }

    // Always evaluate seamless local credentials
    const localSession = authenticateLocally(payload);
    if (localSession) {
      localStorage.setItem('tuition_user_session', JSON.stringify(localSession));
      return { session: localSession };
    }

    throw new Error(
      payload.role === 'student' || payload.rollNumber
        ? 'Invalid Roll Number or Date of Birth. (Example: Roll: 1, DOB: 2009-05-14)'
        : 'Invalid credentials. For Admin, use username "zeaipc" and password "arman786".'
    );
  },

  async getMe(): Promise<{ session: UserSession }> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const sessionRaw = localStorage.getItem('tuition_user_session');
    if (sessionRaw) {
      try {
        return { session: JSON.parse(sessionRaw) };
      } catch (e) {}
    }
    throw new Error('Not authenticated');
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {}
    localStorage.removeItem('tuition_user_session');
  },

  // Students
  async getStudents(params?: {
    search?: string;
    className?: string;
    feeStatus?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    students: Student[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    allClasses: string[];
  }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.className) query.set('className', params.className);
    if (params?.feeStatus) query.set('feeStatus', params.feeStatus);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    try {
      const res = await fetch(`${API_BASE}/students?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      cacheData('students_list', data);
      return data;
    } catch (err) {
      const cached = getCachedData<any>('students_list');
      if (cached) return cached;
      const store = getLocalStore();
      let list = [...store.students];
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter((st) => st.fullName.toLowerCase().includes(s) || st.rollNumber.toString().includes(s));
      }
      if (params?.className && params.className !== 'all') {
        list = list.filter((st) => st.className === params.className);
      }
      return {
        students: list,
        total: list.length,
        page: 1,
        limit: 50,
        totalPages: 1,
        allClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
      };
    }
  },

  async getNextRollNumber(): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/students/next-roll`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return data.nextRollNumber;
      }
    } catch (e) {}
    const store = getLocalStore();
    const maxRoll = store.students.reduce((max, s) => Math.max(max, s.rollNumber || 0), 0);
    return maxRoll + 1;
  },

  async getStudent(id: string): Promise<{ student: Student }> {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Student not found');
      const data = await res.json();
      cacheData(`student_${id}`, data);
      return data;
    } catch (err) {
      const cached = getCachedData<{ student: Student }>(`student_${id}`);
      if (cached) return cached;
      const store = getLocalStore();
      const st = store.students.find((s) => s.id === id || s.rollNumber.toString() === id);
      if (st) return { student: st };
      throw err;
    }
  },

  async createStudent(studentData: any): Promise<{ student: Student; queuedOffline?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const store = getLocalStore();
    const nextRoll = store.students.reduce((max, s) => Math.max(max, s.rollNumber || 0), 0) + 1;
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}`,
      rollNumber: studentData.rollNumber || nextRoll,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.students.push(newStudent);
    saveLocalStore(store);
    return { student: newStudent, queuedOffline: true };
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<{ student: Student }> {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const store = getLocalStore();
    const idx = store.students.findIndex((s) => s.id === id);
    if (idx !== -1) {
      store.students[idx] = { ...store.students[idx], ...updates, updatedAt: new Date().toISOString() };
      saveLocalStore(store);
      return { student: store.students[idx] };
    }
    return { student: { id, ...updates } as Student };
  },

  async deleteStudent(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) return true;
    } catch (e) {}

    const store = getLocalStore();
    store.students = store.students.filter((s) => s.id !== id);
    saveLocalStore(store);
    return true;
  },

  // Attendance
  async getAttendance(date: string, className?: string): Promise<{ attendance: AttendanceRecord[]; date: string }> {
    const query = new URLSearchParams({ date });
    if (className) query.set('className', className);

    try {
      const res = await fetch(`${API_BASE}/attendance?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      cacheData(`attendance_${date}_${className || 'all'}`, data);
      return data;
    } catch (err) {
      const cached = getCachedData<any>(`attendance_${date}_${className || 'all'}`);
      if (cached) return cached;
      return { attendance: [], date };
    }
  },

  async getAttendanceRecords(params?: { date?: string; className?: string }): Promise<{ records: AttendanceRecord[] }> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.className) query.set('className', params.className);

    try {
      const res = await fetch(`${API_BASE}/attendance?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return { records: [] };
      const data = await res.json();
      return { records: data.attendance || [] };
    } catch (err) {
      return { records: [] };
    }
  },

  async getStudentAttendance(studentId: string): Promise<{ history: AttendanceRecord[] }> {
    const res = await fetch(`${API_BASE}/attendance/student/${studentId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { history: [] };
    return res.json();
  },

  async markAttendanceBatch(records: { studentId: string; status: AttendanceStatus; notes?: string }[], date: string) {
    if (!navigator.onLine) {
      enqueueOfflineAction('attendance', 'create', { records, date });
      return { success: true, count: records.length, date, queuedOffline: true };
    }

    const res = await fetch(`${API_BASE}/attendance/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ records, date }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record attendance' }));
      throw new Error(err.error || 'Server error recording attendance');
    }
    return res.json();
  },

  async saveAttendanceBatch(records: { studentId: string; status: 'present' | 'absent' | 'late'; date: string }[]) {
    if (records.length === 0) return { success: true, count: 0 };
    const targetDate = records[0].date;
    const formatted = records.map((r) => ({
      studentId: r.studentId,
      status: r.status,
    }));
    return this.markAttendanceBatch(formatted, targetDate);
  },

  // Fees
  async getFeeOverview() {
    try {
      const res = await fetch(`${API_BASE}/fees/overview`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        cacheData('fee_overview', data);
        return data;
      }
    } catch (err) {}

    const store = getLocalStore();
    const totalStudents = store.students.length;
    const paidStudents = store.students.filter((s: Student) => s.feePaidStatus === 'paid').length;
    const unpaidStudents = totalStudents - paidStudents;
    const totalCollected = store.students.reduce((sum: number, s: Student) => sum + (s.feePaidAmount || 0), 0);
    const totalDue = store.students.reduce((sum: number, s: Student) => sum + (s.feeDueAmount || 0), 0);

    return {
      totalStudents,
      paidStudents,
      unpaidStudents,
      totalCollected,
      totalDue,
      recentTransactions: store.fees || [],
    };
  },

  async getFeeRecords(): Promise<{ records: FeeRecord[] }> {
    const overview = await this.getFeeOverview();
    return { records: overview.recentTransactions || [] };
  },

  async getStudentFeeRecords(studentId: string): Promise<{ records: FeeRecord[] }> {
    try {
      const res = await fetch(`${API_BASE}/fees/student/${studentId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const store = getLocalStore();
    const recs = store.fees.filter((f: FeeRecord) => f.studentId === studentId);
    return { records: recs };
  },

  async updateFeeStatus(
    studentIdOrPayload:
      | string
      | {
          studentId: string;
          feeStatus: FeeStatus;
          amount: number;
          paymentMode: string;
          remarks: string;
          privilegedConfirmation?: boolean;
        },
    secondPayload?: {
      status: 'paid' | 'unpaid';
      amount: number;
      paymentMode: string;
      remarks?: string;
    }
  ) {
    let payload: any;
    if (typeof studentIdOrPayload === 'string') {
      payload = {
        studentId: studentIdOrPayload,
        feeStatus: secondPayload?.status || 'paid',
        amount: secondPayload?.amount || 0,
        paymentMode: secondPayload?.paymentMode || 'Cash',
        remarks: secondPayload?.remarks || '',
      };
    } else {
      payload = studentIdOrPayload;
    }

    try {
      const res = await fetch(`${API_BASE}/fees/update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const store = getLocalStore();
    const stIndex = store.students.findIndex((s: Student) => s.id === payload.studentId);
    if (stIndex !== -1) {
      const st = store.students[stIndex];
      st.feePaidStatus = payload.feeStatus;
      if (payload.feeStatus === 'paid') {
        st.feePaidAmount = (st.feePaidAmount || 0) + Number(payload.amount || 0);
        st.feeDueAmount = Math.max(0, (st.feeDueAmount || 0) - Number(payload.amount || 0));
        st.feeLastPaidDate = new Date().toISOString();
        st.paymentMode = payload.paymentMode || 'Cash';

        const newRec: FeeRecord = {
          id: `fee-${Date.now()}`,
          studentId: st.id,
          studentRoll: st.rollNumber,
          studentName: st.fullName,
          className: st.className,
          amount: Number(payload.amount || 0),
          dueAmount: st.feeDueAmount || 0,
          status: 'paid',
          paymentMode: payload.paymentMode || 'Cash',
          markedBy: 'dev-001',
          markedByName: 'Admin',
          transactionDate: new Date().toISOString(),
          receiptNumber: `REC-${st.rollNumber}-${Date.now().toString().slice(-4)}`,
          remarks: payload.remarks || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.fees.unshift(newRec);
      } else {
        st.feeDueAmount = Number(payload.amount || 500);
      }
      saveLocalStore(store);
    }
    return { success: true };
  },

  // Notices
  async getNotices(className?: string): Promise<{ notices: Notice[] }> {
    const query = new URLSearchParams();
    if (className) query.set('className', className);

    try {
      const res = await fetch(`${API_BASE}/notices?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        cacheData(`notices_${className || 'all'}`, data);
        return data;
      }
    } catch (err) {}

    const store = getLocalStore();
    let notices = [...store.notices];
    if (className && className !== 'all') {
      notices = notices.filter((n: Notice) => n.targetClass === 'All' || n.targetClass === 'all' || n.targetClass === className);
    }
    return { notices };
  },

  async createNotice(payload: {
    title: string;
    content: string;
    targetClass: string;
    priority: 'normal' | 'urgent' | 'announcement';
  }): Promise<{ notice: Notice }> {
    try {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const store = getLocalStore();
    const newNotice: Notice = {
      id: `not-${Date.now()}`,
      title: payload.title,
      content: payload.content,
      targetClass: payload.targetClass,
      priority: payload.priority as any,
      authorId: 'dev-001',
      authorName: 'Admin (Manasthali Tutions)',
      authorRole: 'developer',
      createdAt: new Date().toISOString(),
      readByStudentIds: [],
    };
    store.notices.unshift(newNotice);
    saveLocalStore(store);
    return { notice: newNotice };
  },

  async markNoticeRead(noticeId: string) {
    try {
      await fetch(`${API_BASE}/notices/${noticeId}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {}
  },

  // Doubts
  async getDoubts(params?: { studentId?: string; className?: string }): Promise<{ doubts: Doubt[] }> {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.className) query.set('className', params.className);

    try {
      const res = await fetch(`${API_BASE}/doubts?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        cacheData('doubts_list', data);
        return data;
      }
    } catch (err) {}

    const store = getLocalStore();
    let doubts = [...store.doubts];
    if (params?.studentId) {
      doubts = doubts.filter((d: Doubt) => d.studentId === params.studentId);
    }
    if (params?.className) {
      doubts = doubts.filter((d: Doubt) => d.className === params.className);
    }
    return { doubts };
  },

  async createDoubt(payload: any): Promise<{ doubt: Doubt }> {
    try {
      const res = await fetch(`${API_BASE}/doubts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const store = getLocalStore();
    const newDoubt: Doubt = {
      id: `dbt-${Date.now()}`,
      studentId: payload.studentId || 'stu-1',
      studentRoll: payload.studentRoll || 1,
      studentName: payload.studentName || 'Student',
      className: payload.className || 'Class 10',
      title: payload.title || payload.question || 'Doubt Question',
      subject: payload.subject || 'General',
      description: payload.description || payload.question || payload.title || '',
      imageUrl: payload.imageUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
    };
    store.doubts.unshift(newDoubt);
    saveLocalStore(store);
    return { doubt: newDoubt };
  },

  async replyToDoubt(doubtId: string, message: string, imageUrl?: string): Promise<{ doubt: Doubt }> {
    try {
      const res = await fetch(`${API_BASE}/doubts/${doubtId}/reply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, imageUrl }),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const store = getLocalStore();
    const dIndex = store.doubts.findIndex((d: Doubt) => d.id === doubtId);
    if (dIndex !== -1) {
      store.doubts[dIndex].status = 'answered';
      store.doubts[dIndex].updatedAt = new Date().toISOString();
      store.doubts[dIndex].replies.push({
        id: `rep-${Date.now()}`,
        doubtId,
        authorId: 'dev-001',
        authorName: 'Admin / Teacher',
        authorRole: 'teacher',
        content: message,
        imageUrl,
        createdAt: new Date().toISOString(),
      });
      saveLocalStore(store);
      return { doubt: store.doubts[dIndex] };
    }
    return {
      doubt: {
        id: doubtId,
        studentId: '',
        studentRoll: 0,
        studentName: '',
        className: '',
        title: '',
        subject: '',
        description: '',
        status: 'answered',
        createdAt: '',
        updatedAt: '',
        replies: [],
      },
    };
  },

  async updateDoubtStatus(doubtId: string, status: string): Promise<{ doubt: Doubt }> {
    const res = await fetch(`${API_BASE}/doubts/${doubtId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  // Teachers & Audit
  async getTeachers(): Promise<{ teachers: Teacher[] }> {
    const res = await fetch(`${API_BASE}/teachers`, { headers: getAuthHeaders() });
    if (!res.ok) return { teachers: [] };
    return res.json();
  },

  async createTeacher(teacher: any): Promise<{ teacher: Teacher }> {
    const res = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(teacher),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create teacher' }));
      throw new Error(err.error || 'Error creating teacher');
    }
    return res.json();
  },

  async getAuditLogs(params?: { entityType?: string; actorRole?: string; limit?: number }): Promise<{ logs: AuditLog[] }> {
    const query = new URLSearchParams();
    if (params?.entityType) query.set('entityType', params.entityType);
    if (params?.actorRole) query.set('actorRole', params.actorRole);
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return { logs: [] };
    return res.json();
  },

  async getSystemStats() {
    const res = await fetch(`${API_BASE}/system/stats`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  },

  async resetSystemDatabase() {
    const res = await fetch(`${API_BASE}/system/reset`, { method: 'POST', headers: getAuthHeaders() });
    return res.ok;
  },

  // Image Upload (Cloudinary signed or fallback)
  async uploadImage(base64Image: string, folder: string = 'tuition_students'): Promise<string> {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image: base64Image, folder }),
    });
    if (!res.ok) {
      throw new Error('Image upload failed');
    }
    const data = await res.json();
    return data.url;
  },

  // Batch Offline Sync
  async syncBatch(items: any[]) {
    const res = await fetch(`${API_BASE}/sync/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items }),
    });
    return res.json();
  },
};
