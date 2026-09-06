import { Component as ReactComponent } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import JournalsList from "./pages/JournalsList.jsx";
import JournalEntry from "./pages/JournalEntry.jsx";
import AnalyticsSuite from "./pages/AnalyticsSuite.jsx";
import CapsuleUnlock from "./pages/CapsuleUnlock.jsx";
import Settings from "./pages/Settings.jsx";
import LoginForm from "./components/Auth/LoginForm.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";
import { AnalyticsProvider } from "./context/AnalyticsContext.jsx";

class ErrorBoundary extends ReactComponent {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Aura App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-screen bg-[#0a0b14] text-[#e2ddd4] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#7c6af7]/20 flex items-center justify-center text-2xl mb-4">
            ✦
          </div>
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-[#b4b0a7] text-sm max-w-md mb-6">
            {this.state.error?.message || "An unexpected error occurred while loading this page."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
            className="px-6 py-2.5 rounded-full bg-[#7c6af7] text-white text-sm font-medium hover:bg-[#4e3fc8] transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteWrapper({ Component, componentProps = {} }) {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();

  const handleNavigate = (screen) => {
    const screenMap = {
      landing: "/",
      home: "/",
      onboarding: "/onboarding",
      auth: "/login",
      login: "/login",
      signup: "/signup",
      dashboard: "/dashboard",
      journals: "/journals",
      "journals-list": "/journals",
      "journal-entry": "/journals/new",
      "new-journal": "/journals/new",
      journal: "/journals",
      analytics: "/analytics",
      capsule: "/capsule",
      settings: "/settings",
    };

    if (screenMap[screen]) {
      navigate(screenMap[screen]);
    } else if (screen.startsWith("/")) {
      navigate(screen);
    } else {
      navigate(`/${screen}`);
    }
  };

  return (
    <ErrorBoundary>
      <Component
        navigate={handleNavigate}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        {...componentProps}
      />
    </ErrorBoundary>
  );
}

function MainApp() {
  const { darkMode } = useTheme();
  console.log("[Aura App] Rendering MainApp routes...");

  return (
    <div
      style={{ backgroundColor: "#0a0b14", color: "#e2ddd4", minHeight: "100vh" }}
      className={`w-full h-full min-h-screen font-sans ${darkMode ? "" : "light-mode"}`}
    >
      <Routes>
        <Route path="/" element={<RouteWrapper Component={Home} />} />
        <Route path="/landing" element={<RouteWrapper Component={Home} />} />
        <Route path="/onboarding" element={<RouteWrapper Component={Onboarding} />} />
        <Route path="/auth" element={<RouteWrapper Component={Login} />} />
        <Route path="/login" element={<RouteWrapper Component={Login} componentProps={{ initialMode: "login" }} />} />
        <Route path="/login-form" element={<RouteWrapper Component={LoginForm} />} />
        <Route path="/signup" element={<RouteWrapper Component={Login} componentProps={{ initialMode: "signup" }} />} />
        <Route path="/dashboard" element={<RouteWrapper Component={Dashboard} />} />
        
        {/* Journals Routes */}
        <Route path="/journals" element={<RouteWrapper Component={JournalsList} />} />
        <Route path="/journals/new" element={<RouteWrapper Component={JournalEntry} />} />
        <Route path="/journals/:id" element={<RouteWrapper Component={JournalEntry} />} />
        <Route path="/journal" element={<RouteWrapper Component={JournalsList} />} />
        <Route path="/journal/new" element={<RouteWrapper Component={JournalEntry} />} />
        <Route path="/journal/:id" element={<RouteWrapper Component={JournalEntry} />} />
        <Route path="/journal-entry" element={<RouteWrapper Component={JournalEntry} />} />
        <Route path="/entry/new" element={<RouteWrapper Component={JournalEntry} />} />
        <Route path="/entry/:id" element={<RouteWrapper Component={JournalEntry} />} />
        
        <Route path="/analytics" element={<RouteWrapper Component={AnalyticsSuite} />} />
        <Route path="/capsule" element={<RouteWrapper Component={CapsuleUnlock} />} />
        <Route path="/settings" element={<RouteWrapper Component={Settings} />} />
        
        {/* Fallback */}
        <Route path="*" element={<RouteWrapper Component={Home} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  console.log("[Aura App] Mounting Root App Component...");
  console.log("[Aura App] Environment Variables:", {
    VITE_BACKEND_JOURNAL_URL:
      import.meta.env.VITE_BACKEND_JOURNAL_URL || import.meta.env.VITE_JOURNAL_API_URL || "http://localhost:8080",
    VITE_BACKEND_ANALYTICS_URL:
      import.meta.env.VITE_BACKEND_ANALYTICS_URL || import.meta.env.VITE_ANALYTICS_API_URL || "http://localhost:8081",
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || "personal-gemini-journal-651b7",
  });

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AnalyticsProvider>
            <MainApp />
          </AnalyticsProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
