"""Dev-only static server that disables caching.

Browsers cache ES modules aggressively; with a plain `python3 -m http.server`
that means edits to js/*.js don't show up until a hard refresh. This server
sends no-store headers so every reload fetches fresh files.

Usage:  python3 serve.py [port]   (default 8080)

This is for local development only — production deploys (Vercel / GitHub Pages)
serve the static files directly and are unaffected.
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving (no-cache) on http://localhost:{PORT}")
    httpd.serve_forever()
