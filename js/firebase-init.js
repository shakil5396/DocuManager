(function () {
  "use strict";

  const config = window.FIREBASE_CONFIG || {};
  const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  const missing = required.filter((key) => !config[key] || String(config[key]).startsWith("YOUR_"));

  if (missing.length) {
    window.firebaseConfigured = false;
    window.firebaseConfigError = "Firebase is not configured yet. Open js/firebase-config.js and paste your Firebase Web App config.";
    window.firebaseReady = Promise.reject(new Error(window.firebaseConfigError));
    console.error(window.firebaseConfigError);
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(config);
    window.firebaseConfigured = true;
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
    window.firebaseStorage = firebase.storage();

    window.firebaseReady = Promise.resolve({
      auth: window.firebaseAuth,
      db: window.firebaseDb,
      storage: window.firebaseStorage
    });
  } catch (error) {
    window.firebaseConfigured = false;
    window.firebaseConfigError = error.message || "Firebase initialization failed.";
    window.firebaseReady = Promise.reject(error);
    console.error(error);
  }
})();
