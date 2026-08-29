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

export const api = {
  // Diagnostics
  async checkHealth(): Promise<{
    status: string;
    database: { connected: boolean; message?: string; urlPresent: boolean };
    cloudinary: { configured: boolean; cloudName?: string; apiKeyPresent: boolean; apiSecretPresent: boolean };
  }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    return res.json();
  },

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
      const err = await res.json().catch(() => ({ error: 'Invalid credentials or database connection failed.' }));
      throw new Error(err.error || 'Authentication failed. Please verify credentials.');
    }

    const data = await res.json();
    if (data.session) {
      localStorage.setItem('tuition_user_session', JSON.stringify(data.session));
      return data;
    }
    throw new Error('Authentication response invalid.');
  },

  async getMe(): Promise<{ session: UserSession }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Not authenticated');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {}
    localStorage.removeItem('tuition_user_session');
  },

  // Students (Direct PostgreSQL query)
  async getStudents(params?: {
    search?: string;
    className?: string;
    feeStatus?: string;
  }): Promise<{
    students: Student[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.className) query.set('className', params.className);
    if (params?.feeStatus) query.set('feeStatus', params.feeStatus);

    const res = await fetch(`${API_BASE}/students?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch students from PostgreSQL' }));
      throw new Error(err.error || 'Failed to fetch students from PostgreSQL database.');
    }
    return res.json();
  },

  async getStudent(id: string): Promise<{ student: Student }> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Student not found in database' }));
      throw new Error(err.error || 'Student not found');
    }
    return res.json();
  },

  async createStudent(studentData: any): Promise<{ student: Student }> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to enroll student in database' }));
      throw new Error(err.error || 'Failed to enroll student.');
    }
    return res.json();
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<{ student: Student }> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update student in database' }));
      throw new Error(err.error || 'Failed to update student.');
    }
    return res.json();
  },

  async deleteStudent(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete student from database' }));
      throw new Error(err.error || 'Failed to delete student.');
    }
    return true;
  },

  // Attendance (Direct PostgreSQL)
  async getAttendance(date: string, className?: string): Promise<{ attendance: AttendanceRecord[]; date: string }> {
    const query = new URLSearchParams({ date });
    if (className && className !== 'All') query.set('className', className);

    const res = await fetch(`${API_BASE}/attendance?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch attendance from database.');
    }
    return res.json();
  },

  async getAttendanceRecords(params?: { date?: string; className?: string; studentId?: string }): Promise<{ records: AttendanceRecord[] }> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.className && params.className !== 'All') query.set('className', params.className);
    if (params?.studentId) query.set('studentId', params.studentId);

    const res = await fetch(`${API_BASE}/attendance?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { records: [] };
    const data = await res.json();
    return { records: data.attendance || [] };
  },

  async getStudentAttendance(studentId: string): Promise<{ history: AttendanceRecord[] }> {
    const res = await fetch(`${API_BASE}/attendance?studentId=${encodeURIComponent(studentId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { history: [] };
    const data = await res.json();
    return { history: data.attendance || [] };
  },

  async markAttendanceBatch(
    records: Array<{
      studentId: string;
      studentRoll: number;
      studentName: string;
      className: string;
      date: string;
      status: 'present' | 'absent' | 'late';
      remarks?: string;
    }>
  ) {
    const res = await fetch(`${API_BASE}/attendance/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ records }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record attendance in database' }));
      throw new Error(err.error || 'Server error recording attendance.');
    }
    return res.json();
  },

  async saveAttendanceBatch(records: Array<{ studentId: string; studentRoll?: number; studentName?: string; className?: string; status: 'present' | 'absent' | 'late'; date: string }>) {
    const res = await fetch(`${API_BASE}/attendance/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ records }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record attendance' }));
      throw new Error(err.error || 'Attendance save error');
    }
    return res.json();
  },

  // Fees (Direct PostgreSQL)
  async getFeeRecords(params?: { studentId?: string; studentRoll?: number; className?: string; status?: string }): Promise<{ records: FeeRecord[] }> {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.studentRoll) query.set('studentRoll', params.studentRoll.toString());
    if (params?.className && params.className !== 'All') query.set('className', params.className);
    if (params?.status && params.status !== 'all') query.set('status', params.status);

    const res = await fetch(`${API_BASE}/fees/records?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load fee transactions from database.');
    }
    return res.json();
  },

  async createFeeRecord(recordData: {
    studentId: string;
    studentRoll: number;
    studentName: string;
    className: string;
    amount: number;
    dueAmount?: number;
    status: 'paid' | 'unpaid' | 'partial';
    paymentMode: 'cash' | 'online' | 'cheque' | 'upi';
    transactionDate: string;
    remarks?: string;
  }): Promise<{ record: FeeRecord }> {
    const res = await fetch(`${API_BASE}/fees/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(recordData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save fee record to PostgreSQL' }));
      throw new Error(err.error || 'Fee creation failed');
    }
    return res.json();
  },

  // Notices (Direct PostgreSQL)
  async getNotices(className?: string): Promise<{ notices: Notice[] }> {
    const query = new URLSearchParams();
    if (className && className !== 'All') query.set('className', className);

    const res = await fetch(`${API_BASE}/notices?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load notices from database.');
    }
    return res.json();
  },

  async createNotice(payload: {
    title: string;
    content: string;
    targetClass: string;
    priority: 'normal' | 'urgent' | 'announcement';
    attachmentUrl?: string;
  }): Promise<{ notice: Notice }> {
    const res = await fetch(`${API_BASE}/notices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to publish notice' }));
      throw new Error(err.error || 'Failed to publish notice to database.');
    }
    return res.json();
  },

  async deleteNotice(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to delete notice.');
    }
    return true;
  },

  // Doubts (Direct PostgreSQL)
  async getDoubts(params?: { studentId?: string; className?: string; status?: string }): Promise<{ doubts: Doubt[] }> {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.className && params.className !== 'All') query.set('className', params.className);
    if (params?.status && params.status !== 'all') query.set('status', params.status);

    const res = await fetch(`${API_BASE}/doubts?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load doubts from database.');
    }
    return res.json();
  },

  async createDoubt(payload: {
    studentId: string;
    studentRoll: number;
    studentName: string;
    className: string;
    title: string;
    description: string;
    imageUrl?: string;
  }): Promise<{ doubt: Doubt }> {
    const res = await fetch(`${API_BASE}/doubts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit doubt' }));
      throw new Error(err.error || 'Failed to submit doubt to database.');
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
      const err = await res.json().catch(() => ({ error: 'Failed to post reply' }));
      throw new Error(err.error || 'Failed to reply to doubt.');
    }
    return res.json();
  },

  // Teachers & Faculty (Direct PostgreSQL)
  async getTeachers(): Promise<{ teachers: Teacher[] }> {
    const res = await fetch(`${API_BASE}/teachers`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error('Failed to load teachers from database.');
    }
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
      throw new Error(err.error || 'Error creating teacher account.');
    }
    return res.json();
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<{ teacher: Teacher }> {
    const res = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update teacher' }));
      throw new Error(err.error || 'Error updating teacher account.');
    }
    return res.json();
  },

  async deleteTeacher(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete teacher' }));
      throw new Error(err.error || 'Error deleting teacher account.');
    }
    return true;
  },

  // Audit Logs (Direct PostgreSQL)
  async getAuditLogs(params?: { entityType?: string; actorRole?: string; limit?: number }): Promise<{ logs: AuditLog[] }> {
    const query = new URLSearchParams();
    if (params?.entityType) query.set('entityType', params.entityType);
    if (params?.actorRole) query.set('actorRole', params.actorRole);
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return { logs: [] };
    return res.json();
  },

  // Image Upload (Direct Cloudinary upload via backend with strict env requirement)
  async uploadImage(base64Image: string, folder: string = 'manasthali_tuition'): Promise<string> {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image: base64Image, folder }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Cloudinary upload failed' }));
      throw new Error(err.error || 'Cloudinary upload failed. Check Cloudinary environment variables.');
    }
    const data = await res.json();
    return data.url;
  },
};
