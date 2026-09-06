const admin = require("./firebase");
const { Firestore } = require("@google-cloud/firestore");

let db;
const databaseId = process.env.FIRESTORE_DATABASE_ID || "default";

let serviceAccount = null;
try {
  serviceAccount = require("./serviceAccountKey.json");
} catch (e) {
  // Service account file might be injected via environment or Secret Manager in Cloud Run
}

try {
  const options = {
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      (serviceAccount && serviceAccount.project_id) ||
      "personal-gemini-journal-651b7",
    databaseId: databaseId,
  };

  if (serviceAccount) {
    options.credentials = serviceAccount;
  }

  db = new Firestore(options);
} catch (err) {
  console.warn("Firestore direct initialization note, using admin SDK fallback:", err.message);
  try {
    db = admin.firestore();
  } catch (e) {
    db = new Firestore({ databaseId });
  }
}

module.exports = db;
