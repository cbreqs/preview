/* Firebase for the static client sites.
   Read-only access to the `clients` Firestore database from the browser. The
   config below is public by design — security comes from firestore.rules,
   which allow reads only under sites/{siteId}/public/ and deny everything
   else. Writes never happen here. */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

const firebaseConfig = {
  projectId: 'reqs-tech',
  appId: '1:416777413798:web:2bb71a41191a9593af0067',
  apiKey: 'AIzaSyAdIKiCeoh-yjYXHsbhUvgm1aRvAbMo6Gs',
  authDomain: 'reqs-tech.firebaseapp.com',
  storageBucket: 'reqs-tech.firebasestorage.app',
  measurementId: 'G-6ZGJ5CTF04',
  messagingSenderId: '416777413798',
};

const app = initializeApp(firebaseConfig);

// Named database — `clients`, not the `flexagenda` one that flexAgenda and
// leafatip share. There is no "(default)" database in this project.
export const db = getFirestore(app, 'clients');

/** Firestore Timestamps and plain ISO strings both turn into a Date here. */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
