#!/usr/bin/env python3
"""Build the independent Jinja2 static site into static-site/dist."""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "dist"


def build() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    env = Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=select_autoescape(["html", "xml"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template("index.html")
    data = json.loads((ROOT / "data" / "dashboard.json").read_text(encoding="utf-8"))
    (OUTPUT / "index.html").write_text(
        template.render(dashboard=data), encoding="utf-8"
    )
    shutil.copytree(ROOT / "static", OUTPUT, dirs_exist_ok=True)
    shutil.copytree(ROOT / "data", OUTPUT / "data", dirs_exist_ok=True)
    print(f"Built static site: {OUTPUT}")


if __name__ == "__main__":
    build()
