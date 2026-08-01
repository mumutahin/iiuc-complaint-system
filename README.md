# IIUC Campus Complaint Management System

A complaint submission and tracking system for **International Islamic
University Chittagong** — students report facility issues (classrooms,
labs, WiFi, hostel, transport, library, cleanliness, security), staff
triage and resolve them, everyone sees real-time status updates.

Full setup instructions are in **`SETUP_GUIDE.md`**.
This README is just a map of what's here.

## Structure

This is a monorepo — one Git repository, four folders, deployed as
**three separate services**:

```
iiuc-complaint-system/
├── shared/              Plain-JS constants, validators, formatters.
│                        Imported directly (by relative path) from all
│                        three projects below — this is the ONE place
│                        that defines categories, statuses, priorities,
│                        and field limits, so they can never drift out
│                        of sync between the student app, the admin
│                        app, and the API that serves both.
│
├── backend/             Node.js + Express + MongoDB + Socket.io API.
│                        Deploys to Render.
│
├── student-frontend/    React app students use to submit and track
│                        complaints. Deploys to Vercel.
│
└── admin-frontend/       React app staff use to triage, resolve, and
                          run analytics. Deploys to Vercel (as a
                          SEPARATE project from student-frontend).
```

Each of `backend/`, `student-frontend/`, and `admin-frontend/` has its
own `package.json` and is installed/run independently (`cd backend &&
npm install`, etc.) — they are not npm workspaces, just three plain
Node/Vite projects that happen to share one `shared/` folder of plain
JavaScript.

## Roles

- **Student** — submits complaints, tracks their own, browses/upvotes
  a community board of everyone's complaints, comments.
- **Admin** (department-level authority) — sees complaints routed to
  their department, updates status/priority, assigns, leaves internal
  notes.
- **Superadmin** — sees everything university-wide, manages
  departments and category routing, promotes/demotes user roles,
  manages department staff.

There's no self-service way to become an admin or superadmin — see
"Creating your first superadmin" in the setup guide.

## Quickstart (once everything is configured — see the setup guide first)

```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd student-frontend && npm install && npm run dev    # http://localhost:5173

# Terminal 3
cd admin-frontend && npm install && npm run dev      # http://localhost:5174
```
