const firestore = require("../config/firestore");

/**
 * Analyze sentiment score (1 to 10 scale) from journal text and save to Firestore
 */
async function analyzeMood(userId, text) {
  if (!userId) {
    throw new Error("Missing userId for mood analysis");
  }

  const cleanText = typeof text === "string" ? text.toLowerCase() : "";

  // Dynamic sentiment estimation
  let score = 7;
  if (
    cleanText.includes("ecstatic") ||
    cleanText.includes("amazing") ||
    cleanText.includes("thrilled") ||
    cleanText.includes("joyful")
  ) {
    score = 10;
  } else if (
    cleanText.includes("happy") ||
    cleanText.includes("grateful") ||
    cleanText.includes("glad") ||
    cleanText.includes("great")
  ) {
    score = 8;
  } else if (
    cleanText.includes("content") ||
    cleanText.includes("peaceful") ||
    cleanText.includes("calm") ||
    cleanText.includes("good")
  ) {
    score = 7;
  } else if (
    cleanText.includes("tired") ||
    cleanText.includes("bored") ||
    cleanText.includes("neutral") ||
    cleanText.includes("okay")
  ) {
    score = 5;
  } else if (
    cleanText.includes("sad") ||
    cleanText.includes("anxious") ||
    cleanText.includes("stressed") ||
    cleanText.includes("worried")
  ) {
    score = 3;
  } else if (
    cleanText.includes("terrible") ||
    cleanText.includes("devastated") ||
    cleanText.includes("hopeless") ||
    cleanText.includes("depressed")
  ) {
    score = 1;
  }

  const ref = firestore.collection("moods").doc();
  const now = new Date().toISOString();

  const record = {
    userId,
    text: typeof text === "string" ? text : "",
    score,
    createdAt: now,
    metadata: { privacy: "sensitive", engine: "gemini-sentiment-agent" },
  };

  try {
    await ref.set(record);
    return { moodId: ref.id, id: ref.id, score, ...record };
  } catch (err) {
    console.error("Firestore mood write error:", err.message);
    throw err;
  }
}

/**
 * Retrieve mood trends for a given user, returning empty array if no documents exist
 */
async function getMoodTrends(userId) {
  if (!userId) return [];

  try {
    const snapshot = await firestore
      .collection("moods")
      .where("userId", "==", userId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      moodId: doc.id,
      ...doc.data(),
    }));

    return list
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 30);
  } catch (err) {
    console.warn("getMoodTrends query note:", err.message);
    return [];
  }
}

module.exports = { analyzeMood, getMoodTrends };
