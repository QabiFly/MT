import {
  Student,
  AttendanceRecord,
  FeeRecord,
  Notice,
  Doubt,
  Teacher,
  AuditLog,
  UserSession,
} from '../types/index.js';

const SEED_DATA = {
  students: [
    {
      id: 'stu-1',
      rollNumber: 1,
      fullName: 'Aarav Patel',
      mobileNumber: '9876543210',
      email: 'aarav.patel@gmail.com',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      address: '42 Orchid Heights, MG Road, Pune',
      className: 'Class 10',
      dob: '2009-05-14',
      dateOfJoining: '2024-01-10',
      feePaidStatus: 'paid' as const,
      feeDueAmount: 0,
      feePaidAmount: 500,
      feeLastPaidDate: '2026-08-01T10:00:00.000Z',
      paymentMode: 'UPI / Online',
      notes: 'Exceptional in algebra and geometry.',
      active: true,
      createdByTeacherId: 'teach-001',
      createdByName: 'Prof. Rajesh Sharma',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2026-08-28T15:29:33.439Z',
    },
    {
      id: 'stu-2',
      rollNumber: 2,
      fullName: 'Diya Sharma',
      mobileNumber: '9876543211',
      email: 'diya.sharma@outlook.com',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      address: '18 Garden Crest, Sector 14, Noida',
      className: 'Class 10',
      dob: '2009-08-22',
      dateOfJoining: '2024-02-01',
      feePaidStatus: 'unpaid' as const,
      feeDueAmount: 350,
      feePaidAmount: 0,
      notes: 'Needs additional practice in Trigonometry.',
      active: true,
      createdByTeacherId: 'teach-001',
      createdByName: 'Prof. Rajesh Sharma',
      createdAt: '2024-02-01T10:30:00.000Z',
      updatedAt: '2026-08-28T15:29:33.439Z',
    },
    {
      id: 'stu-3',
      rollNumber: 3,
      fullName: 'Rohan Gupta',
      mobileNumber: '9876543212',
      email: 'rohan.gupta@gmail.com',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      address: '88 Lakeview Apartments, Bandra West, Mumbai',
      className: 'Class 12',
      dob: '2007-03-10',
      dateOfJoining: '2023-07-15',
      feePaidStatus: 'paid' as const,
      feeDueAmount: 0,
      feePaidAmount: 750,
      feeLastPaidDate: '2026-08-05T14:30:00.000Z',
      paymentMode: 'Net Banking',
      notes: 'Preparing for engineering entrance exams.',
      active: true,
      createdByTeacherId: 'teach-001',
      createdByName: 'Prof. Rajesh Sharma',
      createdAt: '2023-07-15T11:00:00.000Z',
      updatedAt: '2026-08-28T15:29:33.439Z',
    },
    {
      id: 'stu-4',
      rollNumber: 4,
      fullName: 'Ananya Iyer',
      mobileNumber: '9876543213',
      email: 'ananya.iyer@gmail.com',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      address: '104 Palm Grove, Indiranagar, Bengaluru',
      className: 'Class 11',
      dob: '2008-11-05',
      dateOfJoining: '2023-09-01',
      feePaidStatus: 'unpaid' as const,
      feeDueAmount: 600,
      feePaidAmount: 0,
      notes: 'Active in doubt queries and discussion forums.',
      active: true,
      createdByTeacherId: 'teach-002',
      createdByName: 'Dr. Anita Verma',
      createdAt: '2023-09-01T08:00:00.000Z',
      updatedAt: '2026-08-28T15:29:33.439Z',
    },
    {
      id: 'stu-5',
      rollNumber: 5,
      fullName: 'Kabir Mehta',
      mobileNumber: '9876543214',
      address: '15 Civil Lines, Jaipur',
      className: 'Class 9',
      dob: '2010-01-30',
      dateOfJoining: '2024-04-10',
      feePaidStatus: 'paid' as const,
      feeDueAmount: 0,
      feePaidAmount: 400,
      feeLastPaidDate: '2026-08-10T11:20:00.000Z',
      paymentMode: 'Cash Receipt',
      notes: 'Consistently completes weekly assignments.',
      active: true,
      createdByTeacherId: 'teach-001',
      createdByName: 'Prof. Rajesh Sharma',
      createdAt: '2024-04-10T12:00:00.000Z',
      updatedAt: '2026-08-28T15:29:33.439Z',
    },
  ],
  teachers: [
    {
      id: 'teach-001',
      name: 'Prof. Rajesh Sharma',
      username: 'teacher1',
      email: 'rajesh.sharma@manasthalitutions.com',
      mobileNumber: '9820011223',
      subject: 'Mathematics & Mechanics',
      assignedClasses: ['Class 9', 'Class 10', 'Class 12'],
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'teach-002',
      name: 'Dr. Anita Verma',
      username: 'anita.verma',
      email: 'anita.verma@manasthalitutions.com',
      mobileNumber: '9820044556',
      subject: 'Physics & Chemistry',
      assignedClasses: ['Class 10', 'Class 11'],
      active: true,
      createdAt: '2023-03-15T00:00:00.000Z',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    },
  ],
  notices: [
    {
      id: 'not-001',
      title: 'Term-1 Comprehensive Examination Schedule Released',
      content: 'The Term-1 examinations for Class 9, 10, 11, and 12 will commence from September 10th. Detailed date sheet is available at the center notice desk. Students are advised to clear pending fee dues prior to hall ticket issuance.',
      targetClass: 'All',
      priority: 'urgent' as const,
      authorId: 'dev-001',
      authorName: 'Admin (Manasthali Tutions)',
      authorRole: 'developer' as const,
      createdAt: '2026-08-25T10:00:00.000Z',
      readByStudentIds: [],
    },
    {
      id: 'not-002',
      title: 'Class 10 Extra Problem-Solving Workshop',
      content: 'Special intensive numerical workshop on Quadratic Equations and Coordinate Geometry scheduled for this Sunday from 9:00 AM to 12:30 PM.',
      targetClass: 'Class 10',
      priority: 'urgent' as const,
      authorId: 'teach-001',
      authorName: 'Prof. Rajesh Sharma',
      authorRole: 'teacher' as const,
      createdAt: '2026-08-26T14:30:00.000Z',
      readByStudentIds: [],
    },
  ],
  fees: [
    {
      id: 'fee-rec-001',
      studentId: 'stu-1',
      studentRoll: 1,
      studentName: 'Aarav Patel',
      className: 'Class 10',
      amount: 500,
      dueAmount: 0,
      status: 'paid' as const,
      paymentMode: 'UPI / Online',
      markedBy: 'dev-001',
      markedByName: 'Zeaipc (Admin)',
      transactionDate: '2026-08-01T10:00:00.000Z',
      receiptNumber: 'REC-1-AUG26',
      remarks: 'Full monthly tuition fee received.',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'fee-rec-003',
      studentId: 'stu-3',
      studentRoll: 3,
      studentName: 'Rohan Gupta',
      className: 'Class 12',
      amount: 750,
      dueAmount: 0,
      status: 'paid' as const,
      paymentMode: 'Net Banking',
      markedBy: 'dev-001',
      markedByName: 'Zeaipc (Admin)',
      transactionDate: '2026-08-05T14:30:00.000Z',
      receiptNumber: 'REC-3-AUG26',
      remarks: 'Monthly tuition fees paid.',
      createdAt: '2026-08-05T14:30:00.000Z',
      updatedAt: '2026-08-05T14:30:00.000Z',
    },
  ],
  doubts: [] as Doubt[],
  attendance: [] as AttendanceRecord[],
};

