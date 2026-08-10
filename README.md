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

You need to create the App Hosting backend once before the first deploy — this
repo has `apphosting.yaml` and `.firebaserc` but no backend exists yet.

## Firebase notes

- `src/firebase/config.ts` holds the **public** web config for the shared
  `reqs-tech` project. Public by design; security lives in Firestore rules.
- The `appId` in there is still leafatip's. Register a Web App for this project
  in the console and swap it in, or analytics will land under leafatip.
- Firestore is the **named** `flexagenda` database, not `(default)` — that one
  doesn't exist in this project. The database is shared with flexAgenda and
  leafatip, so namespace any collections this app adds.
- Auth is shared too. Never delete an Auth user to fix something here.
