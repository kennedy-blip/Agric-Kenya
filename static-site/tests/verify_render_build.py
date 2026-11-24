#!/usr/bin/env python3
"""Reproduce Render's current root build command in an isolated temp checkout."""
from __future__ import annotations

import functools
import shutil
import subprocess
import sys
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


def copy_sources(destination: Path) -> None:
    for name in ("package.json", "package-lock.json", "vite.config.ts", ".python-version"):
        shutil.copy2(ROOT / name, destination / name)
    shutil.copytree(
        ROOT / "static-site",
        destination / "static-site",
        ignore=shutil.ignore_patterns(".venv", "dist", "__pycache__"),
    )


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="agric-render-build-") as temp:
        checkout = Path(temp)
        copy_sources(checkout)
        subprocess.run(["npm", "ci"], cwd=checkout, check=True)
        subprocess.run(["./node_modules/.bin/vite", "build"], cwd=checkout, check=True)

        output = checkout / "dist"
        required = [output / "index.html", output / "data" / "dashboard.json"]
        required.extend((output / "assets").glob("*.js"))
        required.extend((output / "assets").glob("*.css"))
        if any(not item.is_file() for item in required) or len(required) < 4:
            raise RuntimeError("Vite output is missing a page, bundle, or dashboard JSON")

        handler = functools.partial(QuietHandler, directory=str(output))
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            sys.path.insert(0, str(ROOT / "static-site" / "tests"))
            from verify_staging import verify

            url = f"http://127.0.0.1:{server.server_port}/"
            for result in verify(url):
                print(result)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

    print("Clean-checkout Render build command and published output verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
