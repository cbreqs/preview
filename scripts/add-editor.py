#!/usr/bin/env python3
"""Grant someone edit access to a client site's admin page.

    python scripts/add-editor.py --site cnkc --email someone@example.com

Writes their Firebase Auth uid into

    sites/{site}/admin/editors   →   { uids: [...] }

in that site's own Firebase project — see SITES below — which is what
firestore.rules and storage.rules both check before allowing any write from
/{site}/admin.html. Existing uids are kept; a uid already there is left alone.

WHY THIS EXISTS
That document sits three levels deep in a subcollection, which is tedious and
easy to get subtly wrong by hand in the console — one typo in the path and the
rules silently deny every write with no clue why.

WHAT IT DOESN'T DO
It does not create the account. Sign the person up first in
Firebase console > Authentication > Users > Add user, so their password is
theirs alone and never passes through here.

AUTH
gcloud only:

    gcloud auth login

Deliberately NOT `gcloud auth application-default login`. ADC user credentials
need a quota project configured before identitytoolkit will talk to them; an
ordinary login plus a per-request x-goog-user-project header does not.

REMOVING SOMEONE
    python scripts/add-editor.py --site cnkc --email someone@example.com --remove
"""

import argparse
import json
import shutil
import subprocess
import sys
import urllib.error
import urllib.request

# Each client site lives in its own Firebase project, so the site id decides
# which project and database to talk to. Add a row here when onboarding a
# client. New sites should use "(default)" — Storage rules can only reach the
# default database, which is what lets storage.rules check this same editors
# list instead of trusting any signed-in account.
SITES = {
    "cnkc": ("cannabis-network-kc", "(default)"),
    # Legacy: still in the shared reqs-tech project, named `clients` database.
    "rubi": ("reqs-tech", "clients"),
}


def fail(message):
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def tool(name, install_hint):
    """Locate a CLI. shutil.which, not a bare name: on Windows these are .cmd
    shims and subprocess won't apply PATHEXT to resolve them."""
    exe = shutil.which(name)
    if not exe:
        fail(f"{name} isn't on PATH. {install_hint}")
    return exe


def access_token():
    """A short-lived OAuth token from the ordinary gcloud login.

    Not `application-default print-access-token` — ADC user credentials
    require a quota project to be set and extra APIs enabled."""
    try:
        result = subprocess.run(
            [tool("gcloud", "Install the Google Cloud SDK."),
             "auth", "print-access-token"],
            capture_output=True, text=True, check=True,
        )
    except subprocess.CalledProcessError as error:
        detail = [l for l in (error.stderr or "").strip().splitlines() if l.strip()]
        fail("gcloud has no usable credentials.\n"
             "       Run: gcloud auth login\n"
             + (f"       gcloud said: {detail[0]}" if detail else ""))
    return result.stdout.strip()


def call(url, token, project, method="GET", body=None):
    """One JSON request. Returns (status, parsed_body).

    x-goog-user-project matters: identitytoolkit refuses a user credential
    without a quota project, and this header supplies one per request rather
    than requiring `gcloud auth application-default set-quota-project`."""
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("x-goog-user-project", project)
    request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read() or "{}")
    except urllib.error.HTTPError as error:
        payload = error.read().decode()
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            pass
        return error.code, payload


def resolve(site):
    """Site id -> (project, database). Fails with the valid ids listed."""
    if site not in SITES:
        fail(f"unknown site '{site}'. Known sites: {', '.join(sorted(SITES))}\n"
             "       Add a row to SITES at the top of this file to onboard a new one.")
    return SITES[site]


def uid_for_email(email, project, token):
    """Resolve an email to its Firebase Auth uid.

    Uses identitytoolkit directly rather than `firebase auth:export`, so the
    whole script needs one credential (gcloud) instead of two. The Firebase
    CLI's login expires often, and it used to take this script down with it.
    It also avoids writing the project's entire user list to a temp file just
    to read one uid out of it."""
    status, body = call(
        f"https://identitytoolkit.googleapis.com/v1/projects/{project}/accounts:lookup",
        token, project, "POST", {"email": [email]},
    )
    if status != 200:
        fail(f"looking up {email} failed ({status}): {body}")

    users = body.get("users") or []
    if not users:
        # ASCII only: the Windows console codepage can't encode arrows, and
        # they come out as escape sequences in the middle of the error.
        fail(f"no account for {email} in project {project}.\n"
             "       Create it first in the Firebase console, under "
             "Authentication > Users > Add user")
    return users[0]["localId"]


def set_display_name(uid, name, project, token):
    """Set the account's username.

    This is what gets credited on anything they upload. It's stored on the
    Firebase Auth profile rather than alongside the content, so renaming
    someone doesn't mean rewriting every document they touched — and so the
    public site never has to carry an editor's email address."""
    status, body = call(
        f"https://identitytoolkit.googleapis.com/v1/projects/{project}/accounts:update",
        token, project, "POST", {"localId": uid, "displayName": name},
    )
    if status != 200:
        fail(f"setting the username failed ({status}): {body}")


def editors_url(site, project, database):
    return (f"https://firestore.googleapis.com/v1/projects/{project}"
            f"/databases/{database}/documents/sites/{site}/admin/editors")


def read_uids(site, project, database, token):
    status, body = call(editors_url(site, project, database), token, project)
    if status == 404:
        return []   # no editors doc yet; the first grant creates it
    if status != 200:
        fail(f"reading the editors doc failed ({status}): {body}")
    values = body.get("fields", {}).get("uids", {}).get("arrayValue", {}).get("values", [])
    return [v["stringValue"] for v in values if "stringValue" in v]


def write_uids(site, project, database, uids, token):
    status, body = call(
        f"{editors_url(site, project, database)}?updateMask.fieldPaths=uids",
        token, project, "PATCH",
        {"fields": {"uids": {"arrayValue": {
            "values": [{"stringValue": u} for u in uids]}}}},
    )
    if status != 200:
        fail(f"writing the editors doc failed ({status}): {body}")


def main():
    parser = argparse.ArgumentParser(description="Grant or revoke admin access to a client site.")
    parser.add_argument("--site", required=True, help="site id, e.g. cnkc")
    parser.add_argument("--email", required=True, help="an existing Firebase Auth account")
    parser.add_argument("--remove", action="store_true", help="revoke instead of grant")
    parser.add_argument("--name", help="username to credit on their uploads, "
                                       "e.g. --name Asteres")
    args = parser.parse_args()

    project, database = resolve(args.site)

    token = access_token()
    # uid first: fails fast on a typo'd email, before touching Firestore.
    uid = uid_for_email(args.email, project, token)

    if args.name and not args.remove:
        set_display_name(uid, args.name.strip(), project, token)
        print(f"Username set to {args.name.strip()}.")

    current = read_uids(args.site, project, database, token)

    if args.remove:
        if uid not in current:
            print(f"{args.email} was not an editor of {args.site}. Nothing changed.")
            return
        updated = [u for u in current if u != uid]
        write_uids(args.site, project, database, updated, token)
        print(f"Removed {args.email} from {args.site}. {len(updated)} editor(s) remain.")
        return

    if uid in current:
        print(f"{args.email} can already edit {args.site} (uid {uid}). Nothing changed.")
        return

    updated = current + [uid]
    write_uids(args.site, project, database, updated, token)
    print(f"Added {args.email} (uid {uid}) as an editor of {args.site} "
          f"in project {project}.")
    print(f"{len(updated)} editor(s) total. They can now sign in at /{args.site}/admin.html")


if __name__ == "__main__":
    main()
