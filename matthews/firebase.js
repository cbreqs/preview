/* Matthews Outdoor Services: Firebase wiring.
   Exposes window.MOS for app.js. Auth is email-link (no passwords).
   The web config below is public by design; Firestore security rules protect the data. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7gxywV0eaR9Y6m_w6Ekcuboiv9BwNtjg",
  authDomain: "matthews-outdoor-services.firebaseapp.com",
  projectId: "matthews-outdoor-services",
  storageBucket: "matthews-outdoor-services.firebasestorage.app",
  messagingSenderId: "493927775759",
  appId: "1:493927775759:web:0d9ab6fce56966d7882d7a",
  measurementId: "G-CBYJ0H4J0T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const EMAIL_KEY = 'mosEmail';

function clean(obj) {
  const out = {};
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v) && !v.length) return;
    out[k] = v;
  });
  return out;
}

window.MOS = {
  async saveRequest(data) {
    const u = auth.currentUser;
    const doc = clean(Object.assign({}, data, {
      status: 'new',
      uid: u ? u.uid : undefined,
      createdAt: serverTimestamp()
    }));
    if (doc.contact && doc.contact.indexOf('@') > -1) doc.contact = doc.contact.trim().toLowerCase();
    const ref = await addDoc(collection(db, 'requests'), doc);
    return ref.id;
  },

  async sendLink(email) {
    const url = location.href.split('#')[0].split('?')[0];
    await sendSignInLinkToEmail(auth, email, { url: url, handleCodeInApp: true });
    try { localStorage.setItem(EMAIL_KEY, email); } catch (e) {}
  },

  async myRequests() {
    const u = auth.currentUser;
    if (!u) return [];
    const col = collection(db, 'requests');
    const [a, b] = await Promise.all([
      getDocs(query(col, where('uid', '==', u.uid))),
      getDocs(query(col, where('contact', '==', (u.email || '').toLowerCase())))
    ]);
    const seen = {}, rows = [];
    [a, b].forEach(snap => snap.forEach(d => {
      if (seen[d.id]) return;
      seen[d.id] = 1;
      const x = d.data();
      x.id = d.id;
      x.when = x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : Date.now();
      rows.push(x);
    }));
    rows.sort((p, q) => q.when - p.when);
    return rows;
  },

  async allRequests() {
    const snap = await getDocs(query(collection(db, 'requests'), orderBy('createdAt', 'desc')));
    const rows = [];
    snap.forEach(d => {
      const x = d.data(); x.id = d.id;
      x.when = x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : Date.now();
      rows.push(x);
    });
    return rows;
  },
  updateRequest(id, patch) { return updateDoc(doc(db, 'requests', id), patch); },

  user() { return auth.currentUser; },
  signOut() { return signOut(auth); },
  onUser(cb) { return onAuthStateChanged(auth, cb); }
};

/* finish sign-in when the person lands here from the emailed link */
(async function finishLink() {
  if (!isSignInWithEmailLink(auth, location.href)) return;
  let email = null;
  try { email = localStorage.getItem(EMAIL_KEY); } catch (e) {}
  if (!email) email = window.prompt('To finish signing in, type the email you used:');
  if (!email) return;
  try {
    await signInWithEmailLink(auth, email, location.href);
    try { localStorage.removeItem(EMAIL_KEY); } catch (e) {}
    history.replaceState(null, '', location.pathname + (document.getElementById('portal') ? '#portal' : ''));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('mos-auth-error'));
  }
})();

window.dispatchEvent(new Event('mos-ready'));
