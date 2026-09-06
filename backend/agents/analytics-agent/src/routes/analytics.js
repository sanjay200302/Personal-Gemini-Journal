const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const moodService = require("../services/moodService");
const growthService = require("../services/growthService");
const capsuleService = require("../services/capsuleService");
const transparencyService = require("../services/transparencyService");
const performanceService = require("../services/performanceService");
const analyticsService = require("../services/analyticsService");
const geminiService = require("../services/geminiService");

// All analytics routes require auth
router.use(authMiddleware);

// Overall analytics endpoint (returns empty arrays if no documents exist)
router.get("/", async (req, res, next) => {
  try {
    const result = await analyticsService.getUserAnalytics(req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Gemini Insights endpoints
router.post("/insights", async (req, res, next) => {
  try {
    if (!req.body || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be a JSON object" });
    }

    const text = req.body?.text || req.body?.entry || req.body?.content || "";
    if (typeof text !== "string") {
      return res.status(400).json({ error: "text must be a string" });
    }

    const journals = await analyticsService.getUserJournals(req.user.uid);
    console.log(`[POST /insights] Authenticated request for userId ${req.user.uid}; journalCount=${journals.length}; textLength=${text.length}`);
    const result = await geminiService.generateInsights(req.user.uid, text, journals);
    
    if (result?.error) {
      console.error("[POST /analytics/insights] Error response:", result);
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error("[POST /analytics/insights] Exception:", err.message);
    next(err);
  }
});

router.get("/insights", async (req, res, next) => {
  try {
    const journals = await analyticsService.getUserJournals(req.user.uid);
    console.log(`[GET /insights] Authenticated request for userId ${req.user.uid}; journalCount=${journals.length}`);
    const result = await geminiService.generateInsights(req.user.uid, "", journals);
    
    if (result?.error) {
      console.error("[GET /analytics/insights] Error response:", result);
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error("[GET /analytics/insights] Exception:", err.message);
    next(err);
  }
});

// Mood tracking
router.post("/mood", async (req, res, next) => {
  try {
    const journals = await analyticsService.getUserJournals(req.user.uid);
    res.json(analyticsService.calculateMoodAnalytics(journals));
  } catch (err) {
    next(err);
  }
});

router.get("/mood", async (req, res, next) => {
  try {
    const result = await moodService.getMoodTrends(req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Growth tracker
router.post("/growth", async (req, res, next) => {
  try {
    const journals = await analyticsService.getUserJournals(req.user.uid);
    res.json({ growth: analyticsService.calculateGrowthMetrics(journals) });
  } catch (err) {
    next(err);
  }
});

router.get("/growth", async (req, res, next) => {
  try {
    const result = await growthService.getGrowthMetrics(req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Capsule service
router.post("/capsule", async (req, res, next) => {
  try {
    const result = await capsuleService.createCapsule(req.user.uid, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/capsule", async (req, res, next) => {
  try {
    const result = await capsuleService.getCapsules(req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Transparency endpoint
router.get("/transparency", async (req, res, next) => {
  try {
    const result = await transparencyService.getExplanation();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Performance mode endpoint (POST & GET)
router.post("/performance", async (req, res, next) => {
  try {
    const result = await performanceService.getLiteResponse(req.user.uid, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/performance", async (req, res, next) => {
  try {
    const result = await performanceService.getLiteResponse(req.user.uid, {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
