// Client site data lives in its own named database, separate from the
// `flexagenda` database that flexAgenda and leafatip share. This repo owns
// its rules and indexes; leafatip owns flexagenda's. Neither can deploy over
// the other. (There is no "(default)" database in this project.)
export const FIRESTORE_DATABASE_ID = 'clients';

// Shared Firebase project across reqs.tech apps. This config is public by
// design (security comes from Firestore rules, not from hiding this).
//
// This is the `preview_1` web app, which is the one the App Hosting backend
// `preview` is bound to — see `firebase apphosting:backends:get preview`.
// There is a second, unlinked web app also called `preview`; don't use it.
export const firebaseConfig = {
  projectId: 'reqs-tech',
  appId: '1:416777413798:web:2bb71a41191a9593af0067',
  apiKey: 'AIzaSyAdIKiCeoh-yjYXHsbhUvgm1aRvAbMo6Gs',
  authDomain: 'reqs-tech.firebaseapp.com',
  storageBucket: 'reqs-tech.firebasestorage.app',
  measurementId: 'G-6ZGJ5CTF04',
  messagingSenderId: '416777413798',
};
