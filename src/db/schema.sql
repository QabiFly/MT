-- PostgreSQL Database Schema for Tuition & Student Management System

-- 1. Users Table (Developers, Teachers, Linked Student Logins)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('developer', 'teacher', 'student')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  roll_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  assigned_classes TEXT[] DEFAULT '{}',
  subjects TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  joined_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students Table (with auto-generated sequential Roll Numbers starting from 1)
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  roll_number SERIAL UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  photo_url TEXT,
  address TEXT NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  dob DATE NOT NULL,
  date_of_joining DATE NOT NULL,
  fee_paid_status VARCHAR(20) DEFAULT 'unpaid' CHECK (fee_paid_status IN ('paid', 'unpaid', 'partial')),
  fee_due_amount NUMERIC(10, 2) DEFAULT 0.00,
  fee_paid_amount NUMERIC(10, 2) DEFAULT 0.00,
  fee_last_paid_date TIMESTAMP WITH TIME ZONE,
  payment_mode VARCHAR(50),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_by_teacher_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
  student_roll INTEGER NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by VARCHAR(64) NOT NULL,
  marked_by_name VARCHAR(255) NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date)
);

-- 5. Fee Records & Receipts
CREATE TABLE IF NOT EXISTS fee_records (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
  student_roll INTEGER NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  due_amount NUMERIC(10, 2) DEFAULT 0.00,
  status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'unpaid', 'partial')),
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  receipt_number VARCHAR(50),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  marked_by VARCHAR(64) NOT NULL,
  marked_by_name VARCHAR(255) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notices Table (Broadcast to classes in realtime)
CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_class VARCHAR(50) NOT NULL DEFAULT 'All',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'announcement')),
  author_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_by_student_ids TEXT[] DEFAULT '{}'
);

-- 7. Student Doubts
CREATE TABLE IF NOT EXISTS doubts (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
  student_roll INTEGER NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Doubt Replies
CREATE TABLE IF NOT EXISTS doubt_replies (
  id VARCHAR(64) PRIMARY KEY,
  doubt_id VARCHAR(64) REFERENCES doubts(id) ON DELETE CASCADE,
  author_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Logs Table (Detailed accountability logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  actor_id VARCHAR(64) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64),
  details TEXT NOT NULL,
  ip VARCHAR(50)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_dob ON students(dob);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_student ON fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_student ON doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
