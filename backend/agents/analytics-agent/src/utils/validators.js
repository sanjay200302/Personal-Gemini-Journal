function validateText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input");
  }
}

function validateCapsuleInput({ text, unlockDate }) {
  if (!text || !unlockDate) {
    throw new Error("Capsule requires text and unlockDate");
  }
}

module.exports = { validateText, validateCapsuleInput };
