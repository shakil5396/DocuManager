const AUTH_USER_KEY = 'documentVaultUser';

function clearAuth() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem('documentVaultLoggedIn');
  localStorage.removeItem('documentVaultUserName');
}

function firebaseConfigError() {
  return window.firebaseConfigError || 'Firebase is not configured. Please add your Firebase Web App config.';
}

async function getCurrentFirebaseUser() {
  await window.firebaseReady;
  return new Promise((resolve) => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user || null);
    });
  });
}

async function getUserProfile(user) {
  if (!user) return null;
  const snap = await firebaseDb.collection('users').doc(user.uid).get();
  if (snap.exists) return { id: snap.id, ...snap.data() };

  const profile = {
    name: user.displayName || (user.email || 'User').split('@')[0],
    email: user.email || '',
    role: 'user',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await firebaseDb.collection('users').doc(user.uid).set(profile, { merge: true });
  return { id: user.uid, ...profile };
}

async function requireAuth() {
  try {
    const user = await getCurrentFirebaseUser();
    if (!user) {
      location.replace('index.html');
      return null;
    }
    const profile = await getUserProfile(user);
    return { user, profile };
  } catch (error) {
    console.error(error);
    alert(error.message || firebaseConfigError());
    return null;
  }
}

async function logout() {
  try {
    await window.firebaseReady;
    await firebaseAuth.signOut();
  } catch (error) {
    console.error(error);
  } finally {
    clearAuth();
    location.href = 'index.html';
  }
}

function authErrorMessage(error) {
  const code = error && error.code ? error.code : '';
  const messages = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
    'auth/user-not-found': 'No account was found with this email.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.'
  };
  return messages[code] || (error && error.message) || 'Authentication failed.';
}
