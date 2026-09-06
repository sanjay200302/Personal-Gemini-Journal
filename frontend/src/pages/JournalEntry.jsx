import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createJournal, updateJournal, getJournal } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useAnalytics } from "../context/AnalyticsContext.jsx";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { uploadJournalPhoto } from "../services/storage";
import { db, auth } from "../services/firebase";
import {
  getUserSettings,
  getJournalById,
  saveUserJournal,
  updateUserJournal,
  addJournalAttachment,
  removeJournalAttachment,
} from "../services/firestore";

const MOODS = [
  { emoji: "😢", label: "Sad", value: 1 },
  { emoji: "😕", label: "Low", value: 3 },
  { emoji: "😐", label: "Neutral", value: 5 },
  { emoji: "🙂", label: "Good", value: 7 },
  { emoji: "😊", label: "Happy", value: 8 },
  { emoji: "😄", label: "Joyful", value: 10 },
];

const PROMPTS = [
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
            ? `Recorded ${formatTime(recordingTime)} — Ready`
            : "Tap microphone to start speaking"}
        </p>

        {transcript && (
          <div className="p-3 rounded-xl bg-surface border border-border text-xs text-ink-dim mb-4 text-left max-h-24 overflow-y-auto font-mono">
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

export default function JournalEntry({ navigate: propNavigate }) {
  const params = useParams();
  const entryId = params.id && params.id !== "new" ? params.id : null;
  const [currentEntryId, setCurrentEntryId] = useState(entryId);

  useEffect(() => {
    setCurrentEntryId(params.id && params.id !== "new" ? params.id : null);
  }, [params.id]);

  // Form & Content states
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);

  // Explicit requested states for Save Button and Photo Upload
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Save Entry");
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const [loadingDoc, setLoadingDoc] = useState(Boolean(entryId));
  const [showVoice, setShowVoice] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [promptIdx, setPromptIdx] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem("aura_voice_enabled") !== "false";
    } catch {
      return true;
    }
  });

  const textRef = useRef(null);
  const fileInputRef = useRef(null);

  const routerNavigate = useNavigate();
  const { user, getToken } = useAuth();
  const { fetchAnalyticsData } = useAnalytics();

  const navigate = (screen) => {
    if (propNavigate) propNavigate(screen);
    else routerNavigate(screen.startsWith("/") ? screen : `/${screen}`);
  };

  // Helper to mark entry as modified when user types/edits
  const handleEdit = () => {
    if (saveStatus === "Saved" || saveStatus === "Error") {
      setSaveStatus("Save Entry");
    }
  };

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

  // Load existing entry if editing / viewing an existing ID; Reset if creating new
  useEffect(() => {
    if (!entryId) {
      setTitle("");
      setContent("");
      setSelectedMood(null);
      setAttachments([]);
      setLoadingDoc(false);
      return;
    }

    let isMounted = true;
    setLoadingDoc(true);

    const loadDoc = async () => {
      try {
        let docData = await getJournalById(entryId);

        // Fallback to backend journal agent if direct Firestore returned null
        if (!docData) {
          try {
            const token = await getToken();
            if (token) {
              docData = await getJournal(entryId, token);
            }
          } catch (apiErr) {
            console.warn("Backend getJournal fallback note:", apiErr.message);
          }
        }

        if (docData && isMounted) {
          setTitle(docData.title || "");
          setContent(docData.content || "");
          if (typeof docData.mood === "number") setSelectedMood(docData.mood);
          else if (typeof docData.moodVal === "number") setSelectedMood(docData.moodVal);

          if (Array.isArray(docData.attachments)) {
            setAttachments(docData.attachments);
          } else if (docData.photoURL) {
            setAttachments([docData.photoURL]);
          }
          setSaveStatus("Saved");
        }
      } catch (err) {
        console.warn("Failed to load existing journal entry:", err);
      } finally {
        if (isMounted) setLoadingDoc(false);
      }
    };

    loadDoc();
    return () => {
      isMounted = false;
    };
  }, [entryId, getToken]);

  // 1. Save Button Logic
  const handleSave = async () => {
    // On save start
    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      const uid = auth?.currentUser?.uid || user?.uid;
      if (!uid) {
        throw new Error("User not authenticated");
      }

      const targetId = currentEntryId || entryId;
      const payload = {
        userId: auth?.currentUser?.uid || uid,
        title: title || "Untitled Reflection",
        content: content || "",
        mood: selectedMood,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: Array.isArray(attachments) ? attachments : [],
        photoURL: attachments[0] || null,
      };

      if (!targetId) {
        payload.createdAt = new Date().toISOString();
      }

      let finalDocId = targetId;

      // Firestore Write (Primary & Authoritative)
      if (targetId) {
        await updateUserJournal(targetId, payload);
      } else {
        const newId = await saveUserJournal(uid, payload);
        if (newId) {
          finalDocId = newId;
          setCurrentEntryId(newId);
          // Persist entry URL so refresh loads this same entry with "Saved" state
          window.history.replaceState(null, "", `/journals/${newId}`);
        }
      }

      // After Firestore write success
      setSaveStatus("Saved");

      // Non-blocking Backend Agent Sync (Update only, never create duplicate document)
      if (getToken && finalDocId) {
        getToken()
          .then((token) => {
            if (token) {
              updateJournal(finalDocId, payload, token).catch(() => {});
            }
          })
          .catch(() => {});
      }

      // Clear cache and trigger analytics refresh
      if (uid) {
        try {
          localStorage.removeItem(`aura_analytics_cache_${uid}`);
        } catch {}
      }
      if (fetchAnalyticsData) {
        fetchAnalyticsData(true);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("Error");
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Photo Upload Logic
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // On photo select start
    setIsUploading(true);

    try {
      const uid = user?.uid || auth?.currentUser?.uid;
      if (!uid) {
        throw new Error("User must be authenticated to upload photos");
      }
      const targetId = currentEntryId || entryId;

      const uploadedUrls = await Promise.all(files.map(async (file) => {
        // Upload file to Firebase Storage at path journals/${userId}/${file.name}
        const downloadUrl = await uploadJournalPhoto(file, uid);

        // Save download URL into Firestore under attachments array using arrayUnion
        if (targetId && db) {
          try {
            await addJournalAttachment(targetId, downloadUrl);
          } catch (unionErr) {
            console.warn("Firestore arrayUnion note:", unionErr.message);
          }
        }
        return downloadUrl;
      }));

      // Update local state once after all uploads finish.
      setAttachments((prev) => [...prev, ...uploadedUrls]);
      handleEdit();
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async (urlToRemove, indexToRemove) => {
    const targetId = currentEntryId || entryId;
    // Delete from Firestore if entry exists
    if (targetId && urlToRemove) {
      try {
        await removeJournalAttachment(targetId, urlToRemove);
      } catch (removeErr) {
        console.warn("Firestore arrayRemove note:", removeErr.message);
      }
    }
    // Update local state
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    handleEdit();
  };

  const insertPrompt = () => {
    const prompt = PROMPTS[promptIdx % PROMPTS.length];
    setContent((c) => (c ? `${c}\n\n${prompt}\n` : `${prompt}\n`));
    setPromptIdx((i) => i + 1);
    handleEdit();
    textRef.current?.focus();
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    const label = linkText.trim() || "Link";
    const markdownLink = `[${label}](${linkUrl.trim()})`;
    setContent((prev) => (prev ? `${prev} ${markdownLink}` : markdownLink));
    setShowLinkModal(false);
    setLinkText("");
    setLinkUrl("https://");
    handleEdit();
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
      {/* Hidden Photo Input supporting multiple photos */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Voice Recorder Modal */}
      {showVoice && (
        <VoiceModal
          onClose={() => setShowVoice(false)}
          onTranscript={(t) => {
            setContent((c) => (c ? `${c}\n\n${t}` : t));
            textRef.current?.focus();
          }}
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
                  placeholder="e.g. Reference Article"
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

      <div className="h-dvh min-h-0 overflow-hidden flex flex-col bg-ground text-ink">
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-6 md:px-8 py-4 border-b border-border bg-ground/90 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/journals")}
              className="text-muted hover:text-ink transition-colors text-sm font-mono flex items-center gap-2 cursor-pointer"
            >
              ← All Journals
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="text-muted text-sm font-mono hidden sm:inline">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted text-xs font-mono">
              {wordCount} words
            </span>
            {/* Save Button Rendering using {saveStatus} */}
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                saveStatus === "Saved"
                  ? "bg-green/20 text-green border border-green/30"
                  : saveStatus === "Error"
                  ? "bg-rose/20 text-rose border border-rose/30"
                  : "bg-violet text-white hover:bg-violet-dim shadow-lg shadow-violet/20"
              } disabled:opacity-70`}
            >
              {saveStatus}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 md:px-8 py-8">
            {loadingDoc ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-violet/30 border-t-violet animate-spin mb-3" />
                <p className="text-muted text-xs font-mono">Loading entry…</p>
              </div>
            ) : (
              <>
                {/* Mood selector */}
                <div className="mb-6">
                  <p className="text-muted font-mono text-xs tracking-widest uppercase mb-3">
                    HOW ARE YOU FEELING?
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {MOODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => {
                          setSelectedMood(m.value);
                          handleEdit();
                        }}
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
                        {MOODS.find((m) => m.value === selectedMood)?.label} —{" "}
                        {selectedMood}/10
                      </span>
                    )}
                  </div>
                </div>

                {/* Display all photos by looping through attachments array */}
                {attachments && attachments.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-muted uppercase tracking-widest">
                        ATTACHED PHOTOS ({attachments.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs font-mono text-violet-light hover:text-violet transition-colors cursor-pointer"
                      >
                        + Add another photo
                      </button>
                    </div>

                    <div
                      className={`grid gap-3 ${
                        attachments.length === 1
                          ? "grid-cols-1"
                          : attachments.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 sm:grid-cols-3"
                      }`}
                    >
                      {attachments.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="rounded-2xl overflow-hidden border border-border bg-surface relative group animate-fade-in shadow-md aspect-video sm:aspect-square flex items-center justify-center"
                        >
                          <img
                            src={url}
                            alt={`Journal reflection visual ${idx + 1}`}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(url, idx)}
                              className="px-2.5 py-1 rounded-full bg-ground/90 backdrop-blur-sm border border-border text-rose text-[11px] font-mono hover:bg-rose/20 transition-all cursor-pointer shadow-lg"
                              title="Remove photo"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Title */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    handleEdit();
                  }}
                  placeholder="Give this entry a title…"
                  className="w-full font-display text-3xl md:text-4xl bg-transparent border-none outline-none text-ink placeholder-muted mb-4 leading-snug"
                />

                {/* Prompt suggestion */}
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-surface border border-border">
                  <span className="text-violet font-mono text-sm flex-none">✦</span>
                  <p className="text-muted-light text-sm italic flex-1 truncate">
                    {PROMPTS[promptIdx % PROMPTS.length]}
                  </p>
                  <button
                    onClick={insertPrompt}
                    className="flex-none text-xs text-violet-light hover:text-violet font-mono transition-colors cursor-pointer"
                  >
                    USE →
                  </button>
                  <button
                    onClick={() => {
                      setPromptIdx((i) => i + 1);
                      handleEdit();
                    }}
                    className="flex-none text-xs text-muted hover:text-ink font-mono transition-colors cursor-pointer"
                  >
                    NEXT
                  </button>
                </div>

                {/* Editor */}
                <textarea
                  ref={textRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    handleEdit();
                  }}
                  placeholder="Begin writing — this space is yours…"
                  className="w-full min-h-[400px] bg-transparent border-none outline-none text-ink placeholder-muted resize-none leading-relaxed text-base"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                />
              </>
            )}
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="flex-none px-6 md:px-8 py-4 border-t border-border bg-surface flex items-center gap-4">
          <button
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
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-violet/40 transition-colors text-sm text-muted hover:text-ink cursor-pointer disabled:opacity-60"
          >
            {isUploading ? (
              <div className="w-4 h-4 rounded-full border-2 border-violet/30 border-t-violet animate-spin" />
            ) : (
              <span className="text-base">📷</span>
            )}
            <span>
              {isUploading
                ? "Uploading…"
                : attachments.length > 0
                ? `Photos (${attachments.length})`
                : "Photo"}
            </span>
          </button>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-violet/40 transition-colors text-sm text-muted hover:text-ink cursor-pointer"
          >
            <span className="text-base">🔗</span>
            <span>Link</span>
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            Auto-save on
          </div>
        </div>
      </div>
    </>
  );
}
