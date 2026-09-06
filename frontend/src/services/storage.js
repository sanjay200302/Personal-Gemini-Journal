import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

// Helper to convert image file to optimized Base64 Data URL (max 1200px width/height, compressed)
function fileToOptimizedDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG/WebP for ultra-compact storage
        const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(optimizedDataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => {
      // Fallback
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => resolve(fallbackReader.result);
      fallbackReader.onerror = () => resolve("");
      fallbackReader.readAsDataURL(file);
    };
    reader.readAsDataURL(file);
  });
}

function fileToOptimizedBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed"))),
          "image/jpeg",
          0.82
        );
      };
      image.onerror = () => reject(new Error("Image could not be decoded"));
      image.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Image could not be read"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a photo for a journal entry to Firebase Storage under journals/${userId}/${file.name}
 * Falls back seamlessly to optimized Data URL if Storage bucket is not available.
 * @param {File} file - Image file object
 * @param {string} userId - User UID
 * @returns {Promise<string>} - Download URL or Data URL
 */
export async function uploadJournalPhoto(file, userId) {
  if (!file) throw new Error("No file provided for upload");

  // 1. Try Firebase Storage
  if (storage && userId) {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const optimizedFile = await fileToOptimizedBlob(file);
      const storageRef = ref(
        storage,
        `journals/${userId}/${timestamp}_${safeName}`
      );
      const snapshot = await uploadBytes(storageRef, optimizedFile, {
        contentType: "image/jpeg",
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn("Firebase Storage upload note, falling back to local image data:", err.message);
    }
  }

  // 2. Seamless Optimized Data URL fallback
  return await fileToOptimizedDataUrl(file);
}

/**
 * Delete a photo from Firebase Storage given its download URL
 * @param {string} photoURL - Download URL of the photo
 */
export async function deleteJournalPhoto(photoURL) {
  if (!storage || !photoURL || !photoURL.startsWith("http")) return;
  try {
    const storageRef = ref(storage, photoURL);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("deleteJournalPhoto note:", err.message);
  }
}

export default {
  uploadJournalPhoto,
  deleteJournalPhoto,
};
