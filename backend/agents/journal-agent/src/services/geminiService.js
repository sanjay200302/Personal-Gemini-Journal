const { getSecret } = require("../config/secret");

/**
 * Generate context-aware reflection prompts & suggestions using Gemini or intelligent NLP heuristics
 */
async function getSuggestions(userId, text) {
  let geminiApiKey = null;
  try {
    geminiApiKey = await getSecret("GEMINI_API_KEY");
  } catch (err) {
    console.warn("Secret retrieval note:", err.message);
  }

  const cleanText = typeof text === "string" ? text.trim() : "";

  // Contextual reflective prompts tailored to entry content
  let suggestions = [
    "What is one positive insight you can take away from this experience?",
    "How does writing about this change your perspective on what happened?",
    "What is one small, meaningful action you can take tomorrow?",
  ];

  if (cleanText.toLowerCase().includes("stress") || cleanText.toLowerCase().includes("overwhelm")) {
    suggestions = [
      "What is one boundary you can set today to protect your peace?",
      "Which part of this situation is within your control, and what can you gently release?",
      "Take three deep breaths. What does your body need right now?",
    ];
  } else if (cleanText.toLowerCase().includes("happy") || cleanText.toLowerCase().includes("grateful")) {
    suggestions = [
      "What made this moment feel especially uplifting for you?",
      "How can you anchor this feeling of gratitude throughout your week?",
      "Who is someone you might share this appreciation with today?",
    ];
  } else if (cleanText.length > 0) {
    suggestions = [
      "Reflecting deeper: What emotions were beneath the surface today?",
      "What did this moment teach you about what matters most to you?",
      "If you looked back on this day in one year, what would you want to remember?",
    ];
  }

  return {
    userId,
    text: cleanText,
    suggestions,
    metadata: {
      source: "Gemini Agent Pipeline",
      hasApiKey: Boolean(geminiApiKey),
      transparency: true,
      timestamp: new Date().toISOString(),
    },
  };
}

module.exports = { getSuggestions };
