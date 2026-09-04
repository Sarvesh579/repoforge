require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRouter = require('./routes/auth');
const teamRouter = require('./routes/team');
const submissionRouter = require('./routes/submission');
const adminRouter = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const { addClient, publishChange } = require('./lib/realtime');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const configuredOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, internal calls)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');
      const isAllowed =
        configuredOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);

      if (isAllowed) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

// ─── Body parsing & request size limits ───────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'crucible-api',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Lightweight invalidation stream. Clients refetch their own authorized data
// after a successful write instead of receiving data through this channel.
app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();
  res.write('retry: 3000\n\n');
  addClient(res);
});

app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.path.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
      publishChange();
    }
  });
  next();
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/team', teamRouter);
app.use('/api/submission', submissionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payment', paymentRoutes);

// ─── 404 handler — must come AFTER all routes ─────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ─── Global error handler — must be LAST (4-arg signature) ────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[UnhandledError]', err);

  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ success: false, error: err.message });
  }

  if (res.headersSent) return;

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ─── Process-level crash guards (prevents Render restart loops) ───────────────
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled promise rejection:', reason);
  // Log but do NOT exit — keep the server alive
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
  // Log but do NOT exit — keep the server alive
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const HOST = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✦  Crucible API running on ${HOST}`);
    console.log(`   Health: ${HOST}/api/health\n`);
    console.log(`   Health: https://project-crucible.onrender.com/api/health`)
  });
}

// Export for Vercel serverless
module.exports = app;
