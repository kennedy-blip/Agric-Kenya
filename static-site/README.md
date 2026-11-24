# Independent Python/Jinja2 dashboard build

This directory contains the replacement static implementation of the Kenya AgriPredict dashboard, built from Jinja templates and static JSON. A root Vite compatibility bridge lets the existing Render build command publish this output without changing Render's service settings. The production URL is <https://agric-kenya.onrender.com>.

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
python3.11 tests/verify_render_build.py
```

Once a separate staging URL exists, run the standard-library staging probe (it refuses the known production hostname):

```sh
python3.11 tests/verify_staging.py https://your-staging-service.onrender.com
```

For a local browser preview, run `python3.11 -m http.server 8080 --directory dist` from this directory and visit `http://localhost:8080`.

## Deployment boundary

The repository includes `static-site/render.staging.yaml`, a standalone Blueprint definition for a **new** Static Site named `agric-kenya-python-staging`. It targets the feature branch and uses the same repository root, build command, and publish directory as production, with Python 3.11.18 pinned for the Jinja build. The production build bridge keeps Render's configured command and publish directory unchanged: `npm ci && ./node_modules/.bin/vite build` invokes the Jinja build, then Vite packages its HTML/CSS/JS into repository-root `dist/` and emits the JSON data asset. `.python-version` pins Python 3.11 for the root service. The staging Blueprint is ready for an isolated deploy, but Render has no service-creation integration here.

## Baseline captured before migration

- Public production URL supplied and fetched: <https://agric-kenya.onrender.com>.
- The live page is the Kenya AgriPredict 2026 dashboard, with county/crop/year selectors; headline satellite/weather/soil/farmer stats; year and county summary; satellite field-health grid; agricultural alerts; weather and yield visualizations; crop distribution; growing conditions; yield trends; soil sensors; model performance; pipeline; crop selector buttons; and data-source footer.
- The default visible selection was Nakuru County, Maize (Mahindi), 2026. The captured live summary showed 24°C, 89mm monthly rain, 7.2h sunlight, an approximately 83.5% field-health average, and the four 2026 alerts beginning with drought conditions in Turkana and Marsabit.
- The production service settings were supplied by the user from Render: Static Site **Agric-Kenya**, service ID `srv-d611mvkhg0os73cvtbrg`, repository `kennedy-blip/Agric-Kenya`, branch `main` at `dc182c8`, live at <https://agric-kenya.onrender.com>. Its root directory is blank (repository root); its build command is `npm ci && ./node_modules/.bin/vite build`; its publish directory is `dist`; auto-deploy is On Commit; PR previews are Off. These settings show the assigned feature branch does not itself deploy production.
- Baseline repository command from `package.json` is `npm run build` (`vite build`), which corresponds to the Vite build used by Render. There are no test scripts in `package.json`.
- At baseline, the checked-out `node_modules` was incomplete: the Vite executable lacked its executable bit and Rollup's platform optional dependency `@rollup/rollup-linux-x64-gnu` was absent. The production-equivalent command was subsequently tested in a clean temporary checkout with `npm ci && ./node_modules/.bin/vite build`; it generated bundled HTML/CSS/JS and JSON successfully, and the staging verifier plus bundled interaction checks passed.
- GitHub has no Render deployment records. Render service settings are known from the user-provided snapshot, but this session cannot create a Render service or read its build logs; production deployment status must be confirmed from the Render dashboard and live site.
