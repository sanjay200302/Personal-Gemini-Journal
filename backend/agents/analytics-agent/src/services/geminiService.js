const { getSecret } = require("../config/secret");

/**
 * Generate dynamic AI insights using Gemini API (REST) with request & response logging
 * @param {string} userId - User UID
 * @param {string} text - Journal entry text / reflections
 * @param {Array} userJournals - Array of journal objects (optional)
 */
async function generateInsights(userId, text = "", userJournals = []) {
  // 1. Resolve GEMINI_API_KEY
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      apiKey = await getSecret("GEMINI_API_KEY");
    } catch (err) {
      console.warn("[analytics-agent/geminiService] Secret Manager lookup note:", err.message);
    }
  }

  // Combine text from param and userJournals if text is minimal
  let combinedText = typeof text === "string" ? text.trim() : "";
  if (!combinedText && Array.isArray(userJournals) && userJournals.length > 0) {
    combinedText = userJournals
      .slice(0, 5)
      .map((j) => `${j.title || "Reflection"}: ${j.content || ""}`)
      .join("\n\n");
  }

  console.log(`[analytics-agent/geminiService] Request received for userId: ${userId}`);
  console.log(`[analytics-agent/geminiService] Input Text Length: ${combinedText.length}`);
  console.log(`[analytics-agent/geminiService] GEMINI_API_KEY Present: ${Boolean(apiKey)}`);

  if (!combinedText) {
    console.warn("[analytics-agent/geminiService] No journal text provided in request body.");
    return {
      insights: [
        {
          icon: "✦",
          title: "Awaiting Journal Entries",
          desc: "Write your first reflection to receive personalized AI insights.",
        },
      ],
      sourceInfo: { model: "Gemini", status: "Live deployed endpoint" },
    };
  }

  if (!apiKey) {
    console.error("[analytics-agent/geminiService] Missing GEMINI_API_KEY environment variable or secret.");
    return {
      error: "Gemini API failed",
      details: "GEMINI_API_KEY environment variable is missing on Cloud Run server.",
    };
  }

  const promptText = `You are an empathetic, insightful AI mental wellness assistant for Personal Gemini Journal.
Analyze the following user journal entry / reflections:

"""
${combinedText.substring(0, 4000)}
"""

Generate 3 concise, uplifting, and actionable mental health & self-growth insights.
Return ONLY a valid JSON array of 3 objects with keys "icon" (single emoji), "title" (short phrase), and "desc" (1-2 sentences explanation). Example:
[
  { "icon": "🌱", "title": "Emotional Resilience", "desc": "You showed self-compassion while processing challenges today." }
]`;

  const requestPayload = {
    contents: [
      {
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
  };

  // Models to try in priority order
  const models = [process.env.GEMINI_MODEL || "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of models) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      console.log(`[analytics-agent/geminiService] Calling Gemini REST API endpoint (${model})...`);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[analytics-agent/geminiService] Model ${model} returned HTTP ${response.status}: ${errorText}`);
        lastError = `HTTP ${response.status}: ${errorText}`;
        continue;
      }

      const geminiData = await response.json();
      console.log(`[analytics-agent/geminiService] Gemini API (${model}) Raw Response:`, JSON.stringify(geminiData, null, 2));

      const responseText =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!responseText) {
        console.warn(`[analytics-agent/geminiService] Model ${model} returned empty text.`);
        lastError = "Empty response text from Gemini";
        continue;
      }

      // Parse JSON from output
      let insightsList = [];
      try {
        const cleanedJson = responseText.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
        insightsList = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.warn("[analytics-agent/geminiService] JSON parse note, wrapping text output:", parseErr.message);
        insightsList = [
          {
            icon: "✨",
            title: "Gemini Reflection Insight",
            desc: responseText.substring(0, 200),
          },
        ];
      }

      return {
        insights: Array.isArray(insightsList) ? insightsList : [insightsList],
        sourceInfo: { model: "Gemini", status: "Live deployed endpoint" },
        success: true,
      };
    } catch (err) {
      console.error(`[analytics-agent/geminiService] Exception calling ${model}:`, err.message);
      lastError = err.message;
    }
  }

  console.error("[analytics-agent/geminiService] All Gemini models failed. Last error:", lastError);
  return {
    error: "Gemini API failed",
    details: lastError || "Failed to reach Gemini API",
  };
}

module.exports = { generateInsights };
