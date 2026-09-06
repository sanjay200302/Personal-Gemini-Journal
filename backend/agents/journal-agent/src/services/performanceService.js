const firestore = require("../config/firestore");

/**
 * Performance Service: returns a lightweight snapshot of journals for fast mobile/low-bandwidth rendering
 */
async function getLiteResponse(userId) {
  if (!userId) {
    return { mode: "lite", journals: [] };
  }

  try {
    const snapshot = await firestore
      .collection("journals")
      .where("userId", "==", userId)
      .limit(5)
      .get();

    if (snapshot.empty) {
      return { mode: "lite", journals: [] };
    }

    return {
      mode: "lite",
      journals: snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "Untitled Reflection",
        createdAt: doc.data().createdAt || doc.data().date,
      })),
    };
  } catch (err) {
    console.warn("Journal Agent getLiteResponse query error:", err.message);
    return { mode: "lite", journals: [] };
  }
}

module.exports = { getLiteResponse };
