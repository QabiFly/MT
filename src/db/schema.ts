import { pgTable, text, serial, integer, boolean, timestamp, numeric } from 'drizzle-orm/pg-core';

export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  password: text('password'),
  email: text('email'),
  mobile: text('mobile'),
  phone: text('phone'),
  mobileNumber: text('mobile_number'),
  subject: text('subject'),
  assignedClasses: text('assigned_classes').array().notNull(),
  subjects: text('subjects').array(),
  active: boolean('active').default(true).notNull(),
  photoUrl: text('photo_url'),
  joinedDate: text('joined_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  rollNumber: integer('roll_number').notNull().unique(),
  fullName: text('full_name').notNull(),
  mobileNumber: text('mobile_number').notNull(),
  email: text('email'),
  photoUrl: text('photo_url'),
  address: text('address').notNull(),
  className: text('class_name').notNull(),
  dob: text('dob').notNull(),
  dateOfJoining: text('date_of_joining').notNull(),
  feePaidStatus: text('fee_paid_status').notNull().default('unpaid'), // 'paid' | 'unpaid' | 'partial'
  feeDueAmount: numeric('fee_due_amount').notNull().default('0'),
  feePaidAmount: numeric('fee_paid_amount').notNull().default('0'),
  feeLastPaidDate: text('fee_last_paid_date'),
  paymentMode: text('payment_mode'),
  notes: text('notes'),
  active: boolean('active').default(true).notNull(),
  createdByTeacherId: text('created_by_teacher_id'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRoll: integer('student_roll').notNull(),
  studentName: text('student_name').notNull(),
  className: text('class_name').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status').notNull(), // 'present' | 'absent' | 'late'
  markedBy: text('marked_by').notNull(),
  markedByName: text('marked_by_name').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const feeRecords = pgTable('fee_records', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRoll: integer('student_roll').notNull(),
  studentName: text('student_name').notNull(),
  className: text('class_name').notNull(),
  amount: numeric('amount').notNull(),
  dueAmount: numeric('due_amount').notNull().default('0'),
  status: text('status').notNull(), // 'paid' | 'unpaid' | 'partial'
  paymentMode: text('payment_mode').notNull(),
  receiptNumber: text('receipt_number').notNull(),
  transactionDate: text('transaction_date').notNull(),
  markedBy: text('marked_by').notNull(),
  markedByName: text('marked_by_name').notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notices = pgTable('notices', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetClass: text('target_class').notNull().default('All'),
  priority: text('priority').notNull().default('normal'), // 'normal' | 'urgent' | 'announcement'
  attachmentUrl: text('attachment_url'),
  authorId: text('author_id').notNull(),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role').notNull(),
  readByStudentIds: text('read_by_student_ids').array().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const doubts = pgTable('doubts', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRoll: integer('student_roll').notNull(),
  studentName: text('student_name').notNull(),
  className: text('class_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  status: text('status').notNull().default('pending'), // 'pending' | 'answered'
  replies: text('replies').notNull().default('[]'), // JSON array string
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: text('details').notNull(),
});
