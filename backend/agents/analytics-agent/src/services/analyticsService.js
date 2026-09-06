const firestore = require("../config/firestore");

async function getUserJournals(userId) {
  if (!userId) return [];

  try {
    const snapshot = await firestore
      .collection("journals")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn("Journal analytics ordered query fallback:", err.message);
    try {
      const snapshot = await firestore
        .collection("journals")
        .where("userId", "==", userId)
        .limit(100)
        .get();
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
    } catch (fallbackErr) {
      console.warn("Journal analytics query failed:", fallbackErr.message);
      return [];
    }
  }
}

function journalText(journal) {
  return [journal.title, journal.content].filter((value) => typeof value === "string").join(" ").trim();
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateGrowthMetrics(journals) {
  const ordered = [...journals].sort(
    (a, b) => new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0)
  );
  if (!ordered.length) return [];

  const buckets = Array.from({ length: Math.min(5, ordered.length) }, () => []);
  ordered.forEach((journal, index) => buckets[Math.floor((index * buckets.length) / ordered.length)].push(journal));
  const scores = buckets.map((bucket, index) => {
    const averageMood = bucket.reduce((sum, journal) => sum + (Number(journal.mood) || 0), 0) / bucket.length;
    const averageLength = bucket.reduce((sum, journal) => sum + journalText(journal).length, 0) / bucket.length;
    const frequency = bucket.length / ordered.length;
    return clampScore(averageMood * 6 + Math.min(30, averageLength / 8) + frequency * 20 + index * 2);
  });

  return [{ category: "Mindfulness", scores, color: "#7c6af7" }];
}

function calculateMoodAnalytics(journals) {
  const mood = journals
    .filter((journal) => Number.isFinite(Number(journal.mood)))
    .map((journal) => ({
      date: journal.createdAt || journal.date || null,
      score: Number(journal.mood),
    }));
  const average = mood.length ? mood.reduce((sum, item) => sum + item.score, 0) / mood.length : null;
  return {
    mood,
    averageMood: average === null ? null : Math.round(average * 100) / 100,
    journalCount: journals.length,
  };
}

/**
 * Analytics Service: Centralized analytics retrieval with empty result protection
 */
async function getUserAnalytics(userId) {
  if (!userId) {
    return {
      moodTrends: [],
      moodMap: [],
      growthMetrics: [],
    };
  }

  try {
    const [moodsSnap, growthSnap, journalsSnap] = await Promise.all([
      firestore
        .collection("moods")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(30)
        .get()
        .catch(() => ({ empty: true, docs: [] })),
      firestore
        .collection("growth")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get()
        .catch(() => ({ empty: true, docs: [] })),
      firestore
        .collection("journals")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(30)
        .get()
        .catch(() => ({ empty: true, docs: [] })),
    ]);

    // If completely empty across all collections, return empty arrays cleanly
    if (moodsSnap.empty && growthSnap.empty && journalsSnap.empty) {
      return {
        moodTrends: [],
        moodMap: [],
        growthMetrics: [],
      };
    }

    const moodTrends = moodsSnap.empty
      ? []
      : moodsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const growthMetrics = growthSnap.empty
      ? []
      : growthSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const journals = journalsSnap.empty
      ? []
      : journalsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Generate mood map from entries if available
    let moodMap = [];
    if (journals.length > 0) {
      moodMap = journals.map((j) => ({
        date: j.createdAt || j.date,
        score: j.mood || 7,
      }));
    }

    return {
      moodTrends,
      moodMap,
      growthMetrics,
    };
  } catch (err) {
    console.warn("Analytics retrieval fallback (returning empty metrics):", err.message);
    return {
      moodTrends: [],
      moodMap: [],
      growthMetrics: [],
    };
  }
}

module.exports = {
  getUserJournals,
  calculateGrowthMetrics,
  calculateMoodAnalytics,
  getUserAnalytics,
};
