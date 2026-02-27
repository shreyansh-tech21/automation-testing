const crypto = require("crypto");

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

/**
 * Verify that the request came from Slack using X-Slack-Signature.
 * Expects req.rawBody to be the raw request body (Buffer or string).
 * Must be used on routes that capture raw body (e.g. urlencoded verify callback).
 */
function verifySlackSignature(req, res, next) {
  if (!SLACK_SIGNING_SECRET) {
    console.error("[Slack] Signing secret not configured. Set SLACK_SIGNING_SECRET in .env");
    return res.status(503).send("Slack signing secret not configured");
  }
  const signature = req.headers["x-slack-signature"];
  if (!signature || !signature.startsWith("v0=")) {
    console.error("[Slack] Missing or invalid X-Slack-Signature header");
    return res.status(401).send("Missing or invalid X-Slack-Signature");
  }
  const rawBody = req.rawBody;
  if (!rawBody) {
    console.error("[Slack] Raw body missing. Ensure /slack/command is parsed with urlencoded and verify callback sets req.rawBody.");
    return res.status(500).send("Raw body required for Slack verification");
  }
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const sigBaseline = signature.slice(3);
  const ts = req.body?.timestamp || req.headers["x-slack-request-timestamp"];
  if (!ts) {
    console.error("[Slack] Missing timestamp in request");
    return res.status(401).send("Missing timestamp");
  }
  const age = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (age < 0 || age > 300) {
    console.error("[Slack] Request timestamp too old or in future, age=" + age);
    return res.status(401).send("Request timestamp too old");
  }
  const base = `v0:${ts}:${body}`;
  const hmac = crypto.createHmac("sha256", SLACK_SIGNING_SECRET).update(base).digest("hex");
  const sigBuf = Buffer.from(sigBaseline, "hex");
  const hmacBuf = Buffer.from(hmac, "hex");
  if (sigBuf.length !== hmacBuf.length || !crypto.timingSafeEqual(sigBuf, hmacBuf)) {
    console.error("[Slack] Invalid signature (wrong SLACK_SIGNING_SECRET or body tampered)");
    return res.status(401).send("Invalid signature");
  }
  next();
}

module.exports = { verifySlackSignature };
