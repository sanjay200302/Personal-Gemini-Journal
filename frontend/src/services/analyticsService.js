// Analytics & Gemini AI Service
// Handles dynamic Secret Manager injection and backend AI analytics integration

const BASE_URL_ANALYTICS = import.meta.env.VITE_ANALYTICS_API_URL || "http://localhost:8081/analytics";
const BASE_URL_JOURNAL = import.meta.env.VITE_JOURNAL_API_URL || "http://localhost:8080/journal";

/**
 * Generic authorized request helper
 */
async function authRequest(url, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      throw new Error(`Analytics API error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`Analytics API request to ${url} failed:`, err.message);
    throw err;
  }
}

/**
 * Dynamically resolves Gemini API Key / Secret from Secret Manager endpoint if needed.
 * No hardcoded keys are stored in client bundles.
 */
export async function fetchSecret(secretName = "gemini-api-key", token = null) {
  try {
    const res = await authRequest(`${BASE_URL_ANALYTICS}/secret?name=${encodeURIComponent(secretName)}`, "GET", null, token);
    return res?.value || res?.secret || null;
  } catch {
    // Backend agents manage secret injection natively
    return null;
  }
}

/**
 * Fetch Analytics Agent Transparency report
 */
export async function fetchAnalyticsTransparency(token = null) {
  return authRequest(`${BASE_URL_ANALYTICS}/transparency`, "GET", null, token);
}

/**
 * Fetch Journal Agent Transparency report
 */
export async function fetchJournalTransparency(token = null) {
  return authRequest(`${BASE_URL_JOURNAL}/transparency`, "GET", null, token);
}

/**
 * Fetch Gemini Reflection Suggestions
 */
export async function fetchGeminiSuggestions(text, token = null) {
  return authRequest(`${BASE_URL_JOURNAL}/gemini`, "POST", { text }, token);
}

/**
 * Track mood via Analytics Agent
 */
export async function trackMood(data, token = null) {
  return authRequest(`${BASE_URL_ANALYTICS}/mood`, "POST", data, token);
}

/**
 * Track growth progression via Analytics Agent
 */
export async function trackGrowth(data, token = null) {
  return authRequest(`${BASE_URL_ANALYTICS}/growth`, "POST", data, token);
}

/**
 * Fetch dynamic AI insights synthesized across user reflections and Gemini models
 */
export async function generateDynamicInsights(userJournals = [], token = null) {
  if (!userJournals || userJournals.length === 0) {
    return {
      insights: [],
      sourceInfo: { model: "Your journal data", status: "Awaiting entries" },
    };
  }

  // Prefer the deployed Gemini service when it is available. The local analysis
  // below remains the fallback for development and temporary endpoint failures.
  try {
    const recentText = userJournals
      .slice(0, 5)
      .map((journal) => `${journal.title || ""}: ${journal.content || ""}`)
      .join("\n");
    const insightsResponse = await authRequest(
      `${BASE_URL_ANALYTICS}/insights`,
      "POST",
      { text: recentText, userJournals },
      token
    );

    if (Array.isArray(insightsResponse?.insights) && insightsResponse.insights.length > 0) {
      let transparency = null;
      try {
        transparency = await fetchAnalyticsTransparency(token);
      } catch (transparencyError) {
        console.warn("Analytics transparency note:", transparencyError.message);
      }

      return {
        insights: insightsResponse.insights,
        sourceInfo: insightsResponse.sourceInfo || {
          model: "Gemini",
          status: "Live deployed endpoint",
        },
        transparency: transparency?.explanation || transparency?.details || [],
      };
    }
  } catch (err) {
    console.warn("Gemini insights unavailable; using local journal analysis:", err.message);
  }

  const moods = userJournals
    .map((journal) => Number(journal.mood ?? journal.moodVal))
    .filter((mood) => Number.isFinite(mood));
  const averageMood = moods.length
    ? moods.reduce((sum, mood) => sum + mood, 0) / moods.length
    : null;
  const recentMoods = moods.slice(0, Math.min(3, moods.length));
  const olderMoods = moods.slice(-Math.min(3, moods.length));
  const recentAverage = recentMoods.length
    ? recentMoods.reduce((sum, mood) => sum + mood, 0) / recentMoods.length
    : null;
  const olderAverage = olderMoods.length
    ? olderMoods.reduce((sum, mood) => sum + mood, 0) / olderMoods.length
    : null;
  const totalWords = userJournals.reduce(
    (sum, journal) => sum + String(journal.content || "").trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const datedEntries = userJournals
    .map((journal) => new Date(journal.createdAt || journal.date || 0).getTime())
    .filter((date) => Number.isFinite(date) && date > 0);
  const daySpan = datedEntries.length > 1
    ? Math.max(1, Math.round((Math.max(...datedEntries) - Math.min(...datedEntries)) / 86400000) + 1)
    : 1;
  const words = userJournals
    .flatMap((journal) => String(`${journal.title || ""} ${journal.content || ""}`).toLowerCase().match(/[a-z]{4,}/g) || [])
    .filter((word) => !new Set(["that", "this", "with", "from", "what", "your", "have", "when", "were", "they", "about", "today", "just", "feel", "felt"]).has(word));
  const wordCounts = words.reduce((counts, word) => ({ ...counts, [word]: (counts[word] || 0) + 1 }), {});
  const topWord = Object.entries(wordCounts).sort((a, b) => b[1] - a[1])[0];
  const dynamicList = [];

  if (averageMood !== null) {
    const direction = recentAverage !== null && olderAverage !== null
      ? recentAverage - olderAverage
      : 0;
    dynamicList.push({
      icon: direction > 0.4 ? "↗" : direction < -0.4 ? "↘" : "◌",
      title: `Your average mood is ${averageMood.toFixed(1)}/10`,
      desc: direction > 0.4
        ? `Your three most recent mood scores are trending ${direction.toFixed(1)} points higher than your earlier entries.`
        : direction < -0.4
        ? `Your three most recent mood scores are ${Math.abs(direction).toFixed(1)} points lower than your earlier entries.`
        : "Your recent mood scores are staying close to your overall pattern.",
    });
  }

  dynamicList.push({
    icon: "✎",
    title: `${totalWords.toLocaleString()} words across ${userJournals.length} ${userJournals.length === 1 ? "entry" : "entries"}`,
    desc: `You are averaging ${Math.round(totalWords / userJournals.length).toLocaleString()} words per reflection over ${daySpan} ${daySpan === 1 ? "day" : "days"}.`,
  });

  if (topWord) {
    dynamicList.push({
      icon: "⌕",
      title: `“${topWord[0]}” appears most often`,
      desc: `This term appears ${topWord[1]} times in your journal titles and reflections, making it a useful theme to revisit.`,
    });
  }

  const voiceCount = userJournals.filter((journal) => journal.audioUrl || journal.hasAudio).length;
  const photoCount = userJournals.filter((journal) => journal.photoURL || journal.attachments?.length).length;
  dynamicList.push({
    icon: "◇",
    title: "What this analysis used",
    desc: `Your ${moods.length} mood scores, ${userJournals.length} ${userJournals.length === 1 ? "entry" : "entries"}, ${voiceCount} voice note${voiceCount === 1 ? "" : "s"}, and ${photoCount} photo-supported ${photoCount === 1 ? "entry" : "entries"}. No fixed sample data was used.`,
  });

  return {
    insights: dynamicList,
    sourceInfo: {
      model: "Your journal data",
      status: "Computed from your entries",
    },
  };
}

export default {
  fetchSecret,
  fetchAnalyticsTransparency,
  fetchJournalTransparency,
  fetchGeminiSuggestions,
  trackMood,
  trackGrowth,
  generateDynamicInsights,
};
