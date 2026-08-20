#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const joined = (...parts) => parts.join("");
const CREATOR_NAME = joined("The", "Vibe", "Founder");
const CREDIT = `By ${CREATOR_NAME}`;
const COPYRIGHT = `Copyright (c) 2026 ${CREATOR_NAME}`;
const SKIP_DIRECTORIES = new Set([".git", "node_modules", "research", "coverage"]);
const MEDIA_EXTENSIONS = new Set([
  ".gif", ".jpeg", ".jpg", ".mov", ".mp4", ".otf", ".png", ".ttf", ".webp", ".woff", ".woff2"
]);
const privateName = joined("aj", "ay");
const privateAbbreviation = joined("t", "v", "f");
const privateProject = joined("ai", "[ ._-]?", "drop", "lets");
const accountPlatforms = [
  joined("insta", "gram"),
  joined("linked", "in"),
  joined("sub", "stack")
].join("|");
const strategyTerms = [
  joined("carou", "sel"),
  joined("field", " guide"),
  joined("proof", " poster"),
  joined("hook", " candidates?"),
  joined("honest", " tension"),
  joined("proof", " angle"),
  joined("reader", " actions?"),
  joined("slide", " plan"),
  joined("editorial", " stance"),
  joined("receipt", " assets?")
].join("|");
const DENIED = [
  ["personal name", new RegExp(`\\b${privateName}\\b`, "gi")],
  ["absolute user path", /(?:\/Users\/|[A-Z]:\\Users\\)/gi],
  ["private account abbreviation", new RegExp(`\\b${privateAbbreviation}\\b`, "gi")],
  ["private project name", new RegExp(`\\b${privateProject}\\b`, "gi")],
  ["account-specific platform", new RegExp(`\\b(?:${accountPlatforms})\\b`, "gi")],
  ["publication tactic", new RegExp(`\\b(?:${strategyTerms})\\b`, "gi")],
  ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ["common API credential", /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,})\b/g]
];

function filesUnder(root, violations, base = root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (SKIP_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(root, entry.name);
    if (entry.isSymbolicLink()) {
      violations.push(`${path.relative(base, absolute)}: symbolic links are not allowed`);
    } else if (entry.isDirectory()) files.push(...filesUnder(absolute, violations, base));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function scanText(label, raw, violations) {
  const withoutCredit = raw.replaceAll(CREDIT, "").replaceAll(COPYRIGHT, "");
  if (new RegExp(CREATOR_NAME, "gi").test(withoutCredit)) {
    violations.push(`${label}: creator identity appears outside the approved credit`);
  }
  for (const [name, expression] of DENIED) {
    expression.lastIndex = 0;
    if (expression.test(raw)) violations.push(`${label}: contains ${name}`);
  }
}

function scanTree(root, violations) {
  let creditCount = 0;
  for (const file of filesUnder(root, violations)) {
    const relative = path.relative(root, file);
    scanText(`${relative} (path)`, relative, violations);
    const extension = path.extname(file).toLowerCase();
    if (MEDIA_EXTENSIONS.has(extension)) {
      violations.push(`${relative}: bundled media or identity asset is not allowed`);
      continue;
    }
    const raw = fs.readFileSync(file, "utf8");
    creditCount += raw.split(CREDIT).length - 1;
    scanText(relative, raw, violations);
    if (
      (relative.startsWith("src/") || relative.startsWith("bin/")) &&
      /(?:\bfetch\s*\(|node:https?|https?\.request|XMLHttpRequest|WebSocket)/.test(raw)
    ) {
      violations.push(`${relative}: CLI network access is not allowed`);
    }
  }
  if (creditCount === 0) violations.push(`approved credit is missing: ${CREDIT}`);
}

function scanHistory(root, violations) {
  if (!fs.existsSync(path.join(root, ".git"))) return;
  let commits = [];
  try {
    commits = execFileSync("git", ["rev-list", "--all"], {
      cwd: root,
      encoding: "utf8"
    }).trim().split("\n").filter(Boolean);
  } catch {
    violations.push("Git history could not be inspected");
    return;
  }
  for (const commit of commits) {
    const metadata = execFileSync(
      "git",
      ["show", "-s", "--format=%an%n%ae%n%cn%n%ce%n%B", commit],
      { cwd: root, encoding: "utf8" }
    );
    scanText(`${commit} (commit metadata)`, metadata, violations);
    const files = execFileSync("git", ["ls-tree", "-r", "--name-only", commit], {
      cwd: root,
      encoding: "utf8"
    }).trim().split("\n").filter(Boolean);
    for (const file of files) {
      scanText(`${commit}:${file} (path)`, file, violations);
      if (MEDIA_EXTENSIONS.has(path.extname(file).toLowerCase())) {
        violations.push(`${commit}:${file}: historical media or identity asset is not allowed`);
        continue;
      }
      try {
        const size = Number(execFileSync("git", ["cat-file", "-s", `${commit}:${file}`], {
          cwd: root,
          encoding: "utf8"
        }).trim());
        if (!Number.isFinite(size) || size > 10 * 1024 * 1024) {
          violations.push(`${commit}:${file}: historical file is too large to inspect safely`);
          continue;
        }
        const raw = execFileSync("git", ["show", `${commit}:${file}`], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 11 * 1024 * 1024
        });
        scanText(`${commit}:${file}`, raw, violations);
      } catch (error) {
        violations.push(`${commit}:${file}: historical file could not be inspected`);
      }
    }
  }
}

export function runPublicSafetyCheck({ root = ROOT, history = true } = {}) {
  const violations = [];
  scanTree(root, violations);
  if (history) scanHistory(root, violations);
  return { ok: violations.length === 0, violations };
}

const invokedFile = process.argv[1] ? fs.realpathSync(path.resolve(process.argv[1])) : "";
const moduleFile = fs.realpathSync(fileURLToPath(import.meta.url));
if (moduleFile === invokedFile) {
  const result = runPublicSafetyCheck({ history: !process.argv.includes("--tree-only") });
  if (!result.ok) {
    process.stderr.write(`${result.violations.map((item) => `FAIL: ${item}`).join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("PASS: public package contains only generic research logic and the approved credit.\n");
  }
}
