# Repository restructure – steps to do yourself

Use this as a checklist. Run every command from the repo root unless a step says otherwise.

**Repo root:** `c:\Users\karamtot\Automation-Testing`

---

## 1. Current project structure (as of now)

```
Automation-Testing/
├── .git/
├── package.json              ← root (has dev, dev:backend + some deps)
├── package-lock.json
├── TESTING.md
├── node_modules/             ← root (from chart.js, react-chartjs-2, string-similarity)
│
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── runner.js
│   ├── models/               (Execution.js, Test.js)
│   ├── routes/               (aiRoutes, executionRoutes, testRoutes)
│   ├── utils/                (selfHeal.js, generateReport.js, reports/, …)
│   ├── screenshots/
│   ├── test-*.js             (test-server, test-create-test, etc.)
│   ├── PROJECT-REVIEW.md
│   └── TEST-SCRIPTS.md
│
└── frontend/
    ├── .gitignore
    ├── .eslintrc.json
    ├── package.json
    ├── package-lock.json
    ├── next.config.js
    ├── postcss.config.mjs
    ├── tsconfig.json
    ├── next-env.d.ts
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── dashboard/
    │       └── page.tsx
    └── node_modules/         ← frontend deps only
```

**What’s missing at root:** no root `.gitignore`, no root `README.md`. Backend and frontend each have their own `.gitignore`.

---

## 2. Target structure (what you want after restructure)

```
Automation-Testing/
├── .git/
├── .gitignore          ← NEW: root ignore list
├── README.md           ← NEW: how to run backend + frontend
├── package.json        ← UPDATE: scripts only (no root deps)
├── package-lock.json    (optional at root; can delete if you remove root deps)
│
├── backend/            ← unchanged layout
│   ├── .env            (untracked)
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   └── …
│
└── frontend/           ← unchanged layout
    ├── .gitignore
    ├── package.json
    ├── app/
    └── …
```

---

## 3. Step-by-step (do in order; tick as you go)

### Step 1 – Create root `.gitignore`

- **Where:** repo root (`Automation-Testing/`).
- **Action:** Create a new file named `.gitignore` (no filename before the dot).
- **Contents:**

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Next.js
frontend/.next/
frontend/out/

# Build / misc
dist/
*.log
.DS_Store
```

- **Why:** So you never commit root `node_modules`, frontend build output, or `.env` files.

---

### Step 2 – Update root `package.json`

- **Where:** repo root, file `package.json`.
- **Action:** Replace its contents with scripts only (no dependencies needed at root to run backend/frontend):

```json
{
  "name": "automation-testing",
  "private": true,
  "scripts": {
    "dev": "npm run dev --prefix frontend",
    "dev:backend": "npm run dev --prefix backend"
  }
}
```

- **Optional:** If you remove the old root dependencies (chart.js, react-chartjs-2, string-similarity), you can also delete root `package-lock.json` and run `npm install` at root again (or leave lockfile as-is; it won’t break anything).
- **Why:** One place to run frontend (`npm run dev`) and backend (`npm run dev:backend`) from the root.

---

### Step 3 – Create root `README.md`

- **Where:** repo root, new file `README.md`.
- **Action:** Create the file and add at least:

```markdown
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

---

### Step 5 – Git: see what will be committed

- **Where:** repo root.
- **Commands:**

```bash
cd c:\Users\karamtot\Automation-Testing
git status
```

- **What to look for:** You should see:
  - `.gitignore` (new)
  - `README.md` (new)
  - `package.json` (modified)
  - `frontend/` (new if it wasn’t tracked before)
  - You should **not** see `node_modules/`, `backend/.env`, or `frontend/.next/` as files to add (they should be ignored).

---

### Step 6 – Git: add and commit

- **Where:** repo root.
- **Commands:**

```bash
git add .gitignore README.md package.json frontend
git status
git commit -m "Restructure: root .gitignore, README, scripts; add frontend"
```

- **If backend wasn’t in the last commit:** also `git add backend` and adjust the commit message if you like (e.g. “Add backend and frontend; root structure”).
- **Note:** Don’t add `backend/.env`; it should be in `.gitignore` or `backend/.gitignore`.

---

### Step 7 – Git: push

- **Where:** repo root.
- **Command (use your branch name):**

```bash
git push origin main
```

- If your default branch is `master`:

```bash
git push origin master
```

- **If the remote has a different structure (e.g. backend at root):** you may need to use a new branch, push that, then merge or force-push after reviewing. Same steps as above, but create a branch first, e.g. `git checkout -b restructure`, then do the add/commit/push for that branch.

---

## 4. Quick checklist (copy into your notes)

- [ ] 1. Create root `.gitignore` with node_modules, .env, frontend/.next, etc.
- [ ] 2. Update root `package.json` to scripts only (dev, dev:backend).
- [ ] 3. Create root `README.md` with setup and run instructions.
- [ ] 4. Do not move backend or frontend folders.
- [ ] 5. Run `git status` and confirm only the right files are listed.
- [ ] 6. `git add` the new/changed root files and frontend (and backend if needed), then `git commit`.
- [ ] 7. `git push origin <your-branch>`.

---

## 5. Verify after restructure

- From root: `npm run dev:backend` → backend runs on 5000.
- From root: `npm run dev` → frontend runs on 3000.
- In browser: http://localhost:3000 → Home → Dashboard; dashboard loads data from backend.

Done. You can keep this file in the repo or delete it after you’ve written the steps into your own notes.
