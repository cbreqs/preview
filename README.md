# preview.reqs.tech

Client sites in progress, published early so clients can look at them. Same
shape as the [apps](https://github.com/cbreqs/apps) repo: static HTML on GitHub
Pages, one folder per client, no build step.

```
CNAME              preview.reqs.tech
index.html         landing page listing the client sites
assets/            shared stylesheet, theme toggle, Firebase setup
cnkc/              index, calendar, documents, contact
rubi/              index
```

Open any `.html` file directly in a browser to work on it. Paths are relative,
so the site also works at `cbreqs.github.io/preview/` before DNS resolves.

## Hosting

GitHub Pages, from `main` at the repo root. The `CNAME` file sets the custom
domain; DNS is a CNAME from `preview.reqs.tech` to `cbreqs.github.io`, exactly
like `apps.reqs.tech`.

## The calendar and documents

`/cnkc/calendar.html` and `/cnkc/documents.html` read from Firestore in the
browser using the CDN SDK — no build, no server. Data lives in the **`clients`**
database in the `reqs-tech` Firebase project, kept separate from the
`flexagenda` database that flexAgenda and leafatip share.

Collections:

```
sites/cnkc/public/calendar/events/{id}   title, start, allDay, location, note
sites/cnkc/public/library/files/{id}     name, note, url, kind, size
```

`start` is a Firestore timestamp; the calendar shows only future events, so
past ones drop off on their own. A file with no `url` is skipped.

Rules live in `firestore.rules` and cover the `clients` database only —
`firebase.json` scopes them with `"database": "clients"`, so a deploy from here
cannot touch leafatip's. Anything under `sites/{siteId}/public/` is
world-readable; everything else is denied to the browser entirely. Writes go
through the Admin SDK, never from these pages.

To publish rules changes:

```
firebase deploy --only firestore --project reqs-tech
```

## Firebase App Hosting

Backend `preview` in `us-central1` still exists and serves an earlier Next.js
version of this site at `preview--reqs-tech.us-central1.hosted.app`. It is not
used and nothing here deploys to it — `firebase.json` has no `apphosting`
block on purpose. Delete the backend in the console when you're sure it isn't
wanted; the old code is in this repo's git history.
