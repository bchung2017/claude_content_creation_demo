import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson } from "./json.js";
import { routeInput } from "./route.js";
import { initProject } from "./workspace.js";
import { validateProject } from "./validate.js";
import { writeBrief } from "./brief.js";
import { findFrameGrabCli, registerMediaAsset, routeMedia } from "./media.js";
import { importResearchHandoff } from "./research-handoff.js";
import { discoverBrandGuides } from "./brand.js";
import { registerRenderedSlide } from "./slides.js";
import { discoverAgents, findInstalledAgent, formatAgentStatus, validateDeclaredSkills } from "./agents.js";
import { registerCaption } from "./caption.js";
import { detectChrome } from "./browser.js";
import { evaluateBrandProfile, formatBrandCheck } from "./brand.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HELP = `Content Creation

Usage:
  content-creation route --topic <text> [--url <url> ...]
  content-creation agents [--json]
  content-creation brand-discover [--workspace <main-folder>]
  content-creation brand-check <brand.json-or-project-folder> [--json]
  content-creation init --topic <text> [--goal <text>] [--url <url> ...] [--out <dir>]
  content-creation research-import <project-dir> --from <research-project-dir>
  content-creation validate <project-dir> [--json]
  content-creation brief <project-dir> [--out <file>]
  content-creation media-route --url <url>
  content-creation media-register <project-dir> --url <url> --file <path>
      --usage <text> [--provider <provider>] [--kind <kind>] [--source-id <id>]
      [--rights <status>] [--title <text>] [--creator <text>]
  content-creation slide-register <project-dir> --slide <slide-id> --file <png>
  content-creation caption-register <project-dir>
  content-creation doctor
