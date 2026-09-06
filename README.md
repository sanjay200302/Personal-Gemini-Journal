# Personal Gemini Journal

Personal Gemini Journal is a full-stack journaling and self-growth application. It combines a React frontend, Firebase services, two Express backend agents, and Gemini-powered reflections and analytics.

## Project Structure

```text
personal-gemini-journal/
├── .agents/
├── .claude/
├── .firebaserc
├── .gitignore
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── skills-lock.json
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── agents/
│       ├── journal-agent/
│       │   ├── package.json
│       │   ├── Dockerfile
│       │   ├── cloudbuild.yaml
│       │   ├── src/
│       │   │   ├── app.js
│       │   │   ├── server.js
│       │   │   ├── firestore.js
│       │   │   ├── config/
│       │   │   │   ├── firebase.js
│       │   │   │   ├── firestore.js
│       │   │   │   ├── secret.js
│       │   │   │   └── serviceAccountKey.json  # Local only; ignored by Git
│       │   │   ├── middleware/
│       │   │   │   ├── authMiddleware.js
│       │   │   │   ├── errorHandler.js
│       │   │   │   └── rateLimiter.js
│       │   │   ├── routes/
│       │   │   │   ├── journal.js
│       │   │   │   └── gemini.js
│       │   │   ├── services/
│       │   │   │   ├── journalService.js
│       │   │   │   ├── geminiService.js
│       │   │   │   ├── performanceService.js
│       │   │   │   └── transparencyService.js
│       │   │   └── utils/
│       │   │       └── logger.js
│       │   └── test/
│       │
│       └── analytics-agent/
│           ├── package.json
│           ├── Dockerfile
│           ├── cloudbuild.yaml
│           ├── src/
│           │   ├── app.js
│           │   ├── server.js
│           │   ├── firestore.js
│           │   ├── config/
│           │   │   ├── firebase.js
│           │   │   ├── firestore.js
│           │   │   ├── secret.js
│           │   │   └── serviceAccountKey.json  # Local only; ignored by Git
│           │   ├── middleware/
│           │   │   ├── authMiddleware.js
│           │   │   ├── errorHandler.js
│           │   │   └── rateLimiter.js
│           │   ├── routes/
│           │   │   └── analytics.js
│           │   ├── services/
│           │   │   ├── analyticsService.js
│           │   │   ├── capsuleService.js
│           │   │   ├── geminiService.js
│           │   │   ├── growthService.js
│           │   │   ├── moodService.js
│           │   │   ├── performanceService.js
│           │   │   └── transparencyService.js
│           │   └── utils/
│           │       ├── logger.js
│           │       └── validators.js
│           └── test/
│               └── analytics.test.js
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vercel.json
    ├── vite.config.js
    └── src/
        ├── App.css
        ├── App.jsx
        ├── index.css
        ├── index.jsx
        ├── main.jsx
        ├── components/
        │   ├── Analytics/InsightsModal.jsx
        │   ├── Auth/LoginForm.jsx
        │   ├── Journal/
        │   │   ├── JournalEditor.jsx
        │   │   └── MoodTracker.jsx
        │   └── UI/
        │       ├── Button.jsx
        │       ├── Card.jsx
        │       ├── Input.jsx
        │       ├── Modal.jsx
        │       └── ThemeSwitcher.jsx
        ├── context/
        │   ├── AnalyticsContext.jsx
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useTheme.js
        │   └── useVoiceRecorder.js
        ├── pages/
        │   ├── AnalyticsSuite.jsx
        │   ├── CapsuleUnlock.jsx
        │   ├── Dashboard.jsx
        │   ├── Home.jsx
        │   ├── JournalEntry.jsx
        │   ├── JournalsList.jsx
        │   ├── Login.jsx
        │   ├── Onboarding.jsx
        │   └── Settings.jsx
        ├── services/
        │   ├── analyticsService.js
        │   ├── api.js
        │   ├── auth.js
        │   ├── firebase.js
        │   ├── firestore.js
        │   └── storage.js
        └── styles/
            ├── globals.css
            ├── tailwind.css
            └── themes.css
```


