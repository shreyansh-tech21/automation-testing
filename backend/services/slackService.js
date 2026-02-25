const https = require("https");

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

function hasWebhook() {
  return Boolean(SLACK_WEBHOOK_URL && SLACK_WEBHOOK_URL.startsWith("https://hooks.slack.com/"));
}

function hasBotToken() {
  return Boolean(SLACK_BOT_TOKEN && SLACK_CHANNEL_ID);
}

/**
 * Post a message to Slack using Incoming Webhook (Option A).
 * @param {object} payload - Slack block kit or simple { text } message
 */
function postViaWebhook(payload) {
  return new Promise((resolve, reject) => {
    if (!hasWebhook()) {
      resolve(null);
      return;
    }
    const url = new URL(SLACK_WEBHOOK_URL);
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`Slack webhook ${res.statusCode}: ${data}`));
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Post a message to Slack using Bot Token (Option B).
 * @param {string} text - Plain text message
 * @param {object} [blocks] - Optional Block Kit blocks
 */
function postViaBot(text, blocks) {
  return new Promise((resolve, reject) => {
    if (!hasBotToken()) {
      resolve(null);
      return;
    }
    const body = JSON.stringify({
      channel: SLACK_CHANNEL_ID,
      text,
      ...(blocks && { blocks }),
    });
    const req = https.request(
      {
        hostname: "slack.com",
        path: "/api/chat.postMessage",
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const parsed = JSON.parse(data);
          if (parsed.ok) resolve(parsed);
          else reject(new Error(parsed.error || data));
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Notify Slack about a test execution result.
 * Uses webhook if set, otherwise bot token; does nothing if neither is configured.
 */
async function notifyTestExecution(execution) {
  const status = execution.overallStatus === "Passed" ? "Passed" : "Failed";
  const emoji = status === "Passed" ? "✅" : "❌";
  const text = `${emoji} Test run: *${execution.testName || "Unnamed"}* — ${status}`;
  const blocks = [
    {
      type: "section",
      text: { type: "mrkdwn", text },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Profile: ${execution.profile || "—"} | Execution ID: \`${execution._id}\`` },
      ],
    },
  ];

  if (hasWebhook()) {
    try {
      await postViaWebhook({ text, blocks });
    } catch (err) {
      console.error("Slack webhook error:", err.message);
    }
    return;
  }
  if (hasBotToken()) {
    try {
      await postViaBot(text, blocks);
    } catch (err) {
      console.error("Slack bot post error:", err.message);
    }
  }
}

module.exports = {
  hasWebhook,
  hasBotToken,
  postViaWebhook,
  postViaBot,
  notifyTestExecution,
};
