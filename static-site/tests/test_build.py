import functools
import json
import subprocess
import sys
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


class MarkupInventory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.assets = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for name in ("href", "src"):
            if attrs.get(name):
                self.assets.append(attrs[name])


class StaticBuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run([sys.executable, str(ROOT / "build.py")], check=True)
        cls.output = ROOT / "dist"
        cls.html = (cls.output / "index.html").read_text(encoding="utf-8")
        cls.data = json.loads((cls.output / "data" / "dashboard.json").read_text(encoding="utf-8"))

    def test_generated_page_and_local_assets_exist(self):
        self.assertIn("Kenya AgriPredict", self.html)
        self.assertIn('id="county-select"', self.html)
        self.assertIn('id="year-select"', self.html)
        self.assertIn('id="weather-chart"', self.html)
        self.assertTrue((self.output / "css" / "site.css").is_file())
        self.assertTrue((self.output / "js" / "app.js").is_file())
        self.assertTrue((self.output / "data" / "dashboard.json").is_file())
        self.assertIn('href="css/site.css"', self.html)
        self.assertIn('<script type="module" src="js/app.js"></script>', self.html)

    def test_markup_ids_are_unique_and_local_asset_links_resolve(self):
        parser = MarkupInventory()
        parser.feed(self.html)
        self.assertEqual(len(parser.ids), len(set(parser.ids)))
        self.assertGreaterEqual(len(parser.ids), 10)
        for asset in parser.assets:
            parsed = urlparse(asset)
            if parsed.scheme or parsed.netloc:
                continue
            relative = parsed.path or "index.html"
            target = self.output / relative
            if relative.endswith("/"):
                target = target / "index.html"
            self.assertTrue(target.is_file(), f"Missing local asset: {asset}")
        for section in ("Satellite Field Health", "Kenya Agricultural Alerts", "Weather Patterns", "County Yield Comparison", "Growing Conditions", "Yield Trends", "Soil Sensor Network", "ML Model Performance", "Distributed Processing Pipeline"):
            self.assertIn(section, self.html)
        self.assertIn("illustrative sample data", self.html)

    def test_static_http_serves_page_styles_scripts_and_json(self):
        handler = functools.partial(SimpleHTTPRequestHandler, directory=str(self.output))
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            base = f"http://127.0.0.1:{server.server_port}/"
            for path, marker in (("", b"Kenya AgriPredict"), ("css/site.css", b".stats-grid"), ("js/app.js", b"renderWeather"), ("data/dashboard.json", b"countyYield")):
                with urlopen(base + path, timeout=5) as response:
                    self.assertEqual(response.status, 200)
                    self.assertIn(marker, response.read(), path)
            result = subprocess.run(
                [sys.executable, str(ROOT / "tests" / "verify_staging.py"), base],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("static data integrity: passed", result.stdout)
            production = subprocess.run(
                [sys.executable, str(ROOT / "tests" / "verify_staging.py"), "https://agric-kenya.onrender.com"],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(production.returncode, 0)
            self.assertIn("Refusing to certify the production URL", production.stderr)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

    def test_staging_blueprint_is_separate_and_targets_feature_branch(self):
        blueprint = (ROOT / "render.staging.yaml").read_text(encoding="utf-8")
        self.assertIn("type: web", blueprint)
        self.assertIn("runtime: static", blueprint)
        self.assertIn("name: agric-kenya-python-staging", blueprint)
        self.assertIn("branch: arena/5dd54068-agric-kenya", blueprint)
        self.assertIn("buildCommand: npm ci && ./node_modules/.bin/vite build", blueprint)
        self.assertNotIn("rootDir:", blueprint)
        self.assertIn("staticPublishPath: dist", blueprint)
        self.assertIn("key: PYTHON_VERSION", blueprint)
        self.assertIn("value: 3.11.18", blueprint)
        self.assertNotIn("name: Agric-Kenya", blueprint)
        self.assertNotIn("agric-kenya.onrender.com", blueprint)

    def test_county_crop_and_year_data_are_complete(self):
        self.assertEqual(len(self.data["counties"]), 18)
        self.assertEqual(len(self.data["crops"]), 16)
        self.assertEqual(set(self.data["years"]), set(self.data["multipliers"]))
        self.assertEqual(set(self.data["years"]), set(self.data["alerts"]))
        self.assertTrue(all(len(self.data["alerts"][year]) == 4 for year in self.data["years"]))
        self.assertEqual(sum(item["value"] for item in self.data["cropDistribution"]), 100)

    def test_key_dashboard_calculations_match_source(self):
        factors = self.data["multipliers"]["2026"]
        self.assertEqual(round(24 * factors["temp"]), 24)
        self.assertEqual(round(85 * factors["rainfall"]), 89)
        nakuru = next(row for row in self.data["countyYield"] if row["county"] == "Nakuru")
        self.assertEqual(round(nakuru["maize"] * factors["yield"]), 26)
        archived = self.data["multipliers"]["2022"]
        self.assertEqual(round(72 * archived["yield"]), 61)
        self.assertEqual(round(45 * archived["yield"]), 38)


if __name__ == "__main__":
    unittest.main()