## Architecture Diagram:

```text
Frontend (React + Vite)
   │
   ├── Auth → Firebase Authentication
   │
   ├── Journals → Journal Agent (Cloud Run)
   │                  │
   │                  └── Firestore (journals collection)
   │
   ├── Analytics → Analytics Agent (Cloud Run)
   │                  │
   │                  └── Firestore (analytics collection)
   │
   ├── Photos/Audio → Firebase Storage
   │
   └── Insights → Gemini API (via Secret Manager)
   
```

## Features Summary

Bullet out the highlights so they stand out:

- Secure Authentication with Firebase Auth
- Journaling with text, photo, and voice support
- Analytics Dashboard powered by Gemini AI
- Mood‑Driven Themes and streak tracking
- Capsules (future‑self reflections)
- Cloud Run Microservices for scalability
- Secret Manager for secure key handling


## Main Responsibilities

### Frontend

The `frontend` directory contains the React and Vite application.

- Authentication with Firebase Auth
- Journal creation and editing
- Mood tracking and streaks
- Photo and voice journal support
- Analytics dashboards
- Gemini suggestions and insights
- Theme and user settings

### Journal Agent

The Journal Agent is an Express service that runs on port `8080` by default.

- Journal CRUD operations
- Audio upload handling
- Gemini reflection suggestions
- Transparency information
- Firebase ID-token verification
- Rate limiting and error handling

### Analytics Agent

The Analytics Agent is an Express service that runs on port `8081` by default.

- Mood analytics
- Growth metrics
- Gemini-generated insights
- Capsule management
- Performance responses
- Analytics transparency

## Firebase Services

- Firebase Authentication: user sign-in and identity
- Cloud Firestore: journals, moods, growth data, capsules, and settings
- Firebase Storage: journal photos and audio files
- Google Secret Manager: Gemini and backend secrets

Firestore access is controlled by [firestore.rules](firestore.rules). User-owned documents use the authenticated user's UID as `userId`.

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Journal Agent

```bash
cd backend/agents/journal-agent
npm install
npm start
```

### Analytics Agent

```bash
cd backend/agents/analytics-agent
npm install
npm start
```

Configure the required Firebase, backend, and Gemini environment variables before starting the services. Use [backend/.env.example](backend/.env.example) as the reference.

## Testing

Run the Analytics Agent tests with:

```bash
cd backend/agents/analytics-agent
npm test
```

The backend endpoints require a Firebase ID token in the `Authorization` header:

```text
Authorization: Bearer <firebase-id-token>
```

## Deployment

Each backend agent includes its own `Dockerfile` and `cloudbuild.yaml` for container builds and Cloud Run deployment. The frontend can be built with:

```bash
cd frontend
npm run build
```

The generated frontend files can be deployed using the hosting provider configured for the project, such as Vercel or Firebase Hosting.

## Security Notes

- Do not commit `.env` files or service account credentials.
- `serviceAccountKey.json` is ignored by Git and must remain local or be provided through Google Cloud credentials.
- Backend routes verify Firebase ID tokens before accessing user data.
- Firestore rules restrict documents to their owning authenticated user.
- Gemini API keys are resolved on the backend through environment variables or Secret Manager.



## License

This project is licensed under the
[Creative Commons Attribution-NonCommercial 4.0 International License](LICENSE).

Commercial use is not permitted without prior permission.



## 👥 Contributors
- **Sanjay Kumar** – AIML Engineer (Graduated 2026)  
  Passionate about AI/ML, cloud engineering, and building impactful full‑stack systems.  
  🌐 Portfolio: https://sanjay200302.github.io/sanjay.com  
  💼 LinkedIn: https://www.linkedin.com/in/sanjay200302  

Open for collaboration and contributions.
