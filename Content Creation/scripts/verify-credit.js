#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CREATOR = ["The", "Vibe", "Founder"].join("");
const CREDIT = `By ${CREATOR}`;
const COPYRIGHT = `Copyright (c) 2026 ${CREATOR}`;

export const ROOT_REQUIREMENTS = [
  ["NOTICE.md", [CREDIT, COPYRIGHT, "npm run verify:credit"]],
  ["LICENSE", [COPYRIGHT, "MIT License"]],
  ["README.md", [CREDIT, "NOTICE.md", "npm run verify:credit"]],
  ["START-HERE.md", [CREDIT, "NOTICE.md"]],
  ["AGENTS.md", [CREDIT, "NOTICE.md", "npm run verify:credit"]],
  ["CLAUDE.md", [CREDIT, "NOTICE.md", "npm run verify:credit"]],
  ["PROMPT.md", ["NOTICE.md", "release invariant"]]
];

export const COMPONENTS = [
  { path: "Content Research Agent", license: true },
  { path: "Hook Writer Agent", license: true },
  { path: "Carousel Maker Agent", license: true },
  { path: "Caption Writer Agent", license: true }
];

const COMPONENT_REQUIREMENTS = [
  ["README.md", [CREDIT]],
  ["NOTICE.md", [CREDIT, COPYRIGHT, "must not"]],
  ["AGENTS.md", [CREDIT, "NOTICE.md"]],
  ["CLAUDE.md", [CREDIT, "NOTICE.md"]],
  ["PROMPT.md", []],
  ["LICENSE", [COPYRIGHT, "MIT License"]]
];

function rootFromArgs(args) {
  const index = args.indexOf("--root");
  if (index < 0) return MODULE_ROOT;
  if (!args[index + 1]) throw new Error("--root requires a directory");
  return path.resolve(args[index + 1]);
}

function requireMarkers(root, relative, markers, errors) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    errors.push(`${relative}: protected attribution file is missing`);
    return;
  }
  const text = fs.readFileSync(file, "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) errors.push(`${relative}: protected attribution is missing: ${marker}`);
  }
}

function requireManifestCredit(root, relative, errors) {
  const file = path.join(root, relative);
  try {
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    if (manifest.credit !== CREDIT) errors.push(`${relative}: credit must be exactly ${CREDIT}`);
  } catch (error) {
    errors.push(`${relative}: cannot verify manifest credit (${error.message})`);
  }
}

export function verifyCredit({ root = MODULE_ROOT } = {}) {
  const errors = [];
  let rootManifest;
  try {
    const workspaceFile = path.join(root, "workspace.json");
    const agentFile = path.join(root, "agent.json");
    rootManifest = JSON.parse(fs.readFileSync(fs.existsSync(workspaceFile) ? workspaceFile : agentFile, "utf8"));
  } catch (error) {
    return { ok: false, errors: [`package manifest: cannot verify package (${error.message})`] };
  }

  if (rootManifest.id !== "content-creation-workspace") {
    for (const [relative, markers] of COMPONENT_REQUIREMENTS) {
      requireMarkers(root, relative, markers, errors);
    }
    requireManifestCredit(root, "agent.json", errors);
    return { ok: errors.length === 0, errors };
  }

  for (const [relative, markers] of ROOT_REQUIREMENTS) requireMarkers(root, relative, markers, errors);
  requireManifestCredit(root, "workspace.json", errors);

  for (const component of COMPONENTS) {
    const base = component.path;
    if (!fs.existsSync(path.join(root, base))) continue;
    requireMarkers(root, `${base}/README.md`, [CREDIT], errors);
    requireMarkers(root, `${base}/NOTICE.md`, [CREDIT, COPYRIGHT, "must not"], errors);
    requireMarkers(root, `${base}/AGENTS.md`, [CREDIT, "NOTICE.md"], errors);
    requireMarkers(root, `${base}/CLAUDE.md`, [CREDIT, "NOTICE.md"], errors);
    requireManifestCredit(root, `${base}/agent.json`, errors);
    if (component.license) requireMarkers(root, `${base}/LICENSE`, [COPYRIGHT, "MIT License"], errors);
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const root = rootFromArgs(process.argv.slice(2));
  const result = verifyCredit({ root });
  if (!result.ok) {
    process.stderr.write(`${result.errors.map((error) => `FAIL: ${error}`).join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("PASS: protected attribution is intact across the umbrella and every agent.\n");
  }
}

const invokedFile = process.argv[1] ? fs.realpathSync(path.resolve(process.argv[1])) : "";
const moduleFile = fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedFile === moduleFile) main();
