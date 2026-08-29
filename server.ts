import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { initWebSocketServer, broadcastRealtime } from './server/realtime.js';
import { uploadToCloudinary, getCloudinaryConfig } from './server/cloudinary.js';
import { UserSession } from './src/types/index.js';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Initialize WebSocket server on the same HTTP instance
initWebSocketServer(server);

// Auth Helper from Authorization header or Cookie or Session header
function getSessionFromReq(req: Request): UserSession | null {
  const authHeader = req.headers.authorization;
  const sessionHeader = req.headers['x-user-session'];

  if (sessionHeader && typeof sessionHeader === 'string') {
    try {
      return JSON.parse(decodeURIComponent(sessionHeader));
    } catch (e) {}
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (e) {}
  }

  if (req.cookies?.tuition_session) {
    try {
      return JSON.parse(req.cookies.tuition_session);
    } catch (e) {}
  }

  return null;
}

// RBAC Middleware
function requireRole(allowedRoles: ('developer' | 'teacher' | 'student')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const session = getSessionFromReq(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    if (!allowedRoles.includes(session.role)) {
      res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
      return;
    }
    (req as any).userSession = session;
    next();
  };
}

// ================= API ROUTES =================

// Health & Environment Diagnostics
app.get('/api/health', async (req, res) => {
  const dbHealth = await db.checkHealth();
  const cloudinaryConfig = getCloudinaryConfig();

  res.json({
    status: dbHealth.healthy ? 'ok' : 'degraded',
    database: {
      connected: dbHealth.healthy,
      message: dbHealth.message,
      urlPresent: Boolean(process.env.DATABASE_URL),
    },
    cloudinary: {
      configured: cloudinaryConfig.isConfigured,
      cloudName: cloudinaryConfig.cloudName,
      apiKeyPresent: Boolean(cloudinaryConfig.apiKey),
      apiSecretPresent: Boolean(cloudinaryConfig.apiSecret),
    },
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { role, username, password, rollNumber, dob } = req.body || {};

    const cleanUser = typeof username === 'string' ? username.trim() : '';
    const cleanPass = typeof password === 'string' ? password.trim() : '';

    let session: UserSession | null = null;

    if (role === 'developer' || cleanUser.toLowerCase() === 'zeaipc' || cleanUser.toLowerCase() === 'admin') {
      session = await db.authenticateDeveloper(cleanUser || 'zeaipc', cleanPass);
    } else if (role === 'teacher') {
      session = await db.authenticateTeacher(cleanUser, cleanPass);
    } else if (role === 'student' || rollNumber) {
      session = await db.authenticateStudent(Number(rollNumber), dob);
    }

    // Fallback check across all roles in case tab or role was mismatched
    if (!session) {
      if (cleanUser && cleanPass) {
        session =
          (await db.authenticateDeveloper(cleanUser, cleanPass)) ||
          (await db.authenticateTeacher(cleanUser, cleanPass));
      }
      if (!session && rollNumber && dob) {
        session = await db.authenticateStudent(Number(rollNumber), dob);
      }
    }

    if (!session) {
      return res.status(401).json({
        error:
          role === 'student'
            ? 'Invalid Roll Number or Date of Birth (Example: Roll: 1, DOB: 2009-05-14).'
            : 'Invalid username or password. For Admin/Developer sign in with username "zeaipc" & password "arman786".',
      });
    }

    res.cookie('tuition_session', JSON.stringify(session), {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.json({ session });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Database error during authentication' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ session });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('tuition_session');
  return res.json({ success: true });
});

// Students API
app.get('/api/students', async (req, res) => {
  try {
    const { search, className, feeStatus } = req.query;
    const students = await db.getStudents({
      search: search as string,
      className: className as string,
      feeStatus: feeStatus as string,
    });
    res.json({ students, total: students.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve students from PostgreSQL database' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const newStudent = await db.createStudent(req.body, actor);
    broadcastRealtime('student:created', newStudent);
    res.status(201).json({ student: newStudent });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/students/:id', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const updated = await db.updateStudent(req.params.id, req.body, actor);
    broadcastRealtime('student:updated', updated);
    res.json({ student: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    await db.deleteStudent(req.params.id, actor);
    broadcastRealtime('student:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Attendance API
app.get('/api/attendance', async (req, res) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const className = req.query.className as string;
    const studentId = req.query.studentId as string;
    const studentRoll = req.query.studentRoll ? Number(req.query.studentRoll) : undefined;

    const list = await db.getAttendance({ date, className, studentId, studentRoll });
    res.json({ attendance: list, date });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/batch', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Records must be an array' });
    }
    const result = await db.markAttendanceBatch(records, actor);
    broadcastRealtime('attendance:updated', { count: records.length });
    res.json({ results: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Fee API
app.get('/api/fees/records', async (req, res) => {
  try {
    const { studentId, studentRoll, className, status } = req.query;
    const records = await db.getFeeRecords({
      studentId: studentId as string,
      studentRoll: studentRoll ? Number(studentRoll) : undefined,
      className: className as string,
      status: status as string,
    });
    res.json({ records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fees/record', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const fee = await db.createFeeRecord(req.body, actor);
    broadcastRealtime('fee:updated', fee);
    res.json({ record: fee });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Notices API
app.get('/api/notices', async (req, res) => {
  try {
    const targetClass = req.query.className as string;
    const notices = await db.getNotices({ targetClass });
    res.json({ notices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notices', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const notice = await db.createNotice(req.body, actor);
    broadcastRealtime('notice:new', notice);
    res.status(201).json({ notice });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/notices/:id', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    await db.deleteNotice(req.params.id, actor);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Doubts API
app.get('/api/doubts', async (req, res) => {
  try {
    const session = getSessionFromReq(req);
    const studentId = session?.role === 'student' ? session.studentId : (req.query.studentId as string);
    const className = req.query.className as string;
    const status = req.query.status as string;

    const doubts = await db.getDoubts({ studentId, className, status });
    res.json({ doubts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doubts', async (req, res) => {
  try {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required to post a question' });
    }
    const doubt = await db.createDoubt(req.body, session);
    broadcastRealtime('doubt:created', doubt);
    res.status(201).json({ doubt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/doubts/:id/reply', requireRole(['developer', 'teacher', 'student']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const { message, imageUrl } = req.body;
    const doubt = await db.replyToDoubt(req.params.id, message, imageUrl, actor);
    broadcastRealtime('doubt:replied', { doubtId: req.params.id, doubt });
    res.json({ doubt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Teachers / Faculty API
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await db.getTeachers();
    res.json({ teachers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teachers', requireRole(['developer']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const teacher = await db.createTeacher(req.body, actor);
    res.status(201).json({ teacher });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/teachers/:id', requireRole(['developer']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    const teacher = await db.updateTeacher(req.params.id, req.body, actor);
    res.json({ teacher });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/teachers/:id', requireRole(['developer']), async (req, res) => {
  try {
    const actor = (req as any).userSession;
    await db.deleteTeacher(req.params.id, actor);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Audit Logs API
app.get('/api/audit-logs', requireRole(['developer', 'teacher']), async (req, res) => {
  try {
    const logs = await db.getAuditLogs({
      entityType: req.query.entityType as string,
      actorRole: req.query.actorRole as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real Cloudinary Upload Route
app.post('/api/upload', async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image base64 or URL data is required' });
    }

    const result = await uploadToCloudinary(image, folder || 'tuition_uploads');
    res.json(result);
  } catch (err: any) {
    console.error('Upload route error:', err);
    res.status(500).json({
      error:
        err.message ||
        'Cloudinary upload failed. Please verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    });
  }
});

// Vite middleware & Static SPA setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Manasthali Tutions Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
