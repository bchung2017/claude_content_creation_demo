import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PROFILE_IDS, PROFILES } from "./profiles.js";
import { routeResearch } from "./router.js";
import { findVibeTasks, initProject } from "./workspace.js";
import { validateProject } from "./validate.js";
import { writeBrief } from "./brief.js";
import { writeVibeTasksPacket } from "./packet.js";
import { recordBrowserTrace } from "./browser-trace.js";
import { detectChrome } from "./browser.js";
import {
  captureLearning,
  decideLearning,
  logDecision,
  logSession,
  readLearningMemory
} from "./ledger.js";

const HELP = `Social Media Research Agent

Usage:
  content-research-agent profiles
  content-research-agent route --topic <text> [--goal <text>] [--type <id>]
  content-research-agent init --topic <text> [--goal <text>] [--type <id>]
                              [--url <url> ...] [--out <dir>]
  content-research-agent browser-log <project-dir> --agent <name> --tool <name>
                                      --discovery x.com --discovery digg.com
                                      --discovery reddit.com
                                      --outcome <status> --outcome <status>
                                      --outcome <status> [--google-query <text>]
                                      [--google-opened <url> ...]
                                      --query <text> --query <text> --query <text>
                                      [--opened <url> ...]
                                      [--notes <text>]
  content-research-agent session-log <project-dir> --agent <name>
                                      --summary <text> [--status <status>]
  content-research-agent decision-log <project-dir> --agent <name>
                                       --title <text> --decision <text>
                                       --rationale <text>
  content-research-agent learning-capture <project-dir> --agent <name>
                                          --feedback <text> --learning <text>
                                          [--scope job|package]
  content-research-agent learning-decide <project-dir> --agent <name>
                                         --learning-id <id>
                                         --decision approved|declined
                                         [--notes <text>]
  content-research-agent memory <project-dir> [--json]
  content-research-agent validate <project-dir> [--json]
  content-research-agent brief <project-dir> [--out <file>]
  content-research-agent packet <project-dir> [--out <file>]
  content-research-agent doctor

Content types:
  ${PROFILE_IDS.join(", ")}
`;

const KNOWN_OPTIONS = new Set([
  "agent",
  "decision",
  "discovery",
  "feedback",
  "goal",
  "google-query",
  "google-opened",
  "json",
  "learning",
  "learning-id",
  "notes",
  "opened",
  "outcome",
  "out",
  "query",
  "rationale",
  "scope",
  "status",
  "summary",
  "title",
  "tool",
  "topic",
  "type",
  "url"
]);

export function parseArgs(argv) {
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
    if (["url", "query", "discovery", "opened", "outcome", "google-opened"].includes(key)) {
      options[key] ||= [];
      options[key].push(value);
    } else {
      options[key] = value;
    }
  }
  return { positional, options };
}

function outputJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printValidation(result) {
  process.stdout.write(`${result.ok ? "PASS" : "FAIL"} · ${result.errors.length} error(s) · ${result.warnings.length} warning(s)\n`);
  for (const error of result.errors) process.stdout.write(`  ✗ ${error}\n`);
  for (const warning of result.warnings) process.stdout.write(`  ! ${warning}\n`);
}

function detectOllama() {
  const versionResult = spawnSync("ollama", ["--version"], { encoding: "utf8", timeout: 3000 });
  const installed = versionResult.status === 0;
  const versionOutput = `${versionResult.stdout || ""}\n${versionResult.stderr || ""}`;
  const versionMatch = versionOutput.match(/(?:client )?version(?: is)?\s+([^\s]+)/i);
  const serviceResult = installed
    ? spawnSync("ollama", ["list"], { encoding: "utf8", timeout: 3000 })
    : null;
  return {
    installed,
    running: serviceResult?.status === 0,
    version: installed ? (versionMatch?.[1] || "detected") : ""
  };
}

export function buildDoctorReport({
  agentRoot,
  nodeVersion = process.versions.node,
  ollama = detectOllama(),
  env = process.env,
  chrome = detectChrome({ env })
}) {
  const major = Number(nodeVersion.split(".")[0]);
  const nodeOk = Number.isInteger(major) && major >= 20;
  const manifest = fs.existsSync(path.join(agentRoot, "agent.json"));
  const packageFile = path.join(agentRoot, "package.json");
  let dependencyCount = null;
  let packageManifest = false;
  if (fs.existsSync(packageFile)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
      dependencyCount = Object.keys(pkg.dependencies || {}).length;
      packageManifest = true;
    } catch {}
  }
  const vibeTasksRoot = findVibeTasks(agentRoot);
  return {
    ok: nodeOk && manifest && packageManifest && chrome.available,
    node: {
      required: ">=20",
      current: nodeVersion,
      ok: nodeOk
    },
    manifest,
    package_manifest: packageManifest,
    npm_dependencies: dependencyCount,
    browser: {
      required: true,
      provider: "Codex or Claude host",
      chrome: {
        installed: chrome.available,
        executable: chrome.executable,
        detected_by: chrome.detected_by
      },
      connection: "user-confirmation-required",
      signed_in_accounts: {
        required: ["X", "Reddit", "Digg"],
        status: "user-confirmation-required"
      }
    },
    local_model: {
      required: false,
      family: "Gemma 4",
      runtime: "Ollama",
      installed: Boolean(ollama.installed),
      running: Boolean(ollama.running),
      version: ollama.version || "",
      setup: "See docs/LOCAL-MODEL.md. Installation and model download require explicit approval."
    },
    vibetasks: {
      required: false,
      detected: Boolean(vibeTasksRoot)
    },
    handoff: vibeTasksRoot
      ? "Run the parent VibeTasks CLI with: vibetasks import <project>/VIBETASKS-TASKS.json"
      : "Standalone mode. Generate the same packet with the packet command."
  };
}

