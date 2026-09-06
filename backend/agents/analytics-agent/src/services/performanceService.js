const firestore = require("../config/firestore");

/**
 * Performance Service: returns simplified metrics for low-end devices and dashboard summaries
 */
async function getLiteResponse(userId, body = {}) {
  const response = {
    moods: [],
    growth: [],
    capsules: [],
  };

  if (!userId) {
    return { mode: "lite", data: response };
  }

  const include = body.include || { mood: true, growth: true, capsules: true };

  try {
    if (include.mood) {
      try {
        const moods = await firestore
          .collection("moods")
          .where("userId", "==", userId)
          .limit(7)
          .get();

        if (!moods.empty) {
          response.moods = moods.docs.map((doc) => ({
            score: doc.data().score,
            createdAt: doc.data().createdAt,
          }));
        }
      } catch (err) {
        console.warn("Lite moods query fallback:", err.message);
      }
    }

    if (include.growth) {
      try {
        const growth = await firestore
          .collection("growth")
          .where("userId", "==", userId)
          .limit(5)
          .get();

        if (!growth.empty) {
          response.growth = growth.docs.map((doc) => ({
            wordCount: doc.data().wordCount,
            positivity: doc.data().positivity,
            mindfulnessScore: doc.data().mindfulnessScore,
          }));
        }
      } catch (err) {
        console.warn("Lite growth query fallback:", err.message);
      }
    }

    if (include.capsules) {
      try {
        const capsules = await firestore
          .collection("capsules")
          .where("userId", "==", userId)
          .limit(3)
          .get();

        if (!capsules.empty) {
          response.capsules = capsules.docs.map((doc) => ({
            id: doc.id,
            status: doc.data().status || (doc.data().locked ? "locked" : "unlocked"),
            unlockDate: doc.data().unlockDate,
          }));
        }
      } catch (err) {
        console.warn("Lite capsules query fallback:", err.message);
      }
    }
  } catch (err) {
    console.warn("Performance lite query error:", err.message);
  }

  return { mode: "lite", data: response };
}

module.exports = { getLiteResponse };
