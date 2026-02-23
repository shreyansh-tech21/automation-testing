# How to Test Your Automation-Testing Project

Run these in order. Use **two terminals**: one for the backend server, one for commands.

---

## 1. Start the backend

```bash
cd backend
npm run dev
```

Wait for: `Server is running on port 5000` and `MongoDB connected`.

---

## 2. Backend API tests (no browser)

In a **second terminal**:

```bash
cd backend
node test-all.js
```

This checks:

- **GET /health** – server and DB
- **POST /create-test** – create a test
- **GET /tests** – list tests

You should see: `3 passed, 0 failed`.

---

## 3. Create a test (API)

```bash
cd backend
npm run test:create
```

Or with curl (from project root or backend):

```bash
curl -X POST http://localhost:5000/create-test -H "Content-Type: application/json" -d "{\"name\":\"Login Test\",\"url\":\"https://example.com/login\",\"steps\":[{\"label\":\"Email\",\"action\":\"fill\",\"value\":\"test@gmail.com\"},{\"label\":\"Password\",\"action\":\"fill\",\"value\":\"123456\"},{\"label\":\"Login\",\"action\":\"click\"}]}"
```

Save the `_id` from the response (24-character hex string).

---

## 4. List tests and get an id

```bash
cd backend
node test-run-test.js
```

Use one of the printed ids in the next step.

---

## 5. Run a test (Playwright – opens browser)

```bash
cd backend
node test-run-test.js <paste-24-char-id-here>
```

Example:

```bash
node test-run-test.js 6995d74d9f92b36abb8cfc35
```

A browser window will open, run the steps, then close. The response includes `execution` and `report` (path to the HTML report). Reports are saved in `backend/utils/reports/`.

---

## 6. Frontend (manual)

1. Backend must be running (`npm run dev` in `backend`).
2. In another terminal:

   ```bash
   cd frontend
   npm run dev
   ```

3. Open **http://localhost:3000** in your browser.
4. Fill the form:
   - **Test Name:** e.g. Login Test
   - **URL:** e.g. https://example.com/login
   - **Paste Steps JSON:** e.g.  
     `[{"label":"Email","action":"fill","value":"test@gmail.com"},{"label":"Login","action":"click"}]`
5. Click **Save Test** → you should see “Test saved successfully” and the form should clear.
6. Try invalid JSON in Steps → you should see an error alert.

---

## Quick reference

| What              | Command / URL |
|-------------------|----------------|
| Start backend     | `cd backend` → `npm run dev` |
| API checks        | `node test-all.js` (from backend) |
| Create test (API) | `npm run test:create` |
| List test ids     | `node test-run-test.js` |
| Run one test      | `node test-run-test.js <id>` |
| Start frontend    | `cd frontend` → `npm run dev` |
| Open app          | http://localhost:3000 |
| Health            | http://localhost:5000/health |

---

## HTML reports

After running a test, the server writes an HTML report to:

`backend/utils/reports/<timestamp>-report.html`

Open that file in a browser to see step-by-step results.
