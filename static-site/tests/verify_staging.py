#!/usr/bin/env python3
"""Check a deployed staging URL serves this static dashboard and its data."""
from __future__ import annotations

import argparse
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

PRODUCTION_HOST = "agric-kenya.onrender.com"
REQUIRED_MARKERS = (
    "Kenya AgriPredict",
    'id="county-select"',
    'id="crop-select"',
    'id="year-select"',
    "Satellite Field Health",
    "Kenya Agricultural Alerts",
    "County Yield Comparison",
    "ML Model Performance",
)


def fetch(base: str, path: str) -> tuple[bytes, str]:
    url = urljoin(base.rstrip("/") + "/", path)
    request = Request(url, headers={"User-Agent": "Agric-Kenya-staging-check/1.0"})
    with urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f"{path}: HTTP {response.status}")
        return response.read(), response.headers.get("Content-Type", "")


def verify(base_url: str) -> list[str]:
    parsed = urlparse(base_url)
    is_loopback = parsed.hostname in {"localhost", "127.0.0.1", "::1"}
    if not parsed.hostname or (parsed.scheme != "https" and not (parsed.scheme == "http" and is_loopback)):
        raise ValueError("Use an HTTPS staging URL (or HTTP localhost for a local test)")
    if parsed.hostname.lower() == PRODUCTION_HOST:
        raise ValueError("Refusing to certify the production URL as staging")

    html, html_type = fetch(base_url, "")
    css, css_type = fetch(base_url, "css/site.css")
    js, js_type = fetch(base_url, "js/app.js")
    raw_data, data_type = fetch(base_url, "data/dashboard.json")
    html_text = html.decode("utf-8")
    css_text = css.decode("utf-8")
    js_text = js.decode("utf-8")
    data = json.loads(raw_data)

    missing = [marker for marker in REQUIRED_MARKERS if marker not in html_text]
    if missing:
        raise RuntimeError("Page is missing required dashboard markers: " + ", ".join(missing))
    if ".stats-grid" not in css_text or "@media" not in css_text:
        raise RuntimeError("Stylesheet does not appear to be the responsive dashboard stylesheet")
    if "renderWeather" not in js_text or "fetch('data/dashboard.json')" not in js_text:
        raise RuntimeError("JavaScript asset is missing the dashboard renderer/data load")
    if len(data.get("counties", [])) != 18 or len(data.get("crops", [])) != 16:
        raise RuntimeError("Static JSON county/crop data is incomplete")
    years = set(data.get("years", []))
    if years != set(data.get("multipliers", {})) or years != set(data.get("alerts", {})):
        raise RuntimeError("Year multipliers or alerts do not cover every dashboard year")
    if not all(len(data["alerts"][year]) == 4 for year in years):
        raise RuntimeError("Expected four static alerts for every dashboard year")
    if sum(item["value"] for item in data.get("cropDistribution", [])) != 100:
        raise RuntimeError("Crop distribution must total 100 percent")
    if "json" not in data_type.lower():
        raise RuntimeError(f"Dashboard data has an unexpected content type: {data_type}")
    if "html" not in html_type.lower() or "css" not in css_type.lower() or "javascript" not in js_type.lower():
        raise RuntimeError("One or more assets have unexpected content types")

    return [
        f"HTML: 200 ({html_type.split(';')[0]})",
        f"CSS: 200 ({css_type.split(';')[0]})",
        f"JavaScript: 200 ({js_type.split(';')[0]})",
        f"Dashboard JSON: 200 ({len(data['counties'])} counties, {len(data['crops'])} crops, {len(years)} years)",
        "Dashboard section markers and static data integrity: passed",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("staging_url", help="HTTPS URL for a separate staging service (not production)")
    args = parser.parse_args()
    try:
        for result in verify(args.staging_url):
            print(result)
    except (ValueError, RuntimeError, HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"STAGING CHECK FAILED: {exc}", file=sys.stderr)
        return 1
    print("Staging HTTP/data checks passed. Visual browser parity still requires a browser review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
