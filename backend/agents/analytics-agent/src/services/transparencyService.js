/**
 * Transparency Service: Returns model architecture and processing stage transparency for Gemini agents
 */
async function getExplanation() {
  return {
    explanation: [
      "Insights were generated from the authenticated user's journal entries.",
      "Mood scores, dates, titles, and journal content were analyzed.",
      "No unrelated user's data was used.",
      "The Gemini API key remains on the backend.",
    ],
  };
}

module.exports = { getExplanation };
