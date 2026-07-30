// One-time bootstrap helper: promotes a user (by email) to a given role.
// You need this because the very FIRST superadmin has no superadmin yet
// to grant them the role through the app's own User Management page —
// someone has to be the first. Every user after that can be promoted
// normally from the Super Admin Panel.
//
// Usage (from the backend/ folder, after `npm install`):
//   node scripts/setUserRole.js you@iiuc.edu.bd superadmin
//   node scripts/setUserRole.js someone@iiuc.edu.bd admin <departmentId>
//
// The user must have already signed up once through the actual app
// (Firebase + the frontend) before you run this — this script only
// PROMOTES an existing MongoDB user, it does not create a Firebase
// account for them.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { USER_ROLES } from '../../shared/constants.js';

async function run() {
  const [, , email, role, departmentId] = process.argv;

  if (!email || !role) {
    console.error('Usage: node scripts/setUserRole.js <email> <role> [departmentId]');
    process.exit(1);
  }
  if (!USER_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Must be one of: ${USER_ROLES.join(', ')}`);
    process.exit(1);
  }
  if (role === 'admin' && !departmentId) {
    console.error('An admin needs a departmentId. Create a department first, then re-run with its _id.');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(
      `No user found with email "${email}". They must sign up through the app once first (Firebase + frontend), then re-run this script.`
    );
    await disconnectDB();
    process.exit(1);
  }

  user.role = role;
  user.departmentId = role === 'admin' ? departmentId : role === 'superadmin' ? user.departmentId : null;
  await user.save();

  console.log(`✅ ${user.email} is now "${role}"${departmentId ? ` (department: ${departmentId})` : ''}.`);
  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
