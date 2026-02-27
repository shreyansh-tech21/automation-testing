/**
 * Test GET /issues and POST /issues without Postman.
 * Requires auth: logs in first, then calls issues endpoints.
 *
 * Run: node test-issues.js
 * (Start the server first: npm run dev)
 *
 * Set credentials via env or edit below:
 *   TEST_EMAIL=admin@example.com TEST_PASSWORD=yourpass node test-issues.js
 */

require("dotenv").config();
const http = require("http");

// Strip surrounding quotes (Windows CMD often sets env with quotes: set TEST_EMAIL="a@b.com")
const strip = (s) => (typeof s === "string" ? s.replace(/^\s*["']|["']\s*$/g, "").trim() : s) || "";
const BASE = process.env.BASE_URL || "http://localhost:5000";
const EMAIL = strip(process.env.TEST_EMAIL) || "admin@example.com";
const PASSWORD = strip(process.env.TEST_PASSWORD) || "yourpassword";

function request(method, path, body, token) {
  const url = new URL(path, BASE);
  const bodyStr = body ? JSON.stringify(body) : "";
  const opts = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (bodyStr) opts.headers["Content-Length"] = Buffer.byteLength(bodyStr);
  if (token) opts.headers["Authorization"] = "Bearer " + token;

  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log("1. Login:", EMAIL);
  const loginRes = await request("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  if (loginRes.status !== 200) {
    console.error("Login failed:", loginRes.status, loginRes.data);
    if (loginRes.data?.error === "User not found") {
      console.error("\nNo user with this email in the database. Either:");
      console.error("  1. Register first (e.g. open the app in browser and sign up), or");
      console.error("  2. Use the exact email you use to log in on the frontend.");
    }
    console.error("\nSet credentials (no quotes in CMD):");
    console.error('  set TEST_EMAIL=your@email.com');
    console.error('  set TEST_PASSWORD=yourpassword');
    console.error('  npm run test:issues');
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log("   Token received.\n");

  console.log("2. GET /issues");
  const getRes = await request("GET", "/issues", null, token);
  console.log("   Status:", getRes.status);
  console.log("   Response:", JSON.stringify(getRes.data, null, 2));
  if (getRes.status !== 200) {
    console.error("GET /issues failed.");
    process.exit(1);
  }

  console.log("\n3. POST /issues");
  const postBody = {
    title: "Test issue from script",
    description: "Created by test-issues.js",
    priority: "medium",
    // optional: assignedTo: "<userId>", linkedExecutionId: "<executionId>"
  };
  const postRes = await request("POST", "/issues", postBody, token);
  console.log("   Status:", postRes.status);
  console.log("   Response:", JSON.stringify(postRes.data, null, 2));
  if (postRes.status !== 200 && postRes.status !== 201) {
    console.error("POST /issues failed.");
    process.exit(1);
  }

  console.log("\nDone. GET and POST /issues succeeded.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  console.error("Is the server running? npm run dev");
  process.exit(1);
});
