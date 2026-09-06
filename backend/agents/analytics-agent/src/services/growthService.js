const firestore = require("../config/firestore");

/**
 * Track user reflection growth (mindfulness, word depth, positivity score)
 */
async function trackGrowth(userId, entry) {
  if (!userId) {
    throw new Error("Missing userId for growth tracking");
  }

  const text = typeof entry === "string" ? entry : "";
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const positivity =
    text.toLowerCase().includes("good") ||
    text.toLowerCase().includes("grateful") ||
    text.toLowerCase().includes("happy")
      ? "positive"
      : "reflective";

  const mindfulnessScore = Math.min(
    100,
    Math.round((wordCount / 100) * 80 + 20)
  );
  const ref = firestore.collection("growth").doc();
  const now = new Date().toISOString();

  const growthRecord = {
    userId,
    entry: text.substring(0, 300),
    wordCount,
    positivity,
    mindfulnessScore,
    createdAt: now,
    metadata: { privacy: "sensitive", engine: "gemini-growth-agent" },
  };

  try {
    await ref.set(growthRecord);
    return {
      growthId: ref.id,
      id: ref.id,
      wordCount,
      positivity,
      mindfulnessScore,
      ...growthRecord,
    };
  } catch (err) {
    console.error("Firestore growth write error:", err.message);
    throw err;
  }
}

/**
 * Retrieve growth metrics for a given user, returning empty array if no documents exist
 */
async function getGrowthMetrics(userId) {
  if (!userId) return [];

  try {
    const snapshot = await firestore
      .collection("growth")
      .where("userId", "==", userId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      growthId: doc.id,
      ...doc.data(),
    }));

    return list
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);
  } catch (err) {
    console.warn("getGrowthMetrics query note:", err.message);
    return [];
  }
}

module.exports = { trackGrowth, getGrowthMetrics };
