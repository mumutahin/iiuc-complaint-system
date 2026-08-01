# IIUC Complaint System — Setup & Deployment Guide

It covers the actual code in `iiuc-complaint-system.zip`, and every step has been
checked against how Firebase, MongoDB Atlas, Cloudinary, Render, and
Vercel actually work today (not just carried over from the previous
draft).

**One product decision worth knowing:** "Submit anonymously" hides a
student's name from *other students* browsing the community board.
It does **not** hide it from admin/superadmin — university staff
handling a complaint always see who filed it, for accountability.

### 0 Changelog — post-deployment feature round

After the initial build and deploy, these were added/fixed:

- **Forgot password**, on both login screens (Firebase's built-in
  reset email; always shows the same message whether or not the
  email is registered, so it can't be used to check who has an account).
- **Google sign-in is now login-only.** It's rejected for any identity
  Firebase hasn't seen before (checked via `isNewUser`, then the
  auto-created account is deleted) — only pre-registered accounts can
  enter this way. Consequently, the Register page's Google button was
  removed; registration is email/password only now.
- **Delete my account**, in both apps' Profile page. Deletes the login
  (MongoDB user + Firebase Auth record) but **never** touches
  complaints — they stay on record, attributed to "Deleted user."
  A staff member's assigned complaints get released back to
  unassigned. A superadmin can't delete themselves if they're the only one.
- **Staff can delete any complaint, any status** (for spam/nonsense);
  students keep their existing own-complaint-while-Pending edit/delete.
