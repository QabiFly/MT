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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Authentication error');
    }
    const data = await res.json();
    localStorage.setItem('tuition_user_session', JSON.stringify(data.session));
    return data;
  },

  async getMe(): Promise<{ session: UserSession }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
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
      throw err;
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
    return 1;
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
      throw err;
    }
  },

  async createStudent(studentData: any): Promise<{ student: Student; queuedOffline?: boolean }> {
    if (!navigator.onLine) {
      enqueueOfflineAction('student', 'create', studentData);
      return {
        student: {
          ...studentData,
          id: `temp-${Date.now()}`,
          rollNumber: 999,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        queuedOffline: true,
      };
    }

    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create student' }));
      throw new Error(err.error || 'Server error creating student');
    }
    return res.json();
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<{ student: Student }> {
    if (!navigator.onLine) {
      enqueueOfflineAction('student', 'update', { id, ...updates });
      return { student: { id, ...updates } as Student };
    }

    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update student' }));
      throw new Error(err.error || 'Error updating student');
    }
    return res.json();
  },

  async deleteStudent(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
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
      if (!res.ok) throw new Error('Failed to fetch fee overview');
      const data = await res.json();
      cacheData('fee_overview', data);
      return data;
    } catch (err) {
      const cached = getCachedData<any>('fee_overview');
      if (cached) return cached;
      return { totalStudents: 0, paidStudents: 0, unpaidStudents: 0, totalCollected: 0, totalDue: 0, recentTransactions: [] };
    }
  },

  async getFeeRecords(): Promise<{ records: FeeRecord[] }> {
    const overview = await this.getFeeOverview();
    return { records: overview.recentTransactions || [] };
  },

  async getStudentFeeRecords(studentId: string): Promise<{ records: FeeRecord[] }> {
    const res = await fetch(`${API_BASE}/fees/student/${studentId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { records: [] };
    return res.json();
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

    if (!navigator.onLine) {
      enqueueOfflineAction('fee', 'update', payload);
      return { success: true, queuedOffline: true };
    }

    const res = await fetch(`${API_BASE}/fees/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Fee update failed' }));
      throw new Error(err.error || 'Failed to update fee status');
    }
    return res.json();
  },

  // Notices
  async getNotices(className?: string): Promise<{ notices: Notice[] }> {
    const query = new URLSearchParams();
    if (className) query.set('className', className);

    try {
      const res = await fetch(`${API_BASE}/notices?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch notices');
      const data = await res.json();
      cacheData(`notices_${className || 'all'}`, data);
      return data;
    } catch (err) {
      const cached = getCachedData<any>(`notices_${className || 'all'}`);
      if (cached) return cached;
      return { notices: [] };
    }
  },

  async createNotice(payload: {
    title: string;
    content: string;
    targetClass: string;
    priority: 'normal' | 'urgent' | 'announcement';
  }): Promise<{ notice: Notice }> {
    const res = await fetch(`${API_BASE}/notices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create notice' }));
      throw new Error(err.error || 'Server error creating notice');
    }
    return res.json();
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
      if (!res.ok) throw new Error('Failed to fetch doubts');
      const data = await res.json();
      cacheData('doubts_list', data);
      return data;
    } catch (err) {
      const cached = getCachedData<any>('doubts_list');
      if (cached) return cached;
      return { doubts: [] };
    }
  },

  async createDoubt(payload: { title: string; subject?: string; description: string; imageUrl?: string }): Promise<{ doubt: Doubt }> {
    if (!navigator.onLine) {
      enqueueOfflineAction('doubt', 'create', payload);
      return {
        doubt: {
          id: `temp-${Date.now()}`,
          studentId: 'offline',
          studentRoll: 0,
          studentName: 'Me',
          className: '',
          title: payload.title,
          subject: payload.subject || 'General',
          description: payload.description,
          imageUrl: payload.imageUrl,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          replies: [],
        },
      };
    }

    const res = await fetch(`${API_BASE}/doubts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit doubt' }));
      throw new Error(err.error || 'Server error creating doubt');
    }
    return res.json();
  },

  async replyToDoubt(doubtId: string, message: string, imageUrl?: string): Promise<{ doubt: Doubt }> {
    const res = await fetch(`${API_BASE}/doubts/${doubtId}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, imageUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit reply' }));
      throw new Error(err.error || 'Server error submitting reply');
    }
    return res.json();
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
