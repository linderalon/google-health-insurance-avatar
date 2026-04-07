import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import avatarRouter from './routes/avatar.js';
import agentRouter  from './routes/agent.js';
import dppRouter    from './routes/dpp.js';
import fieldsRouter from './routes/fields.js';

const PORT = process.env.PORT || 3001;

// Fail fast — KS must be set before the server starts
if (!process.env.KALTURA_KS) {
  console.error('[server] FATAL: KALTURA_KS environment variable is not set.');
  process.exit(1);
}

const app = express();

app.use(express.json());

// Restrict CORS to the frontend origin in production.
// Vite runs on HTTPS (5173) — add both http and https variants for dev.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:5173',
      'https://localhost:5173',
    ];

app.use(
  cors({
    origin(origin, cb) {
      // Allow server-to-server calls (no origin header) or listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Avatar session routes — KS never leaves this process
app.use('/api/avatar', avatarRouter);

// AI agent routes — proxies to ADK server, streams A2UI JSONL as SSE
app.use('/api/agent', agentRouter);

// Avatar DPP — injected into the iframe after showing-agent fires
app.use('/api/avatar', dppRouter);

// Form field extraction from conversation transcript
app.use('/api/agent/fields', fieldsRouter);

// Central error handler
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[server] Healthcare demo backend running on http://localhost:${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('[network] ── Kaltura WebRTC prerequisites ───────────────────────────────');
  console.log('[network] Whitelist the Kaltura TURN server IP range in your firewall:');
  console.log('[network]   IP block : 3.41.177.176/29  (3.41.177.176 – 3.41.177.183)');
  console.log('[network]   Ports    : UDP/TCP 443 (primary)  UDP/TCP 80 (fallback)');
  console.log('[network]   Direction: outbound from clients to these IPs');
  console.log('[network] Without this, WebRTC connections will fail behind strict NAT/firewalls.');
  console.log('[network] ────────────────────────────────────────────────────────────────');
});
