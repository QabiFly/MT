import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { initWebSocketServer, broadcastRealtime } from './server/realtime.js';
import { generateSignedUploadParams, uploadImage, getCloudinaryConfig } from './server/cloudinary.js';
import { UserSession } from './src/types/index.js';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Initialize WebSocket server on the same HTTP instance
initWebSocketServer(server);

// Mock Auth Helper from Authorization header or Cookie or Session header
function getSessionFromReq(req: Request): UserSession | null {
  const authHeader = req.headers.authorization;
  const sessionHeader = req.headers['x-user-session'];
  
  if (sessionHeader && typeof sessionHeader === 'string') {
    try {
      return JSON.parse(decodeURIComponent(sessionHeader));
    } catch (e) {
      // fallback
    }
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (e) {
      // fallback
    }
  }

  if (req.cookies?.tuition_session) {
    try {
      return JSON.parse(req.cookies.tuition_session);
    } catch (e) {
      // fallback
    }
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

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { role, username, password, rollNumber, dob } = req.body;

  let session: UserSession | null = null;

  if (role === 'developer' || username === 'zeaipc') {
    session = db.authenticateDeveloper(username || 'zeaipc', password);
  } else if (role === 'teacher') {
    session = db.authenticateTeacher(username, password);
  } else if (role === 'student' || rollNumber) {
    session = db.authenticateStudent(Number(rollNumber), dob);
  }

  if (!session) {
    return res.status(401).json({
      error:
        role === 'student'
          ? 'Invalid Roll Number or Date of Birth (Format: YYYY-MM-DD).'
          : 'Invalid username or password.',
    });
  }

  res.cookie('tuition_session', JSON.stringify(session), {
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  return res.json({ session });
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
app.get('/api/students', (req, res) => {
  const { search, className, feeStatus, sortBy, page, limit } = req.query;
  const result = db.getStudents({
    search: search as string,
    className: className as string,
    feeStatus: feeStatus as string,
    sortBy: sortBy as string,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  res.json(result);
});

app.get('/api/students/next-roll', (req, res) => {
  const nextRoll = db.getNextRollNumber();
  res.json({ nextRollNumber: nextRoll });
});

app.get('/api/students/:id', (req, res) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ student });
});

app.post('/api/students', requireRole(['developer', 'teacher']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const newStudent = db.createStudent(req.body, actor);
    broadcastRealtime('student:created', newStudent);
    res.status(201).json({ student: newStudent });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/students/:id', requireRole(['developer', 'teacher']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const updated = db.updateStudent(req.params.id, req.body, actor);
    broadcastRealtime('student:updated', updated);
    res.json({ student: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', requireRole(['developer', 'teacher']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const success = db.deleteStudent(req.params.id, actor);
    if (!success) {
      return res.status(404).json({ error: 'Student not found' });
    }
    broadcastRealtime('student:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Attendance API
app.get('/api/attendance', (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const className = req.query.className as string;
  const list = db.getAttendanceByDate(date, className);
  res.json({ attendance: list, date });
});

app.get('/api/attendance/student/:id', (req, res) => {
  const history = db.getStudentAttendanceHistory(req.params.id);
  res.json({ history });
});

app.post('/api/attendance/batch', requireRole(['developer', 'teacher']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const { records, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = db.markAttendanceBatch(records, targetDate, actor);
    broadcastRealtime('attendance:updated', { date: targetDate, count: records.length });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Fee API
app.get('/api/fees/overview', (req, res) => {
  const overview = db.getFeeOverview();
  res.json(overview);
});

app.get('/api/fees/student/:id', (req, res) => {
  const records = db.getStudentFeeRecords(req.params.id);
  res.json({ records });
});

app.post('/api/fees/update', requireRole(['developer', 'teacher']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const { studentId, feeStatus, amount, paymentMode, remarks, privilegedConfirmation } = req.body;
    const result = db.updateFeeStatus(
      studentId,
      feeStatus,
      Number(amount || 0),
      paymentMode || 'Cash',
      remarks,
      actor,
      Boolean(privilegedConfirmation)
    );
    broadcastRealtime('fee:updated', result);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Notices API
app.get('/api/notices', (req, res) => {
  const targetClass = req.query.className as string;
  const notices = db.getNotices(targetClass);
  res.json({ notices });
});

app.post('/api/notices', requireRole(['developer', 'teacher']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const notice = db.createNotice(req.body, actor);
    broadcastRealtime('notice:new', notice);
    res.status(201).json({ notice });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/notices/:id/read', (req, res) => {
  const session = getSessionFromReq(req);
  if (session && session.role === 'student' && session.studentId) {
    const notice = db.markNoticeRead(req.params.id, session.studentId);
    return res.json({ notice });
  }
  res.json({ success: true });
});

// Doubts API
app.get('/api/doubts', (req, res) => {
  const session = getSessionFromReq(req);
  const studentId = session?.role === 'student' ? session.studentId : (req.query.studentId as string);
  const className = req.query.className as string;
  const doubts = db.getDoubts(studentId, className);
  res.json({ doubts });
});

app.post('/api/doubts', (req, res) => {
  try {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const doubt = db.createDoubt(req.body, session);
    broadcastRealtime('doubt:created', doubt);
    res.status(201).json({ doubt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/doubts/:id/reply', requireRole(['developer', 'teacher', 'student']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const { message, imageUrl } = req.body;
    const doubt = db.replyToDoubt(req.params.id, message, imageUrl, actor);
    broadcastRealtime('doubt:replied', { doubtId: req.params.id, doubt });
    res.json({ doubt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/doubts/:id/status', requireRole(['developer', 'teacher']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const doubt = db.updateDoubtStatus(req.params.id, req.body.status, actor);
    broadcastRealtime('doubt:replied', { doubtId: req.params.id, doubt });
    res.json({ doubt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Teachers API
app.get('/api/teachers', (req, res) => {
  const teachers = db.getTeachers();
  res.json({ teachers });
});

app.post('/api/teachers', requireRole(['developer']), (req, res) => {
  try {
    const actor = (req as any).userSession;
    const teacher = db.createTeacher(req.body, actor);
    res.status(201).json({ teacher });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Audit Logs API
app.get('/api/audit-logs', requireRole(['developer', 'teacher']), (req, res) => {
  const logs = db.getAuditLogs({
    entityType: req.query.entityType as string,
    actorRole: req.query.actorRole as string,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  });
  res.json({ logs });
});

// System Stats & Config API
app.get('/api/system/stats', (req, res) => {
  const stats = db.getSystemStats();
  const cloudinary = getCloudinaryConfig();
  res.json({
    stats,
    cloudinary: {
      isConfigured: cloudinary.isConfigured,
      cloudName: cloudinary.cloudName,
      apiKeyPresent: Boolean(cloudinary.apiKey),
      apiSecretPresent: Boolean(cloudinary.apiSecret),
      uploadPreset: cloudinary.uploadPreset,
      mode: cloudinary.isConfigured ? 'cloudinary' : 'local_fallback',
    },
  });
});

app.post('/api/system/reset', requireRole(['developer']), (req, res) => {
  const actor = (req as any).userSession;
  db.resetToSeed(actor);
  broadcastRealtime('student:created', {});
  res.json({ success: true, message: 'Database reset to default demo seed.' });
});

// Cloudinary Upload & Signature Routes
app.get('/api/upload/signature', (req, res) => {
  const folder = (req.query.folder as string) || 'tuition_students';
  const params = generateSignedUploadParams(folder);
  res.json({ signatureParams: params, isConfigured: Boolean(params) });
});

app.post('/api/upload', async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    const result = await uploadImage(image, folder || 'tuition_uploads');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

// Offline Sync Queue Processor
app.post('/api/sync/batch', async (req, res) => {
  const session = getSessionFromReq(req);
  const actor: UserSession = session || {
    id: 'offline-syncer',
    name: 'Offline Sync Queue',
    role: 'teacher',
    username: 'offline_sync',
  };

  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }

  const results: any[] = [];

  for (const item of items) {
    try {
      if (item.entity === 'student') {
        if (item.operation === 'create') {
          const student = db.createStudent(item.payload, actor);
          results.push({ id: item.id, status: 'synced', data: student });
        } else if (item.operation === 'update') {
          const student = db.updateStudent(item.payload.id, item.payload, actor);
          results.push({ id: item.id, status: 'synced', data: student });
        }
      } else if (item.entity === 'attendance') {
        const att = db.markAttendanceBatch(item.payload.records, item.payload.date, actor);
        results.push({ id: item.id, status: 'synced', data: att });
      } else if (item.entity === 'fee') {
        const fee = db.updateFeeStatus(
          item.payload.studentId,
          item.payload.feeStatus,
          item.payload.amount,
          item.payload.paymentMode,
          item.payload.remarks,
          actor,
          item.payload.privilegedConfirmation
        );
        results.push({ id: item.id, status: 'synced', data: fee });
      } else if (item.entity === 'doubt') {
        const doubt = db.createDoubt(item.payload, actor);
        results.push({ id: item.id, status: 'synced', data: doubt });
      } else if (item.entity === 'notice') {
        const notice = db.createNotice(item.payload, actor);
        results.push({ id: item.id, status: 'synced', data: notice });
      }
    } catch (err: any) {
      results.push({ id: item.id, status: 'failed', error: err.message });
    }
  }

  res.json({ results, timestamp: new Date().toISOString() });
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
