export type UserRole = 'developer' | 'teacher' | 'student';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  avatarUrl?: string;
  rollNumber?: number; // for student
  studentId?: string; // for student
  token?: string;
}

export type FeeStatus = 'paid' | 'unpaid' | 'partial';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type DoubtStatus = 'pending' | 'answered' | 'closed';
export type NoticePriority = 'normal' | 'urgent' | 'announcement';

export interface Student {
  id: string;
  rollNumber: number;
  fullName: string;
  mobileNumber: string;
  email?: string;
  photoUrl?: string;
  address: string;
  className: string;
  dob: string; // YYYY-MM-DD
  dateOfJoining: string; // YYYY-MM-DD
  feePaidStatus: FeeStatus;
  feeDueAmount: number;
  feePaidAmount?: number;
  feeLastPaidDate?: string;
  paymentMode?: string;
  notes?: string;
  active: boolean;
  createdByTeacherId: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  attendancePercentage?: number;
  totalPresent?: number;
  totalDays?: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentRoll: number;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedBy: string;
  markedByName: string;
  notes?: string;
  updatedAt: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentRoll: number;
  studentName: string;
  className: string;
  amount: number;
  dueAmount: number;
  status: FeeStatus;
  paymentMode?: string;
  receiptNumber?: string;
  transactionDate: string;
  markedBy: string;
  markedByName: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetClass: string; // 'All' or specific class e.g. 'Class 10'
  priority: NoticePriority;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  readByStudentIds: string[];
}

export interface DoubtReply {
  id: string;
  doubtId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message?: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Doubt {
  id: string;
  studentId: string;
  studentRoll: number;
  studentName: string;
  className: string;
  title: string;
  subject?: string;
  description: string;
  imageUrl?: string;
  status: DoubtStatus;
  createdAt: string;
  updatedAt: string;
  replies: DoubtReply[];
}

export interface Teacher {
  id: string;
  username: string;
  name: string;
  email?: string;
  mobile?: string;
  phone?: string;
  subject?: string;
  assignedClasses: string[];
  subjects?: string[];
  active?: boolean;
  joinedDate?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'system';
  action: string;
  entityType: 'student' | 'attendance' | 'fee' | 'notice' | 'doubt' | 'teacher' | 'auth' | 'system';
  entity?: string;
  entityId?: string;
  details: string;
  ip?: string;
}

export interface OfflineSyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: 'student' | 'attendance' | 'fee' | 'doubt' | 'notice';
  payload: any;
  clientTimestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

export interface CloudinaryConfigStatus {
  isConfigured: boolean;
  cloudName: string;
  apiKeyPresent: boolean;
  apiSecretPresent: boolean;
  uploadPreset?: string;
  mode: 'cloudinary' | 'local_fallback';
}

export interface RealtimeMessage {
  type: 
    | 'notice:new'
    | 'attendance:updated'
    | 'fee:updated'
    | 'doubt:created'
    | 'doubt:replied'
    | 'student:created'
    | 'student:updated'
    | 'student:deleted'
    | 'audit:new'
    | 'sync:ack';
  payload: any;
  timestamp: string;
}
