const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const journalService = require("../services/journalService");
const geminiService = require("../services/geminiService");
const transparencyService = require("../services/transparencyService");
const performanceService = require("../services/performanceService");

// All journal routes require auth
router.use(authMiddleware);

// CRUD endpoints
router.post("/", async (req, res, next) => {
  try {
    const result = await journalService.createJournal(req.user.uid, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await journalService.getJournals(req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await journalService.getJournalById(req.user.uid, req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Journal not found" });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const result = await journalService.updateJournal(req.user.uid, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    console.log(`[DELETE /journal/${req.params.id}] Deletion requested by user: ${req.user.uid}`);
    const result = await journalService.deleteJournal(req.user.uid, req.params.id);
    console.log(`[DELETE /journal/${req.params.id}] Success response:`, result);
    res.json({ success: true, message: "Journal entry deleted successfully", ...result });
  } catch (err) {
    console.error(`[DELETE /journal/${req.params.id}] Error:`, err.message);
    next(err);
  }
});

// Audio upload
router.post("/upload-audio", async (req, res, next) => {
  try {
    const { fileBuffer, fileName } = req.body;
    const result = await journalService.uploadAudio(req.user.uid, fileBuffer, fileName);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Gemini proxy
router.post("/gemini", async (req, res, next) => {
  try {
    const result = await geminiService.getSuggestions(req.user.uid, req.body?.text);
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

// Lite mode endpoint
router.get("/lite", async (req, res, next) => {
  try {
    const result = await performanceService.getLiteResponse(req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
