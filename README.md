# preview

A reqs.tech app. Next.js App Router + TypeScript + Tailwind + shadcn/ui (Radix),
with the shared Firebase client wiring under `src/firebase/`.

## Develop

```
npm run dev        # http://localhost:9004
npm run typecheck
npm run lint
```

Ports across the family: flexAgenda 9002, leafatip 9003, this 9004.

## Deploy

Firebase App Hosting, against the shared `reqs-tech` project:

```
npx firebase-tools@latest deploy --only apphosting --project reqs-tech
```

Backend `preview` in `us-central1`, runtime `nodejs24` with automatic base
image updates on, serving at
**https://preview--reqs-tech.us-central1.hosted.app**. It deploys from this
local folder — no GitHub repo is connected to the backend, same as leafatip.

## Firebase notes

- `src/firebase/config.ts` holds the **public** web config for the shared
  `reqs-tech` project. Public by design; security lives in Firestore rules.
- It points at the `preview_1` web app, which is the one the backend is bound
  to. A second, unlinked web app named `preview` also exists — ignore it.
- Firestore is the **named** `flexagenda` database, not `(default)` — that one
  doesn't exist in this project. The database is shared with flexAgenda and
  leafatip, so namespace any collections this app adds.
- **This project deliberately has no `firestore` block in `firebase.json`.**
  Leafatip owns `firestore.rules` and `firestore.indexes.json` for the shared
  database. Adding them here would let a `firebase deploy --only firestore`
  from this directory overwrite leafatip's live security rules.
- Auth is shared too. Never delete an Auth user to fix something here.
