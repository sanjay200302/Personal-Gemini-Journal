import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getUserSettings,
  saveUserSettings,
  exportUserData,
  getUserJournals,
} from "../services/firestore";
import ThemeSwitcher from "../components/UI/ThemeSwitcher.jsx";

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Zurich",
  "Europe/Stockholm",
  "Europe/Athens",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Jerusalem",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Pacific/Auckland",
  "Pacific/Fiji",
];

// Play a pleasant ambient chime for sound alerts via Web Audio API
function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(783.99, now); // G5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25); // C6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.warn("Audio chime note:", err);
  }
}

export default function Settings({ navigate: propNavigate }) {
  const detectedTz =
    typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      : "UTC";

  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(() => {
    try { return localStorage.getItem("aura_timezone") || detectedTz; } catch { return detectedTz; }
  });
  const [fontSize, setFontSize] = useState(() => {
    try { return localStorage.getItem("aura_font_size") || "md"; } catch { return "md"; }
  });
  const [highContrast, setHighContrast] = useState(() => {
    try { return localStorage.getItem("aura_high_contrast") === "true"; } catch { return false; }
  });
  const [notifications, setNotifications] = useState(() => {
    try { return localStorage.getItem("aura_notifications") !== "false"; } catch { return true; }
  });
  const [sound, setSound] = useState(() => {
    try { return localStorage.getItem("aura_sound_alerts") !== "false"; } catch { return true; }
  });
  const [reminderTime, setReminderTime] = useState(() => {
    try { return localStorage.getItem("aura_reminder_time") || "08:00"; } catch { return "08:00"; }
  });
  const [voiceRecorderEnabled, setVoiceRecorderEnabled] = useState(() => {
    try { return localStorage.getItem("aura_voice_enabled") !== "false"; } catch { return true; }
  });

  const [exportFormat, setExportFormat] = useState("json");
  const [exportLoading, setExportLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [journalCount, setJournalCount] = useState(0);

  const routerNavigate = useNavigate();
  const { user, logout } = useAuth();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  // Load user settings and journal count from Firestore with local cache fallback
  useEffect(() => {
    if (user?.uid) {
      getUserSettings(user.uid).then((settings) => {
        if (settings) {
          if (settings.timezone) {
            setTimezone(settings.timezone);
            localStorage.setItem("aura_timezone", settings.timezone);
          }
          if (settings.fontSize) setFontSize(settings.fontSize);
          if (typeof settings.highContrast === "boolean")
            setHighContrast(settings.highContrast);
          if (typeof settings.notifications === "boolean")
            setNotifications(settings.notifications);
          if (typeof settings.sound === "boolean") {
            setSound(settings.sound);
            localStorage.setItem("aura_sound_alerts", String(settings.sound));
          }
          if (settings.reminderTime) setReminderTime(settings.reminderTime);
          if (typeof settings.voiceRecorderEnabled === "boolean") {
            setVoiceRecorderEnabled(settings.voiceRecorderEnabled);
            localStorage.setItem("aura_voice_enabled", String(settings.voiceRecorderEnabled));
          }
        }
      });

      getUserJournals(user.uid, 50).then((j) => {
        if (j) setJournalCount(j.length);
      });
    }
  }, [user]);

  // Apply font size globally
  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
    document.body.setAttribute("data-font-size", fontSize);
    localStorage.setItem("aura_font_size", fontSize);
  }, [fontSize]);

  // Apply high contrast globally
  useEffect(() => {
    document.documentElement.setAttribute("data-high-contrast", String(highContrast));
    document.body.setAttribute("data-high-contrast", String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add("theme-high-contrast");
      document.body.classList.add("theme-high-contrast");
    } else {
      document.documentElement.classList.remove("theme-high-contrast");
      document.body.classList.remove("theme-high-contrast");
    }
    localStorage.setItem("aura_high_contrast", String(highContrast));
  }, [highContrast]);

  // Handle Timezone change & sync to Firestore
  const handleTimezoneChange = async (newTz) => {
    setTimezone(newTz);
    localStorage.setItem("aura_timezone", newTz);
    if (user?.uid) {
      await saveUserSettings(user.uid, { timezone: newTz });
      showSavedFeedback("Timezone updated ✓");
    }
  };

  // Auto-detect system timezone
  const handleDetectTimezone = async () => {
    const autoTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setTimezone(autoTz);
    localStorage.setItem("aura_timezone", autoTz);
    if (user?.uid) {
      await saveUserSettings(user.uid, { timezone: autoTz });
      showSavedFeedback(`Auto-detected: ${autoTz} ✓`);
    }
  };

  // Handle Font Size change & sync to Firestore
  const handleFontSizeChange = async (size) => {
    setFontSize(size);
    if (user?.uid) {
      await saveUserSettings(user.uid, { fontSize: size });
      showSavedFeedback();
    }
  };

  // Handle High Contrast change & sync to Firestore
  const handleHighContrastChange = async () => {
    const next = !highContrast;
    setHighContrast(next);
    if (user?.uid) {
      await saveUserSettings(user.uid, { highContrast: next });
      showSavedFeedback();
    }
  };

  // Handle Voice Recorder setting toggle
  const handleVoiceRecorderToggle = async () => {
    const next = !voiceRecorderEnabled;
    setVoiceRecorderEnabled(next);
    localStorage.setItem("aura_voice_enabled", String(next));
    if (user?.uid) {
      await saveUserSettings(user.uid, { voiceRecorderEnabled: next });
      showSavedFeedback(next ? "Voice recording enabled ✓" : "Voice recording disabled ✓");
    }
  };

  // Handle Notification toggle & Browser Notification Permission
  const handleNotificationToggle = async () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("aura_notifications", String(next));

    if (next && "Notification" in window && Notification.permission !== "granted") {
      try {
        const perm = await Notification.requestPermission();
        if (perm === "granted" && sound) {
          playChimeSound();
        }
      } catch {}
    }

    if (user?.uid) {
      await saveUserSettings(user.uid, {
        notifications: next,
        sound,
        reminderTime,
      });
      showSavedFeedback(next ? "Reminders enabled ✓" : "Reminders disabled ✓");
    }
  };

  // Handle Sound Alerts toggle
  const handleSoundToggle = async () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem("aura_sound_alerts", String(next));
    if (next) playChimeSound();

    if (user?.uid) {
      await saveUserSettings(user.uid, {
        sound: next,
        notifications,
        reminderTime,
      });
      showSavedFeedback(next ? "Sound alerts enabled ✓" : "Sound alerts disabled ✓");
    }
  };

  // Trigger test notification
  const handleTestNotification = async () => {
    if (sound) playChimeSound();

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Aura Daily Reflection ✦", {
          body: "It's time for your daily journaling practice. How are you feeling today?",
          icon: "/favicon.svg",
        });
        showSavedFeedback("Test notification sent ✓");
      } else if (Notification.permission !== "denied") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          new Notification("Aura Daily Reflection ✦", {
            body: "It's time for your daily journaling practice. How are you feeling today?",
            icon: "/favicon.svg",
          });
          showSavedFeedback("Notification permission granted ✓");
        }
      } else {
        alert("Browser notifications are blocked. Please enable them in your browser site settings.");
      }
    } else {
      alert("Browser notifications are not supported on this browser.");
    }
  };

  // Handle Reminder Time change
  const handleReminderTimeChange = async (time) => {
    setReminderTime(time);
    localStorage.setItem("aura_reminder_time", time);
    if (user?.uid) {
      await saveUserSettings(user.uid, {
        notifications,
        sound,
        reminderTime: time,
      });
      showSavedFeedback("Reminder schedule updated ✓");
    }
  };

  const showSavedFeedback = (msg = "Settings saved to your profile ✓") => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(""), 2500);
  };

  // Export journals and analytics securely from Firestore
  const handleExport = async () => {
    if (!user?.uid) {
      alert("Please log in to export your journal data.");
      return;
    }
    setExportLoading(true);
    try {
      const data = await exportUserData(user.uid);
      const dateStr = new Date().toISOString().split("T")[0];

      if (exportFormat === "csv") {
        // Convert to CSV
        const headers = ["Title", "Content", "Mood", "Date", "AudioUrl"];
        const rows = (data.journals || []).map((j) => [
          `"${(j.title || "").replace(/"/g, '""')}"`,
          `"${(j.content || "").replace(/"/g, '""')}"`,
          j.mood || "",
          `"${j.date || ""}"`,
          `"${j.audioUrl || ""}"`,
        ]);
        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `aura_journal_export_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Export JSON
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `aura_journal_export_${dateStr}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export journals. Please check your network and try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Aura Member";
  const userEmail = user?.email || "No email provided";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "AM";

  const allTimezones = Array.from(new Set([detectedTz, ...TIMEZONE_OPTIONS]));

  return (
    <div className="h-full min-h-screen bg-ground text-ink flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 md:px-8 py-4 border-b border-border bg-ground/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("dashboard")}
            className="text-muted hover:text-ink transition-colors text-sm font-mono flex items-center gap-2 cursor-pointer"
          >
            ← Dashboard
          </button>
          <div className="w-px h-5 bg-border" />
          <div>
            <p className="text-muted font-mono text-xs tracking-widest uppercase">
              SETTINGS
            </p>
          </div>
        </div>

        {saveStatus && (
          <span className="text-xs text-green font-mono bg-green/10 border border-green/30 px-3 py-1 rounded-full animate-fade-in">
            {saveStatus}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 md:px-8 py-10 space-y-8">
          {/* Profile Section */}
          <section>
            <p className="text-muted font-mono text-xs tracking-widest uppercase mb-4">
              USER PROFILE
            </p>
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-violet/20 flex items-center justify-center text-2xl font-medium text-violet-light border border-violet/30">
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-lg text-ink">{displayName}</p>
                  <p className="text-muted text-sm font-mono">{userEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-muted font-mono text-xs mb-1 uppercase">
                    USER ID
                  </p>
                  <p className="text-xs text-ink-dim font-mono truncate">
                    {user?.uid || "Anonymous Session"}
                  </p>
                </div>
                <div>
                  <p className="text-muted font-mono text-xs mb-1 uppercase">
                    TOTAL JOURNALS
                  </p>
                  <p className="text-sm text-ink-dim font-mono">
                    {journalCount} reflection{journalCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Timezone & Localization Section */}
          <section>
            <p className="text-muted font-mono text-xs tracking-widest uppercase mb-4">
              TIMEZONE & LOCALIZATION
            </p>
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Selected Timezone</p>
                  <p className="text-muted text-xs mt-0.5">
                    Used for dashboard greetings, reminder schedules, and reflection dates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDetectTimezone}
                  className="px-3 py-1.5 rounded-xl border border-violet/30 bg-violet-glow text-violet-light text-xs font-mono hover:border-violet/60 transition-colors cursor-pointer self-start sm:self-center"
                >
                  ⚡ Auto-Detect Local
                </button>
              </div>

              <div className="pt-2">
                <select
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-ink text-sm font-mono focus:outline-none focus:border-violet/60 cursor-pointer"
                >
                  {allTimezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz} {tz === detectedTz ? "(System Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Voice Features Section */}
          <section>
            <p className="text-muted font-mono text-xs tracking-widest uppercase mb-4">
              VOICE & MULTIMODAL FEATURES
            </p>
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Voice Recorder & Live Streaming</p>
                  <p className="text-muted text-xs mt-0.5">
                    Enable Web Speech API streaming transcription and audio note uploads
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVoiceRecorderToggle}
                  className={`relative w-12 h-6 rounded-full transition-all focus:outline-none cursor-pointer ${
                    voiceRecorderEnabled ? "bg-violet" : "bg-border"
                  }`}
                  aria-label="Toggle Voice Recorder"
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                      voiceRecorderEnabled ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <p className="text-muted font-mono text-xs tracking-widest uppercase mb-4">
              APPEARANCE & ACCESSIBILITY
            </p>
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-sm">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Color Theme</p>
                  <p className="text-muted text-xs mt-0.5">
                    Switch between dark, light, and adaptive mood themes
                  </p>
                </div>
                <ThemeSwitcher variant="toggle" />
              </div>

              {/* Font Size Selector */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Font Size</p>
                    <p className="text-muted text-xs mt-0.5">
                      Adjust global typography scaling across the entire application
                    </p>
                  </div>
                  <span className="text-xs text-violet-light font-mono uppercase">
                    {fontSize}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: "sm", label: "Small (14px)" },
                    { id: "md", label: "Default (16px)" },
                    { id: "lg", label: "Large (18px)" },
                  ].map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleFontSizeChange(size.id)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        fontSize === size.id
                          ? "border-violet/80 bg-violet text-white shadow-md shadow-violet/20"
                          : "border-border text-muted hover:text-ink hover:bg-surface"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm font-medium">High Contrast Mode</p>
                  <p className="text-muted text-xs mt-0.5">
                    Increase contrast and visual boundaries for enhanced accessibility
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleHighContrastChange}
                  className={`relative w-12 h-6 rounded-full transition-all focus:outline-none cursor-pointer ${
                    highContrast ? "bg-violet" : "bg-border"
                  }`}
                  aria-label="Toggle High Contrast"
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                      highContrast ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Notifications & Sound Section */}
          <section>
            <p className="text-muted font-mono text-xs tracking-widest uppercase mb-4">
              NOTIFICATIONS & SOUND ALERTS
            </p>
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-sm">
              {/* Daily Reminder Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Daily Reflection Reminder</p>
                  <p className="text-muted text-xs mt-0.5">
                    Receive scheduled browser alerts to maintain your reflection streak
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  className={`relative w-12 h-6 rounded-full transition-all focus:outline-none cursor-pointer ${
                    notifications ? "bg-violet" : "bg-border"
                  }`}
                  aria-label="Toggle Notifications"
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                      notifications ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Sound Alerts Option */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Sound Alerts</p>
                  <p className="text-muted text-xs mt-0.5">
                    Play a gentle ambient chime when reminders and notifications fire
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={playChimeSound}
                    className="px-2.5 py-1 rounded-lg border border-border text-muted hover:text-ink text-xs font-mono transition-colors cursor-pointer"
                    title="Preview sound chime"
                  >
                    🔊 Test Sound
                  </button>
                  <button
                    type="button"
                    onClick={handleSoundToggle}
                    className={`relative w-12 h-6 rounded-full transition-all focus:outline-none cursor-pointer ${
                      sound ? "bg-violet" : "bg-border"
                    }`}
                    aria-label="Toggle Sound Alerts"
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                        sound ? "left-6" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {notifications && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Scheduled Reminder Time</p>
                      <p className="text-muted text-xs mt-0.5">
                        Preferred local time ({timezone}) for your daily journaling prompt
                      </p>
                    </div>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => handleReminderTimeChange(e.target.value)}
                      className="px-4 py-2 rounded-xl bg-surface border border-border text-ink focus:outline-none focus:border-violet/60 transition-colors text-sm font-mono cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="px-4 py-2 rounded-xl border border-violet/30 bg-violet-glow text-violet-light text-xs font-mono hover:border-violet/60 transition-all cursor-pointer"
                    >
                      🔔 Test Browser Notification
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Data & Privacy */}
          <section>
            <p className="text-muted font-mono text-xs tracking-widest uppercase mb-4">
              DATA, PRIVACY & EXPORT
            </p>
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Export Your Journal Records</p>
                  <p className="text-muted text-xs mt-0.5">
                    Download your reflections, moods, and time-capsules from Firestore
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-ink font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="json">JSON (.json)</option>
                    <option value="csv">CSV (.csv)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="px-5 py-2 rounded-xl bg-violet text-white text-xs font-medium hover:bg-violet-dim transition-colors disabled:opacity-60 cursor-pointer shadow-md shadow-violet/20"
                  >
                    {exportLoading ? "Exporting…" : "Export Data"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm font-medium">End-to-End Encryption</p>
                  <p className="text-muted text-xs mt-0.5">
                    All journal content is scoped and encrypted by your user UID
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-green font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-rose">Sign Out</p>
                  <p className="text-muted text-xs mt-0.5">
                    Safely log out of your session on this device
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("landing");
                  }}
                  className="px-4 py-2 rounded-xl border border-rose/30 text-rose text-xs hover:bg-rose/10 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
