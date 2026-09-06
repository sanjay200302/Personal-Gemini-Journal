import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

function getAuthErrorMessage(err) {
  if (!err) return "Authentication failed. Please try again.";
  const code = err.code || "";
  const msg = err.message || "";

  if (
    code === "auth/wrong-password" ||
    code === "auth/invalid-credential" ||
    msg.includes("wrong-password") ||
    msg.includes("invalid-credential") ||
    msg.includes("INVALID_LOGIN_CREDENTIALS")
  ) {
    return "Incorrect password or credentials. Please try again.";
  }
  if (code === "auth/user-not-found" || msg.includes("user-not-found")) {
    return "No account found with this email. Please click Sign Up below.";
  }
  if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code === "auth/email-already-in-use" || msg.includes("email-already-in-use")) {
    return "An account already exists with this email address. Please log in.";
  }
  if (code === "auth/weak-password" || msg.includes("weak-password")) {
    return "Password should be at least 6 characters long.";
  }
  if (code === "auth/too-many-requests" || msg.includes("too-many-requests")) {
    return "Too many failed attempts. Please wait a moment or reset your password.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Sign in was cancelled.";
  }
  if (code === "auth/account-exists-with-different-credential") {
    return "An account already exists with the same email address but different sign-in credentials.";
  }
  return err.message || "Authentication failed. Please check your credentials.";
}

export default function LoginForm({ onSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState({ loading: false, msg: "", err: "" });

  const { login, signup, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setInfoMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password, name.trim());
      }
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Auth error caught in LoginForm:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      await loginWithGithub();
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("GitHub Auth error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReset = () => {
    setResetEmail(email.trim());
    setResetStatus({ loading: false, msg: "", err: "" });
    setShowResetModal(true);
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetStatus({ loading: false, msg: "", err: "Please enter your email address." });
      return;
    }
    setResetStatus({ loading: true, msg: "", err: "" });
    try {
      await resetPassword(resetEmail.trim());
      setResetStatus({
        loading: false,
        msg: `Password reset link sent to ${resetEmail.trim()}. Please check your inbox and spam folder.`,
        err: "",
      });
    } catch (err) {
      setResetStatus({
        loading: false,
        msg: "",
        err: getAuthErrorMessage(err),
      });
    }
  };

  return (
    <div className="w-full">
      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-border bg-card text-ink shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl font-light">Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-muted text-xs sm:text-sm mb-6 leading-relaxed">
              Enter your account email below. We'll send you a secure link to reset your password.
            </p>

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted tracking-widest uppercase mb-2">
                  ACCOUNT EMAIL
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={resetStatus.loading}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink placeholder-muted focus:outline-none focus:border-violet/60 transition-colors text-sm"
                  autoFocus
                />
              </div>

              {resetStatus.err && (
                <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose text-xs flex items-start gap-2">
                  <span>✕</span>
                  <span>{resetStatus.err}</span>
                </div>
              )}

              {resetStatus.msg && (
                <div className="p-3 rounded-xl bg-green/10 border border-green/30 text-green text-xs flex items-start gap-2">
                  <span>✓</span>
                  <span>{resetStatus.msg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:text-ink text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetStatus.loading}
                  className="flex-1 py-2.5 rounded-xl bg-violet text-white font-medium hover:bg-violet-dim transition-all text-sm shadow-md shadow-violet/20 disabled:opacity-60 cursor-pointer"
                >
                  {resetStatus.loading ? "Sending link…" : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social login buttons with official SVG logos */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border bg-card hover:bg-card-hover transition-colors text-sm disabled:opacity-60 cursor-pointer"
        >
          {/* Official Google Brand Mark SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-ink-dim font-medium">Google</span>
        </button>

        <button
          type="button"
          onClick={handleGithubAuth}
          disabled={loading}
          className="flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border bg-card hover:bg-card-hover transition-colors text-sm disabled:opacity-60 cursor-pointer"
        >
          {/* Official GitHub Brand Mark Octocat SVG */}
          <svg className="w-4 h-4 fill-current text-ink" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span className="text-ink-dim font-medium">GitHub</span>
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-muted text-xs font-mono">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl bg-surface border border-border p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
            setInfoMessage("");
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mode === "login"
              ? "bg-violet text-white shadow-md shadow-violet/20"
              : "text-muted hover:text-ink"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
            setInfoMessage("");
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mode === "signup"
              ? "bg-violet text-white shadow-md shadow-violet/20"
              : "text-muted hover:text-ink"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-xs font-mono text-muted tracking-widest uppercase mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink placeholder-muted focus:outline-none focus:border-violet/60 transition-colors text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-mono text-muted tracking-widest uppercase mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink placeholder-muted focus:outline-none focus:border-violet/60 transition-colors text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono text-muted tracking-widest uppercase">
              Password
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={handleOpenReset}
                className="text-xs text-violet-light hover:underline font-mono cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-ink placeholder-muted focus:outline-none focus:border-violet/60 transition-colors text-sm"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose/10 border border-rose/30 text-rose text-sm flex items-start gap-2.5 animate-fade-up">
            <span className="font-mono text-base font-bold">✕</span>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-green/10 border border-green/30 text-green text-sm flex items-start gap-2.5 animate-fade-up">
            <span className="font-mono text-base font-bold">✓</span>
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-violet text-white font-medium hover:bg-violet-dim transition-all disabled:opacity-60 text-sm shadow-lg shadow-violet/20 cursor-pointer"
        >
          {loading
            ? "Authenticating…"
            : mode === "login"
            ? "Sign in →"
            : "Create account →"}
        </button>
      </form>

      <p className="text-center text-muted text-xs mt-6">
        {mode === "login"
          ? "Don't have an account? "
          : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setInfoMessage("");
          }}
          className="text-violet-light hover:underline font-medium cursor-pointer"
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
