const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try loading from serviceAccountKey.json first, then fall back to .env variables
const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let credential;

if (fs.existsSync(keyPath)) {
  const serviceAccount = require(keyPath);
  credential = admin.credential.cert(serviceAccount);
} else {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  });
}

admin.initializeApp({ credential });

const db = admin.firestore();

module.exports = { admin, db };
