#!/usr/bin/env python3
"""Static dev server for preview.reqs.tech, with caching turned off.

    python scripts/serve.py [port]        # default 9004

WHY NOT `python -m http.server`
That sends no Cache-Control header, so browsers apply heuristic freshness and
happily reuse a stylesheet or module from earlier — including across a reload
and across tabs. ES modules are the worst of it: the module graph is cached by
URL, so editing a file a page imports can leave you staring at a stale error
with no clue it isn't the current code. Everything below is served no-store,
so a plain refresh always shows what's on disk.

This is a development convenience only. GitHub Pages serves the real site and
sets its own sensible caching headers.
"""

import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PORT = 9004


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, keyword, value):
        # SimpleHTTPRequestHandler adds Last-Modified, which lets a browser
        # revalidate and get a 304 — defeating the point. Drop it.
        if keyword == "Last-Modified":
            return
        super().send_header(keyword, value)

    def log_message(self, fmt, *args):
        # One tidy line per request; the default writes the client address too.
        sys.stderr.write("%s\n" % (fmt % args))


class ReusableServer(socketserver.ThreadingTCPServer):
    # Threading, not plain TCPServer: that one handles a single request at a
    # time, so one browser connection blocks every other request and the whole
    # server appears to hang.
    daemon_threads = True

    # Without this, restarting after Ctrl+C fails with "address already in use"
    # while the old socket sits in TIME_WAIT.
    allow_reuse_address = True


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    handler = functools.partial(NoCacheHandler, directory=ROOT)
    with ReusableServer(("", port), handler) as httpd:
        print(f"serving {ROOT} at http://localhost:{port}/ (caching disabled)")
        print(f"  CNKC: http://localhost:{port}/cnkc/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
