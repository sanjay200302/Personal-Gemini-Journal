import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

/**
 * Auto-creates default user_settings document in Firestore on first login
 * @param {object} user - Firebase User object with uid
 */
export async function ensureUserSettings(user) {
  if (!db || !user?.uid) return;
  try {
    const ref = doc(db, "user_settings", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const defaultTz =
        typeof Intl !== "undefined" && Intl.DateTimeFormat
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
          : "UTC";

      const defaultSettings = {
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || "Aura Member",
        timezone: defaultTz,
        fontSize: "md",
        highContrast: false,
        notifications: true,
        sound: true,
        reminderTime: "08:00",
        voiceRecorderEnabled: true,
        streak: 0,
        lastEntryDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(ref, defaultSettings);
      try {
        localStorage.setItem(`aura_settings_cache_${user.uid}`, JSON.stringify(defaultSettings));
      } catch {}
    }
  } catch (err) {
    console.warn("Auto-create user_settings document note:", err);
  }
}

/**
 * Fetch journals belonging specifically to the authenticated userId with query limit and optional pagination
 */
export async function getUserJournals(userId, pageSize = 50, lastVisible = null) {
  if (!db || !userId) return [];
  try {
    let q;
    if (lastVisible) {
      q = query(
        collection(db, "journals"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, "journals"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      _rawDoc: d,
    }));
  } catch (err) {
    console.warn("Firestore query error (fallback to unsorted with limit):", err);
    try {
      const fallbackQuery = query(
        collection(db, "journals"),
        where("userId", "==", userId),
        limit(pageSize)
      );
      const snapshot = await getDocs(fallbackQuery);
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        _rawDoc: d,
      }));
      // Sort client-side by createdAt descending
      return list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || a.date || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      });
    } catch (e) {
      console.warn("Firestore direct query failed:", e);
      return [];
    }
  }
}

/**
 * Get a single journal document by ID
 */
