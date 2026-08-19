# preview.reqs.tech

Client sites in progress, published early so clients can look at them. Same
shape as the [apps](https://github.com/cbreqs/apps) repo: static HTML on GitHub
Pages, one folder per client, no build step.

```
CNAME              preview.reqs.tech
index.html         landing page listing the client sites
assets/            shared stylesheet, admin styles, theme toggle, Firebase setup
cnkc/              cnkc.css + index, about, calendar, gallery, memberships,
                   members, contact, documents, admin
rubi/              index
```

## CNKC branding

`cnkc/cnkc.css` loads after `assets/site.css` and redefines its tokens — black
ground, white type, Poppins — so the CNKC pages match the client's Wix site
while `rubi/` and the preview index keep the reqs.tech palette. Nothing in the
shared stylesheet is CNKC-specific.

Two deliberate substitutions: her headings use **arp-display**, which is
licensed to Wix, so Poppins stands in as the closest free geometric. And the
green (`--accent: #8DC63F`) is invented — her site has no accent colour at all,
photography carries it. Change that one variable to reskin every page.

`documents.html` is kept but is no longer in the nav, because the Wix site has
no equivalent page and the nav mirrors hers.

## Accessibility

CNKC's members skew older, so these pages are deliberately set larger than a
default marketing site and audited rather than assumed. Every text/background
pair on every page clears **WCAG AA in both themes** (measured with alpha
composited against the real backdrop, not the nominal token), and every
non-inline control is at least 44px tall.

Two rules the type follows, both aimed at older eyes:

1. **No body copy below 16px, and none at weight 300.** Thin white text on a
   black ground blooms badly with any astigmatism. Body copy is weight 400 up.
2. **Small uppercase labels get more size and less letter-spacing.** Wide
   tracking on tiny text hurts legibility more than it helps.

Also in place: a skip link on every page, labelled `<nav>` landmarks (three
navs would otherwise all announce as "navigation"), one `<h1>` per page with no
skipped heading levels, a visible focus ring on every interactive element
(`site.css` defines none), `.visually-hidden` labels for inputs whose label the
design doesn't show, and 16px form inputs so iOS Safari doesn't zoom on focus.

Re-run the audit any time by loading a page from the preview server and pasting
the checker in the browser console — it walks every text node, composites alpha
against the nearest opaque ancestor, and reports failures per theme.

## Jotform

`contact.html` embeds the live **"Send us a message!"** form
(`261575349126159`) from the ReqsTech Jotform account.

`memberships.html` has a slot for her membership application, but it is **not
connected yet** — set `JOTFORM_ID` in the inline script at the bottom of that
page and the embed switches on. Left empty, the page shows a fallback link to
the contact form so the "Apply now" buttons never dead-end.

**Serve the site; don't open the files directly.** Every data-driven page uses
`<script type="module">`, and ES modules can't resolve a relative import over
`file://` — the page loads but sits on "Loading…" forever with
`Failed to resolve module specifier` in the console. Run:

```
python scripts/serve.py
```

then open <http://localhost:9004/cnkc/>. That's what `.claude/launch.json`
starts, so `preview_start` handles it too. Paths are relative, so the site also
works at `cbreqs.github.io/preview/` before DNS resolves.

`scripts/serve.py` rather than `python -m http.server` because the built-in one
sends no cache headers, so browsers reuse stale CSS and — worse — stale ES
modules, which are cached by URL and survive a reload. That produces errors
describing code you already fixed. This server sends `no-store`.

If you still get a stale file, suspect a proxy between you and it rather than
the server: check whether the response carries the `Cache-Control: no-store`
header this server always sets. If that header is missing, something else
answered. Serving on a different port (`python scripts/serve.py 9007`) is a
quick way to sidestep a URL-keyed cache.

## Hosting

GitHub Pages, from `main` at the repo root. The `CNAME` file sets the custom
domain; DNS is a CNAME from `preview.reqs.tech` to `cbreqs.github.io`, exactly
like `apps.reqs.tech`.

## One Firebase project per client

Each client site owns its own Firebase project, so one client's users, data,
storage and billing are entirely separate from another's. An account made for
one site cannot sign in to another, and handing a site over means handing over
a project rather than untangling it from everyone else's.

```
cnkc/   cannabis-network-kc   (default) database   ← current
rubi/   reqs-tech             clients database     ← legacy, not yet moved
```

`assets/firebase.js` holds no project config — it exports `initSite(config)`
and `toDate`. Each site keeps its own config beside its pages
(`cnkc/firebase.js`), along with its own `firebase.json`, `.firebaserc` and
rules. Deploys run from the site folder:

```
cd cnkc && firebase deploy --only firestore,storage
```

New client sites should use the project's **default** Firestore database, not a
named one. Storage rules can only reach the default database through
`firestore.get()`, and that is what allows `storage.rules` to check the same
editors list Firestore does rather than trusting any signed-in account. The old
shared setup used a named `clients` database and could not do this.

The `sites/{siteId}/` path prefix is kept even though a project now serves one
client. It costs nothing and keeps the rules, the admin page and
`scripts/add-editor.py` identical across clients, so onboarding the next one is
a copy rather than a rewrite.

## The data-driven pages

`calendar.html`, `gallery.html`, `members.html` and `documents.html` read from
Firestore in the browser using the CDN SDK — no build, no server. Data lives in
the **`clients`** database in the `reqs-tech` Firebase project, kept separate
from the `flexagenda` database that flexAgenda and leafatip share.

Collections:

```
sites/cnkc/public/calendar/events/{id}   title, start, allDay, location, note,
                                         imageUrl, storagePath
sites/cnkc/public/gallery/photos/{id}    url, storagePath, caption, createdAt,
                                         uploadedBy, uploadedByName,
                                         eventId, eventTitle
sites/cnkc/public/members/items/{id}     name, category, blurb, link,
                                         memberSince, displayOrder, logoUrl,
                                         storagePath
sites/cnkc/public/library/files/{id}     name, note, url, kind, size
```

`start` is a Firestore timestamp; the calendar shows only future events, so past
ones drop off on their own. A file with no `url` is skipped. Members sort by
`displayOrder`, photos by `createdAt` descending.

`storagePath` is kept alongside every image URL so the admin page can delete the
underlying Storage object when the document goes — without it, deleting an event
would orphan its photo in the bucket forever.

Gallery `caption` is capped at 25 characters (`PHOTO_CAPTION_MAX` in
`admin.html`). It's a label under a thumbnail, not a description; longer ones
wrap to three lines and wreck the grid.

`uploadedByName` is a **username, never an email**. These documents are
world-readable, so an editor's address would be queryable by anyone who found
the collection. The username comes from the Firebase Auth profile's
`displayName`, set with `add-editor.py --name`, and falls back to the part
before the `@` for accounts that predate it.

## The API key in cnkc/firebase.js is meant to be public

GitHub secret scanning flags it as a "Google API Key". It is not a secret and
must not be rotated in a panic — every Firebase web app ships this value to the
browser, because it identifies the project rather than authorising anything.
Access is controlled by `firestore.rules` and `storage.rules`, which is why
those files matter and this string doesn't.

Two conditions make that true, and both hold here:

* the key is restricted to Firebase APIs only (automatic for Firebase-created
  browser keys — verify with `gcloud services api-keys describe`)
* the security rules actually restrict access, rather than being left open

The one real exposure is that anyone holding the key can call Identity
Platform's sign-up endpoint and create accounts in the project. Such an account
can't edit anything, since writes require the uid to be in the site's `editors`
list, but it's junk data and quota. So the key is also restricted by HTTP
referrer:

```
gcloud services api-keys update <key-uid> --project cannabis-network-kc \
  --allowed-referrers="https://preview.reqs.tech/*,https://cbreqs.github.io/*,\
https://cannabis-network-kc.firebaseapp.com/*,https://cannabis-network-kc.web.app/*,\
http://localhost:9004/*,http://localhost:9007/*,http://127.0.0.1:9004/*"
```

**Serving the site from a new domain means adding it to that list**, or every
Firebase call from it fails. That is the one way this bites later.

Close the GitHub alert as a false positive rather than rotating the key.

## Albums

An album **is** an event — there is no separate album collection. A photo either
carries an `eventId` or it doesn't. That one field replaces albums, tags,
album creation and publishing:

* every event is implicitly an album, created the moment a photo is filed there
* an album appears on the Gallery page only while it has photos, so nothing has
  to be published or switched on, and emptying it removes it
* photos with no `eventId` fall into "More photos" at the bottom

`eventTitle` is denormalised onto each photo, but the Gallery reads the events
collection too and prefers the **live** event name — otherwise renaming an event
would leave its album captioned with the old title. The stored copy is the
fallback for an event that has since been deleted, so an album keeps its name
rather than dumping its photos into "More photos".

## The admin page

`/cnkc/admin.html` is how the client edits the site: sign in, then add or edit
events, photos and business members. It's the only page that writes, and the
only one that loads the Auth and Storage SDKs — `assets/firebase.js`
deliberately exports `app` rather than importing those, so the public pages
don't download bundles they never use.

### Setting up an editor

One-time per project:

```
firebase login                    # deploys
gcloud auth login                 # add-editor.py
cd cnkc && firebase deploy --only firestore,storage
```

Both logins are interactive; they're separate credential stores, and the
Firebase one expires often. `add-editor.py` needs only gcloud, deliberately, so
an expired Firebase login can't take it down.

Use plain `gcloud auth login`, **not** `gcloud auth application-default login`
— ADC user credentials need a quota project configured before identitytoolkit
will accept them; an ordinary login plus a per-request `x-goog-user-project`
header does not.

If `firebase deploy` is the thing that's expired and you don't want another
login round-trip, rules can also be published straight through the Firebase
Rules REST API with a gcloud token — create a ruleset, then point the release
(`cloud.firestore`, or `firebase.storage/<bucket>`) at it.

Then per person:

1. **Firebase console → Authentication** — enable Email/Password (once), then
   **Add user**. Accounts are created by hand on purpose; there is no sign-up
   flow, and the password stays between the console and its owner.
2. Grant them access:

   ```
   python scripts/add-editor.py --site cnkc --email someone@example.com
   ```

3. Send them to `/cnkc/admin.html`.

`add-editor.py` writes their uid into `sites/{site}/admin/editors`. That
document is three levels deep in a subcollection and easy to get subtly wrong
by hand — one wrong path segment and the rule denies every write with no
visible reason. `--remove` revokes.

If you'd rather not install or log into gcloud, the same document can be made
by hand: Firestore, `clients` database, collection `sites` → document `cnkc` →
collection `admin` → document `editors` → field `uids`, type **array**, one
string entry per uid.

The `editors` doc sits outside `public/`, so the browser can never read it, but
`get()` inside the rules runs server-side and can. Adding a uid to the array is
what grants write access; removing it revokes.

Nothing in the admin works until **both** the rules are deployed and the uid is
in that array. A missing deploy and a missing uid produce the same symptom —
"This account isn't set up to edit CNKC yet" — so check both.

## Rules

`firestore.rules` covers the `clients` database only — `firebase.json` scopes it
with `"database": "clients"`, so a deploy from here cannot touch leafatip's.
Anything under `sites/{siteId}/public/` is world-readable; writes require a
signed-in uid listed in that site's `editors` doc. Everything else is denied to
the browser entirely.

### Cross-service rules need an IAM grant

`storage.rules` reads Firestore via `firestore.get()`. That requires the
Storage service agent to have permission to read Firestore — the console and
`firebase deploy` prompt for it, but publishing rules through the REST API does
not, and the only symptom is every upload failing with `storage/unauthorized`
while Firestore writes work fine.

```
gcloud projects add-iam-policy-binding <project> \
  --member="serviceAccount:service-<projectNumber>@gcp-sa-firebasestorage.iam.gserviceaccount.com" \
  --role="roles/firebaserules.firestoreServiceAgent"
```

`cnkc/storage.cors.json` is applied to the bucket so the admin page can fetch
an existing photo when duplicating an event. Without it that fetch is blocked
cross-origin and the copy silently arrives without its picture:

```
gcloud storage buckets update gs://<bucket> --cors-file=cnkc/storage.cors.json
```

### The rules themselves

`cnkc/storage.rules` gates uploads on **the editors list + image type + 10 MB**,
using the cross-service `firestore.get()` described above. Deletes are gated on
the editors list too — they carry no `request.resource`, so the size and type
checks would fail on them and they need their own clause.

The root `storage.rules` and `firestore.rules` still belong to the shared
`reqs-tech` project, which `rubi/` has not yet been moved off. Those cannot do
the editors check: `reqs-tech` has no default database (its client data lives
in the named `clients` one), and cross-service reads only reach the default.
That is the concrete reason each new client site gets its own project.

To publish rules changes:

```
cd cnkc && firebase deploy --only firestore,storage   # CNKC
firebase deploy --only firestore,storage --project reqs-tech   # legacy/rubi
```

## Firebase App Hosting

Backend `preview` in `us-central1` still exists and serves an earlier Next.js
version of this site at `preview--reqs-tech.us-central1.hosted.app`. It is not
used and nothing here deploys to it — `firebase.json` has no `apphosting`
block on purpose. Delete the backend in the console when you're sure it isn't
wanted; the old code is in this repo's git history.
