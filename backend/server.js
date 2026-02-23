const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Test=require('./models/Test');
require('dotenv').config();
const runner=require('./runner');
const Execution=require('./models/Execution')
const generateHTMLReport=require('./utils/generateReport');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mongoose connection (use MONGO_URI in .env — e.g. MongoDB Atlas or mongodb://localhost:27017/yourdb)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/automation-testing';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Health check for testing
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Server is running',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.post('/create-test', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database not connected',
      hint: 'Start MongoDB locally or set MONGO_URI in .env to a MongoDB Atlas connection string.',
    });
  }
  try {
    const test = await Test.create(req.body);
    res.json(test);  // response includes _id — use it in POST /run-test/<_id>
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all tests (use the _id from here in POST /run-test/<id> or DELETE /tests/<id>)
app.get('/tests', async (req, res) => {
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

// Delete a test by id (to keep profiles quick)
app.delete('/tests/:id', async (req, res) => {
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

app.post('/run-profile/:profile', async (req, res) => {
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

app.get("/stats", async (req, res) => {
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

    res.json({
      totalExecutions,
      passRate: totalExecutions
        ? ((passedExecutions / totalExecutions) * 100).toFixed(2)
        : 0,
      totalHeals,
      strategyBreakdown: healAggregation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/executions",async(req,res)=>{
  const executions=await Execution.find().sort({createdAt:-1});
  res.json(executions);
})

// Get latest execution (to verify healed/healStrategy/similarityScore in Mongo)
app.get('/executions/latest', async (req, res) => {
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

app.post('/run-test/:id', async (req, res) => {
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
      results: results.results,
      overallStatus: results.overallStatus,
    });
    const reportPath = generateHTMLReport(execution);
    res.json({ execution, report: reportPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});