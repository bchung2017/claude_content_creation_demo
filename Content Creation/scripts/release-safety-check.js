#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MODULE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAC_USER_ROOT = ["", "Users", ""].join("/");
const WINDOWS_USER_ROOT = "\\" + ["Users", ""].join("\\");
const PRIVATE_PERSON = ["Aj", "ay", "\\s+", "Ya", "dav"].join("");
const PRIVATE_ACCOUNTS = [
  ["ai", "[ ._-]?", "drop", "lets"].join(""),
  ["ai", "[ ._-]?", "hard", "ware"].join("")
].join("|");
const INTERNAL_BRAND_PATH = ["Brand", "\\s+Guide", "\\s+&", "\\s+Assets/"].join("");
const TOKEN_PREFIXES = ["sk" + "-", "ghp" + "_", "github" + "_pat_", "xox" + "b-", "xox" + "p-"];
const DENIED_TEXT = [
  ["personal home path", new RegExp(`(?:${MAC_USER_ROOT}|[A-Z]:${WINDOWS_USER_ROOT.replaceAll("\\", "\\\\")})`, "g")],
  ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ["personal legal name", new RegExp(PRIVATE_PERSON, "gi")],
  ["private account identifier", new RegExp(`\\b(?:${PRIVATE_ACCOUNTS})\\b`, "gi")],
  ["internal brand source path", new RegExp(INTERNAL_BRAND_PATH, "gi")],
  ["OpenAI-style credential", new RegExp(`\\b${TOKEN_PREFIXES[0]}[A-Za-z0-9_-]{20,}\\b`, "g")],
  ["GitHub credential", new RegExp(`\\b(?:${TOKEN_PREFIXES[1]}[A-Za-z0-9]{20,}|${TOKEN_PREFIXES[2]}[A-Za-z0-9_]{20,})\\b`, "g")],
  ["Google credential", /\bAIza[A-Za-z0-9_-]{20,}\b/g],
  ["Slack credential", new RegExp(`\\b(?:${TOKEN_PREFIXES[3]}|${TOKEN_PREFIXES[4]})[A-Za-z0-9-]{20,}\\b`, "g")],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g]
];
const FORBIDDEN_PARTS = new Set([
  ".git", ".claude", ".pytest_cache", ".transcribe-venv", ".venv",
  "__pycache__", "coverage", "downloads", "node_modules", ["private", "-projects"].join(""),
  "research-projects", "venv"
]);
const FORBIDDEN_EXTENSIONS = new Set([
  ".gif", ".jpeg", ".jpg", ".m4a", ".mov", ".mp3", ".mp4", ".pdf", ".png", ".wav", ".webm", ".zip"
]);
const ALLOWED_BINARY_EXTENSIONS = new Set([".ico", ".woff", ".woff2"]);
const APPROVED_VISUAL = /^docs\/assets\/visuals\/(?:00-cover|01-start-here|02-agent-pipeline|03-first-run|04-safety-stops|05-what-you-get|06-next-steps)\.png$/;
const APPROVED_PDF = /^docs\/assets\/visuals\/Content-Creation-Visual-Guide\.pdf$/;

function parseArgs(args) {
  const index = args.indexOf("--root");
  return {
    root: index >= 0 ? path.resolve(args[index + 1] || "") : MODULE_ROOT,
    release: args.includes("--release")
  };
}

function walk(directory, base = directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(base, absolute).split(path.sep).join("/");
    if (entry.isSymbolicLink()) result.push({ absolute, relative, symlink: true });
    else if (entry.isDirectory()) walk(absolute, base, result);
    else if (entry.isFile()) result.push({ absolute, relative, symlink: false });
  }
  return result;
}

function sourceFiles(root) {
  if (!fs.existsSync(path.join(root, ".git"))) return walk(root);
  const listed = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
    cwd: root
  }).toString("utf8").split("\0").filter(Boolean);
  return listed.filter((relative) => fs.existsSync(path.join(root, relative))).map((relative) => ({
    absolute: path.join(root, relative),
    relative: relative.split(path.sep).join("/"),
    symlink: fs.lstatSync(path.join(root, relative)).isSymbolicLink()
  }));
}

function isAllowedProjectPlaceholder(relative) {
  return relative === "projects/.gitkeep";
}

function isApprovedBinary(relative) {
  const normalized = relative.split(path.sep).join("/");
  return APPROVED_VISUAL.test(normalized) || APPROVED_PDF.test(normalized);
}

function inspectFile(item, violations) {
  const parts = item.relative.toLowerCase().split("/");
  if (item.symlink) {
    violations.push(`${item.relative}: symbolic links are not allowed in a release`);
    return;
  }
  if (parts.some((part) => FORBIDDEN_PARTS.has(part)) && !isAllowedProjectPlaceholder(item.relative)) {
    violations.push(`${item.relative}: private, generated, or environment path is not distributable`);
    return;
  }
  if (path.basename(item.relative).startsWith(".env") || item.relative.endsWith(".DS_Store")) {
    violations.push(`${item.relative}: local environment or metadata file is not distributable`);
    return;
  }
  const extension = path.extname(item.relative).toLowerCase();
  if ((FORBIDDEN_EXTENSIONS.has(extension) && !isApprovedBinary(item.relative)) || item.relative.endsWith(".pyc")) {
    violations.push(`${item.relative}: downloaded media, archive, or cache artifact is not distributable`);
    return;
  }
  if (isApprovedBinary(item.relative)) return;
  const buffer = fs.readFileSync(item.absolute);
  if (buffer.includes(0)) {
    if (!ALLOWED_BINARY_EXTENSIONS.has(extension) && !isApprovedBinary(item.relative)) violations.push(`${item.relative}: unexpected binary file`);
    return;
  }
  const text = buffer.toString("utf8");
  for (const [label, expression] of DENIED_TEXT) {
    expression.lastIndex = 0;
    if (expression.test(text)) violations.push(`${item.relative}: contains ${label}`);
  }
}

export function runReleaseSafetyCheck({ root = MODULE_ROOT, release = false } = {}) {
  const violations = [];
  if (!root || !fs.existsSync(root)) return { ok: false, violations: ["release root does not exist"] };
  if (release && fs.existsSync(path.join(root, ".git"))) violations.push("release contains Git metadata");
  const files = release ? walk(root) : sourceFiles(root);
  const seen = new Set();
  for (const item of files) {
    if (seen.has(item.relative)) continue;
    seen.add(item.relative);
    inspectFile(item, violations);
  }
  return { ok: violations.length === 0, violations };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = runReleaseSafetyCheck(options);
  if (!result.ok) {
    process.stderr.write(`${result.violations.map((item) => `FAIL: ${item}`).join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("PASS: distributable source contains no personal identity, email, user path, credential, private account identifier, generated media, or Git metadata.\n");
  }
}

const invokedFile = process.argv[1] ? fs.realpathSync(path.resolve(process.argv[1])) : "";
const moduleFile = fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedFile === moduleFile) main();
