# Independent Python/Jinja2 dashboard build

This directory contains a parallel, static implementation of the Kenya AgriPredict dashboard. It does not replace or modify the root React/Vite app, its package files, or deployment configuration. Production remains at <https://agric-kenya.onrender.com> until separately verified staging and parity evidence support a cutover.

## Local build

Requires Python 3.11. The repository checkout used for this migration has Python 3.11.2 and no Ruby runtime. Install the pinned Jinja2/MarkupSafe dependencies in an isolated environment and build:

```sh
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python build.py
```

Generated static files are written to `dist/` (ignored by Git). The build uses `templates/index.html`, `data/dashboard.json`, and files under `static/`. No API, database, secret, JavaScript framework, CSS framework, or remote font is needed to build the static output.

## Checks

```sh
.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
node tests/test_interactions.cjs
node --check static/js/app.js
```

Once a separate staging URL exists, run the standard-library staging probe (it refuses the known production hostname):

```sh
python3.11 tests/verify_staging.py https://your-staging-service.onrender.com
```

For a local browser preview, run `python3.11 -m http.server 8080 --directory dist` from this directory and visit `http://localhost:8080`.

## Deployment boundary

The repository now includes `static-site/render.staging.yaml`, a standalone Blueprint definition for a **new** Static Site named `agric-kenya-python-staging`. It targets this feature branch, uses `static-site/` as its root, runs `python3.11 -m pip install -r requirements.txt && python3.11 build.py`, and publishes `dist/`. The file is deliberately nested and is not a replacement for production's settings. After the feature branch is pushed, create a separate Render Blueprint using this file path; verify that Render creates the distinct staging service, and that its build environment actually provides Python 3.11. Then run `python3.11 tests/verify_staging.py https://<staging-url>` from this directory. No Render service was created or changed by this repository work. Do not repoint production or merge the feature until the separate staging build and browser parity review pass.

## Baseline captured before migration

- Public production URL supplied and fetched: <https://agric-kenya.onrender.com>.
- The live page is the Kenya AgriPredict 2026 dashboard, with county/crop/year selectors; headline satellite/weather/soil/farmer stats; year and county summary; satellite field-health grid; agricultural alerts; weather and yield visualizations; crop distribution; growing conditions; yield trends; soil sensors; model performance; pipeline; crop selector buttons; and data-source footer.
- The default visible selection was Nakuru County, Maize (Mahindi), 2026. The captured live summary showed 24°C, 89mm monthly rain, 7.2h sunlight, an approximately 83.5% field-health average, and the four 2026 alerts beginning with drought conditions in Turkana and Marsabit.
- The production service settings were supplied by the user from Render: Static Site **Agric-Kenya**, service ID `srv-d611mvkhg0os73cvtbrg`, repository `kennedy-blip/Agric-Kenya`, branch `main` at `dc182c8`, live at <https://agric-kenya.onrender.com>. Its root directory is blank (repository root); its build command is `npm ci && ./node_modules/.bin/vite build`; its publish directory is `dist`; auto-deploy is On Commit; PR previews are Off. These settings show the assigned feature branch does not itself deploy production.
- Baseline repository command from `package.json` is `npm run build` (`vite build`), which corresponds to the Vite build used by Render. There are no test scripts in `package.json`.
- The root npm build could not be run to completion in this checkout: the Vite executable lacks its executable bit and, invoking it through Node, Rollup's platform optional dependency `@rollup/rollup-linux-x64-gnu` is absent. Root app files and deployment settings were left untouched.
- GitHub has no registered deployment records. Render's service/dashboard is not available through this conversation, so although production settings have been recorded from the user-provided snapshot, a separate staging service cannot be created or inspected here.
