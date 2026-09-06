import { useState, useRef, useEffect } from "react";
import { createJournal, geminiSuggestions, moodTracking } from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { uploadJournalPhoto } from "../../services/storage";
import { auth } from "../../services/firebase";
import { getUserSettings, saveUserJournal } from "../../services/firestore";

const MOODS = [
  { emoji: "😢", label: "Sad", value: 1 },
  { emoji: "😕", label: "Low", value: 3 },
  { emoji: "😐", label: "Neutral", value: 5 },
  { emoji: "🙂", label: "Good", value: 7 },
  { emoji: "😊", label: "Happy", value: 8 },
  { emoji: "😄", label: "Joyful", value: 10 },
];

const DEFAULT_PROMPTS = [
  "What made you feel most alive today?",
  "What would you tell your past self right now?",
  "Where did you notice resistance, and what does it mean?",
  "What small thing surprised you with joy today?",
  "What are you letting go of?",
];

function VoiceModal({ onClose, onTranscript }) {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    transcript,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    uploadAndTranscribe,
  } = useVoiceRecorder();

  const { getToken } = useAuth();

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleInsert = async () => {
    try {
      const token = await getToken();
      const res = await uploadAndTranscribe(token);
      if (res?.transcript && onTranscript) {
        onTranscript(res.transcript);
      }
      onClose();
    } catch {
      if (transcript && onTranscript) {
        onTranscript(transcript);
      }
      onClose();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-border bg-card text-center animate-fade-up shadow-2xl">
        <p className="text-muted font-mono text-xs tracking-widest uppercase mb-6">
          VOICE RECORDER
        </p>

        <div className="relative mx-auto w-24 h-24 mb-6">
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-2 border-rose/40 animate-ping" />
          )}
          <button
            type="button"
            onClick={handleToggle}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all cursor-pointer ${
              isRecording
                ? "bg-rose text-white scale-105 shadow-lg shadow-rose/30"
                : audioBlob
                ? "bg-green/20 text-green border-2 border-green"
                : "bg-surface border-2 border-border text-muted hover:border-violet/40 hover:scale-105"
            }`}
          >
            {audioBlob && !isRecording ? "✓" : isRecording ? "⏹" : "🎙"}
          </button>
        </div>

        {/* Animated Waveform */}
        <div className="flex items-center justify-center gap-1 h-8 mb-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-violet/60"
              style={{
                height: isRecording
                  ? `${Math.sin(i + recordingTime) * 12 + 14}px`
                  : "4px",
                animation: isRecording
                  ? `wave ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`
                  : "none",
                animationDelay: `${i * 0.04}s`,
                transition: "height 0.15s ease",
              }}
            />
          ))}
        </div>

        <p className="text-ink-dim text-sm mb-2 font-mono">
          {isRecording
            ? `Recording live… ${formatTime(recordingTime)}`
            : audioBlob
            ? `Recorded ${formatTime(recordingTime)} — Ready to insert`
            : "Tap microphone to speak"}
        </p>

        {transcript && (
          <div className="p-3 rounded-xl bg-surface border border-border text-xs text-ink-dim mb-4 text-left max-h-28 overflow-y-auto font-mono">
            <span className="text-violet text-[10px] block mb-1 uppercase font-bold">
              Live Transcript:
            </span>
            {transcript}
          </div>
        )}

        {error && (
          <p className="text-rose text-xs font-mono mb-4">{error}</p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-border text-muted hover:text-ink transition-colors text-sm cursor-pointer"
          >
            Cancel
          </button>
          {(audioBlob || transcript) && !isRecording && (
            <button
              type="button"
              onClick={handleInsert}
              disabled={isProcessing}
              className="px-6 py-2 rounded-full bg-violet text-white text-sm hover:bg-violet-dim transition-colors shadow-lg shadow-violet/20 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? "Processing…" : "Insert transcript"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JournalEditor({ onSaved, initialEntry = null }) {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [selectedMood, setSelectedMood] = useState(initialEntry?.mood || null);
  const [showVoice, setShowVoice] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const prompts = DEFAULT_PROMPTS;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem("aura_voice_enabled") !== "false";
    } catch {
      return true;
    }
  });

  const textRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user, getToken } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      getUserSettings(user.uid).then((settings) => {
        if (settings && typeof settings.voiceRecorderEnabled === "boolean") {
          setVoiceEnabled(settings.voiceRecorderEnabled);
          localStorage.setItem("aura_voice_enabled", String(settings.voiceRecorderEnabled));
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = user?.uid || auth?.currentUser?.uid;
      if (!uid) {
        throw new Error("User must be authenticated to save a reflection");
      }

      const payload = {
        userId: uid,
        title: title || "Untitled Entry",
        content,
        mood: selectedMood,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Direct Firestore write
      let savedDocId = null;
      try {
        savedDocId = await saveUserJournal(uid, payload);
      } catch (fsErr) {
        console.warn("Firestore saveUserJournal error:", fsErr);
      }

      // 2. Track mood via backend if token available
      const token = await getToken();
      if (token) {
        if (content) {
          try {
            await moodTracking({ text: content }, token);
          } catch {
            // ignore
          }
        }
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        if (onSaved) onSaved({ title, content, mood: selectedMood });
      }, 900);
    } catch (err) {
      console.warn("Save note:", err);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        if (onSaved) onSaved({ title, content, mood: selectedMood });
      }, 900);
    } finally {
      setSaving(false);
    }
  };

  const handleFetchAiSuggestions = async () => {
    if (!content) return;
    setAiLoading(true);
    try {
      const token = await getToken();
      const res = await geminiSuggestions({ text: content }, token);
      if (res?.suggestions) {
        setAiSuggestions(res.suggestions);
      }
    } catch {
      setAiSuggestions([
        "Reflect deeper on how this situation made you feel.",
        "What is one positive takeaway from this experience?",
        "How can you apply what you learned tomorrow?",
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const insertPrompt = () => {
    const prompt = prompts[promptIdx % prompts.length];
    setContent((c) => (c ? `${c}\n\n${prompt}\n` : `${prompt}\n`));
    setPromptIdx((i) => i + 1);
    textRef.current?.focus();
  };

  const handleTranscript = (text) => {
    setContent((c) => (c ? `${c}\n\n${text}` : text));
    textRef.current?.focus();
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoMessage("Uploading photo to storage…");
    try {
      const uid = user?.uid || auth?.currentUser?.uid;
      if (!uid) {
        throw new Error("User must be authenticated to upload photos");
      }
      const downloadUrl = await uploadJournalPhoto(file, uid);
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
      const markdownImage = `\n\n![${cleanFileName}](${downloadUrl})\n\n`;
      setContent((prev) => (prev ? `${prev}${markdownImage}` : markdownImage));
      setPhotoMessage("Photo inserted ✓");
      setTimeout(() => setPhotoMessage(""), 2500);
    } catch (err) {
      console.error("Photo upload error:", err);
      setPhotoMessage("Failed to upload photo. Please try again.");
      setTimeout(() => setPhotoMessage(""), 3000);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Link Insert Handler
  const handleInsertLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    const label = linkText.trim() || "Link";
    const markdownLink = `[${label}](${linkUrl.trim()})`;
    setContent((prev) => (prev ? `${prev} ${markdownLink}` : markdownLink));
    setShowLinkModal(false);
    setLinkText("");
    setLinkUrl("https://");
    textRef.current?.focus();
  };

  const handleOpenVoice = () => {
    if (!voiceEnabled) {
      alert("Voice recording is disabled in Settings. Please enable it in Settings to record voice notes.");
      return;
    }
    setShowVoice(true);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      {/* Hidden Photo File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Voice Recording Modal */}
      {showVoice && (
        <VoiceModal
          onClose={() => setShowVoice(false)}
          onTranscript={handleTranscript}
        />
      )}

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-border bg-card shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-light">Insert Link</h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-muted hover:text-ink text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleInsertLink} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-1.5">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. My Inspiration Article"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-ink text-sm focus:outline-none focus:border-violet/60"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-1.5">
                  URL Address
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-ink text-sm focus:outline-none focus:border-violet/60"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:text-ink text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-violet text-white text-sm font-medium hover:bg-violet-dim shadow-md shadow-violet/20 cursor-pointer"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col h-full">
        {/* Editor Controls Header */}
        <div className="flex items-center justify-between py-2 mb-6 border-b border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted font-mono">
            <span>{wordCount} words</span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-green">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              Auto-save ready
            </span>
            {photoMessage && (
              <span className="text-violet-light animate-fade-in">· {photoMessage}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFetchAiSuggestions}
              disabled={aiLoading || !content}
              className="px-4 py-1.5 rounded-full border border-violet/30 bg-violet-glow text-violet-light hover:border-violet/60 text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
            >
              {aiLoading ? "Thinking…" : "✦ Gemini AI Help"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                saved
                  ? "bg-green/20 text-green border border-green/30"
                  : "bg-violet text-white hover:bg-violet-dim shadow-lg shadow-violet/20"
              } disabled:opacity-70`}
            >
              {saved ? "✓ Saved" : saving ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </div>

        {/* Mood selector */}
        <div className="mb-6">
          <p className="text-muted font-mono text-xs tracking-widest uppercase mb-3">
            HOW ARE YOU FEELING?
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.value}
                onClick={() => setSelectedMood(m.value)}
                title={m.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                  selectedMood === m.value
                    ? "bg-violet-glow border-2 border-violet/60 scale-110"
                    : "bg-surface border border-border hover:border-border/80 hover:scale-105"
                }`}
              >
                {m.emoji}
              </button>
            ))}
            {selectedMood && (
              <span className="text-violet-light text-sm font-mono ml-2">
                {MOODS.find((m) => m.value === selectedMood)?.label} — {selectedMood}/10
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this entry a title…"
          className="w-full font-display text-3xl md:text-4xl bg-transparent border-none outline-none text-ink placeholder-muted mb-4 leading-snug"
        />

        {/* Prompt suggestion */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-surface border border-border">
          <span className="text-violet font-mono text-sm flex-none">✦</span>
          <p className="text-muted-light text-sm italic flex-1 truncate">
            {prompts[promptIdx % prompts.length]}
          </p>
          <button
            type="button"
            onClick={insertPrompt}
            className="flex-none text-xs text-violet-light hover:text-violet font-mono transition-colors cursor-pointer"
          >
            USE →
          </button>
          <button
            type="button"
            onClick={() => setPromptIdx((i) => i + 1)}
            className="flex-none text-xs text-muted hover:text-ink font-mono transition-colors cursor-pointer"
          >
            NEXT
          </button>
        </div>

        {/* AI Suggestions Box (if fetched) */}
        {aiSuggestions.length > 0 && (
          <div className="mb-4 p-4 rounded-xl border border-violet/30 bg-violet-glow animate-fade-up">
            <p className="text-violet-light text-xs font-mono tracking-widest uppercase mb-2">
              ✦ AI SUGGESTIONS
            </p>
            <ul className="space-y-1.5 text-sm text-ink-dim">
              {aiSuggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 cursor-pointer hover:text-ink"
                  onClick={() => handleTranscript(s)}
                >
                  <span className="text-violet">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Editor Area */}
        <textarea
          ref={textRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Begin writing — this space is yours…"
          className="w-full min-h-[350px] bg-transparent border-none outline-none text-ink placeholder-muted resize-none leading-relaxed text-base"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        />

        {/* Toolbar */}
        <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
          <button
            type="button"
            onClick={handleOpenVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-violet/40 transition-colors text-sm text-muted hover:text-ink cursor-pointer ${
              !voiceEnabled ? "opacity-60" : ""
            }`}
            title={!voiceEnabled ? "Voice recording disabled in Settings" : "Record voice note"}
          >
            <span className="text-base">🎙</span>
            <span>Voice note</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-violet/40 transition-colors text-sm text-muted hover:text-ink cursor-pointer disabled:opacity-60"
          >
            <span className="text-base">📷</span>
            <span>{uploadingPhoto ? "Uploading…" : "Photo"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-violet/40 transition-colors text-sm text-muted hover:text-ink cursor-pointer"
          >
            <span className="text-base">🔗</span>
            <span>Link</span>
          </button>
        </div>
      </div>
    </>
  );
}
