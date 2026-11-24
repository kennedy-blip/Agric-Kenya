# Agric-Kenya

Kenya AgriPredict is a static, responsive dashboard for Kenya-focused agricultural yield, weather, soil, crop, and county summaries.

## Current production deployment

- URL: <https://agric-kenya.onrender.com>
- Render service: **Agric-Kenya** (Static Site)
- Build command: `npm ci && ./node_modules/.bin/vite build`
- Publish directory: `dist`
- Python build runtime: Python 3.11 (pinned by `.python-version`)

The repository preserves that existing Render command. `vite.config.ts` creates an isolated Python environment, installs the pinned Jinja2 requirements, renders the Jinja templates and JSON data, then uses Vite to bundle the site into the existing `dist/` publish directory. Render's service settings do not need a root-directory or publish-path change.

## Build locally

The source site is in `static-site/`; the generated output is ignored by Git.

```sh
python3.11 -m venv static-site/.venv
static-site/.venv/bin/python -m pip install -r static-site/requirements.txt
static-site/.venv/bin/python static-site/build.py
npm ci
npm run build
```

The last two commands reproduce the Render build. The direct Python build writes `static-site/dist/`; the Vite build writes the deployable site to repository-root `dist/`.

For a local preview of the deployable output:

```sh
npm run preview -- --host 0.0.0.0
```

## Tests and deployment checks

```sh
static-site/.venv/bin/python -m unittest discover -s static-site/tests -p 'test_*.py'
node static-site/tests/test_interactions.cjs
node --check static-site/static/js/app.js
python3.11 static-site/tests/verify_render_build.py
```

`verify_render_build.py` performs a clean temporary `npm ci`, runs the production Render command, serves the resulting output, and checks the HTML/assets/data over HTTP. `verify_staging.py <https-url>` checks a separate staging service; it intentionally refuses to certify the known production hostname as staging.

## Data and behavior notes

Dashboard data is static illustrative sample data exported from the previous implementation. County, crop, and year controls update the dashboard client-side. “Snapshot” labels and the page disclaimer make clear that values are not a real-time data feed. There is no database, API, or secret required for this static build.
