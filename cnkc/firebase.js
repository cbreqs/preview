/* CNKC's own Firebase project.

   Everything for this client lives in `cannabis-network-kc` — its own users,
   its own Firestore, its own Storage bucket, its own billing line. Nothing is
   shared with reqs-tech, flexAgenda, leafatip or any other client site, so an
   account created for one of those cannot sign in here.

   Unlike the old shared setup this uses the project's DEFAULT Firestore
   database rather than a named one. That isn't cosmetic: Storage rules can
   only reach the default database via firestore.get(), so using it is what
   lets storage.rules check the same editors list Firestore does instead of
   trusting any signed-in account.

   The values below are public by design. Security comes from the rules. */

import { initSite, toDate } from '../assets/firebase.js';

const firebaseConfig = {
  projectId: 'cannabis-network-kc',
  appId: '1:780263984801:web:8950956df9bf16c3326ae0',
  apiKey: 'AIzaSyAbDb4gtOaftHL8lXirsHg8vcuDTqahMCQ',
  authDomain: 'cannabis-network-kc.firebaseapp.com',
  storageBucket: 'cannabis-network-kc.firebasestorage.app',
  messagingSenderId: '780263984801',
};

export const { app, db } = initSite(firebaseConfig);
export { toDate };

/** This site's id inside its own project. The sites/{siteId}/ layout is kept
    even though this project serves one client — it keeps the rules, the
    admin page and scripts/add-editor.py identical across clients, so the next
    site is a copy rather than a rewrite. */
export const SITE_ID = 'cnkc';
