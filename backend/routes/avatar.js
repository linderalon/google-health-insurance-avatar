/**
 * Avatar session routes.
 *
 * The Kaltura Session (KS) is read exclusively from process.env.KALTURA_KS.
 * It is used only in server-side fetch calls and is NEVER included in any
 * response body sent to the client.
 *
 * Session tracking: we keep a map of active sessions and end the previous
 * one before creating a new one — avoids hitting the 5-session concurrency limit.
 */

import { Router } from 'express';

const router = Router();

const KALTURA_AVATAR_BASE_URL =
  process.env.KALTURA_AVATAR_BASE_URL ||
  'https://api.avatar.us.kaltura.ai/v1/avatar-session';

// In-memory map of active sessions: sessionId → token
// Used to end stale sessions before creating new ones.
const activeSessions = new Map();

/** Silently end a session by ID — best-effort, never throws. */
async function endSession(sessionId, token) {
  try {
    await fetch(`${KALTURA_AVATAR_BASE_URL}/${sessionId}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`[avatar] Ended stale session: ${sessionId.slice(0, 20)}…`);
  } catch { /* ignore errors on cleanup */ }
}

/** End all tracked sessions — called on server shutdown. */
async function endAllSessions() {
  const entries = [...activeSessions.entries()];
  if (entries.length === 0) return;
  console.log(`[avatar] Ending ${entries.length} active session(s) on shutdown…`);
  await Promise.allSettled(entries.map(([id, token]) => endSession(id, token)));
  activeSessions.clear();
}

// Clean up on graceful shutdown
process.once('SIGINT',  () => endAllSessions().finally(() => process.exit(0)));
process.once('SIGTERM', () => endAllSessions().finally(() => process.exit(0)));

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/avatar/session
 *
 * Creates a new Kaltura Avatar session using the server-side KS.
 * Ends any previous tracked session first to stay under the concurrency limit.
 * Returns only { sessionId, token } — KS never leaves this process.
 */
router.post('/session', async (req, res, next) => {
  try {
    const ks      = process.env.KALTURA_KS;
    const avatarId = req.body?.avatarId || process.env.DEFAULT_AVATAR_ID;
    const voiceId  = req.body?.voiceId  || process.env.DEFAULT_VOICE_ID || null;

    if (!avatarId) {
      return res.status(400).json({ error: 'avatarId is required (or set DEFAULT_AVATAR_ID in .env)' });
    }

    // End all stale tracked sessions before creating a new one
    if (activeSessions.size > 0) {
      console.log(`[avatar] Ending ${activeSessions.size} stale session(s) before creating new one`);
      await Promise.allSettled(
        [...activeSessions.entries()].map(([id, token]) => endSession(id, token))
      );
      activeSessions.clear();
    }

    const body = {
      clientId: process.env.KALTURA_CLIENT_ID || '695cd19880ea19bd1b816a08',
      visualConfig: { id: avatarId },
      ...(voiceId && { voiceConfig: { id: voiceId, modelId: 'eleven_flash_v2_5' } }),
    };

    const response = await fetch(`${KALTURA_AVATAR_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        Authorization: `ks ${ks}`,      // lowercase 'ks' matches SDK convention
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[avatar] Session creation failed:', data);
      const status = response.status === 429 ? 429 : response.status === 401 ? 401 : 502;
      return res.status(status).json({ error: data.error || 'Failed to create avatar session' });
    }

    // Track this session so we can end it later
    activeSessions.set(data.sessionId, data.token);
    console.log(`[avatar] Session created: ${data.sessionId.slice(0, 20)}… (tracking ${activeSessions.size} active)`);

    return res.json({ sessionId: data.sessionId, token: data.token });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/avatar/say
 * Body: { sessionId, token, text, turnId?, isFinal? }
 */
router.post('/say', async (req, res, next) => {
  try {
    const { sessionId, token, text, turnId, isFinal = true } = req.body;
    if (!sessionId || !token || !text)
      return res.status(400).json({ error: 'sessionId, token, and text are required' });
    if (text.length > 1000)
      return res.status(400).json({ error: 'text must be 1000 characters or fewer' });

    const response = await fetch(`${KALTURA_AVATAR_BASE_URL}/${sessionId}/say-text`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...(turnId && { turnId }), isFinal }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: data.error || 'say-text failed' });
    return res.json({ success: true });
  } catch (err) { next(err); }
});

/**
 * POST /api/avatar/interrupt
 * Body: { sessionId, token }
 */
router.post('/interrupt', async (req, res, next) => {
  try {
    const { sessionId, token } = req.body;
    if (!sessionId || !token)
      return res.status(400).json({ error: 'sessionId and token are required' });

    const response = await fetch(`${KALTURA_AVATAR_BASE_URL}/${sessionId}/interrupt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: data.error || 'interrupt failed' });
    return res.json({ success: true });
  } catch (err) { next(err); }
});

/**
 * POST /api/avatar/end
 * Body: { sessionId, token }
 */
router.post('/end', async (req, res, next) => {
  try {
    const { sessionId, token } = req.body;
    if (!sessionId || !token)
      return res.status(400).json({ error: 'sessionId and token are required' });

    await endSession(sessionId, token);
    activeSessions.delete(sessionId);

    return res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
