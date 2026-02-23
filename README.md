# Automation Testing

Backend (Node/Express, Playwright, self-healing locators) + Frontend (Next.js) for test execution and dashboard.

## Prerequisites

- Node.js
- MongoDB (for backend)

## Setup

1. Clone the repo.
2. Backend:
   - `cd backend`
   - `npm install`
   - Copy `.env.example` to `.env` and set MongoDB URL etc.
3. Frontend:
   - `cd frontend`
   - `npm install`

## Run

- Backend (port 5000): from root run `npm run dev:backend`, or `cd backend && npm run dev`.
- Frontend (port 3000): from root run `npm run dev`, or `cd frontend && npm run dev`.
- Open http://localhost:3000 and use the Dashboard.
```

- **Why:** So you (and others) know how to install and run both backend and frontend.

---

### Step 4 – Leave `backend/` and `frontend/` as they are

- **Action:** Do not move or rename files inside `backend/` or `frontend/`. Only root files were added/updated.
- **Check:** Backend still has its own `package.json` and `.gitignore`; frontend has its own `package.json` and `.gitignore`.
