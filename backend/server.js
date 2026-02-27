require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Test = require('./models/Test');
const runner = require('./runner');
const Execution=require('./models/Execution')
const generateHTMLReport=require('./utils/generateReport');
const { analyzeExecution } = require("./services/aiService");
const { validateCreateTest } = require("./schemas/createTest");
const { notifyTestExecution } = require("./services/slackService");
const { verifySlackSignature } = require("./middleware/slackVerify");
const { WebClient } = require("@slack/web-api");
const auth = require("./middleware/authMiddleware");
const allowRoles = require("./middleware/roleMiddleware");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/IssueRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const slackClient = process.env.SLACK_BOT_TOKEN ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use("/issues", issueRoutes);

// Mongoose connection (use MONGO_URI in .env — e.g. MongoDB Atlas or mongodb://localhost:27017/yourdb)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/automation-testing';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Auth routes (public)
app.use("/auth", authRoutes);

// Admin: list users (admin only)
app.get("/users", auth, allowRoles("admin"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const users = await User.find().select("name email role createdAt").lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assignable users: testers only (for issue "Assigned to" dropdown; admin & tester can call)
app.get("/users/assignable", auth, allowRoles("admin", "tester"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const users = await User.find({ role: "tester" }).select("_id name email").lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check for testing (public)
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Server is running',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Create test — tester & admin
app.post("/create-test", auth, allowRoles("admin", "tester"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database not connected",
      hint: "Start MongoDB locally or set MONGO_URI in .env to a MongoDB Atlas connection string.",
    });
  }
  const parsed = validateCreateTest(req.body);
  if (!parsed.success) {
    const messages = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    return res.status(400).json({ error: "Validation failed", details: messages });
  }
  try {
    const test = await Test.create(parsed.data);
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all tests — tester & admin
app.get('/tests', auth, allowRoles("admin", "tester"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    const tests = await Test.find({}).select('_id name url profile').lean();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a test — tester & admin
app.delete('/tests/:id', auth, allowRoles("admin", "tester"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  const id = req.params.id;
  if (id.length !== 24 || !/^[a-f0-9]+$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid test id', id });
  }
  try {
    const deleted = await Test.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Test not found', id });
    }
    res.json({ deleted: true, id, name: deleted.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run profile — tester & admin
app.post('/run-profile/:profile', auth, allowRoles("admin", "tester"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  const profile = req.params.profile;
  try {
    const tests = await Test.find({ profile });
    const results = [];
    for (const test of tests) {
      const testResult = await runner.runTest(test);
      results.push({
        testId: test._id,
        testName: test.name,
        result: testResult,
      });
    }
    res.json({ profile, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats, executions, execution detail, screenshot — viewer, tester & admin
const viewerOrAbove = allowRoles("admin", "tester", "viewer");

app.get("/stats", auth, viewerOrAbove, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const totalExecutions = await Execution.countDocuments();
    const passedExecutions = await Execution.countDocuments({
      overallStatus: "Passed"
    });

    const healAggregation = await Execution.aggregate([
      { $unwind: "$results" },
      { $match: { "results.healed": true } },
      {
        $group: {
          _id: "$results.healStrategy",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalHeals = healAggregation.reduce((acc, item) => acc + item.count, 0);

    const trend = await Execution.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalExecutions,
      passRate: totalExecutions
        ? ((passedExecutions / totalExecutions) * 100).toFixed(2)
        : 0,
      totalHeals,
      strategyBreakdown: healAggregation,
      trend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/executions", auth, viewerOrAbove, async (req, res) => {
  const executions = await Execution.find().sort({ createdAt: -1 });
  res.json(executions);
});

// Get latest execution
app.get('/executions/latest', auth, viewerOrAbove, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    const execution = await Execution.findOne().sort({ createdAt: -1 }).lean();
    if (!execution) return res.status(404).json({ error: 'No executions yet' });
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single execution by id
app.get('/executions/:id', auth, viewerOrAbove, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    const execution = await Execution.findById(req.params.id).lean();
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve screenshot for a failed step
app.get('/executions/:id/steps/:stepIndex/screenshot', auth, viewerOrAbove, async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id).lean();
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    const stepIndex = parseInt(req.params.stepIndex, 10);
    const results = execution.results || [];
    if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= results.length) {
      return res.status(400).json({ error: 'Invalid step index' });
    }
    const screenshotPath = results[stepIndex].screenshot;
    if (!screenshotPath || typeof screenshotPath !== 'string' || screenshotPath.startsWith('(')) {
      return res.status(404).json({ error: 'No screenshot for this step' });
    }
    const resolved = path.resolve(screenshotPath);
    const screenshotsDir = path.resolve(__dirname, 'screenshots');
    if (!resolved.startsWith(screenshotsDir) || !fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'Screenshot file not found' });
    }
    res.sendFile(resolved, { headers: { 'Content-Type': 'image/png' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/run-test/:id', auth, allowRoles("admin", "tester"), async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  const id = req.params.id;
  if (id.length !== 24 || !/^[a-f0-9]+$/i.test(id)) {
    return res.status(400).json({
      error: 'Invalid test id',
      hint: 'Id must be 24 hex characters (from create-test or GET /tests).',
      id,
    });
  }
  const test = await Test.findById(id);
  if (!test) {
    return res.status(404).json({ error: 'Test not found', id });
  }
  try {
    const results = await runner.runTest(test);
    const execution = await Execution.create({
      testId: test._id,
      testName: test.name,
      profile: test.profile,
      results: results.results,
      overallStatus: results.overallStatus,
    });
    const reportPath = generateHTMLReport(execution);
    notifyTestExecution(execution).catch((err) => console.error("Slack notify:", err.message));
    res.json({ execution, report: reportPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Slack slash command: /run [profile] — must respond within 3s, then post result to channel
const skipSlackVerify = process.env.SKIP_SLACK_VERIFY === "1" || process.env.SKIP_SLACK_VERIFY === "true";
app.post("/slack/command", (req, res, next) => {
  if (skipSlackVerify) return next();
  return verifySlackSignature(req, res, next);
}, (req, res) => {
  console.log("[Slack] /run command received, profile from text:", (req.body?.text || "").trim() || "(default: smoke)");
  res.status(200).send("Processing...");

  const channelId = req.body.channel_id;
  const responseUrl = req.body.response_url; // use this to replace "Processing..." with the result
  const text = (req.body.text || "").trim();
  const args = text ? text.split(/\s+/) : [];
  const profile = args[0] || "smoke";

  // Post to response_url so the "Processing..." message gets replaced (works without bot in channel)
  const updateSlackResponse = (payload) => {
    if (!responseUrl) return Promise.resolve();
    const url = new URL(responseUrl);
    const body = JSON.stringify(payload);
    return new Promise((resolve, reject) => {
      const lib = url.protocol === "https:" ? require("https") : require("http");
      const req = lib.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    });
  };

  (async () => {
    try {
      if (!slackClient) {
        await updateSlackResponse({
          replace_original: true,
          text: "Slack bot token not configured. Set SLACK_BOT_TOKEN in .env.",
        });
        return;
      }
      if (mongoose.connection.readyState !== 1) {
        await updateSlackResponse({
          replace_original: true,
          text: "Database not connected.",
        });
        return;
      }
      const tests = await Test.find({ profile }).lean();

      const testNames = tests.map((t) => t.name || t._id?.toString() || "Unnamed").filter(Boolean);
      const lineupText = testNames.length === 0
        ? `No tests found for profile *${profile}*. Add tests with this profile in the app.`
        : `Running *${profile}* suite (${tests.length} test${tests.length === 1 ? "" : "s"}):\n${testNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;

      await updateSlackResponse({
        replace_original: true,
        text: lineupText,
        blocks: [{ type: "section", text: { type: "mrkdwn", text: lineupText } }],
      });

      if (tests.length === 0) return;

      let passed = 0;
      let failed = 0;
      let totalHeals = 0;

      for (const test of tests) {
        const result = await runner.runTest(test);
        await Execution.create({
          testId: test._id,
          testName: test.name,
          profile: test.profile,
          results: result.results,
          overallStatus: result.overallStatus,
        });
        if (result.overallStatus === "Passed") passed++;
        else failed++;
        totalHeals += (result.results || []).filter((r) => r.healed).length;
      }

      const failedExecutions = await Execution.find({
        profile,
        overallStatus: "Failed",
      })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean();

      let aiSummary = "";
      if (failedExecutions.length > 0) {
        try {
          const aiResult = await analyzeExecution(failedExecutions[0]);
          aiSummary = aiResult.summary ? `\n*AI Insight:*\n${aiResult.summary}` : "";
        } catch (aiErr) {
          console.error("AI summary error:", aiErr.message);
        }
      }

      const blocks = [
        { type: "section", text: { type: "mrkdwn", text: `*${profile} suite completed*` } },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Passed:*\n${passed}` },
            { type: "mrkdwn", text: `*Failed:*\n${failed}` },
            { type: "mrkdwn", text: `*Self-healed:*\n${totalHeals}` },
          ],
        },
      ];
      if (aiSummary) {
        blocks.push({ type: "section", text: { type: "mrkdwn", text: aiSummary } });
      }
      const frontendUrl = process.env.FRONTEND_URL || process.env.DASHBOARD_URL;
      if (frontendUrl) {
        const executionsUrl = frontendUrl.replace(/\/$/, "") + "/executions";
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `📋 <${executionsUrl}|View all executions> in the dashboard` },
        });
      }

      const summaryText = `${profile} suite — Passed: ${passed}, Failed: ${failed}, Self-healed: ${totalHeals}${aiSummary ? "\n" + aiSummary : ""}`;

      await updateSlackResponse({
        replace_original: true,
        text: summaryText,
        blocks,
      });

      try {
        await slackClient.chat.postMessage({
          channel: channelId,
          text: summaryText,
          blocks,
        });
      } catch (e) {
        console.error("Slack channel post failed (result was still sent to you):", e.message);
      }
    } catch (err) {
      console.error("Slack command error:", err);
      await updateSlackResponse({
        replace_original: true,
        text: `Run failed: ${err.message}`,
      }).catch((e) => console.error("Could not update Slack response:", e.message));
    }
  })();
});

app.post("/ai/analyze/:id", auth, allowRoles("admin", "tester"), async (req, res) => {
  try{
    const execution=await Execution.findById(req.params.id);
    if(!execution){
      return res.status(404).json({error:"Execution not found"});
    }
    const analysis=await analyzeExecution(execution);
    res.json(analysis);

  }catch(err){
    console.log("Groq API error:",err.message);
    res.status(500).json({error:"AI analysis failed"});
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});