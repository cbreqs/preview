/* Shared Firebase helper for every client deployment.

   Deliberately holds NO project config. Each client lives in its own Firebase
   project and keeps its own config next to its pages — see
   clients/template/firebase.js. That way one client's users, data, storage
   and billing are fully separate from another's, and handing a site over
   means handing over a project rather than untangling it from everyone
   else's.

   This is a hard rule for FlexAgenda specifically: an earlier version shared
   one `flexagenda` database in the `reqs-tech` project across clients (and,
   at one point, with an unrelated product). Never repeat that — one project
   per client, always.

   Auth and Storage are not imported here on purpose: a static import would
   make every public page download them, and the public pages only read
   Firestore. Pages that need them (the admin, the booking wizard once it
   writes) import them from the CDN themselves, attaching to the `app`
   returned below. */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

/** Wire up one client's Firebase project. Returns its app and Firestore handle.

    The config is public by design — security comes from the rules, which
    allow reads only under sites/{siteId}/public/ and writes only to a
    signed-in uid listed as an editor of that site. */
export function initSite(config) {
  const app = initializeApp(config);
  return { app, db: getFirestore(app) };
}

/** Firestore Timestamps and plain ISO strings both turn into a Date here. */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
