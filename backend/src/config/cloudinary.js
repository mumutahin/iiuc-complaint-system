// NOTE: `import { v2 as cloudinary } from 'cloudinary'` looks natural but
// breaks at runtime under plain Node ESM — cloudinary's CJS build assigns
// its exports as an object literal (`module.exports = { v2: ... }`), which
// Node's static cjs-module-lexer analysis does not reliably expose as a
// named export. Same root cause as the Express Router issue. Safe fix:
// default-import the whole module, then destructure.
import cloudinaryPkg from 'cloudinary';

const { v2: cloudinary } = cloudinaryPkg;

let configured = false;

export function initCloudinary() {
  if (configured) return cloudinary;

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and ' +
        'CLOUDINARY_API_SECRET — see backend/.env.example.'
    );
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configured = true;
  return cloudinary;
}

export { cloudinary };
