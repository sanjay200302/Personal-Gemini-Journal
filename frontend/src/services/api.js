// API helpers to connect frontend → backend
const BASE_URL_JOURNAL = import.meta.env.VITE_JOURNAL_API_URL ;
const BASE_URL_ANALYTICS = import.meta.env.VITE_ANALYTICS_API_URL ;

async function request(url, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`API request to ${url} failed:`, err.message);
    throw err;
  }
}

// ----------------------------------------------------
// Journal Agent Endpoints (Port 8080)
// ----------------------------------------------------

export const createJournal = (data, token) =>
  request(BASE_URL_JOURNAL, "POST", data, token);

export const getJournals = (token) =>
  request(BASE_URL_JOURNAL, "GET", null, token);

export const getJournal = (id, token) =>
  request(`${BASE_URL_JOURNAL}/${id}`, "GET", null, token);

export const updateJournal = (id, data, token) =>
  request(`${BASE_URL_JOURNAL}/${id}`, "PUT", data, token);

export const deleteJournal = (id, token) =>
  request(`${BASE_URL_JOURNAL}/${id}`, "DELETE", null, token);

export const uploadAudio = (data, token) =>
  request(`${BASE_URL_JOURNAL}/upload-audio`, "POST", data, token);

export const geminiSuggestions = (data, token) =>
  request(`${BASE_URL_JOURNAL}/gemini`, "POST", data, token);

export const journalTransparency = (token) =>
  request(`${BASE_URL_JOURNAL}/transparency`, "GET", null, token);

export const journalLite = (token) =>
  request(`${BASE_URL_JOURNAL}/lite`, "GET", null, token);

// ----------------------------------------------------
// Analytics Agent Endpoints (Port 8081)
// ----------------------------------------------------

export const moodTracking = (data, token) =>
  request(`${BASE_URL_ANALYTICS}/mood`, "POST", data, token);

export const growthTracking = (data, token) =>
  request(`${BASE_URL_ANALYTICS}/growth`, "POST", data, token);

export const capsuleService = (data, token) =>
  request(`${BASE_URL_ANALYTICS}/capsule`, "POST", data, token);

export const analyticsTransparency = (token) =>
  request(`${BASE_URL_ANALYTICS}/transparency`, "GET", null, token);

export const getInsights = (data, token) =>
  request(`${BASE_URL_ANALYTICS}/insights`, "POST", data, token);

export default {
  createJournal,
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
  uploadAudio,
  geminiSuggestions,
  journalTransparency,
  journalLite,
  moodTracking,
  growthTracking,
  capsuleService,
  analyticsTransparency,
  getInsights,
};
