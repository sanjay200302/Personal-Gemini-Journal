function validateJournal(data) {
  if (!data.title || !data.body) {
    throw new Error("Journal entry must have a title and body");
  }
}

function validateMood(data) {
  const validMoods = ["joyful", "calm", "anxious", "sad", "energetic"];
  if (!validMoods.includes(data.mood)) {
    throw new Error("Invalid mood value");
  }
}

function validateCapsule(data) {
  if (!data.unlockDate) {
    throw new Error("Capsule must include unlockDate");
  }
}

module.exports = { validateJournal, validateMood, validateCapsule };
