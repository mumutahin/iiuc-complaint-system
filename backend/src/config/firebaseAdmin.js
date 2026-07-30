import admin from 'firebase-admin';

let initialized = false;

/**
 * Initializes firebase-admin exactly once. Called from server.js after
 * dotenv has loaded. Supports TWO ways of supplying credentials because
 * pasting a multi-line private key into a host's env-var UI is the #1
 * source of "Firebase Admin" setup errors:
 *
 *   Option A (simplest): three separate vars, with the private key's
 *   real newlines replaced by the two characters backslash-n.
 *     FIREBASE_PROJECT_ID=...
 *     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
 *     FIREBASE_CLIENT_EMAIL=...
 *
 *   Option B (safer on hosts that mangle multi-line values, e.g. some
 *   Render plans): base64-encode the ENTIRE downloaded service-account
 *   JSON file and put it in one variable:
 *     FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjogInNlcnZpY2Vf...
 *
 * If FIREBASE_SERVICE_ACCOUNT_BASE64 is present we use it and ignore
 * the other three. Otherwise we fall back to Option A.
 */
export function initFirebaseAdmin() {
  if (initialized) return admin;

  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(json);
      credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_BASE64 could not be decoded/parsed as JSON: ${err.message}`
      );
    }
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
      throw new Error(
        'Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and ' +
          'FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_BASE64) — see backend/.env.example.'
      );
    }

    // Handles the private key whether it arrived with literal "\n"
    // (from an env-var UI) or with real newlines (from a local .env file).
    const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

    credential = admin.credential.cert({ projectId, clientEmail, privateKey });
  }

  admin.initializeApp({ credential });
  initialized = true;
  return admin;
}

export function getFirebaseAdmin() {
  if (!initialized) {
    throw new Error('Firebase Admin was not initialized. Call initFirebaseAdmin() first (see server.js).');
  }
  return admin;
}
