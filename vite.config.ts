import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const staticSiteRoot = path.join(repoRoot, "static-site");
const pythonEnvironment = path.join(staticSiteRoot, ".venv");
const python = process.platform === "win32"
  ? path.join(pythonEnvironment, "Scripts", "python.exe")
  : path.join(pythonEnvironment, "bin", "python");
const generatedRoot = path.join(staticSiteRoot, "dist");
const publishRoot = path.join(repoRoot, "dist");

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
}

// Render's current production command invokes Vite directly. Use Vite as the
// static-site publisher while Python/Jinja2 remains the source/build system.
run("python3", ["-m", "venv", pythonEnvironment], repoRoot);
run(python, ["-m", "pip", "install", "--disable-pip-version-check", "-r", path.join(staticSiteRoot, "requirements.txt")], repoRoot);
run(python, [path.join(staticSiteRoot, "build.py")], repoRoot);

export default {
  root: generatedRoot,
  base: "./",
  publicDir: false,
  build: {
    outDir: publishRoot,
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(generatedRoot, "index.html"),
    },
  },
  plugins: [
    {
      name: "emit-static-dashboard-data",
      generateBundle() {
        const data = readFileSync(path.join(generatedRoot, "data", "dashboard.json"), "utf-8");
        this.emitFile({ type: "asset", fileName: "data/dashboard.json", source: data });
      },
    },
  ],
};
