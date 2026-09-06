const firestore = require("../config/firestore");
const admin = require("../config/firebase");

/**
 * Create a new journal entry in Firestore with attachments array & photoURL support
 */
async function createJournal(userId, { title, content, mood, date, photoURL, attachments, metadata }) {
  if (!userId) {
    throw new Error("Missing userId for creating journal entry");
  }

  const ref = firestore.collection("journals").doc();
  const now = new Date().toISOString();

  const attachmentsList = Array.isArray(attachments)
    ? attachments
    : photoURL
    ? [photoURL]
    : [];

  const journalData = {
    userId,
    title: title || "Untitled Reflection",
    content: content || "",
    mood: typeof mood !== "undefined" ? mood : null,
    date: date || now,
    createdAt: now,
    updatedAt: now,
    metadata: metadata || { privacy: "sensitive", source: "journal-agent" },
    photoURL: photoURL || attachmentsList[0] || null,
    attachments: attachmentsList,
  };

  await ref.set(journalData);
  return { journalId: ref.id, id: ref.id, status: "created", ...journalData };
}

/**
 * Retrieve all journal entries for a given user, ordered by createdAt descending
 */
async function getJournals(userId) {
  if (!userId) return [];

  try {
    const snapshot = await firestore
      .collection("journals")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      journalId: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.warn("Firestore sorted getJournals fallback:", err.message);
    try {
      const snapshot = await firestore
        .collection("journals")
        .where("userId", "==", userId)
        .get();

      if (snapshot.empty) {
        return [];
      }

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        journalId: doc.id,
        ...doc.data(),
      }));

      return list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date || 0).getTime();
        const timeB = new Date(b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      });
    } catch (fallbackErr) {
      console.error("Firestore getJournals query failed:", fallbackErr.message);
      return [];
    }
  }
}

/**
 * Retrieve a single journal entry by ID
 */
async function getJournalById(userId, id) {
  if (!id) return null;
  const ref = firestore.collection("journals").doc(id);
  const doc = await ref.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (data.userId && data.userId !== userId) {
    throw new Error("Unauthorized access to journal entry");
  }

  return { id: doc.id, journalId: doc.id, ...data };
}

/**
 * Update an existing journal entry in Firestore with attachments array & photoURL support
 */
async function updateJournal(userId, id, { title, content, mood, date, photoURL, attachments, metadata }) {
  if (!id) {
    throw new Error("Missing journal entry ID");
  }

  const ref = firestore.collection("journals").doc(id);
  const doc = await ref.get();

  if (!doc.exists) {
    return { error: "Journal not found", status: "not_found" };
  }

  const existing = doc.data();
  if (existing.userId && existing.userId !== userId) {
    throw new Error("Unauthorized to update this journal");
  }

  const updateData = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof title !== "undefined") updateData.title = title;
  if (typeof content !== "undefined") updateData.content = content;
  if (typeof mood !== "undefined") updateData.mood = mood;
  if (typeof date !== "undefined") updateData.date = date;
  if (typeof photoURL !== "undefined") updateData.photoURL = photoURL;
  if (typeof attachments !== "undefined") {
    updateData.attachments = attachments;
    if (!updateData.photoURL && Array.isArray(attachments) && attachments.length > 0) {
      updateData.photoURL = attachments[0];
    }
  }
  if (typeof metadata !== "undefined") updateData.metadata = metadata;

  await ref.update(updateData);
  return { journalId: id, id, status: "updated", ...existing, ...updateData };
}

/**
 * Delete a journal entry from Firestore and remove associated photos from Firebase Storage
 */
async function deleteJournal(userId, id) {
  if (!id) {
    throw new Error("Missing journal entry ID");
  }

  console.log(`[journalService.deleteJournal] Deleting journal document id: ${id} for userId: ${userId}`);
  const ref = firestore.collection("journals").doc(id);
  const doc = await ref.get();

  if (doc.exists) {
    const data = doc.data();
    if (data.userId !== userId) {
      console.warn(`[journalService.deleteJournal] Unauthorized delete attempt by user ${userId} on journal owned by ${data.userId}`);
      throw new Error("Unauthorized to delete this journal");
    }

    // Collect all photo URLs to delete
    const urlsToDelete = new Set();
    if (data.photoURL && typeof data.photoURL === "string") {
      urlsToDelete.add(data.photoURL);
    }
    if (Array.isArray(data.attachments)) {
      data.attachments.forEach((u) => {
        if (typeof u === "string") urlsToDelete.add(u);
      });
    }

    if (urlsToDelete.size > 0) {
      try {
        const bucket = admin.storage().bucket();
        for (const url of urlsToDelete) {
          try {
            let filePath = null;
            if (url.includes("/o/")) {
              const match = url.match(/\/o\/([^?]+)/);
              if (match && match[1]) {
                filePath = decodeURIComponent(match[1]);
              }
            } else if (url.includes(bucket.name)) {
              filePath = url.split(`${bucket.name}/`)[1]?.split("?")[0];
            }

            if (filePath) {
              const file = bucket.file(filePath);
              const [exists] = await file.exists();
              if (exists) {
                await file.delete();
              }
            }
          } catch (fileErr) {
            console.warn(`File deletion note for ${url}:`, fileErr.message);
          }
        }
      } catch (storageErr) {
        console.warn("Storage photo deletion note:", storageErr.message);
      }
    }

    await ref.delete();
    const deletedDoc = await ref.get();
    if (deletedDoc.exists) {
      throw new Error("Journal document still exists after delete");
    }
    console.log(`[journalService.deleteJournal] Document ${id} successfully deleted from Firestore`);
  } else {
    console.log(`[journalService.deleteJournal] Document ${id} not found or already deleted`);
  }

  return { journalId: id, id, status: "deleted", success: true };
}

/**
 * Upload an audio recording to Firebase Storage
 */
async function uploadAudio(userId, fileBuffer, fileName) {
  try {
    const bucket = admin.storage().bucket();
    const safeName = fileName
      ? fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
      : `audio_${Date.now()}.mp3`;

    const file = bucket.file(`journal-audio/${userId}/${safeName}`);
    await file.save(Buffer.from(fileBuffer, "base64"), {
      contentType: "audio/mpeg",
      metadata: { metadata: { userId } },
    });

    const audioUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    return { audioUrl, fileName: safeName, status: "uploaded" };
  } catch (err) {
    console.warn("Storage audio upload fallback:", err.message);
    return {
      audioUrl: "",
      status: "fallback",
      error: err.message,
    };
  }
}

module.exports = {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  uploadAudio,
};
