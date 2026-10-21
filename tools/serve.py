"""Static local preview, with explicit JavaScript MIME types on Windows."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import sys

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.mjs': 'text/javascript',
                      '.webp': 'image/webp', '.woff2': 'font/woff2'}

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    root = Path(__file__).resolve().parent.parent
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=str(root)))
    print(f'Preview: http://127.0.0.1:{port}/', flush=True)
    server.serve_forever()