const STORAGE_KEY = 'manasthali_local_data_v1';

export function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        students: parsed.students || SEED_DATA.students,
        teachers: parsed.teachers || SEED_DATA.teachers,
        notices: parsed.notices || SEED_DATA.notices,
        fees: parsed.fees || SEED_DATA.fees,
        doubts: parsed.doubts || SEED_DATA.doubts,
        attendance: parsed.attendance || SEED_DATA.attendance,
      };
    }
  } catch (e) {}

  return { ...SEED_DATA };
}

export function saveLocalStore(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

export function normalizeDobString(d: string): string {
  if (!d) return '';
  const clean = d.trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return clean;
}

export function authenticateLocally(payload: {
  role?: string;
  username?: string;
  password?: string;
  rollNumber?: number | string;
  dob?: string;
}): UserSession | null {
  const store = getLocalStore();
  const cleanUser = (payload.username || '').trim().toLowerCase();
  const cleanPass = (payload.password || '').trim();

  // 1. Check Developer / Superadmin
  const validDevUsers = ['zeaipc', 'admin', 'developer', 'admin@manasthalitutions.com', 'admin@tuition.dev'];
  const validDevPass = ['arman786', 'admin123', 'admin', 'password'];

  if (
    (payload.role === 'developer' || !payload.role || cleanUser === 'zeaipc' || cleanUser === 'admin') &&
    validDevUsers.includes(cleanUser) &&
    validDevPass.includes(cleanPass)
  ) {
    return {
      id: 'dev-001',
      username: cleanUser || 'zeaipc',
      name: 'Zeaipc (Superadmin)',
      role: 'developer',
      email: 'admin@manasthalitutions.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };
  }

  // 2. Check Teacher
  const validTeacherPass = ['teach123', 'arman786', 'password', 'teacher', 'admin123'];
  const teacher = store.teachers.find(
    (t: Teacher) =>
      (t.username.toLowerCase() === cleanUser || t.email.toLowerCase() === cleanUser || cleanUser === 'teacher1' || cleanUser === 'teacher') &&
      (validTeacherPass.includes(cleanPass) || cleanPass === 'teach123')
  );

  if (teacher) {
    return {
      id: teacher.id,
      username: teacher.username,
      name: teacher.name,
      role: 'teacher',
      email: teacher.email,
      assignedClasses: teacher.assignedClasses,
      avatarUrl: teacher.photoUrl,
    };
  }

  // 3. Check Student by Roll Number & DOB
  const rollNum = Number(payload.rollNumber);
  if (!isNaN(rollNum) && payload.dob) {
    const targetDob = normalizeDobString(payload.dob);
    const student = store.students.find(
      (s: Student) =>
        s.rollNumber === rollNum && (s.dob === targetDob || normalizeDobString(s.dob) === targetDob)
    );

    if (student) {
      return {
        id: student.id,
        username: `roll_${student.rollNumber}`,
        name: student.fullName,
        role: 'student',
        email: student.email,
        rollNumber: student.rollNumber,
        studentId: student.id,
        avatarUrl: student.photoUrl,
      };
    }
  }

  // General fallback for default developer if username & password match
  if (cleanUser === 'zeaipc' && (cleanPass === 'arman786' || cleanPass === 'admin123')) {
    return {
      id: 'dev-001',
      username: 'zeaipc',
      name: 'Zeaipc (Superadmin)',
      role: 'developer',
      email: 'admin@manasthalitutions.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };
  }

  return null;
}
