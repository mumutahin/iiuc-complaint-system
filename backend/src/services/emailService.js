import nodemailer from 'nodemailer';
import { getStatusStyle } from '../../../shared/statusConfig.js';

let transporter = null;
let attemptedInit = false;

/**
 * Email is explicitly OPTIONAL (per the assignment's "extra features for
 * higher marks" list) — plenty of students won't configure SMTP at all,
 * and that must never break complaint status updates. So:
 *   - We only build the transporter once, lazily, on first send attempt.
 *   - If EMAIL_USER/EMAIL_PASS aren't set, every function below becomes
 *     a harmless no-op (we log once and move on).
 */
function getTransporter() {
  if (attemptedInit) return transporter;
  attemptedInit = true;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('[email] EMAIL_USER/EMAIL_PASS not set — email notifications are disabled (this is fine).');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  return transporter;
}

/**
 * Fire-and-forget by design: callers should NOT `await` this in the
 * middle of an API request. Call it, ignore the returned promise (or
 * attach a .catch for logging), and let the HTTP response go out
 * immediately regardless of whether the email succeeds.
 */
export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t || !to) return;
  try {
    await t.sendMail({ from: `"IIUC Complaint System" <${process.env.EMAIL_USER}>`, to, subject, html });
  } catch (err) {
    console.error('[email] send failed:', err.message);
  }
}

export function sendStatusUpdateEmail({ to, studentName, complaintTitle, status, complaintId }) {
  const style = getStatusStyle(status);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background:#0f172a; color:#fff; padding:20px 24px; border-radius:8px 8px 0 0;">
        <h2 style="margin:0; font-size:18px;">International Islamic University Chittagong</h2>
        <p style="margin:4px 0 0; color:#cbd5e1; font-size:13px;">Complaint Management System</p>
      </div>
      <div style="border:1px solid #e2e8f0; border-top:none; padding:24px; border-radius:0 0 8px 8px;">
        <p style="color:#334155;">Hi ${studentName || 'there'},</p>
        <p style="color:#334155;">Your complaint has a status update:</p>
        <p style="font-weight:600; color:#0f172a; margin-bottom:4px;">${complaintTitle}</p>
        <span style="display:inline-block; padding:4px 12px; border-radius:9999px; font-size:13px; font-weight:600; background:${style.chart}22; color:${style.chart};">
          ${status}
        </span>
        <p style="color:#64748b; font-size:13px; margin-top:20px;">
          Complaint ID: ${complaintId}
        </p>
      </div>
    </div>
  `;
  // Intentionally not awaited by callers — fire-and-forget.
  return sendEmail({ to, subject: `Complaint update: ${status}`, html });
}
