# Understanding the Backend Test Scripts

These four scripts **call your backend API** from the command line (no Postman needed). Your **real application** is the frontend + backend; these scripts are just **helpers to test and use** the API.

**Requirement:** The backend server must be running first: `npm run dev` (in the `backend` folder).

---

## 1. `test-server.js` — Is the server up?

**What it does:** Sends **GET** to `http://localhost:5000/health` and checks the response.

**How it works:**
1. Uses Node’s `http.get()` to request `/health`.
2. Reads the response body and parses it as JSON.
3. If the JSON has `ok: true`, it prints it and exits with code 0 (success).
4. Otherwise (or on error/timeout), exits with code 1 (failure).

**When to use:** Quick check that the server is running and MongoDB connection is reported (e.g. before running other tests).

**Run:** `npm run test` or `node test-server.js`

**API used:** `GET /health`

---

## 2. `test-create-test.js` — Create one test in the database

**What it does:** Sends **POST** to `http://localhost:5000/create-test` with a **fixed JSON body** (one test definition).

**How it works:**
1. Builds a JavaScript object with `name`, `url`, `profile`, and `steps` (same shape your frontend sends).
2. Converts it to JSON and sends it in the request body with `Content-Type: application/json`.
3. Logs the response: status code and the full response (the created test document with `_id`).

**When to use:** To create a test from the command line (e.g. your “Login Positive Test”). You can edit the `body` object in the file to create different tests.

**Run:** `npm run test:create` or `node test-create-test.js`

**API used:** `POST /create-test` (body: `{ name, url, profile?, steps }`)

---

## 3. `test-run-test.js` — List tests OR run one test

**What it does:** Two modes, depending on whether you pass an **id** as argument:

- **No id:** Sends **GET** to `http://localhost:5000/tests`, prints all tests and their `_id` (so you can copy one).
- **With id:** Sends **POST** to `http://localhost:5000/run-test/<id>`, which runs that test in Playwright and returns the execution result and report path.

**How it works:**
1. Reads `process.argv[2]` — the first command-line argument (the test id, if any).
2. **If no id:** Calls `GET /tests`, then loops over the array and prints each test’s `_id`, `name`, and `url`. Exits.
3. **If id given:** Calls `POST /run-test/<id>`. No body needed. Prints the JSON result (execution + report path). Exits with 0 if the test “Passed”, 1 otherwise.

**When to use:**
- Run `node test-run-test.js` when you want to **see all test ids**.
- Run `node test-run-test.js <id>` when you want to **run a specific test** (browser will open; report is generated).

**Run:**
- List: `npm run test:run` or `node test-run-test.js`
- Run one: `node test-run-test.js <24-char-id>`

**APIs used:** `GET /tests` and `POST /run-test/:id`

---

## 4. `test-all.js` — Smoke test of three endpoints

**What it does:** Runs **three checks in order**: health → create-test → list tests. Prints ✓/✗ for each and a final “X passed, Y failed”.

**How it works:**
1. **Helper `request(method, path, body)`** — Builds an HTTP request to `BASE` (localhost:5000), sends optional JSON body, returns a Promise with `{ status, data }` (parsed JSON) or `{ status, raw }`.
2. **Step 1 — GET /health:** Expects status 200 and `data.ok === true`. Counts pass/fail.
3. **Step 2 — POST /create-test:** Sends a sample test (name, url, steps). Expects status 200 and `data._id`. Counts pass/fail.
4. **Step 3 — GET /tests:** Expects status 200 and an array. Counts pass/fail.
5. Prints total passed/failed and exits with code 1 if any failed (so you can use it in CI).

**When to use:** To quickly verify that the server and database are working and that create + list both succeed (no browser, no Playwright).

**Run:** `npm run test:all` or `node test-all.js`

**APIs used:** `GET /health`, `POST /create-test`, `GET /tests`

---

## How they relate to your application

| Script            | Purpose in your app |
|-------------------|---------------------|
| `test-server.js`  | Check server is up and DB is connected. |
| `test-create-test.js` | Same as “Save Test” in the frontend: creates one test via API. |
| `test-run-test.js` | Same as “run a test” in the backend: list tests or run one by id (Playwright + report). |
| `test-all.js`     | Automated smoke test: health + create + list in one go. |

Your **application** does the same things:
- **Frontend:** User fills form → POST /create-test (like `test-create-test.js`).
- **Backend server:** Exposes /health, /create-test, /tests, /run-test/:id.
- These scripts just **call those same endpoints** from the terminal so you can test without the UI or Postman.

---

## Flow summary

```
1. Start server:     npm run dev
2. Check health:     npm run test          (test-server.js)
3. Create a test:    npm run test:create   (test-create-test.js)
4. List test ids:    node test-run-test.js (test-run-test.js, no id)
5. Run one test:     node test-run-test.js <id>
6. Smoke test all:   npm run test:all      (test-all.js)
```

All scripts use Node’s built-in `http` (or `https`) module to send HTTP requests; they do not start the server — they **talk to** the server that `npm run dev` started.
