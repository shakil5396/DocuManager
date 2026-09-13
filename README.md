# DocuManager — Firebase Edition

Document Vault converted from Express/SQLite to Firebase.

## What is now Firebase-backed?

- Firebase Authentication — email/password login and registration
- Cloud Firestore — user profiles and document metadata
- Cloud Storage for Firebase — uploaded files (up to 100 MB per file)
- Firebase Security Rules — users can only access their own data/files
- No Node.js/Express/SQLite backend is required

## 1. Create Firebase project

Create a Firebase project and register a Web App.

Enable:

1. Authentication → Sign-in method → Email/Password
2. Firestore Database
3. Storage

Cloud Storage for Firebase currently requires the Blaze pay-as-you-go plan. No-cost usage is still available on Blaze within the applicable quotas.

## 2. Add your Web App config

Open:

`js/firebase-config.js`

Replace the `YOUR_...` values with the Firebase Web App configuration from:

Firebase Console → Project settings → Your apps → Web app

Do not paste a service-account private key into this file.

## 3. Deploy security rules

If using Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```

When prompted by `firebase use --add`, select your Firebase project. You can also copy `.firebaserc.example` to `.firebaserc` and replace `YOUR_PROJECT_ID`.

## 4. Authorize your website domain

Firebase Console → Authentication → Settings → Authorized domains.

Add the hostname where this site is hosted, for example:

`shakil5396.github.io`

Also keep/add `localhost` if you test locally.

## 5. Run locally

This is a static Firebase web app, so you can use any static server. Do not open the HTML with `file://`.

For example with VS Code Live Server, open `index.html` through the local server.

## 6. GitHub Pages

You can publish the files as a static site. The app talks directly to Firebase, so there is no `/api/...` backend call anymore.

Important: Firebase client configuration values are not service-account secrets. Protect the data with Firestore and Storage Security Rules.

## Data structure

Firestore collections:

- `users/{uid}`
- `documents/{documentId}`

Storage paths:

- `users/{uid}/documents/{documentId}/{fileName}`
