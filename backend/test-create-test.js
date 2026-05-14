/**
 * Test POST /create-test without Postman.
 * Run: node test-create-test.js
 * (Start the server first with: npm run dev)
 */

const body = {
  name: "Login Positive Test",
  url: "https://the-internet.herokuapp.com/login",
  profile: "smoke",
  steps: [
    { label: "Username", action: "fill", value: "tomsmith", type: "positive" },
    { label: "Password", action: "fill", value: "SuperSecretPassword!", type: "positive" },
    { label: "Login", action: "click" },
    { label: "Success", expected: "You logged into a secure area!", type: "positive" },
  ],
};

const body_neg={
  name: "Login Negative Test",
  url: "https://the-internet.herokuapp.com/login",
  profile: "e2e",
  "steps": [
    {
      "label": "Username",
      "action": "fill",
      "value": "wronguser",
      "type": "negative"
    },
    {
      "label": "Password",
      "action": "fill",
      "value": "wrongpass",
      "type": "negative"
    },
    {
      "label": "Login",
      "action": "click"
    },
    {
      "label": "Error",
      "expected": "Your username is invalid!",
      "type": "negative"
    }
  ]
}

const body_fail={
  name: "Validation Failure Test",
  url: "https://the-internet.herokuapp.com/login",
  profile: "smoke",
  "steps":[
    {
      "label": "Username",
      "action": "fill",
      "value": "tomsmith"
    },
    {
      "label": "Password",
      "action": "fill",
      "value": "SuperSecretPassword!"
    },
    {
      "label": "Login",
      "action": "click"
    },
    {
      "label": "WrongCheck",
      "expected": "Some wrong text"
    }
  ]
}

const body_self_heal={
  name: "Self-Healing Test",
  url: "https://the-internet.herokuapp.com/login",
  profile: "e2e",
  steps: [
    { label: "User Name", action: "fill", value: "tomsmith", type: "positive" },
    { label: "Password", action: "fill", value: "SuperSecretPassword!", type: "positive" },
    { label: "Login", action: "click" },
    { label: "Success", expected: "You logged into a secure area!", type: "positive" },
  ],
};

const body_api = {
  name: "Simple GET Test",
  testType: "api",
  steps: [
    {
      name: "Get User",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/users/1",
      assert: { status: 200 },
    },
  ],
};

const new_url_testing={
  "name": "Base URL Test",
  "testType": "api",
  "baseUrl": "https://jsonplaceholder.typicode.com",
  "steps": [
    {
      "name": "Get User",
      "method": "GET",
      "url": "/users/1",
      "assert": {
        "status": 200
      }
    }
  ]
}
const failure_assertion_testing={
  "name": "Failure Test",
  "testType": "api",
  "baseUrl": "https://jsonplaceholder.typicode.com",
  "steps": [
    {
      "name": "Wrong Status",
      "method": "GET",
      "url": "/users/1",
      "assert": {
        "status": 201
      }
    }
  ]
}
// Variable chaining: step 1 extracts postId from response.id, step 2 uses {{postId}} in URL.
const body_api_chaining = {
  name: "Variable Chaining Test",
  testType: "api",
  steps: [
    {
      "name": "Get User",
      "method": "GET",
      "url": "https://jsonplaceholder.typicode.com/users/1",
      "assert": {
        "status": 200
      }
    }
  ],
};

const ai_generated_flow={
  "name": "Policy Flow Test",
  "testType": "api",
  "baseUrl": "",
  "steps": [
    {
      "name": "Create Policy",
      "method": "POST",
      "url": "/policy",
      "body": { "customerId": "123" },
      "extract": {
        "correlationId": "headers.correlation-id"
      },
      "assert": { "status": 200 }
    },
    {
      "name": "Issue Policy",
      "method": "POST",
      "url": "/issue",
      "body": {
        "correlationId": "{{correlationId}}"
      },
      "assert": { "status": 200 }
    }
  ]
};

// Switch body to create: new_url_testing (Base URL), failure_assertion_testing, body_api_chaining, etc.
// POST /create-test requires auth: set CREATE_TEST_TOKEN or TEST_EMAIL + TEST_PASSWORD to get a token.
const url = "http://localhost:5000/create-test";
const bodyStr = JSON.stringify(ai_generated_flow);

function runCreateTest(token) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr),
    },
  };
  if (token) options.headers.Authorization = "Bearer " + token;

  const req = require("http").request(
    url,
    options,
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", data);
        if (res.statusCode === 401) {
          console.error("Auth required. Set CREATE_TEST_TOKEN or TEST_EMAIL + TEST_PASSWORD (see script).");
        }
        try {
          console.log("Parsed:", JSON.parse(data));
        } catch (_) {}
      });
    }
  );
  req.on("error", (err) => {
    console.error("Error:", err.message);
    console.error("Make sure the server is running: npm run dev");
    process.exit(1);
  });
  req.write(bodyStr);
  req.end();
}

const token = process.env.CREATE_TEST_TOKEN;
if (token) {
  runCreateTest(token);
} else if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
  const loginUrl = "http://localhost:5000/auth/login";
  const loginBody = JSON.stringify({
    email: process.env.TEST_EMAIL.replace(/^["']|["']$/g, ""),
    password: process.env.TEST_PASSWORD.replace(/^["']|["']$/g, ""),
  });
  const loginReq = require("http").request(
    loginUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) },
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) runCreateTest(parsed.token);
          else runCreateTest(null);
        } catch (_) {
          runCreateTest(null);
        }
      });
    }
  );
  loginReq.on("error", () => runCreateTest(null));
  loginReq.write(loginBody);
  loginReq.end();
} else {
  runCreateTest(null);
}
