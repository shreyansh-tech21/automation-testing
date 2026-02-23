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
}

const url = "http://localhost:5000/create-test";
const bodyStr = JSON.stringify(body_self_heal);

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr),
  },
};

const req = require("http").request(
  url,
  options,
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", data);
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
