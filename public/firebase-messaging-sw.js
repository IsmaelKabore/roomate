// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Must match your firebaseConfig (apiKey, authDomain, etc.)
firebase.initializeApp({
  apiKey:    'YOUR_API_KEY',
  authDomain:'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket:'YOUR_STORAGE_BUCKET',
  messagingSenderId:'YOUR_MESSAGING_SENDER_ID',
  appId:     'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Show a notification when a background message arrives
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'New Message', {
    body: body || '',
  });
});
