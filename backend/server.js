// This import MUST be the very first line in the whole program. It
// populates process.env from backend/.env before anything else runs.
// (See src/config/*.js comments for why every env-var read elsewhere
// happens lazily inside functions instead of at module top-level —
// belt-and-suspenders against import-order surprises.)
import 'dotenv/config';

import http from 'node:http';
import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { initFirebaseAdmin } from './src/config/firebaseAdmin.js';
import { initSocket } from './src/sockets/socketManager.js';

const PORT = process.env.PORT || 5000;

async function main() {
  initFirebaseAdmin();
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const corsOrigins = [
    ...(process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  initSocket(httpServer, corsOrigins);

  httpServer.listen(PORT, () => {
    console.log(`[server] IIUC Complaint System API listening on port ${PORT}`);
  });

  // Graceful shutdown: stop accepting new connections, close the DB
  // connection, THEN exit — so an in-flight request isn't cut off mid-write
  // and Mongo doesn't get an unclean disconnect. Render sends SIGTERM on
  // every deploy/restart, so this path runs far more often than you'd think.
  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDB();
      console.log('[server] shutdown complete.');
      process.exit(0);
    });
    // Failsafe: force-exit if close() hangs (e.g. a stuck keep-alive socket).
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
