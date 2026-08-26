/* This client's own Firebase project.

   Everything for this client lives in its own project — its own users, its
   own Firestore, its own Storage bucket, its own billing line. Nothing is
   shared with any other client or any other product, so an account created
   for one site cannot sign in to this one.

   Uses the project's DEFAULT Firestore database, not a named one. That isn't
   cosmetic: Storage rules can only reach the default database via
   firestore.get(), so using it is what lets storage.rules check the same
   editors list Firestore does instead of trusting any signed-in account.

   The values below are public by design once filled in — see the README
   ("the API key is meant to be public"). Security comes from the rules. */

import { initSite, toDate } from './core/firebase.js';

const firebaseConfig = {
  projectId: 'wands-ledgers-flexagenda',
  appId: '1:921644997381:web:fc816bf1e6916f9245f56c',
  apiKey: 'AIzaSyCptNy48EcQkT5UdP-oSSGdd-oSZq7U_ZU',
  authDomain: 'wands-ledgers-flexagenda.firebaseapp.com',
  storageBucket: 'wands-ledgers-flexagenda.firebasestorage.app',
  messagingSenderId: '921644997381',
};

export const { app, db } = initSite(firebaseConfig);
export { toDate };

/** This site's id inside its own project. The sites/{siteId}/ layout is kept
    even though this project serves one client — it keeps the rules, the
    admin page and scripts/add-editor.py identical across clients, so the
    next site is a copy rather than a rewrite. */
export const SITE_ID = 'wands-and-ledgers';