`;

const KNOWN_OPTIONS = new Set(["creator", "file", "from", "goal", "json", "kind", "out", "provider", "rights", "slide", "source-id", "title", "topic", "url", "usage", "workspace"]);
const ARRAY_OPTIONS = new Set(["url"]);

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const key = token.slice(2);
    if (!KNOWN_OPTIONS.has(key)) throw new Error(`unknown option --${key}`);
    if (key === "json") {
      options.json = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`--${key} needs a value`);
    index += 1;
    if (ARRAY_OPTIONS.has(key)) (options[key] ||= []).push(value);
    else options[key] = value;
  }
  return { positional, options };
}

function print(value) {
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

function printValidation(result) {
  process.stdout.write(`${result.ok ? "PASS" : "FAIL"} · ${result.errors.length} error(s) · ${result.warnings.length} warning(s)\n`);
  for (const error of result.errors) process.stdout.write(`  ✗ ${error}\n`);
  for (const warning of result.warnings) process.stdout.write(`  ! ${warning}\n`);
}

export function buildDoctorReport({
  root = ROOT,
  nodeVersion = process.versions.node,
  env = process.env,
  chrome = detectChrome({ env }),
  webSearch = { available: true, provider: "host web search" }
} = {}) {
  const major = Number(nodeVersion.split(".")[0]);
  const manifestFile = path.join(root, "workspace.json");
  const packageFile = path.join(root, "package.json");
  const manifest = fs.existsSync(manifestFile);
  const packageManifest = fs.existsSync(packageFile);
  let packageJson = {};
  let workspaceManifest = {};
  if (packageManifest) {
    try { packageJson = readJson(packageFile); } catch {}
  }
  if (manifest) {
    try { workspaceManifest = readJson(manifestFile); } catch {}
  }
  const installation = discoverAgents({ root });
  const workspaceSkills = validateDeclaredSkills({ root, manifest: workspaceManifest });
  const framegrabCli = findFrameGrabCli({ env });
  const workspaceReady = major >= 20 && manifest && packageManifest && workspaceSkills.valid;
  const brokenAgentStates = installation.agents
    .filter((agent) => !["installed", "missing"].includes(agent.state))
    .map((agent) => ({ id: agent.id, state: agent.state }));
  const brokenUnknownAgents = installation.blocking_unknown || [];
  const installedAgentsHealthy = brokenAgentStates.length === 0 && brokenUnknownAgents.length === 0;
  const searchAvailable = Boolean(webSearch?.available);
  const discoveryModes = [
    ...(chrome.available ? ["browser"] : []),
    ...(searchAvailable ? ["web-search"] : [])
  ];
  return {
    ok: workspaceReady && discoveryModes.length > 0 && installedAgentsHealthy,
    discovery: {
      modes_available: discoveryModes,
      default_mode: discoveryModes[0] || null
    },
    node: { required: ">=20", current: nodeVersion, ok: major >= 20 },
    manifest,
    package_manifest: packageManifest,
    npm_dependencies: Object.keys(packageJson.dependencies || {}).length,
    workspace_skills: workspaceSkills,
    workspace_ready: workspaceReady,
    installed_agents_healthy: installedAgentsHealthy,
    blocking_agent_states: [...brokenAgentStates, ...brokenUnknownAgents],
    pipeline_ready: installation.pipeline_ready,
    installation,
    components: installation.agents,
    components_ready: installation.pipeline_ready,
    browser: {
      required: !searchAvailable,
      provider: "Codex browser connection or official Claude in Chrome",
      chrome: {
        required: !searchAvailable,
        installed: chrome.available,
        executable: chrome.executable,
        detected_by: chrome.detected_by
      },
      connection: {
        required: true,
        status: "user-confirmation-required"
      },
      signed_in_accounts: {
        required: ["X", "Reddit", "Digg"],
        status: "user-confirmation-required"
      },
      ready_for_research: chrome.available ? "requires-user-confirmation" : false,
      credentials_stored: false
    },
    web_search: {
      required: !chrome.available,
      available: searchAvailable,
      provider: webSearch?.provider || "",
      evidence_grade: "snippet",
      note: "Research falls back to web-search mode. Snippet-only sources cannot carry a verified claim."
    },
    media: {
      framegrab_cli: {
        optional: true,
        bundled: false,
        available: framegrabCli.available,
        executable: framegrabCli.executable,
        detected_by: framegrabCli.source
      },
      x_browser_fallback: {
        available: chrome.available,
        provider: "ssstwitter-browser",
        url: "https://ssstwitter.com/",
        public_posts_only: true
      }
    }
  };
}

export function formatDoctorReport(report) {
  const lines = [
    `Content Creation health check · ${report.ok ? "PASS" : "NEEDS ATTENTION"}`,
    "",
    `${report.node.ok ? "✓" : "✗"} Node.js ${report.node.current} (requires ${report.node.required})`,
    `${report.workspace_ready ? "✓" : "✗"} Shared workspace files and routing skill`,
    `${report.installed_agents_healthy ? "✓" : "✗"} Installed agent files and declared skills`,
    `${(report.discovery?.modes_available || []).length ? "✓" : "✗"} Discovery mode available: ${(report.discovery?.modes_available || []).join(", ") || "none"}`,
    `${report.browser.chrome.installed ? "✓" : "○"} Google Chrome or supported Chromium browser (browser mode)`,
    `${report.web_search?.available ? "✓" : "○"} Host web search (web-search mode, snippet-grade evidence)`,
    ...(report.browser.chrome.installed
      ? [
        "? Browser connection enabled — confirm in Codex or Claude",
        "? X, Reddit, and Digg signed in — confirm in the browser"
      ]
      : []),
    "",
    formatAgentStatus(report.installation)
  ];
  if (!(report.discovery?.modes_available || []).length) {
    lines.push("", "Next: install Google Chrome, or set CONTENT_CREATION_CHROME to its executable path, or enable host web search, then run this check again.");
  } else if (!report.browser.chrome.installed) {
    lines.push("", "No browser detected. Research runs in web-search mode with snippet-grade evidence. See Content Research Agent/docs/WEB-SEARCH-FIRST.md.");
  } else if (!report.installed_agents_healthy) {
    lines.push("", "Next: follow the agent repair instruction above before continuing.");
  } else if (!report.pipeline_ready) {
    lines.push("", "Setup is healthy so far. Install the next numbered agent.");
  } else {
    lines.push("", "Files are healthy. Confirm browser control and account sign-in before research.");
  }
  return lines.join("\n");
}

export async function main(argv) {
  const [command = "help", ...rest] = argv;
  const { positional, options } = parseArgs(rest);
  if (["help", "--help", "-h"].includes(command)) return process.stdout.write(HELP);

  if (command === "doctor") {
    const report = buildDoctorReport();
    print(options.json ? report : formatDoctorReport(report));
    if (!report.ok) process.exitCode = 1;
    return;
  }
  if (command === "agents") {
    const report = discoverAgents({ root: ROOT });
    print(options.json ? report : formatAgentStatus(report));
    return;
  }
  if (command === "route") {
    if (!options.topic) throw new Error("route needs --topic");
    print(routeInput({ topic: options.topic, urls: options.url || [] }));
    return;
  }
  if (command === "brand-discover") {
    print(discoverBrandGuides({
      packageRoot: ROOT,
      workspaceRoot: options.workspace || path.dirname(ROOT)
    }));
    return;
  }
  if (command === "brand-check") {
    if (!positional[0]) throw new Error("brand-check needs <brand.json-or-project-folder>");
    const target = path.resolve(positional[0]);
    const file = fs.existsSync(target) && fs.statSync(target).isDirectory()
      ? path.join(target, "brand.json")
      : target;
    const report = evaluateBrandProfile(readJson(file));
    print(options.json ? report : formatBrandCheck(report));
    if (!report.complete) process.exitCode = 1;
    return;
  }
  if (command === "init") {
    if (!options.topic) throw new Error("init needs --topic");
    print(initProject({ topic: options.topic, goal: options.goal, urls: options.url || [], out: options.out }));
    return;
  }
  if (command === "research-import") {
    if (!positional[0] || !options.from) {
      throw new Error("research-import needs <project-dir> and --from <research-project-dir>");
    }
    const researchAgent = findInstalledAgent({ root: ROOT, id: "social-media-research-agent" });
    print(importResearchHandoff({
      projectDir: positional[0],
      researchProjectDir: options.from,
      researchAgentRoot: researchAgent.root
    }));
    return;
  }
  if (command === "validate") {
    const project = path.resolve(positional[0] || "");
    const result = validateProject(project);
    if (options.json) print({ ok: result.ok, errors: result.errors, warnings: result.warnings });
    else printValidation(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === "brief") {
    const project = path.resolve(positional[0] || "");
    print(writeBrief(project, options.out));
    return;
  }
  if (command === "media-route") {
    if (!options.url) throw new Error("media-route needs --url");
    print(routeMedia({ sourceUrl: options.url[0] || options.url }));
    return;
  }
  if (command === "media-register") {
    const project = path.resolve(positional[0] || "");
    if (!positional[0] || !options.url || !options.file || !options.usage) {
      throw new Error("media-register needs <project-dir>, --url, --file, and --usage");
    }
    const asset = registerMediaAsset({
      projectDir: project,
      sourceUrl: options.url[0] || options.url,
      file: options.file,
      provider: options.provider || "manual",
      kind: options.kind || "reference",
      sourceId: options["source-id"] || "",
      usage: options.usage,
      rightsStatus: options.rights || "permission-needed",
      title: options.title || "",
      creator: options.creator || ""
    });
    print(asset);
    return;
  }
  if (command === "slide-register") {
    const project = path.resolve(positional[0] || "");
    if (!positional[0] || !options.slide || !options.file) {
      throw new Error("slide-register needs <project-dir>, --slide, and --file");
    }
    print(registerRenderedSlide({
      projectDir: project,
      slideId: options.slide,
      file: options.file
    }));
    return;
  }
  if (command === "caption-register") {
    if (!positional[0]) throw new Error("caption-register needs <project-dir>");
    print(registerCaption({ projectDir: positional[0] }));
    return;
  }
  throw new Error(`unknown command ${command}`);
}
