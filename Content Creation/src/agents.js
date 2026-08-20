import fs from "node:fs";
import path from "node:path";
import { readJson } from "./json.js";

export const WORKSPACE_API_VERSION = "1.0";
export const ARTIFACT_CONTRACT_VERSION = "1.0";

export const EXPECTED_AGENTS = [
  {
    id: "social-media-research-agent",
    display_name: "Content Research Agent",
    suggested_folder: "Content Research Agent",
    install_order: 1,
    stage: "research"
  },
  {
    id: "hook-writer-agent",
    display_name: "Hook Writer Agent",
    suggested_folder: "Hook Writer Agent",
    install_order: 2,
    stage: "hook"
  },
  {
    id: "carousel-maker-agent",
    display_name: "Carousel Maker Agent",
    suggested_folder: "Carousel Maker Agent",
    install_order: 3,
    stage: "carousel"
  },
  {
    id: "caption-writer-agent",
    display_name: "Caption Writer Agent",
    suggested_folder: "Caption Writer Agent",
    install_order: 4,
    stage: "caption"
  }
];

const REQUIRED_AGENT_FILES = [
  "agent.json",
  "AGENTS.md",
  "CLAUDE.md",
  "PROMPT.md",
  "README.md",
  "NOTICE.md",
  "LICENSE"
];

function readManifest(file) {
  if (!fs.existsSync(file)) return { manifest: null, error: "agent.json is missing" };
  try {
    return { manifest: readJson(file), error: null };
  } catch (error) {
    return { manifest: null, error: error.message };
  }
}

function nonEmptyFile(file) {
  try {
    const stat = fs.statSync(file);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function validateSkill(skillFile) {
  if (!nonEmptyFile(skillFile)) return "is missing or empty";
  const text = fs.readFileSync(skillFile, "utf8");
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return "has no YAML frontmatter";
  const name = frontmatter[1].match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
  if (!name) return "has no valid name";
  const folderName = path.basename(path.dirname(skillFile));
  if (name !== folderName) return `declares name ${name}; expected ${folderName}`;
  if (!/^description:\s*\S.+$/m.test(frontmatter[1])) return "has no description";
  return null;
}

export function validateDeclaredSkills({ root, manifest }) {
  const declared = Array.isArray(manifest?.skills) ? manifest.skills : [];
  const errors = [];
  if (declared.length === 0) errors.push("manifest must declare at least one skill");
  for (const relative of declared) {
    if (typeof relative !== "string" || path.isAbsolute(relative) || relative.split(/[\\/]/).includes("..")) {
      errors.push(`${String(relative)} is not a safe skill path`);
      continue;
    }
    const error = validateSkill(path.join(root, relative));
    if (error) errors.push(`${relative} ${error}`);
  }
  return { declared, errors, valid: errors.length === 0 };
}

function directCandidates(root) {
  if (!fs.existsSync(root)) return [];
  const expectedFolders = new Set(EXPECTED_AGENTS.map((agent) => agent.suggested_folder));
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .filter((entry) => expectedFolders.has(entry.name) || fs.existsSync(path.join(root, entry.name, "agent.json")))
    .map((entry) => ({
      folder: entry.name,
      relative_folder: entry.name,
      root: path.join(root, entry.name),
      manifest_file: path.join(root, entry.name, "agent.json"),
      nested: false
    }));
}

const SEARCH_SKIP = new Set([".git", "node_modules", "projects", "research", "coverage"]);

function recursiveManifestCandidates(searchRoot, { workspaceRoot, outsideWorkspace = false, maxDepth = 8 } = {}) {
  const candidates = [];
  if (!fs.existsSync(searchRoot)) return candidates;
  function walk(directory, depth) {
    if (depth > maxDepth) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || SEARCH_SKIP.has(entry.name)) continue;
      const childRoot = path.join(directory, entry.name);
      if (workspaceRoot && childRoot === workspaceRoot) continue;
      const manifestFile = path.join(childRoot, "agent.json");
      if (fs.existsSync(manifestFile)) {
        const relative = outsideWorkspace
          ? path.relative(workspaceRoot, childRoot)
          : path.relative(searchRoot, childRoot);
        if (!outsideWorkspace && path.dirname(childRoot) === workspaceRoot) continue;
        candidates.push({
          folder: entry.name,
          relative_folder: relative,
          root: childRoot,
          manifest_file: manifestFile,
          nested: true,
          outside_workspace: outsideWorkspace
        });
        continue;
      }
      walk(childRoot, depth + 1);
    }
  }
  walk(searchRoot, 1);
  return candidates;
}

function nestedCandidates(root) {
  return recursiveManifestCandidates(root, { workspaceRoot: root, maxDepth: 8 });
}

