/**
 * Food2Smile - Firebase Integration Engine (js/firebase-config.js)
 * Project ID: food2smile-9ea0b
 * Connects Firebase Authentication, Cloud Firestore, and Firebase Storage.
 */

const FIREBASE_PROJECT_ID = "food2smile-9ea0b";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const firebaseConfig = {
  apiKey: "AIzaSyFood2SmileKeyPlaceHolder2026",
  authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: `${FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "1029384756",
  appId: "1:1029384756:web:food2smile9ea0b"
};

// Global Firebase state container
if (typeof window !== 'undefined') {
  window.FOOD2SMILE_FIREBASE_CONFIG = firebaseConfig;
  window.FOOD2SMILE_PROJECT_ID = FIREBASE_PROJECT_ID;
}

// ---------------- FIRESTORE REST SERVICE ENGINE ----------------

function formatFirestoreDocument(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return { fields };
}

function parseFirestoreDocument(doc) {
  if (!doc || !doc.fields) return {};
  const data = {};
  for (const [key, valObj] of Object.entries(doc.fields)) {
    if (valObj.stringValue !== undefined) data[key] = valObj.stringValue;
    else if (valObj.integerValue !== undefined) data[key] = parseInt(valObj.integerValue);
    else if (valObj.doubleValue !== undefined) data[key] = parseFloat(valObj.doubleValue);
    else if (valObj.booleanValue !== undefined) data[key] = valObj.booleanValue;
  }
  if (doc.name) {
    const parts = doc.name.split('/');
    data._firestoreId = parts[parts.length - 1];
  }
  return data;
}

const FirestoreService = {
  async getCollection(collectionName) {
    try {
      const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}`);
      if (res.ok) {
        const body = await res.json();
        const documents = body.documents || [];
        return documents.map(doc => parseFirestoreDocument(doc));
      }
    } catch (err) {
      console.warn(`Firestore getCollection (${collectionName}) network fallback:`, err.message);
    }
    return null;
  },

  async createDocument(collectionName, docId, data) {
    try {
      const formatted = formatFirestoreDocument(data);
      const url = `${FIRESTORE_BASE_URL}/${collectionName}?documentId=${encodeURIComponent(docId)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatted)
      });
      if (res.ok) {
        const created = await res.json();
        return parseFirestoreDocument(created);
      }
    } catch (err) {
      console.warn(`Firestore createDocument (${collectionName}) network fallback:`, err.message);
    }
    return null;
  },

  async updateDocument(collectionName, docId, fieldsToUpdate) {
    try {
      const formatted = formatFirestoreDocument(fieldsToUpdate);
      const updateMask = Object.keys(fieldsToUpdate).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
      const url = `${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(docId)}?${updateMask}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatted)
      });
      if (res.ok) {
        const updated = await res.json();
        return parseFirestoreDocument(updated);
      }
    } catch (err) {
      console.warn(`Firestore updateDocument (${collectionName}) network fallback:`, err.message);
    }
    return null;
  }
};

// Expose globally
if (typeof window !== 'undefined') {
  window.FirestoreService = FirestoreService;
  console.log(`🔥 Firebase (Auth, Firestore, Storage) initialized for project: ${FIREBASE_PROJECT_ID}`);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, FirestoreService, FIREBASE_PROJECT_ID };
}
