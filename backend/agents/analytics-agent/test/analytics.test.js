const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

const journalDocs = [
  {
    id: "journal-1",
    data() {
      return {
        userId: "user-1",
        title: "A calm day",
        content: "I felt grateful and focused today.",
        mood: 8,
        createdAt: "2026-09-06T10:00:00.000Z",
      };
    },
  },
  {
    id: "journal-2",
    data() {
      return {
        userId: "user-1",
        title: "A reflective day",
        content: "I noticed my stress and wrote through it.",
        mood: 6,
        createdAt: "2026-09-05T10:00:00.000Z",
      };
    },
  },
];

let geminiShouldFail = false;
let capturedInsightRequest = null;

const firestore = {
  collection(name) {
    const query = {
      where() {
        return query;
      },
      orderBy() {
        return query;
      },
      limit() {
        return query;
      },
      async get() {
        return {
          docs: name === "journals" ? journalDocs : [],
          empty: name === "journals" ? journalDocs.length === 0 : true,
        };
      },
    };
    return query;
  },
};

const mocks = {
  firebase: {
    auth() {
      return {
        async verifyIdToken(token) {
          if (token !== "valid-token") throw new Error("invalid token");
          return { uid: "user-1" };
        },
      };
    },
  },
  firestore,
  geminiService: {
    async generateInsights(userId, text, journals) {
      capturedInsightRequest = { userId, text, journals };
      if (geminiShouldFail) throw new Error("Gemini unavailable");
      return {
        insights: [{ title: "Reflection", desc: "Based on your journal.", icon: "✦" }],
        sourceInfo: { model: "Gemini", status: "Live deployed endpoint" },
      };
    },
  },
  transparencyService: {
    async getExplanation() {
      return {
        explanation: [
          "Insights were generated from the authenticated user's journal entries.",
          "Mood scores, dates, titles, and journal content were analyzed.",
          "No unrelated user's data was used.",
          "The Gemini API key remains on the backend.",
        ],
      };
    },
  },
  moodService: { async getMoodTrends() { return []; } },
  growthService: { async getGrowthMetrics() { return []; } },
  capsuleService: {},
  performanceService: {},
};

const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  const normalized = request.replace(/\\/g, "/");
  for (const [name, value] of Object.entries(mocks)) {
    if (normalized.endsWith(`/config/${name}`) || normalized.endsWith(`/services/${name}`)) {
      return value;
    }
  }
  return originalLoad.call(this, request, parent, isMain);
};

const app = require(path.resolve(__dirname, "../src/app"));
Module._load = originalLoad;

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

async function request(route, options = {}) {
  return fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      Origin: "http://localhost:5174",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
}

function authenticated(options = {}) {
  return { ...options, headers: { ...(options.headers || {}), Authorization: "Bearer valid-token" } };
}

test("rejects missing and invalid authentication", async () => {
  const missing = await request("/transparency");
  assert.equal(missing.status, 401);

  const invalid = await request("/transparency", { headers: { Authorization: "Bearer invalid-token" } });
  assert.equal(invalid.status, 401);
});

test("returns transparency for an authenticated user", async () => {
  const response = await request("/transparency", authenticated());
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(await response.json()), ["explanation"]);
});

test("generates insights from server-owned journal data", async () => {
  capturedInsightRequest = null;
  const response = await request("/insights", authenticated({
    method: "POST",
    body: JSON.stringify({
      text: "recent journal text",
      userJournals: [{ id: "other-user-journal", userId: "other-user", content: "must be ignored" }],
    }),
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(await response.json()), ["insights", "sourceInfo"]);
  assert.equal(capturedInsightRequest.userId, "user-1");
  assert.equal(capturedInsightRequest.journals.length, 2);
  assert.ok(capturedInsightRequest.journals.every((journal) => journal.userId === "user-1"));
});

test("returns calculated growth and mood metrics", async () => {
  const growth = await request("/growth", authenticated({ method: "POST", body: "{}" }));
  const growthBody = await growth.json();
  assert.equal(growth.status, 200);
  assert.equal(growthBody.growth[0].scores.length, 2);
  assert.notEqual(growthBody.growth[0].scores[0], growthBody.growth[0].scores[1]);

  const mood = await request("/mood", authenticated({ method: "POST", body: "{}" }));
  const moodBody = await mood.json();
  assert.equal(mood.status, 200);
  assert.equal(moodBody.journalCount, 2);
  assert.equal(moodBody.averageMood, 7);
});

test("handles empty journal data and Gemini failure as JSON", async () => {
  const originalDocs = journalDocs.splice(0, journalDocs.length);
  const empty = await request("/growth", authenticated({ method: "POST", body: "{}" }));
  assert.deepEqual(await empty.json(), { growth: [] });
  journalDocs.push(...originalDocs);

  geminiShouldFail = true;
  const failed = await request("/insights", authenticated({ method: "POST", body: JSON.stringify({ text: "hello" }) }));
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: "Internal Server Error" });
  geminiShouldFail = false;
});

test("allows the configured frontend origin and rejects another origin", async () => {
  const preflight = await request("/insights", {
    method: "OPTIONS",
    headers: { "Access-Control-Request-Method": "POST" },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:5174");

  const rejected = await fetch(`${baseUrl}/transparency`, { headers: { Origin: "http://malicious.example" } });
  assert.equal(rejected.status, 500);
});
