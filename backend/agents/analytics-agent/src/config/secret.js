const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

let client = null;
try {
  client = new SecretManagerServiceClient();
} catch (err) {
  console.warn("SecretManagerServiceClient initialization note:", err.message);
}

/**
 * Access secrets safely with environment variable fallback
 */
async function getSecret(secretName) {
  if (!secretName) {
    return process.env.GEMINI_API_KEY || process.env.FIREBASE_API_KEY || "";
  }

  // 1. Direct environment variable match
  if (process.env[secretName]) {
    return process.env[secretName];
  }

  // 2. Fallback to common env vars if secret name is not a GCP path
  if (!secretName.startsWith("projects/")) {
    const directEnv = process.env.GEMINI_API_KEY || process.env.FIREBASE_API_KEY;
    if (directEnv) return directEnv;
  }

  // 3. Secret Manager access
  if (client) {
    try {
      const name = secretName.startsWith("projects/")
        ? secretName
        : `projects/${process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "personal-gemini-journal-651b7"}/secrets/${secretName}/versions/latest`;

      const [version] = await client.accessSecretVersion({ name });
      return version.payload.data.toString();
    } catch (err) {
      console.warn(`Secret Manager access note for ${secretName}:`, err.message);
    }
  }

  return process.env.GEMINI_API_KEY || process.env.FIREBASE_API_KEY || "";
}

module.exports = { getSecret };