function parentCandidates(root) {
  const parent = path.dirname(root);
  if (parent === root || !fs.existsSync(parent)) return [];
  const expectedNames = new Set(EXPECTED_AGENTS.map((agent) => agent.suggested_folder));
  const candidates = [];
  for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const entryRoot = path.join(parent, entry.name);
    if (entryRoot === root) continue;
    const likelyAgentWrapper = expectedNames.has(entry.name) ||
      /(?:research|hook|carousel|caption).*(?:agent|writer|maker)|(?:agent|writer|maker).*(?:research|hook|carousel|caption)/i.test(entry.name);
    if (!likelyAgentWrapper) continue;
    const manifestFile = path.join(entryRoot, "agent.json");
    if (fs.existsSync(manifestFile)) {
      candidates.push({
        folder: entry.name,
        relative_folder: path.relative(root, entryRoot),
        root: entryRoot,
        manifest_file: manifestFile,
        nested: true,
        outside_workspace: true
      });
      continue;
    }
    candidates.push(...recursiveManifestCandidates(entryRoot, {
      workspaceRoot: root,
      outsideWorkspace: true,
      maxDepth: 4
    }));
  }
  return candidates;
}

function inspectCandidate(candidate) {
  const parsed = readManifest(candidate.manifest_file);
  const missing_files = [];
  const empty_files = [];
  for (const relative of REQUIRED_AGENT_FILES) {
    const file = path.join(candidate.root, relative);
    if (!fs.existsSync(file)) missing_files.push(relative);
    else if (!nonEmptyFile(file)) empty_files.push(relative);
  }

  const skillCheck = parsed.error
    ? { declared: [], errors: [], valid: false }
    : validateDeclaredSkills({ root: candidate.root, manifest: parsed.manifest });
  const skill_errors = skillCheck.errors;

  const entrypoint = parsed.manifest?.entrypoint;
  if (entrypoint) {
    const relative = entrypoint.replace(/^\.\//, "");
    if (!nonEmptyFile(path.join(candidate.root, relative))) {
      empty_files.push(relative);
    }
  }

  const installation = parsed.manifest?.installation || {};
  const compatible = installation.kind === "content-creation-agent" &&
    installation.workspace_api === WORKSPACE_API_VERSION &&
    installation.artifact_contract === ARTIFACT_CONTRACT_VERSION;
  const issues = [
    ...missing_files.map((file) => `missing ${file}`),
    ...empty_files.map((file) => `empty ${file}`),
    ...skill_errors
  ];
  return {
    ...candidate,
    id: parsed.manifest?.id || null,
    manifest: parsed.manifest,
    manifest_error: parsed.error,
    missing_files,
    empty_files: [...new Set(empty_files)],
    skill_errors,
    issues,
    compatible,
    ready: !candidate.nested && !parsed.error && issues.length === 0 && compatible
  };
}

export function discoverAgents({ root }) {
  const workspaceRoot = path.resolve(root);
  const candidates = directCandidates(workspaceRoot).map(inspectCandidate);
  const nested = [
    ...nestedCandidates(workspaceRoot),
    ...parentCandidates(workspaceRoot)
  ].map(inspectCandidate);
  const duplicateIds = new Set();
  const byId = new Map();
  for (const candidate of candidates) {
    if (!candidate.id) continue;
    if (byId.has(candidate.id)) duplicateIds.add(candidate.id);
    else byId.set(candidate.id, candidate);
  }
  const byExpectedFolder = new Map(candidates.map((candidate) => [candidate.folder, candidate]));
  const nestedById = new Map(nested.filter((candidate) => candidate.id).map((candidate) => [candidate.id, candidate]));

  const agents = EXPECTED_AGENTS.map((expected) => {
    const installedById = byId.get(expected.id);
    const misplaced = !installedById ? nestedById.get(expected.id) : null;
    if (misplaced) {
      return {
        ...expected,
        state: "nested",
        ready: false,
        folder: misplaced.folder,
        root: misplaced.root,
        relative_folder: misplaced.relative_folder,
        outside_workspace: misplaced.outside_workspace,
        version: misplaced.manifest?.version || null,
        missing_files: misplaced.missing_files,
        empty_files: misplaced.empty_files,
        skill_errors: misplaced.skill_errors,
        manifest_error: misplaced.manifest_error
      };
    }
    const installed = installedById || byExpectedFolder.get(expected.suggested_folder) || null;
    if (!installed) return { ...expected, state: "missing", ready: false };
    const duplicate = duplicateIds.has(expected.id);
    const state = duplicate
      ? "duplicate"
      : installed.manifest_error
        ? "invalid"
        : installed.id !== expected.id
          ? "invalid"
        : installed.issues.length
          ? "incomplete"
          : installed.compatible
            ? "installed"
            : "incompatible";
    return {
      ...expected,
      state,
      ready: state === "installed",
      folder: installed.folder,
      root: installed.root,
      relative_folder: installed.relative_folder,
      version: installed.manifest?.version || null,
      missing_files: installed.missing_files,
      empty_files: installed.empty_files,
      skill_errors: installed.skill_errors,
      manifest_error: installed.manifest_error,
      manifest_id_error: installed.id !== expected.id
        ? `agent.json id must be ${expected.id}; found ${installed.id || "missing"}`
        : null
    };
  });
  const expectedIds = new Set(EXPECTED_AGENTS.map((agent) => agent.id));
  const recognizedNested = nested.filter((candidate) => expectedIds.has(candidate.id));
  const unknown = [...candidates, ...nested]
    .filter((candidate) => !recognizedNested.some((recognized) =>
      candidate.root !== recognized.root && recognized.root.startsWith(`${candidate.root}${path.sep}`)
    ))
    .filter((candidate) => !candidate.id || !expectedIds.has(candidate.id))
    .map((candidate) => ({
      id: candidate.id,
      folder: candidate.relative_folder,
      state: candidate.manifest_error ? "invalid" : candidate.nested ? "nested" : "unknown",
      manifest_error: candidate.manifest_error,
      manifest_id: candidate.id
    }));
  const blockingUnknown = unknown.filter((candidate) => candidate.state === "invalid");
  const next = agents.find((agent) => !agent.ready && agent.state !== "missing") ||
    agents.find((agent) => !agent.ready) || null;
  return {
    workspace_api: WORKSPACE_API_VERSION,
    artifact_contract: ARTIFACT_CONTRACT_VERSION,
    pipeline_ready: agents.every((agent) => agent.ready),
    installed_count: agents.filter((agent) => agent.ready).length,
    expected_count: agents.length,
    agents,
    unknown,
    blocking_unknown: blockingUnknown,
    misplaced: agents.filter((agent) => agent.state === "nested"),
    next_install: next ? {
      id: next.id,
      display_name: next.display_name,
      install_order: next.install_order,
      suggested_folder: next.suggested_folder,
      found_at: next.relative_folder || null,
      reason: next.state
    } : null
  };
}

export function findInstalledAgent({ root, id }) {
  const report = discoverAgents({ root });
  const agent = report.agents.find((item) => item.id === id);
  if (!agent?.ready) {
    throw new Error(`${id} is not installed and compatible (${agent?.state || "missing"})`);
  }
  return agent;
}

export function formatAgentStatus(report) {
  const lines = ["Content Creation setup", ""];
  for (const agent of report.agents) {
    lines.push(`${agent.ready ? "✓" : "✗"} ${agent.install_order}. ${agent.display_name}${agent.ready ? "" : ` — ${agent.state}`}`);
    if (agent.state === "nested") lines.push(`  Found at: ${agent.relative_folder}`);
    if (agent.manifest_error) lines.push(`  agent.json: ${agent.manifest_error}`);
    if (agent.manifest_id_error) lines.push(`  agent.json: ${agent.manifest_id_error}`);
    for (const file of agent.missing_files || []) lines.push(`  Missing: ${file}`);
    for (const file of agent.empty_files || []) lines.push(`  Empty: ${file}`);
    for (const error of agent.skill_errors || []) lines.push(`  Skill: ${error}`);
  }
  if (report.unknown.length) {
    lines.push("Other agent folders found:");
    for (const item of report.unknown) {
      lines.push(`  ! ${item.folder} — ${item.state}${item.manifest_error ? `: ${item.manifest_error}` : ""}`);
    }
    lines.push("");
  }
  lines.push("");
  if (report.pipeline_ready) {
    lines.push("Ready: all four agents are installed.");
  } else if (report.blocking_unknown?.length) {
    lines.push(`Next: repair the invalid agent folder “${report.blocking_unknown[0].folder}” before installing another copy.`);
  } else if (report.next_install.reason === "nested") {
    lines.push(`Next: move “${report.next_install.found_at}” directly into Content Creation as “${report.next_install.suggested_folder}”. Do not reinstall it.`);
  } else if (["invalid", "incomplete", "incompatible", "duplicate"].includes(report.next_install.reason)) {
    lines.push(`Next: repair ${report.next_install.display_name} (${report.next_install.reason}) before continuing.`);
  } else {
    lines.push(`Next: install ${report.next_install.display_name}.`);
  }
  return lines.join("\n");
}