- **Fixed a real bug:** staff comments were displaying as "Student" to
  the complaint owner. Comments now also support one level of replies,
  plus edit/delete (own comment, or any comment if you're staff).
- **Labels on every login/register field** — no more icon-only inputs.
- **New landing page** (`/` on the student app) — lets a visitor choose
  Student vs. Staff before reaching a login screen. See §9-10 for the
  one new env var this needs.

---


## 1. Accounts you'll need (all free tiers)

1. **Firebase** (console.firebase.google.com) — authentication
2. **MongoDB Atlas** (mongodb.com/cloud/atlas) — database
3. **Cloudinary** (cloudinary.com) — image hosting
4. **Render** (render.com) — backend hosting
5. **Vercel** (vercel.com) — frontend hosting (you'll create it twice)
6. **GitHub** — to connect Render/Vercel to your code
7. *Optional:* a Gmail account for email notifications

Do these roughly in order — later steps need values from earlier ones.

---

## 2. Firebase setup

### 2.1 Create the project
1. Go to the [Firebase Console](https://console.firebase.google.com) → **Get Started**/**Add project**.
2. Name it (e.g. `iiuc-complaint-system`) → accepts terms → you can leave Google
   Analytics off, it's not used here → **Continue**/**Create project**.

### 2.2 Enable sign-in methods
1. In the left sidebar: **Security → Authentication → Get started**.
2. **Sign-in method** tab → enable **Email/Password**.
3. Also enable **Google** → set a support email → **Save**.

### 2.3 Register a Web app (gives you the *client* config)
1. Project Overview → **Add App** under the project name. Or **Settings** → **General** → scroll to
   **Your apps** → click the **`</>`** (web) icon.
2. Nickname it anything (e.g. "student-frontend") → **Register app**.
   You do **not** need Firebase Hosting.
3. Copy the `firebaseConfig` object shown from the **Add Firebase SDK** — you'll paste these six
   values into **both** `student-frontend/.env` and
   `admin-frontend/.env` (same Firebase project, same values, both
   apps).

These six values (`apiKey`, `authDomain`, etc.) are meant to be
public — they identify the project, they're not secrets. It's normal
for them to end up in your deployed frontend's JS bundle.

### 2.4 Generate the Admin SDK key (for the *backend*)
1. From the left sidebar **Settings → Service accounts** tab.
2. Click **Generate new private key** → confirm → a JSON file
   downloads. **Keep this file private — never commit it to Git.**
3. Open the JSON file. You need three fields for `backend/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (paste it exactly as-is,
     including the `\n` sequences and surrounding quotes — see the
     comment in `backend/.env.example`)

If your hosting provider's dashboard mangles multi-line env values,
`backend/src/config/firebaseAdmin.js` also accepts the **entire** JSON
file base64-encoded in one variable, `FIREBASE_SERVICE_ACCOUNT_BASE64`
— instructions are in `backend/.env.example`. Use whichever is easier;
you don't need both.

---

## 3. MongoDB Atlas setup

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) →
   create a free **M0** cluster (any region close to you/Render is
   fine — AWS Singapore or Mumbai will have the lowest latency from
   Bangladesh). Download the `credentials.env` file. **Keep this file private — never commit it to Git.**
2. From the left sidebar **Security** → **Database and Network Access** → **IP Access List** → **Add IP Address** → **Allow access from
   anywhere** (add `0.0.0.0/0` in access entry list). This is the simplest option for a course
   project; Render's outbound IPs aren't fixed on the free tier, so a
   specific-IP allowlist would break on every redeploy.
3. From the left sidebar **Database → Clusters → Choose your cluster → Connect → Drivers** → copy the connection string. It
   looks like:
   ```
   mongodb+srv://<username>:<password>@<your_cluster_name>.xxxxx.mongodb.net/?appName=<your_cluster_name>
   ```
   Replace `<username>`/`<password>`/`your_cluster_name` with your database user's
   credentials, and cluster name. This full string goes in
   `backend/.env` as `MONGODB_URI`.

---

## 4. Cloudinary setup

1. Sign up at [Cloudinary](https://cloudinary.com) (free tier is
   generous — 25 credits/month, plenty for a course project).
2. From the left sidebar go to **Image** → **Quick Start**. Click on **View API Keys** to get 
   your **Cloud Name**, **API Key**, and **API Secret**. These three values go straight
   into `backend/.env` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`.

Uploads go through your backend (`multer` → `cloudinary` upload
stream), not directly from the browser — so nothing Cloudinary-related
needs configuring on either frontend.

---

## 5. Email notifications (optional — skip if you don't want this)

The app works completely fine with this left blank; status-change
emails are a bonus feature, not a requirement (`emailService.js`
no-ops safely if unconfigured).

If you want it: use a Gmail account → Google Account → **Security →
2-Step Verification** (turn it on if it isn't already) → **App
passwords** → generate one for "Mail" → you get a 16-character
password. Put your Gmail address in `EMAIL_USER` and that 16-character
password (not your real Gmail password) in `EMAIL_PASS` in
`backend/.env`.

---

## 6. Running everything locally

1. **Unzip the project**, then for each of the three folders:
   ```bash
   cd backend            && cp .env.example .env   # then fill in real values
   cd ../student-frontend && cp .env.example .env
   cd ../admin-frontend   && cp .env.example .env
   ```
2. Install Node.js **v22 LTS or newer** if you don't have it
   (`node --version` to check) — this project's tooling (Vite 6,
   Tailwind v4, `firebase-admin` v13) needs a current Node version.
3. Install and run each project in **three separate terminals**:
   ```bash
   # Terminal 1
   cd backend && npm install && npm run dev
   # → "IIUC Complaint System API listening on port 5000"

   # Terminal 2
   cd student-frontend && npm install && npm run dev
   # → http://localhost:5173

   # Terminal 3
   cd admin-frontend && npm install && npm run dev
   # → http://localhost:5174
   ```
4. Open `http://localhost:5173`, register a student account (or use
   Google sign-in), and try submitting a complaint.

If `npm run dev` in the backend immediately errors out about a
missing environment variable, that's the intended behavior — it's
telling you exactly which `.env` value is missing rather than failing
silently later. Re-check step 1.

---

## 7. Creating your first superadmin

Nobody starts as an admin or superadmin — every new sign-up is a
`student` by default (this is a deliberate security default: you
never want "become an admin" to be a public, guessable action). To
promote yourself:

1. **Register a normal account** through `student-frontend` first
   (Firebase + this app's own sign-up flow) — this creates your user
   record in MongoDB with `role: student`.
2. In the `backend/` folder, with your `.env` filled in and your
   dependencies installed, run:
   ```bash
   npm run make-admin your.email@example.com superadmin
   ```
   This runs `backend/scripts/setUserRole.js`, which finds that user
   in MongoDB and promotes them — no UI needed, since there's no
   superadmin yet to click the button for you.
3. Log into `admin-frontend` (`http://localhost:5174`) with that same
   email/password. From here on, use the **Users** page to promote
   anyone else — the script is only for bootstrapping the very first
   one.
4. Before department-level admins are useful, go to **Departments**
   (superadmin only) and create at least one department, assigning it
   the complaint categories it should auto-receive (e.g. an "IT
   Support" department handling "Internet/WiFi Issues" and "Lab
   Equipment Problems"). A category with no department mapped just
   means new complaints in it start unassigned, visible to any admin
   to triage.

---

## 8. Deploying the backend (Render)

1. Push this whole repo to a GitHub repository (one repo, all four
   folders — see the root `.gitignore`s, which already exclude
   `node_modules` and `.env`).
2. [Render Dashboard](https://dashboard.render.com) → **New → Web
   Service** → connect your GitHub repo.
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. **Environment** tab → add every variable from
   `backend/.env.example`, with your real values (same ones you used
   locally). Leave `CORS_ORIGINS` blank for now — you'll fill it in
   after step 9 gives you your Vercel URLs.
5. **Create Web Service**. First deploy takes a few minutes. When it's
   live, visit `https://your-service.onrender.com/api/health` — you
   should see `{"status":"ok",...}`.

**Free tier reality check:** Render spins a free web service down
after 15 minutes with no traffic, and the next request takes
30-60 seconds to wake it back up. That's normal, not a bug — just
don't panic during a demo if the first load is slow. If your
presentation timing matters, open the health-check URL a minute or
two before you present to "warm it up."

---

## 9. Deploying the frontends (Vercel — twice, as two separate projects)

You'll repeat this whole section once for `student-frontend` and once
for `admin-frontend` — they're two separate Vercel projects from the
same GitHub repo.

1. [Vercel Dashboard](https://vercel.com/new) → **Import** your GitHub
   repo.
2. Vercel auto-detects it as a monorepo. Set:
   - **Root Directory**: `student-frontend` (or `admin-frontend` the
     second time)
   - **Framework Preset**: Vite (should auto-detect)
3. **Environment Variables** → add every value from that folder's
   `.env.example` (the Firebase values are identical between the two
   apps; only `VITE_API_URL`/`VITE_SOCKET_URL` matter per-app, and
   they'll be the same Render URL for both). `student-frontend` also
   has one extra var, `VITE_ADMIN_APP_URL` — see step 10.4 below.
4. **Deploy**. Repeat for the other frontend.

Because each Vercel project's **Root Directory** is set to its own
folder, Vercel only runs that folder's `npm install`/`npm run build` —
but the whole repository (including `shared/`) is still checked out,
so the `../../../shared/*.js` imports resolve exactly like they do
locally. Nothing extra to configure for that.

---

## 10. Wiring it all together (do this last)

Now that you have three real URLs:
1. **Render dashboard** → your backend service → **Environment** →
   set `CORS_ORIGINS` to your two Vercel URLs, comma-separated, no
   spaces:
   ```
   CORS_ORIGINS=https://your-student-app.vercel.app,https://your-admin-app.vercel.app
   ```
   Save → this triggers a redeploy.
2. Double check both Vercel projects' env vars point
   `VITE_API_URL`/`VITE_SOCKET_URL` at your **Render** URL (not
   `localhost`).
3. Visit your deployed student app, submit a test complaint, then
   check it shows up in the deployed admin app.
4. **student-frontend** → Vercel env vars → set `VITE_ADMIN_APP_URL`
   to your deployed **admin** app's URL (e.g.
   `https://your-admin-app.vercel.app`) → redeploy student-frontend.
   This is what makes the "I'm Staff" button on the student app's
   landing page (`/`) send people to the right place. If you skip
   this, the button just does nothing — it fails safe, not broken.

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend crashes on start: "MONGODB_URI is not set" | `.env` missing/incomplete | Copy `.env.example` → `.env`, fill in real values. |
| Backend crashes: Firebase Admin credentials error | Private key pasted wrong | Re-copy the `private_key` field exactly, keep the `\n` sequences and quotes — or switch to `FIREBASE_SERVICE_ACCOUNT_BASE64`. |
| Frontend shows a blank page, console says Firebase config missing | Forgot `student-frontend/.env` or `admin-frontend/.env` | Both need the same 6 Firebase web-config values. |
| "CORS blocked" error in browser console | Backend's `CORS_ORIGINS` doesn't include your frontend's URL | Add it (comma-separated, exact scheme + domain, no trailing slash). |
| Login works but every API call 401s | Old/expired session, or clock skew | Log out and back in; Firebase tokens auto-refresh otherwise. |
| Image upload fails | Cloudinary credentials wrong, or file >5MB / wrong type | Check `backend/.env` Cloudinary values; only JPEG/PNG/WEBP under 5MB are accepted. |
| Refreshing `/complaints/123` on the deployed site gives a 404 | Vercel didn't apply the SPA rewrite | Confirm `vercel.json` is present in that frontend's folder (it already is in this build) and redeploy. |
| Can't log into admin app at all | Account is still `role: student` | Run `npm run make-admin` (first superadmin) or have an existing superadmin promote you from **Users**. |
| Google sign-in fails on the deployed site but email/password works fine, and it worked on `localhost` | Firebase blocks OAuth popup sign-in from domains it doesn't recognize — `localhost` is allowed by default, your Vercel URL isn't | Firebase Console → Authentication → Settings → **Authorized domains** → Add your exact `.vercel.app` URL(s). No redeploy needed, takes effect immediately. |
| "This Google account is not registered" on a real, valid Google account | Expected behavior, not a bug — Google sign-in only works for identities that already exist in the system (see §0) | Register with email/password first (student app), or have a superadmin create the staff account first (admin app). |
| Deploy hook URL accidentally used as `VITE_API_URL` | Render's dashboard shows a "Deploy Hook" URL that looks similar to an API URL but isn't one | Use `https://<your-service>.onrender.com/api`, not anything containing `api.render.com/deploy/...`. If you pasted a deploy hook into a public frontend build, delete and regenerate it in Render's service settings — treat it as briefly exposed. |
| Real-time toast notifications don't appear | Socket didn't connect | Check `VITE_SOCKET_URL` matches your backend's actual URL, and that the backend redeployed after you set `CORS_ORIGINS`. |
| Render free instance is slow on first load | Expected — free tier spins down after 15 min idle | Not a bug; "warm it up" before a demo (see §8). |

