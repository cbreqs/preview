// The shared Firestore database across reqs.tech apps is a named database
// (not "(default)", which doesn't exist in this project) — see firebase.json.
export const FIRESTORE_DATABASE_ID = 'flexagenda';

// Shared Firebase project across reqs.tech apps. This config is public by
// design (security comes from Firestore rules, not from hiding this).
//
// NOTE: `appId` below is still leafatip's. Register a Web App for this project
// in the Firebase console and swap in its own appId/measurementId, otherwise
// this app's analytics land under leafatip's.
export const firebaseConfig = {
  projectId: 'reqs-tech',
  appId: '1:416777413798:web:aa4916a687e4cfc7af0067',
  apiKey: 'AIzaSyAdIKiCeoh-yjYXHsbhUvgm1aRvAbMo6Gs',
  authDomain: 'reqs-tech.firebaseapp.com',
  storageBucket: 'reqs-tech.firebasestorage.app',
  measurementId: 'G-P1TR540WCS',
  messagingSenderId: '416777413798',
};
