const firestore = require("../config/firestore");

/**
 * Create a new time-locked growth capsule
 */
async function createCapsule(userId, { title, text, content, message, unlockDate, streak }) {
  if (!userId) {
    throw new Error("Missing userId for creating capsule");
  }

  const ref = firestore.collection("capsules").doc();
  const now = new Date().toISOString();
  const targetUnlock = unlockDate || now;
  const isLocked = new Date(targetUnlock).getTime() > Date.now();

  const capsuleData = {
    userId,
    title: title || "Letter to My Future Self",
    content: content || message || text || "",
    message: message || content || text || "",
    unlockDate: targetUnlock,
    status: isLocked ? "locked" : "unlocked",
    locked: isLocked,
    streak: streak || 1,
    createdAt: now,
    metadata: { privacy: "sensitive", engine: "gemini-capsule-agent" },
  };

  await ref.set(capsuleData);
  return { capsuleId: ref.id, id: ref.id, ...capsuleData };
}

/**
 * Retrieve all capsules for a user, sorted by unlockDate, returning empty array if none exist
 */
async function getCapsules(userId) {
  if (!userId) return [];

  try {
    const snapshot = await firestore
      .collection("capsules")
      .where("userId", "==", userId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const capsules = snapshot.docs.map((doc) => {
      const data = doc.data();
      const isLocked = data.status === "locked" || (data.unlockDate && new Date(data.unlockDate).getTime() > Date.now());
      return {
        id: doc.id,
        capsuleId: doc.id,
        ...data,
        status: isLocked ? "locked" : "unlocked",
      };
    });

    return capsules.sort((a, b) => new Date(a.unlockDate || 0) - new Date(b.unlockDate || 0));
  } catch (err) {
    console.warn("Firestore getCapsules query error:", err.message);
    return [];
  }
}

module.exports = { createCapsule, getCapsules };
