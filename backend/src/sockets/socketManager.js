// Default-import + destructure, not `import { Server } from 'socket.io'` —
// see the comment in ../config/cloudinary.js for why the named-import form
// is unsafe under plain Node ESM for CJS packages like this one.
import socketIO from 'socket.io';
import { getFirebaseAdmin } from '../config/firebaseAdmin.js';
import { User } from '../models/User.js';

let io = null;

/**
 * Call once from server.js, right after the HTTP server is created.
 * Every socket connection re-verifies its Firebase token the same way
 * REST requests do (authMiddleware) — a socket is just another
 * authenticated channel, not a separate trust boundary.
 */
export function initSocket(httpServer, corsOrigins) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token provided'));

      const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user || !user.isActive) return next(new Error('Authentication error: user not found or disabled'));

      socket.user = {
        _id: user._id.toString(),
        role: user.role,
        departmentId: user.departmentId ? user.departmentId.toString() : null,
      };
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user._id}`);

    if (socket.user.role === 'admin' || socket.user.role === 'superadmin') {
      socket.join('admins');
      if (socket.user.departmentId) {
        socket.join(`dept:${socket.user.departmentId}`);
      }
    }

    socket.on('disconnect', () => {
      // No-op: rooms are cleaned up automatically by socket.io on disconnect.
    });
  });

  return io;
}

/** Used by controllers/services to emit events without importing server.js. */
export function getIO() {
  if (!io) {
    console.warn('[socket] getIO() called before initSocket() — event will be skipped.');
    return null;
  }
  return io;
}
