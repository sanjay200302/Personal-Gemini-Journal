const admin = require("firebase-admin");

if (!admin.apps.length) {
  let serviceAccount = null;
  try {
    serviceAccount = require("./serviceAccountKey.json");
  } catch (e) {
    // Service account file not on disk
  }

  const options = {
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      (serviceAccount && serviceAccount.project_id) ||
      "personal-gemini-journal-651b7",
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      "personal-gemini-journal-651b7.firebasestorage.app",
  };

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const sa = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      options.credential = admin.credential.cert(sa);
    } catch (e) {
      try {
        options.credential = admin.credential.applicationDefault();
      } catch (err) {
        console.warn("Application default credentials note:", err.message);
      }
    }
  } else if (serviceAccount) {
    options.credential = admin.credential.cert(serviceAccount);
  } else {
    try {
      options.credential = admin.credential.applicationDefault();
    } catch (err) {
      console.warn("Application default credentials note:", err.message);
    }
  }

  admin.initializeApp(options);
}

module.exports = admin;