export function formatDoctorReport(report) {
  const lines = [
    `Content Research Agent health check · ${report.ok ? "PASS" : "NEEDS ATTENTION"}`,
    "",
    `${report.node.ok ? "✓" : "✗"} Node.js ${report.node.current} (requires ${report.node.required})`,
    `${report.manifest && report.package_manifest ? "✓" : "✗"} Agent files`,
    `${report.browser.chrome.installed ? "✓" : "✗"} Google Chrome or supported Chromium browser`,
    "? Browser connection enabled — confirm in Codex or Claude",
    "? X, Reddit, and Digg signed in — confirm in the browser"
  ];
  if (!report.browser.chrome.installed) {
    lines.push("", "Next: install Google Chrome, or set CONTENT_CREATION_CHROME to its executable path, then run this check again.");
  } else {
    lines.push("", "Local prerequisites pass. Confirm browser control and account sign-in before research.");
  }
  return lines.join("\n");
}

export async function main(argv) {
  const [command = "help", ...rest] = argv;
  const { positional, options } = parseArgs(rest);

  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(HELP);
    return;
  }
  if (command === "profiles") {
    outputJson(Object.values(PROFILES).map((profile) => ({
      id: profile.id,
      display_name: profile.displayName,
      specialist: profile.skill,
      mode: profile.mode,
      maturity: profile.maturity
    })));
    return;
  }
  if (command === "route") {
    outputJson(routeResearch({
      topic: options.topic || positional.join(" "),
      goal: options.goal || "",
      type: options.type || ""
    }));
    return;
  }
  if (command === "init") {
    const result = initProject({
      topic: options.topic,
      goal: options.goal,
      type: options.type,
      urls: options.url || [],
      output: options.out
    });
    outputJson({
      job_id: result.route.project_id,
      project_dir: result.projectDir,
      content_type: result.profile.id,
      specialist: result.profile.skill,
      next: `Record the browser-first action with: content-research-agent browser-log "${result.projectDir}" --agent <name> --tool <browser> --discovery x.com --discovery digg.com --discovery reddit.com --outcome <status> --outcome <status> --outcome <status> --query "site:x.com <topic>" --query "site:digg.com <topic>" --query "site:reddit.com <topic>" --opened <url>`
    });
    return;
  }
  if (command === "validate") {
    if (!positional[0]) throw new Error("validate requires <project-dir>");
    const result = validateProject(positional[0]);
    if (options.json) outputJson({ ok: result.ok, errors: result.errors, warnings: result.warnings });
    else printValidation(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === "browser-log") {
    if (!positional[0]) throw new Error("browser-log requires <project-dir>");
    const result = recordBrowserTrace(positional[0], {
      agent: options.agent,
      tool: options.tool,
      searches: options.query || [],
      discoverySites: options.discovery || [],
      discoveryOutcomes: options.outcome || [],
      googleQuery: options["google-query"] || "",
      googleOpenedUrls: options["google-opened"] || [],
      openedUrls: options.opened || [],
      notes: options.notes || ""
    });
    process.stdout.write(`Recorded mandatory browser-first trace: ${result.destination}\n`);
    return;
  }
  if (command === "session-log") {
    if (!positional[0]) throw new Error("session-log requires <project-dir>");
    const result = logSession(positional[0], {
      agent: options.agent,
      summary: options.summary,
      status: options.status || "progress"
    });
    outputJson(result.event);
    return;
  }
  if (command === "decision-log") {
    if (!positional[0]) throw new Error("decision-log requires <project-dir>");
    const result = logDecision(positional[0], {
      agent: options.agent,
      title: options.title,
      decision: options.decision,
      rationale: options.rationale
    });
    outputJson(result.event);
    return;
  }
  if (command === "learning-capture") {
    if (!positional[0]) throw new Error("learning-capture requires <project-dir>");
    const result = captureLearning(positional[0], {
      agent: options.agent,
      feedback: options.feedback,
      learning: options.learning,
      scope: options.scope || "job"
    });
    outputJson({
      ...result.event,
      next: result.event.scope === "package"
        ? "Tell the user what was captured and ask whether to implement this package change."
        : "Apply this learning within the current job."
    });
    return;
  }
  if (command === "learning-decide") {
    if (!positional[0]) throw new Error("learning-decide requires <project-dir>");
    const result = decideLearning(positional[0], {
      learningId: options["learning-id"],
      decision: options.decision,
      agent: options.agent,
      notes: options.notes || ""
    });
    outputJson(result.event);
    return;
  }
  if (command === "memory") {
    if (!positional[0]) throw new Error("memory requires <project-dir>");
    const result = readLearningMemory(positional[0]);
    outputJson(result);
    return;
  }
  if (command === "brief") {
    if (!positional[0]) throw new Error("brief requires <project-dir>");
    const result = writeBrief(positional[0], options.out);
    process.stdout.write(`Wrote validated research brief: ${result.destination}\n`);
    return;
  }
  if (command === "packet") {
    if (!positional[0]) throw new Error("packet requires <project-dir>");
    const result = writeVibeTasksPacket(positional[0], options.out);
    process.stdout.write(`Wrote VibeTasks packet: ${result.destination}\n`);
    return;
  }
  if (command === "doctor") {
    const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const report = buildDoctorReport({ agentRoot });
    if (options.json) outputJson(report);
    else process.stdout.write(`${formatDoctorReport(report)}\n`);
    if (!report.ok) process.exitCode = 1;
    return;
  }

  throw new Error(`unknown command "${command}"\n\n${HELP}`);
}
