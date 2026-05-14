const express = require("express");
const router = express.Router();
const { generateApiFlow } = require("../services/aiApiFlowGenerator");
const Test = require("../models/Test");
const auth = require("../middleware/authMiddleware");

router.post("/generate-api-flow", auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "prompt is required" });
    }
    const generatedTest = await generateApiFlow(prompt.trim());
    if (!generatedTest.testType || generatedTest.testType !== "api" ||
        !generatedTest.steps || !Array.isArray(generatedTest.steps) || generatedTest.steps.length === 0) {
      return res.status(400).json({ error: "Invalid test structure from AI" });
    }
    for(const step of generatedTest.steps){
        if(!step.name || !step.method || !step.url){
            return res.status(400).json({error:"Each step must have name, method, and url"});
        }
    }
    const test = await Test.create(generatedTest);
    res.json(test);
  } catch (err) {
    console.error("AI Flow Generation Error:", err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message || "AI Flow Generation Failed" });
  }
});

module.exports = router;