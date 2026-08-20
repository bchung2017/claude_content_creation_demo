import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "./json.js";

const PROVIDERS = new Set(["framegrab-cli", "ssstwitter-browser", "manual"]);
const RIGHTS = new Set(["owned", "official", "licensed", "permission-needed", "reference-only"]);
const X_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);
export const SSSTWITTER_URL = "https://ssstwitter.com/";

function executableCandidates(command, platform) {
  if (platform !== "win32" || path.extname(command)) return [command];
  return [command, `${command}.exe`, `${command}.cmd`, `${command}.bat`];
}

function isExecutable(file) {
  try {
    if (!fs.statSync(file).isFile()) return false;
    fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveExecutable(command, { pathValue, platform, cwd }) {
  if (!command) return null;
  if (command.includes(path.sep) || (platform === "win32" && command.includes("/"))) {
    const candidate = path.resolve(cwd, command);
    return executableCandidates(candidate, platform).find(isExecutable) || null;
  }
  for (const directory of String(pathValue || "").split(path.delimiter).filter(Boolean)) {
    const found = executableCandidates(path.join(directory, command), platform).find(isExecutable);
    if (found) return found;
  }
  return null;
}

export function findFrameGrabCli({ env = process.env, platform = process.platform, cwd = process.cwd() } = {}) {
  const configured = String(env.FRAMEGRAB_CLI || "").trim();
  const executable = resolveExecutable(configured || "framegrab", {
    pathValue: env.PATH,
    platform,
    cwd
  });
  return {
    available: Boolean(executable),
    executable,
    source: executable ? (configured ? "FRAMEGRAB_CLI" : "PATH") : null
  };
}

export function normalizeSourceUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("media source must be a valid URL");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("media source must be a public HTTP(S) URL without embedded credentials");
  }
  return url;
}

export function routeMedia({ sourceUrl, framegrab = findFrameGrabCli() }) {
  const url = normalizeSourceUrl(sourceUrl);
  if (framegrab.available && framegrab.executable) {
    return {
      status: "ready",
      provider: "framegrab-cli",
      executable: framegrab.executable,
      detected_by: framegrab.source,
      source_url: url.toString(),
      next: "Read the installed CLI help, download with its documented command, then run media-register."
    };
  }
  if (X_HOSTS.has(url.hostname.toLowerCase())) {
    return {
      status: "ready",
      provider: "ssstwitter-browser",
      source_url: url.toString(),
      browser_url: SSSTWITTER_URL,
      requires_browser: true,
      public_posts_only: true,
      steps: [
        "Open the browser URL.",
        "Paste the public X/Twitter post URL and choose Download.",
        "Choose an available quality and save the file.",
        "Run media-register with --provider ssstwitter-browser."
      ]
    };
  }
  return {
    status: "blocked",
    provider: null,
    source_url: url.toString(),
    reason: "FrameGrab CLI is unavailable and the browser fallback supports only public X/Twitter posts."
  };
}

function nextAssetId(assets) {
  const used = new Set(assets.map((asset) => asset?.id));
  let number = 1;
  while (used.has(`asset-${number}`)) number += 1;
  return `asset-${number}`;
}

function safeExtension(file) {
  const extension = path.extname(file).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : ".bin";
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function registerMediaAsset({
  projectDir,
  sourceUrl,
  file,
  provider = "manual",
  kind = "reference",
  sourceId = "",
  usage,
  rightsStatus = "permission-needed",
  title = "",
  creator = ""
}) {
  const url = normalizeSourceUrl(sourceUrl);
  if (!PROVIDERS.has(provider)) throw new Error(`unsupported media provider: ${provider}`);
  if (!RIGHTS.has(rightsStatus)) throw new Error(`unsupported rights status: ${rightsStatus}`);
  if (!String(usage || "").trim()) throw new Error("media usage is required");
  if (provider === "ssstwitter-browser" && !X_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("ssstwitter-browser can register only X/Twitter source URLs");
  }

  const input = path.resolve(file || "");
  if (!file || !fs.existsSync(input) || !fs.statSync(input).isFile()) {
    throw new Error("media file must exist and be a regular file");
  }

  const project = path.resolve(projectDir || "");
  const manifestFile = path.join(project, "assets", "manifest.json");
  if (!fs.existsSync(manifestFile)) {
    throw new Error("project assets/manifest.json is missing; initialize the project first");
  }
  const manifest = readJson(manifestFile);
  if (!Array.isArray(manifest.assets)) throw new Error("project asset manifest is invalid");

  const assetId = nextAssetId(manifest.assets);
  const relativePath = path.posix.join("assets", "media", `${assetId}${safeExtension(input)}`);
  const output = path.join(project, ...relativePath.split("/"));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (path.resolve(input) !== path.resolve(output)) fs.copyFileSync(input, output, fs.constants.COPYFILE_EXCL);

  const asset = {
    id: assetId,
    kind,
    source_id: sourceId || null,
    source_url: url.toString(),
    provider,
    rights_status: rightsStatus,
    usage: String(usage).trim(),
    local_path: relativePath,
    artifact_paths: [relativePath],
    receipt_id: null,
    title: title || path.basename(input),
    creator: creator || null,
    sha256: sha256(output),
    acquired_at: new Date().toISOString(),
    notes: "Copied into this project from the selected provider; download access does not grant publication rights."
  };
  manifest.assets.push(asset);
  writeJson(manifestFile, manifest);
  return asset;
}
