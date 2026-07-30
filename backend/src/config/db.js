import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas. Called once from server.js, AFTER
 * 'dotenv/config' has already loaded process.env.
 *
 * We read process.env.MONGODB_URI *inside* this function (not at
 * module top-level) so this file is safe to import in any order —
 * it never reads the variable before it exists.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and fill in your MongoDB Atlas connection string.'
    );
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] connection lost, mongoose will retry automatically');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[mongo] reconnected');
  });

  await mongoose.connect(uri);
  console.log(`[mongo] connected → ${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