export async function getJournalById(id) {
  if (!db || !id) return null;
  try {
    const ref = doc(db, "journals", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.warn("getJournalById error:", err);
    return null;
  }
}

/**
 * Save journal directly to Firestore root "journals" collection with attachments array, photoURL support, and streak tracking
 */
export async function saveUserJournal(userId, journalData) {
  if (!db) throw new Error("Firestore database is not initialized");
  const uid = userId || auth?.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const now = new Date().toISOString();
  const attachmentsList = Array.isArray(journalData.attachments)
    ? journalData.attachments
    : journalData.photoURL
    ? [journalData.photoURL]
    : [];

  const docPayload = {
    ...journalData,
    userId: uid,
    title: journalData.title || "Untitled Reflection",
    content: journalData.content || "",
    mood: typeof journalData.mood !== "undefined" ? journalData.mood : null,
    attachments: attachmentsList,
    createdAt: journalData.createdAt || now,
    updatedAt: now,
    date: journalData.date || now,
    metadata: journalData.metadata || { privacy: "sensitive", source: "journal-agent" },
    photoURL: journalData.photoURL || attachmentsList[0] || null,
  };

  const docRef = await addDoc(collection(db, "journals"), docPayload);

  // Update streak and lastEntryDate in Firestore user_settings
  try {
    const settings = await getUserSettings(uid);
    const timezone = settings?.timezone || "UTC";
    let todayStr;
    try {
      todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch {
      todayStr = new Date().toISOString().split("T")[0];
    }

    const currentStreak = typeof settings?.streak === "number" ? settings.streak : 0;
    const lastEntryDate = settings?.lastEntryDate;

    let newStreak = 1;
    if (lastEntryDate) {
      const todayDate = new Date(todayStr + "T00:00:00Z");
      const yesterday = new Date(todayDate);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastEntryDate === todayStr) {
        newStreak = Math.max(1, currentStreak);
      } else if (lastEntryDate === yesterdayStr) {
        newStreak = currentStreak + 1;
      } else {
        // Gap detected: reset streak to 1
        newStreak = 1;
      }
    }

    await saveUserSettings(uid, {
      lastEntryDate: todayStr,
      streak: newStreak,
    });
  } catch (streakErr) {
    console.warn("Streak Firestore update note:", streakErr);
  }

  return docRef.id;
}

/**
 * Update journal in Firestore with attachments array & photoURL support
 */
export async function updateUserJournal(id, data) {
  if (!db) throw new Error("Firestore database is not initialized");
  if (!id) throw new Error("Journal ID is required to update journal");
  const uid = data?.userId || auth?.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  const ref = doc(db, "journals", id);
  const now = new Date().toISOString();
  const updatePayload = {
    ...data,
    userId: uid,
    updatedAt: now,
  };
  delete updatePayload.id;
  delete updatePayload.journalId;
  await updateDoc(ref, updatePayload);
  return id;
}

/**
 * Add attachment URL to existing journal entry using arrayUnion
 */
export async function addJournalAttachment(id, downloadUrl) {
  if (!db || !id || !downloadUrl) return;
  const ref = doc(db, "journals", id);
  await updateDoc(ref, {
    attachments: arrayUnion(downloadUrl),
    photoURL: downloadUrl,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Remove attachment URL from existing journal entry using arrayRemove
 */
export async function removeJournalAttachment(id, downloadUrl) {
  if (!db || !id || !downloadUrl) return;
  const ref = doc(db, "journals", id);
  await updateDoc(ref, {
    attachments: arrayRemove(downloadUrl),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete journal from Firestore
 */
export async function deleteUserJournal(id) {
  if (!db) throw new Error("Firestore database is not initialized");
  if (!id) throw new Error("Journal ID is required to delete entry");
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");

  await deleteDoc(doc(db, "journals", id));
  return id;
}

/**
 * Fetch growth capsules belonging to the user from 'capsules' collection
 */
export async function getUserCapsules(userId, maxLimit = 50) {
  if (!db || !userId) return [];
  try {
    const q = query(
      collection(db, "capsules"),
      where("userId", "==", userId),
      limit(maxLimit)
    );
    const snapshot = await getDocs(q);
    const capsules = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    // Sort capsules by unlockDate ascending
    return capsules.sort((a, b) => {
      const dateA = new Date(a.unlockDate || 0).getTime();
      const dateB = new Date(b.unlockDate || 0).getTime();
      return dateA - dateB;
    });
  } catch (err) {
    console.warn("Firestore capsules query failed:", err);
    return [];
  }
}

/**
 * Save a new capsule to Firestore 'capsules' collection
 */
export async function saveUserCapsule(userId, capsuleData) {
  if (!db || !userId) return null;
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "capsules"), {
    ...capsuleData,
    userId,
    status: capsuleData.status || "locked",
    createdAt: now,
  });
  return ref.id;
}

/**
 * Update a capsule in Firestore 'capsules' collection
 */
export async function updateUserCapsule(capsuleId, data) {
  if (!db || !capsuleId) return;
  const ref = doc(db, "capsules", capsuleId);
  const now = new Date().toISOString();
  await updateDoc(ref, {
    ...data,
    updatedAt: now,
  });
}

/**
 * Fetch user settings with local state caching for ultra-fast page transitions
 */
export async function getUserSettings(userId) {
  if (!userId) return null;

  // 1. Return cached settings immediately if available
  let cached = null;
  try {
    const raw = localStorage.getItem(`aura_settings_cache_${userId}`);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  if (!db) return cached;

  try {
    const ref = doc(db, "user_settings", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      try {
        localStorage.setItem(`aura_settings_cache_${userId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
    return cached;
  } catch (err) {
    console.warn("Fetch user settings error, returning cache:", err);
    return cached;
  }
}

/**
 * Save user settings to Firestore and sync local cache
 */
export async function saveUserSettings(userId, settingsData) {
  if (!userId) return false;

  // Update local cache immediately
  try {
    const currentRaw = localStorage.getItem(`aura_settings_cache_${userId}`);
    const current = currentRaw ? JSON.parse(currentRaw) : {};
    const merged = { ...current, ...settingsData };
    localStorage.setItem(`aura_settings_cache_${userId}`, JSON.stringify(merged));
  } catch {}

  if (!db) return true;

  try {
    const ref = doc(db, "user_settings", userId);
    const now = new Date().toISOString();
    await setDoc(
      ref,
      {
        ...settingsData,
        userId,
        updatedAt: now,
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn("Save user settings error:", err);
    return false;
  }
}

/**
 * Pull all user data (journals, capsules, settings) for secure export
 */
export async function exportUserData(userId) {
  if (!userId) return null;
  const journals = await getUserJournals(userId, 500);
  const capsules = await getUserCapsules(userId, 100);
  const settings = await getUserSettings(userId);

  return {
    userId,
    exportedAt: new Date().toISOString(),
    totalJournals: journals.length,
    journals: journals.map((j) => ({
      title: j.title || "Untitled",
      content: j.content || "",
      mood: j.mood || j.moodVal || null,
      date: j.date || j.createdAt || null,
      photoURL: j.photoURL || null,
      attachments: j.attachments || (j.photoURL ? [j.photoURL] : []),
      audioUrl: j.audioUrl || null,
    })),
    capsules,
    settings,
  };
}

export default {
  ensureUserSettings,
  getUserJournals,
  getJournalById,
  saveUserJournal,
  updateUserJournal,
  addJournalAttachment,
  removeJournalAttachment,
  deleteUserJournal,
  getUserCapsules,
  saveUserCapsule,
  updateUserCapsule,
  getUserSettings,
  saveUserSettings,
  exportUserData,
};
