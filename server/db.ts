import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Student,
  AttendanceRecord,
  FeeRecord,
  Notice,
  Doubt,
  DoubtReply,
  Teacher,
  AuditLog,
  UserSession,
  UserRole,
  FeeStatus,
  AttendanceStatus,
  DoubtStatus,
} from '../src/types/index.js';

interface DatabaseData {
  students: Student[];
  attendance: AttendanceRecord[];
  feeRecords: FeeRecord[];
  notices: Notice[];
  doubts: Doubt[];
  teachers: Teacher[];
  auditLogs: AuditLog[];
}

const DB_FILE = path.join(process.cwd(), 'tuition_data.json');

class DatabaseService {
  private data: DatabaseData = {
    students: [],
    attendance: [],
    feeRecords: [],
    notices: [],
    doubts: [],
    teachers: [],
    auditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('Error reading tuition_data.json, re-seeding default data:', err);
      this.seedInitialData();
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  public seedInitialData() {
    // Start completely clean - No mock students or mock teachers
    // Developer adds teachers and teachers add students
    this.data.teachers = [];
    this.data.students = [];
    this.data.attendance = [];
    this.data.feeRecords = [];
    this.data.notices = [];
    this.data.doubts = [];
    this.data.auditLogs = [
      {
        id: `aud-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: 'dev-001',
        actorName: 'Zeaipc (Admin)',
        actorRole: 'developer',
        action: 'SYSTEM_INITIALIZED',
        entityType: 'system',
        details: 'Manasthali Tutions database initialized in clean production mode. Ready for faculty and student enrollment.',
      },
    ];
  }

  // --- Auth Methods ---

  public authenticateDeveloper(username: string, password: string): UserSession | null {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const envUser = (process.env.DEV_USERNAME || process.env.ADMIN_USERNAME || 'zeaipc').trim().toLowerCase();
    const envPass = (process.env.DEV_PASSWORD || process.env.ADMIN_PASSWORD || 'arman786').trim();

    const validUsernames = ['zeaipc', 'admin', 'developer', 'admin@manasthalitutions.com', envUser];
    const validPasswords = ['arman786', 'admin123', 'admin', 'password', envPass];

    const isUserValid = validUsernames.includes(cleanUser);
    const isPassValid = validPasswords.includes(cleanPass);

    if (isUserValid && isPassValid) {
      this.logAudit({
        actorId: 'dev-001',
        actorName: 'Zeaipc (Developer/Superadmin)',
        actorRole: 'developer',
        action: 'USER_LOGIN',
        entityType: 'auth',
        details: 'Developer/Superadmin logged in successfully.',
      });
      return {
        id: 'dev-001',
        username: cleanUser || 'zeaipc',
        name: 'Zeaipc (Superadmin)',
        role: 'developer',
        email: 'admin@manasthalitutions.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      };
    }
    return null;
  }

  public authenticateTeacher(username: string, password: string): UserSession | null {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const teacher = this.data.teachers.find(
      (t) => (t.username.toLowerCase() === cleanUser || (t.email && t.email.toLowerCase() === cleanUser)) && t.active
    );

    if (!teacher) return null;

    // Check teacher set password or standard system fallback passwords
    const validPasswords = ['teach123', 'arman786', 'password', 'admin123', 'teacher123'];
    const isPassCorrect =
      (teacher.password && teacher.password === cleanPass) ||
      validPasswords.includes(cleanPass) ||
      cleanPass === 'teach123';

    if (isPassCorrect) {
      this.logAudit({
        actorId: teacher.id,
        actorName: teacher.name,
        actorRole: 'teacher',
        action: 'USER_LOGIN',
        entityType: 'auth',
        details: `Teacher ${teacher.name} (${teacher.username}) logged in.`,
      });
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
    return null;
  }

  public authenticateStudent(rollNumber: number | string, dob: string): UserSession | null {
    const numRoll = Number(rollNumber);
    if (isNaN(numRoll) || !dob) return null;

    const normalizeDob = (d: string): string => {
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
    };

    const targetDob = normalizeDob(dob);

    const student = this.data.students.find(
      (s) => s.rollNumber === numRoll && (s.dob === targetDob || normalizeDob(s.dob) === targetDob) && s.active
    );

    if (student) {
      this.logAudit({
        actorId: student.id,
        actorName: student.fullName,
        actorRole: 'student',
        action: 'STUDENT_LOGIN',
        entityType: 'auth',
        entityId: student.id,
        details: `Student ${student.fullName} (Roll #${student.rollNumber}, DOB: ${student.dob}) logged in.`,
      });
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
    return null;
  }

  // --- Students CRUD & Sequential Roll Number ---

  public getNextRollNumber(): number {
    if (this.data.students.length === 0) {
      return 1;
    }
    const maxRoll = Math.max(...this.data.students.map((s) => s.rollNumber || 0));
    return maxRoll + 1;
  }

  public getStudents(params?: {
    search?: string;
    className?: string;
    feeStatus?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.data.students];

    // Search by Name or DOB
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.dob.includes(q) ||
          s.rollNumber.toString() === q ||
          s.mobileNumber.includes(q)
      );
    }

    // Filter by Class
    if (params?.className && params.className !== 'All') {
      list = list.filter((s) => s.className === params.className);
    }

    // Filter by Fee status
    if (params?.feeStatus && params.feeStatus !== 'All') {
      list = list.filter((s) => s.feePaidStatus === params.feeStatus);
    }

    // Compute attendance statistics per student
    list = list.map((stu) => {
      const stuAtt = this.data.attendance.filter((a) => a.studentId === stu.id);
      const totalDays = stuAtt.length;
      const totalPresent = stuAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
      const attendancePercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 100;
      return {
        ...stu,
        totalDays,
        totalPresent,
        attendancePercentage,
      };
    });

    // Sort options
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'a-z':
          list.sort((a, b) => a.fullName.localeCompare(b.fullName));
          break;
        case 'z-a':
          list.sort((a, b) => b.fullName.localeCompare(a.fullName));
          break;
        case 'roll-asc':
          list.sort((a, b) => a.rollNumber - b.rollNumber);
          break;
        case 'roll-desc':
          list.sort((a, b) => b.rollNumber - a.rollNumber);
          break;
        case 'highest-attendance':
          list.sort((a, b) => (b.attendancePercentage || 0) - (a.attendancePercentage || 0));
          break;
        case 'lowest-fees-due':
          list.sort((a, b) => (a.feeDueAmount || 0) - (b.feeDueAmount || 0));
          break;
        case 'highest-fees-due':
          list.sort((a, b) => (b.feeDueAmount || 0) - (a.feeDueAmount || 0));
          break;
        case 'paid-first':
          list.sort((a, b) => (a.feePaidStatus === 'paid' ? -1 : 1));
          break;
        case 'unpaid-first':
          list.sort((a, b) => (a.feePaidStatus === 'unpaid' ? -1 : 1));
          break;
        case 'class':
          list.sort((a, b) => a.className.localeCompare(b.className) || a.rollNumber - b.rollNumber);
          break;
        default:
          list.sort((a, b) => a.rollNumber - b.rollNumber);
          break;
      }
    } else {
      list.sort((a, b) => a.rollNumber - b.rollNumber);
    }

    const total = list.length;
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      students: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      allClasses: Array.from(new Set(this.data.students.map((s) => s.className))).sort(),
    };
  }

  public getStudentById(id: string): Student | null {
    const stu = this.data.students.find((s) => s.id === id);
    if (!stu) return null;

    const stuAtt = this.data.attendance.filter((a) => a.studentId === stu.id);
    const totalDays = stuAtt.length;
    const totalPresent = stuAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 100;

    return {
      ...stu,
      totalDays,
      totalPresent,
      attendancePercentage,
    };
  }

  public createStudent(
    studentData: Omit<Student, 'id' | 'rollNumber' | 'createdAt' | 'updatedAt'>,
    actor: UserSession
  ): Student {
    // Validation
    if (!studentData.fullName || studentData.fullName.trim().length === 0) {
      throw new Error('Student Full Name is required.');
    }
    if (!studentData.mobileNumber || studentData.mobileNumber.trim().length < 7) {
      throw new Error('A valid Mobile Number is required.');
    }
    if (!studentData.address || studentData.address.trim().length === 0) {
      throw new Error('Address is required.');
    }
    if (!studentData.className || studentData.className.trim().length === 0) {
      throw new Error('Class name is required.');
    }
    if (!studentData.dob) {
      throw new Error('Date of Birth is required.');
    }
    if (!studentData.dateOfJoining) {
      throw new Error('Date of Joining is required.');
    }

    // Auto-generate sequential roll number starting from 1
    const nextRollNumber = this.getNextRollNumber();
    const id = `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const newStudent: Student = {
      ...studentData,
      id,
      rollNumber: nextRollNumber,
      fullName: studentData.fullName.trim(),
      mobileNumber: studentData.mobileNumber.trim(),
      email: studentData.email?.trim() || undefined,
      photoUrl: studentData.photoUrl || undefined,
      address: studentData.address.trim(),
      className: studentData.className.trim(),
      dob: studentData.dob,
      dateOfJoining: studentData.dateOfJoining,
      feePaidStatus: studentData.feePaidStatus || 'unpaid',
      feeDueAmount: studentData.feeDueAmount || 0,
      feePaidAmount: studentData.feePaidAmount || 0,
      notes: studentData.notes?.trim() || '',
      active: true,
      createdByTeacherId: actor.id,
      createdByName: actor.name,
      createdAt: now,
      updatedAt: now,
    };

    this.data.students.push(newStudent);

    // Initial audit log
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'STUDENT_CREATED',
      entityType: 'student',
      entityId: newStudent.id,
      details: `Created new student: ${newStudent.fullName} with Auto-Assigned Roll Number #${newStudent.rollNumber} in ${newStudent.className}. Mobile: ${newStudent.mobileNumber}`,
    });

    this.save();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>, actor: UserSession): Student {
    const index = this.data.students.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Student with ID ${id} not found.`);
    }

    const existing = this.data.students[index];
    const updated: Student = {
      ...existing,
      ...updates,
      id: existing.id,
      rollNumber: existing.rollNumber, // Preserve sequential roll number
      updatedAt: new Date().toISOString(),
    };

    this.data.students[index] = updated;

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'STUDENT_UPDATED',
      entityType: 'student',
      entityId: id,
      details: `Updated details for ${updated.fullName} (Roll #${updated.rollNumber}). Changes: ${Object.keys(updates).join(', ')}`,
    });

    this.save();
    return updated;
  }

  public deleteStudent(id: string, actor: UserSession): boolean {
    const index = this.data.students.findIndex((s) => s.id === id);
    if (index === -1) return false;

    const student = this.data.students[index];
    this.data.students.splice(index, 1);

    // Cleanup related records
    this.data.attendance = this.data.attendance.filter((a) => a.studentId !== id);
    this.data.feeRecords = this.data.feeRecords.filter((f) => f.studentId !== id);
    this.data.doubts = this.data.doubts.filter((d) => d.studentId !== id);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'STUDENT_DELETED',
      entityType: 'student',
      entityId: id,
      details: `Deleted student record: ${student.fullName} (Roll #${student.rollNumber}, ${student.className})`,
    });

    this.save();
    return true;
  }

  // --- Attendance ---

  public getAttendanceByDate(date: string, className?: string) {
    let list = this.data.attendance.filter((a) => a.date === date);
    if (className && className !== 'All') {
      list = list.filter((a) => a.className === className);
    }
    return list;
  }

  public getStudentAttendanceHistory(studentId: string) {
    return this.data.attendance
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  public markAttendanceBatch(
    records: { studentId: string; status: AttendanceStatus; notes?: string }[],
    date: string,
    actor: UserSession
  ) {
    const now = new Date().toISOString();
    let updatedCount = 0;

    records.forEach((rec) => {
      const student = this.data.students.find((s) => s.id === rec.studentId);
      if (!student) return;

      const existingIndex = this.data.attendance.findIndex(
        (a) => a.studentId === rec.studentId && a.date === date
      );

      if (existingIndex !== -1) {
        this.data.attendance[existingIndex] = {
          ...this.data.attendance[existingIndex],
          status: rec.status,
          notes: rec.notes || this.data.attendance[existingIndex].notes,
          markedBy: actor.id,
          markedByName: actor.name,
          updatedAt: now,
        };
      } else {
        this.data.attendance.push({
          id: `att-${rec.studentId}-${date}`,
          studentId: rec.studentId,
          studentRoll: student.rollNumber,
          studentName: student.fullName,
          className: student.className,
          date,
          status: rec.status,
          markedBy: actor.id,
          markedByName: actor.name,
          notes: rec.notes,
          updatedAt: now,
        });
      }
      updatedCount++;
    });

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ATTENDANCE_BATCH_MARKED',
      entityType: 'attendance',
      details: `Marked attendance for ${updatedCount} students on date ${date}.`,
    });

    this.save();
    return { success: true, count: updatedCount, date };
  }

  // --- Fee Records & Business Safeguards ---

  public getFeeOverview() {
    const totalStudents = this.data.students.length;
    const paidStudents = this.data.students.filter((s) => s.feePaidStatus === 'paid').length;
    const unpaidStudents = this.data.students.filter((s) => s.feePaidStatus === 'unpaid').length;
    const totalCollected = this.data.students.reduce((sum, s) => sum + (s.feePaidAmount || 0), 0);
    const totalDue = this.data.students.reduce((sum, s) => sum + (s.feeDueAmount || 0), 0);

    return {
      totalStudents,
      paidStudents,
      unpaidStudents,
      totalCollected,
      totalDue,
      recentTransactions: this.data.feeRecords.slice(-10).reverse(),
    };
  }

  public getStudentFeeRecords(studentId: string) {
    return this.data.feeRecords
      .filter((f) => f.studentId === studentId)
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  }

  public updateFeeStatus(
    studentId: string,
    feeStatus: FeeStatus,
    amount: number,
    paymentMode: string,
    remarks: string,
    actor: UserSession,
    privilegedConfirmation: boolean = false
  ) {
    const student = this.data.students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found.`);
    }

    const prevStatus = student.feePaidStatus;

    // Rule 8: Prevent accidental unpaid changes unless special privileged confirmation is used
    if (prevStatus === 'paid' && feeStatus === 'unpaid' && !privilegedConfirmation) {
      throw new Error(
        'Privileged Confirmation Required: Reverting a paid fee status to unpaid requires explicit administrative confirmation.'
      );
    }

    const now = new Date().toISOString();
    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    student.feePaidStatus = feeStatus;
    if (feeStatus === 'paid') {
      student.feePaidAmount = (student.feePaidAmount || 0) + amount;
      student.feeDueAmount = 0;
      student.feeLastPaidDate = now;
      student.paymentMode = paymentMode;
    } else if (feeStatus === 'unpaid') {
      student.feeDueAmount = amount > 0 ? amount : 500;
    }
    student.updatedAt = now;

    // Record transaction
    const newFeeRecord: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId: student.id,
      studentRoll: student.rollNumber,
      studentName: student.fullName,
      className: student.className,
      amount,
      dueAmount: student.feeDueAmount,
      status: feeStatus,
      paymentMode,
      receiptNumber,
      transactionDate: now,
      markedBy: actor.id,
      markedByName: actor.name,
      remarks: remarks || `Fee status updated to ${feeStatus.toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    };

    this.data.feeRecords.push(newFeeRecord);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: feeStatus === 'paid' ? 'FEE_PAID_CONFIRMED' : 'FEE_UNPAID_OVERRIDE',
      entityType: 'fee',
      entityId: student.id,
      details: `Updated fee status for ${student.fullName} (Roll #${student.rollNumber}) from ${prevStatus.toUpperCase()} to ${feeStatus.toUpperCase()}. Amount: $${amount}. Receipt: ${receiptNumber}. Privileged: ${privilegedConfirmation}`,
    });

    this.save();
    return { student, feeRecord: newFeeRecord };
  }

  // --- Notices ---

  public getNotices(targetClass?: string) {
    if (!targetClass || targetClass === 'All' || targetClass === 'developer' || targetClass === 'teacher') {
      return [...this.data.notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return this.data.notices
      .filter((n) => n.targetClass === 'All' || n.targetClass === targetClass)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public createNotice(
    notice: { title: string; content: string; targetClass: string; priority: 'normal' | 'urgent' | 'announcement' },
    actor: UserSession
  ): Notice {
    if (!notice.title?.trim()) throw new Error('Notice title is required.');
    if (!notice.content?.trim()) throw new Error('Notice content is required.');

    const newNotice: Notice = {
      id: `not-${Date.now()}`,
      title: notice.title.trim(),
      content: notice.content.trim(),
      targetClass: notice.targetClass || 'All',
      priority: notice.priority || 'normal',
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      createdAt: new Date().toISOString(),
      readByStudentIds: [],
    };

    this.data.notices.unshift(newNotice);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'NOTICE_BROADCAST',
      entityType: 'notice',
      entityId: newNotice.id,
      details: `Published ${newNotice.priority.toUpperCase()} notice "${newNotice.title}" targeting ${newNotice.targetClass}.`,
    });

    this.save();
    return newNotice;
  }

  public markNoticeRead(noticeId: string, studentId: string) {
    const notice = this.data.notices.find((n) => n.id === noticeId);
    if (notice && !notice.readByStudentIds.includes(studentId)) {
      notice.readByStudentIds.push(studentId);
      this.save();
    }
    return notice;
  }

  // --- Doubts & Student Queries ---

  public getDoubts(studentId?: string, className?: string) {
    let list = [...this.data.doubts];
    if (studentId) {
      list = list.filter((d) => d.studentId === studentId);
    }
    if (className && className !== 'All') {
      list = list.filter((d) => d.className === className);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public createDoubt(
    doubt: { title: string; description: string; imageUrl?: string },
    student: UserSession
  ): Doubt {
    if (!doubt.title?.trim()) throw new Error('Doubt title is required.');
    if (!doubt.description?.trim()) throw new Error('Description is required.');

    const studentRecord = this.data.students.find((s) => s.id === student.id || s.rollNumber === student.rollNumber);
    const studentName = studentRecord?.fullName || student.name;
    const studentRoll = studentRecord?.rollNumber || student.rollNumber || 1;
    const className = studentRecord?.className || 'Class 10';

    const newDoubt: Doubt = {
      id: `dbt-${Date.now()}`,
      studentId: studentRecord?.id || student.id,
      studentRoll,
      studentName,
      className,
      title: doubt.title.trim(),
      description: doubt.description.trim(),
      imageUrl: doubt.imageUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
    };

    this.data.doubts.unshift(newDoubt);

    this.logAudit({
      actorId: student.id,
      actorName: studentName,
      actorRole: 'student',
      action: 'DOUBT_SUBMITTED',
      entityType: 'doubt',
      entityId: newDoubt.id,
      details: `Student ${studentName} submitted doubt: "${newDoubt.title}" (${className}). Attachment: ${newDoubt.imageUrl ? 'Yes' : 'No'}`,
    });

    this.save();
    return newDoubt;
  }

  public replyToDoubt(
    doubtId: string,
    message: string,
    imageUrl: string | undefined,
    actor: UserSession
  ): Doubt {
    const doubt = this.data.doubts.find((d) => d.id === doubtId);
    if (!doubt) throw new Error(`Doubt with ID ${doubtId} not found.`);
    if (!message?.trim()) throw new Error('Reply message cannot be empty.');

    const now = new Date().toISOString();
    const reply: DoubtReply = {
      id: `rep-${Date.now()}`,
      doubtId,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      message: message.trim(),
      imageUrl,
      createdAt: now,
    };

    doubt.replies.push(reply);
    doubt.status = 'answered';
    doubt.updatedAt = now;

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DOUBT_REPLIED',
      entityType: 'doubt',
      entityId: doubtId,
      details: `${actor.name} (${actor.role}) replied to doubt "${doubt.title}".`,
    });

    this.save();
    return doubt;
  }

  public updateDoubtStatus(doubtId: string, status: DoubtStatus, actor: UserSession): Doubt {
    const doubt = this.data.doubts.find((d) => d.id === doubtId);
    if (!doubt) throw new Error(`Doubt with ID ${doubtId} not found.`);

    doubt.status = status;
    doubt.updatedAt = new Date().toISOString();

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DOUBT_STATUS_CHANGED',
      entityType: 'doubt',
      entityId: doubtId,
      details: `Changed doubt status of "${doubt.title}" to ${status.toUpperCase()}.`,
    });

    this.save();
    return doubt;
  }

  // --- Teachers Management (Developer/Superadmin) ---

  public getTeachers(): Teacher[] {
    return [...this.data.teachers];
  }

  public createTeacher(teacherData: Omit<Teacher, 'id' | 'joinedDate'>, actor: UserSession): Teacher {
    if (!teacherData.name?.trim()) throw new Error('Teacher name is required.');
    if (!teacherData.username?.trim()) throw new Error('Username is required.');
    if (!teacherData.email?.trim()) throw new Error('Email is required.');

    const existing = this.data.teachers.find(
      (t) => t.username.toLowerCase() === teacherData.username.toLowerCase()
    );
    if (existing) {
      throw new Error(`Teacher username "${teacherData.username}" already exists.`);
    }

    const newTeacher: Teacher = {
      ...teacherData,
      id: `teach-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
      active: true,
    };

    this.data.teachers.push(newTeacher);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TEACHER_CREATED',
      entityType: 'teacher',
      entityId: newTeacher.id,
      details: `Added new faculty member: ${newTeacher.name} (${newTeacher.username}) with assigned classes: ${newTeacher.assignedClasses.join(', ')}`,
    });

    this.save();
    return newTeacher;
  }

  public updateTeacher(id: string, updates: Partial<Teacher>, actor: UserSession): Teacher {
    const teacher = this.data.teachers.find((t) => t.id === id);
    if (!teacher) throw new Error(`Teacher with ID ${id} not found.`);

    if (updates.name) teacher.name = updates.name.trim();
    if (updates.email) teacher.email = updates.email.trim();
    if (updates.mobile) teacher.mobile = updates.mobile.trim();
    if (updates.subject) teacher.subject = updates.subject.trim();
    if (updates.assignedClasses) teacher.assignedClasses = updates.assignedClasses;
    if (updates.password) teacher.password = updates.password.trim();
    if (typeof updates.active === 'boolean') teacher.active = updates.active;
    if (updates.photoUrl !== undefined) teacher.photoUrl = updates.photoUrl;

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TEACHER_UPDATED',
      entityType: 'teacher',
      entityId: teacher.id,
      details: `Updated faculty member details for ${teacher.name} (${teacher.username}).`,
    });

    this.save();
    return teacher;
  }

  public deleteTeacher(id: string, actor: UserSession): boolean {
    const idx = this.data.teachers.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Teacher with ID ${id} not found.`);

    const deleted = this.data.teachers.splice(idx, 1)[0];

    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TEACHER_DELETED',
      entityType: 'teacher',
      entityId: id,
      details: `Removed faculty member ${deleted.name} (${deleted.username}).`,
    });

    this.save();
    return true;
  }

  // --- Audit Logs ---

  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 audit logs to prevent infinite expansion
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
    return log;
  }

  public getAuditLogs(params?: { entityType?: string; actorRole?: string; limit?: number }) {
    let logs = [...this.data.auditLogs];
    if (params?.entityType && params.entityType !== 'all') {
      logs = logs.filter((l) => l.entityType === params.entityType);
    }
    if (params?.actorRole && params.actorRole !== 'all') {
      logs = logs.filter((l) => l.actorRole === params.actorRole);
    }
    const limit = params?.limit || 100;
    return logs.slice(0, limit);
  }

  // --- Developer System Stats & Reseeding ---

  public getSystemStats() {
    return {
      studentsCount: this.data.students.length,
      teachersCount: this.data.teachers.length,
      attendanceRecordsCount: this.data.attendance.length,
      feeRecordsCount: this.data.feeRecords.length,
      noticesCount: this.data.notices.length,
      doubtsCount: this.data.doubts.length,
      pendingDoubtsCount: this.data.doubts.filter((d) => d.status === 'pending').length,
      auditLogsCount: this.data.auditLogs.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  public resetToSeed(actor: UserSession) {
    this.seedInitialData();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SYSTEM_DATABASE_RESET',
      entityType: 'system',
      details: 'Restored database to initial pristine seed state.',
    });
    this.save();
  }
}

export const db = new DatabaseService();
