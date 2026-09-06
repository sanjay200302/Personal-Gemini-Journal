const express = require("express");
const router = express.Router();
const geminiService = require("../services/geminiService");

router.post("/", async (req, res, next) => {
  try {
    const response = await geminiService.callGemini(req.user.uid, req.body.prompt);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
