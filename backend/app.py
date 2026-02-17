import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse
import webbrowser

from routes.pages.outline import handle as handle_outline
from routes.pages.preview import handle as handle_preview
from routes.pages.learning import handle as handle_learning
from routes.pages.review import handle as handle_review
from routes.pages.practice import handle as handle_practice
from routes.pages.check import handle as handle_check

from routes.storages.progress_get import handle as handle_progress_get
from routes.storages.progress_save import handle as handle_progress_save
from routes.storages.preview_get import handle as handle_preview_get
from routes.storages.preview_save import handle as handle_preview_save
from routes.storages.outline_save import handle as handle_outline_save
from routes.storages.outline_get import handle as handle_outline_get
from routes.storages.weakness_save import handle as handle_weakness_save

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR.parent / "frontend"
STORAGE_DIR = ROOT_DIR / "storage"

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
}


def _json_response(handler, status_code, payload):
    data = json.dumps(payload, ensure_ascii=True).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def _read_json(handler):
    length = int(handler.headers.get("Content-Length", "0"))
    if length == 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            _json_response(self, 404, {"error": "Not found"})
            return

        target_path = parsed.path
        if target_path == "/":
            target_path = "/index.html"

        if target_path.startswith("/preview/"):
            preview_relative = target_path[len("/preview/"):]
            file_path = (STORAGE_DIR / "preview" / preview_relative).resolve()
            preview_dir = (STORAGE_DIR / "preview").resolve()

            if not str(file_path).startswith(str(preview_dir)):
                _json_response(self, 403, {"error": "Forbidden"})
                return
                
            if not file_path.exists() or file_path.is_dir():
                _json_response(self, 404, {"error": "File not found"})
                return
                
            ext = file_path.suffix.lower()
            content_type = CONTENT_TYPES.get(ext, "application/octet-stream")
            data = file_path.read_bytes()
            
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        file_path = (FRONTEND_DIR / target_path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(FRONTEND_DIR.resolve())):
            _json_response(self, 403, {"error": "Forbidden"})
            return

        if not file_path.exists() or file_path.is_dir():
            _json_response(self, 404, {"error": "File not found"})
            return

        ext = file_path.suffix.lower()
        content_type = CONTENT_TYPES.get(ext, "application/octet-stream")
        data = file_path.read_bytes()

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        parsed = urlparse(self.path)
        data = _read_json(self)
        ctx = {"root_dir": ROOT_DIR}

        routes = {
            "/api/progress/save": handle_progress_save,
            "/api/progress/get": handle_progress_get,

            "/api/outline": handle_outline,
            "/api/outline/save": handle_outline_save,
            "/api/outline/get": handle_outline_get,

            "/api/preview": handle_preview,
            "/api/preview/get": handle_preview_get,
            "/api/preview/save": handle_preview_save,

            "/api/learning": handle_learning,

            "/api/practice": handle_practice,

            "/api/weakness_save": handle_weakness_save,

            "/api/review": handle_review,
            
            "/api/check": handle_check,
        }

        handler = routes.get(parsed.path)
        if handler is None:
            _json_response(self, 404, {"error": "Not found"})
            return

        try:
            result = handler(data, ctx)
            _json_response(self, 200, result)
        except Exception as exc:  # noqa: BLE001
            _json_response(self, 500, {"error": "Server error", "detail": str(exc)})


def main():
    host = os.getenv("APP_HOST", "127.0.0.1")
    port = int(os.getenv("APP_PORT", "2121"))
    server = HTTPServer((host, port), RequestHandler)
    print(f"服务运行在： http://{host}:{port}")
    webbrowser.open(f"http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
