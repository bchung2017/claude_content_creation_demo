import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { routeResearch } from "../src/router.js";
import { PROFILES } from "../src/profiles.js";
import { findVibeTasks, initProject, writeJson } from "../src/workspace.js";
import { validateProject } from "../src/validate.js";
import { writeBrief } from "../src/brief.js";
import { buildVibeTasksPacket, writeVibeTasksPacket } from "../src/packet.js";
import { recordBrowserTrace } from "../src/browser-trace.js";
import { parseSnippet, recordSearchTrace } from "../src/search-trace.js";
import { hostMatchesSite } from "../src/discovery.js";
import { buildDoctorReport, parseArgs } from "../src/cli.js";
import {
  captureLearning,
  decideLearning,
  ledgerFiles,
  logDecision,
  logSession,
  readLearningMemory,
  readNdjson
} from "../src/ledger.js";
import { runPublicSafetyCheck } from "../scripts/public-safety-check.js";
import { detectChrome } from "../src/browser.js";

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function completeSocialProject(root) {
  const projectDir = path.join(root, "research", "ai-coding-agent-signals");
  const initialized = initProject({
    topic: "AI coding agent signals",
    goal: "Identify current social signals and verify the strongest claim",
    type: "social-media",
    output: projectDir
  });
  const projectId = initialized.route.project_id;
  recordBrowserTrace(initialized.projectDir, {
    agent: "Codex",
    tool: "browser",
    searches: [
      "site:x.com AI coding agent signals",
      "site:digg.com AI coding agent signals",
      "site:reddit.com AI coding agent signals"
    ],
    discoverySites: ["x.com", "digg.com", "reddit.com"],
    discoveryOutcomes: ["useful", "no-useful-results", "useful"],
    openedUrls: [
      "https://x.com/example/status/1",
      "https://example.com/official-release"
    ],
    startedAt: "2026-08-06T12:00:00.000Z"
  });
  writeJson(initialized.files.evidence, {
    schema_version: "1.0",
    project_id: projectId,
    as_of: "2026-08-06",
    summary: "Social discussion points to a release that the official record confirms.",
    sources: [
      {
        id: "src-social",
        title: "Original social discussion",
        source_type: "community",
        url: "https://x.com/example/status/1",
        captured_at: "2026-08-06"
      },
      {
        id: "src-official",
        title: "Official release record",
        source_type: "official",
        url: "https://example.com/official-release",
        captured_at: "2026-08-06"
      }
    ],
    claims: [
      {
        id: "claim-1",
        text: "The documented release is available.",
        kind: "availability",
        verification: "verified",
        source_ids: ["src-official"],
        evidence: "The opened official release record marks it available.",
        as_of: "2026-08-06",
        publishable: true
      }
    ],
    gaps: []
  });
  writeJson(initialized.files.analysis, {
    schema_version: "1.0",
    project_id: projectId,
    content_type: "social-media",
    conclusion: "The strongest social signal is supported by the official release record.",
    scope: "X, Digg, and Reddit discovery as of 2026-08-06.",
    specialist: {
      topic_scope: "AI coding agent release discussion in English-language public sources.",
      sample_definition: "Accessible English-language posts found by the required three-platform sweep.",
      time_window: "Public sources available through 2026-08-06.",
      claim_ranking_method: "Evidence quality, distinct firsthand authors, cross-platform repetition, then recency.",
      stopping_rule: "Stop after the required sweep and verification of the strongest repeated factual claim.",
      signal_counts: [
        { platform: "x.com", unique_authors: 1, qualifying_posts: 1 },
        { platform: "digg.com", unique_authors: 0, qualifying_posts: 0 },
        { platform: "reddit.com", unique_authors: 1, qualifying_posts: 1 }
      ],
      platform_findings: ["X and Reddit discussed the release; Digg had no useful result."],
      firsthand_signals: ["The original X post linked the official record."],
      narrative_patterns: ["Discussion emphasized availability."],
      disagreements: [],
      verification_source_ids: ["src-official"],
      coverage_gaps: ["Private communities were outside scope."]
    }
  });
  writeJson(initialized.files.assets, {
    schema_version: "1.0",
    project_id: projectId,
    assets: []
  });
  logSession(initialized.projectDir, {
    agent: "Codex",
    summary: "Completed social discovery and opened verification sources."
  });
  logDecision(initialized.projectDir, {
    agent: "Codex",
    title: "Evidence ranking",
    decision: "Rank the opened official record above repeated social claims",
    rationale: "The official record directly establishes availability."
  });
  return initialized;
}

const X_SNIPPET = {
  id: "SNIP-X-1",
  site: "x.com",
  query: "site:x.com AI coding agent signals",
  title: "Original social discussion",
  url: "https://x.com/example/status/1",
  snippet: "A practitioner reports the release is now available.",
  retrieved_at: "2026-08-06T12:00:00.000Z"
};

function searchSweep(projectDir, overrides = {}) {
  return recordSearchTrace(projectDir, {
    agent: "Claude",
    tool: "host web search",
    searches: [
      "site:x.com AI coding agent signals",
      "site:digg.com AI coding agent signals",
      "site:reddit.com AI coding agent signals"
    ],
    discoverySites: ["x.com", "digg.com", "reddit.com"],
    discoveryOutcomes: ["useful", "no-useful-results", "blocked"],
    snippets: [X_SNIPPET],
    startedAt: "2026-08-06T12:00:00.000Z",
    ...overrides
  });
}

/** A complete, valid web-search-mode project: snippet evidence, no opened pages. */
function completeSearchProject(root) {
  const projectDir = path.join(root, "research", "search-mode-job");
  const initialized = initProject({
    topic: "AI coding agent signals",
    goal: "Map the social signal without a browser",
    type: "social-media",
    output: projectDir
  });
  const projectId = initialized.route.project_id;
  searchSweep(initialized.projectDir, {
    snippets: [
      X_SNIPPET,
      {
        ...X_SNIPPET,
        id: "SNIP-X-2",
        url: "https://x.com/other/status/2",
        title: "Second independent discussion",
        snippet: "A second author independently reports the same release."
      }
    ],
    notes: "reddit.com refuses this host's search user agent."
  });
  writeJson(initialized.files.evidence, {
    schema_version: "1.0",
    project_id: projectId,
    as_of: "2026-08-06",
    summary: "Two X authors report the same release; no page could be opened.",
    sources: [
      {
        id: "src-x-1",
        title: "Original social discussion",
        source_type: "community",
        publisher: "example on X",
        url: "https://x.com/example/status/1",
        captured_at: "2026-08-06"
      },
      {
        id: "src-x-2",
        title: "Second independent discussion",
        source_type: "community",
        publisher: "other on X",
        url: "https://x.com/other/status/2",
        captured_at: "2026-08-06"
      }
    ],
    claims: [
      {
        id: "claim-1",
        text: "Two independent X authors report the release.",
        kind: "fact",
        verification: "corroborated",
        source_ids: ["src-x-1", "src-x-2"],
        evidence: "Both captured snippets describe the same release.",
        publishable: true
      }
    ],
    gaps: [{ description: "Reddit is unreachable from this host.", blocking: false }]
  });
  writeJson(initialized.files.analysis, {
    schema_version: "1.0",
    project_id: projectId,
    content_type: "social-media",
    conclusion: "Snippet-only signal supports a corroborated, not verified, finding.",
    scope: "Web-search sweep of X, Digg, and Reddit as of 2026-08-06.",
    specialist: {
      topic_scope: "AI coding agent release discussion.",
      sample_definition: "Search snippets returned by the required three-platform sweep.",
      time_window: "Public sources through 2026-08-06.",
      claim_ranking_method: "Evidence quality, then distinct firsthand authors.",
      stopping_rule: "Stop after the required sweep; no page could be opened.",
      signal_counts: [
        { platform: "x.com", unique_authors: 2, qualifying_posts: 2 },
        { platform: "digg.com", unique_authors: 0, qualifying_posts: 0 },
        { platform: "reddit.com", unique_authors: 0, qualifying_posts: 0 }
      ],
      platform_findings: ["Only X produced on-domain results."],
      firsthand_signals: ["Two distinct X authors."],
      narrative_patterns: ["Availability is the recurring theme."],
      disagreements: [],
      verification_source_ids: ["src-x-1"],
      coverage_gaps: ["Reddit and Digg contributed nothing."]
    }
  });
  logSession(initialized.projectDir, { agent: "Claude", summary: "Web-search sweep complete." });
  logDecision(initialized.projectDir, {
    agent: "Claude",
    title: "Run in web-search mode",
    decision: "Capture snippets instead of opening pages",
    rationale: "No browser is available in this environment."
  });
  return initialized;
}

test("social requests route to the only production specialist", () => {
  const route = routeResearch({ topic: "AI coding agents", goal: "Research the social conversation" });
  assert.equal(route.status, "routed");
  assert.equal(route.content_type, "social-media");
  assert.equal(route.maturity, "production");
});

test("a general topic defaults to social-media discovery", () => {
  const route = routeResearch({ topic: "How people are reacting to battery recycling" });
  assert.equal(route.status, "routed");
  assert.equal(route.specialist, "social-media-research");
});

test("ordinary content topics do not become unsupported source types because of one noun", () => {
  for (const topic of [
    "How to write a landing page that converts",
    "3 lessons from my first podcast interview",
    "AI agents explained in simple terms",
    "How to design a better slide presentation",
    "What a new industry report means for founders",
    `Turn a case study into a ${["carou", "sel"].join("")}`,
    "How to promote a blog post",
    "How to package your consulting offer"
  ]) {
    const route = routeResearch({ topic });
    assert.equal(route.status, "routed", topic);
    assert.equal(route.content_type, "social-media", topic);
  }
});

test("explicit source-inspection requests still require the matching specialist", () => {
  const cases = [
    ["Inspect this PDF report", "document"],
    ["Review this GitHub repository", "software-project"],
    ["Transcribe this podcast interview", "audio-video"],
    ["Verify the product pricing page", "product-record"],
    ["Summarize this landing page", "web-page"]
  ];
  for (const [topic, expectedType] of cases) {
    const route = routeResearch({ topic });
    assert.equal(route.status, "needs_specialist", topic);
    assert.equal(route.requested_type, expectedType, topic);
  }
});

test("a report request returns needs_specialist instead of pretending to support it", () => {
  const route = routeResearch({ topic: "A climate report", goal: "Inspect this PDF report" });
  assert.equal(route.status, "needs_specialist");
  assert.equal(route.requested_type, "document");
  assert.equal(route.template, "specialists/template");
  assert.deepEqual(route.alternatives, []);
});

test("a report only routes social when the goal explicitly asks for social reaction", () => {
  const blocked = routeResearch({
    topic: "annual-report.pdf",
    type: "social-media",
    goal: "Verify its methodology"
  });
  assert.equal(blocked.status, "needs_specialist");
  assert.equal(blocked.requested_type, "document");

  const social = routeResearch({
    topic: "annual-report.pdf",
    goal: "What are founders saying on Reddit about this report?"
  });
  assert.equal(social.status, "routed");
  assert.equal(social.content_type, "social-media");
});

test("specialized custom domains do not silently become social research", () => {
  for (const topic of [
    "Research employment law for California contractors",
    "Review the clinical evidence for creatine",
    "Analyze this company's financial health"
  ]) {
    const route = routeResearch({ topic });
    assert.equal(route.status, "needs_specialist", topic);
    assert.equal(route.requested_type, "custom", topic);
  }

  const social = routeResearch({
    topic: "Employment law for California contractors",
    goal: "What are contractors saying on Reddit about this?"
  });
  assert.equal(social.status, "routed");
});

test("a repository request returns the software extension route", () => {
  const route = routeResearch({ topic: "https://github.com/example/project", goal: "Inspect the repository" });
  assert.equal(route.status, "needs_specialist");
  assert.equal(route.requested_type, "software-project");
});

test("an empty request requires confirmation", () => {
  assert.equal(routeResearch({}).status, "needs_confirmation");
});

test("init refuses a non-installed specialist", () => {
  assert.throws(() => initProject({
    topic: "Quarterly report.pdf",
    type: "document",
    output: path.join(tempDir("missing-specialist"), "report")
  }), /specialist is not installed/);
});

test("CLI rejects unknown options and accepts governance options", () => {
  assert.throws(() => parseArgs(["--intent", "old flag"]), /unknown option --intent/);
  const parsed = parseArgs(["--decision", "keep scope", "--status", "progress"]);
  assert.equal(parsed.options.decision, "keep scope");
  assert.equal(parsed.options.status, "progress");
});

test("doctor reports zero dependencies and optional Gemma 4 support", () => {
  const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const report = buildDoctorReport({
    agentRoot,
    ollama: { installed: true, running: true, version: "1.0.0" },
    chrome: { available: true, executable: "/test/chrome", detected_by: "test" }
  });
  assert.equal(report.ok, true);
  assert.equal(report.node.required, ">=20");
  assert.equal(report.npm_dependencies, 0);
  assert.equal(report.browser.required, false);
  assert.deepEqual(report.discovery.modes_available, ["browser", "web-search"]);
  assert.equal(report.local_model.required, false);
  assert.equal(report.local_model.family, "Gemma 4");
  assert.equal(report.local_model.installed, true);
  assert.equal(report.local_model.running, true);
  const oldRuntime = buildDoctorReport({
    agentRoot,
    nodeVersion: "18.20.0",
    ollama: { installed: false, running: false, version: "" },
    chrome: { available: true, executable: "/test/chrome", detected_by: "test" }
  });
  assert.equal(oldRuntime.ok, false);

  const noChrome = buildDoctorReport({
    agentRoot,
    ollama: { installed: false, running: false, version: "" },
    chrome: { available: false, executable: null, detected_by: null }
  });
  assert.equal(noChrome.browser.chrome.installed, false);
  assert.equal(noChrome.browser.required, false);
  assert.equal(noChrome.web_search.required, true);
  assert.deepEqual(noChrome.discovery.modes_available, ["web-search"]);
  assert.equal(noChrome.ok, true, "web-search mode alone keeps the agent usable");

  const noDiscovery = buildDoctorReport({
    agentRoot,
    ollama: { installed: false, running: false, version: "" },
    chrome: { available: false, executable: null, detected_by: null },
    webSearch: { available: false, provider: "" }
  });
  assert.equal(noDiscovery.ok, false, "no browser and no web search leaves no way to research");
  assert.deepEqual(noDiscovery.discovery.modes_available, []);
});

test("standalone Research browser detection supports Chromium and explicit overrides", () => {
  const chromium = detectChrome({
    platform: "linux",
    env: { PATH: "/snap/bin" },
    exists: (candidate) => candidate === "/snap/bin/chromium"
  });
  assert.equal(chromium.available, true);
  assert.equal(chromium.executable, "/snap/bin/chromium");
  const override = detectChrome({
    platform: "linux",
    env: { PATH: "", CONTENT_CREATION_CHROME: "/custom/browser" },
    exists: (candidate) => candidate === "/custom/browser"
  });
  assert.equal(override.detected_by, "CONTENT_CREATION_CHROME");
});

test("only social-media is registered as a production profile", () => {
  assert.deepEqual(Object.keys(PROFILES), ["social-media"]);
  assert.equal(PROFILES["social-media"].maturity, "production");
});

test("init creates a job table and stable session and decision ids", () => {
  const root = tempDir("research-ledgers");
  const initialized = initProject({
    topic: "Synthetic social topic",
    type: "social-media",
    output: path.join(root, "research", "synthetic-social-topic")
  });
  const job = JSON.parse(fs.readFileSync(initialized.files.job, "utf8"));
  const sessions = readNdjson(initialized.files.sessions);
  const decisions = readNdjson(initialized.files.decisions);
  assert.match(job.job_id, /^JOB-\d{8}-[a-f0-9]{8}$/);
  assert.match(sessions[0].session_id, /^SES-\d{8}-[a-f0-9]{8}$/);
  assert.match(decisions[0].decision_id, /^DEC-\d{8}-[a-f0-9]{8}$/);
  assert.equal(fs.existsSync(path.join(root, "research", "JOBS.csv")), true);
  assert.equal(fs.existsSync(path.join(root, "research", "LEARNING-EVENTS.ndjson")), true);
});

test("repeating a topic creates a new default job directory", () => {
  const root = tempDir("research-repeat-topic");
  const originalDirectory = process.cwd();
  try {
    process.chdir(root);
    const first = initProject({ topic: "Repeated social topic" });
    const second = initProject({ topic: "Repeated social topic" });
    assert.notEqual(first.projectDir, second.projectDir);
    assert.equal(fs.existsSync(first.projectDir), true);
    assert.equal(fs.existsSync(second.projectDir), true);
  } finally {
    process.chdir(originalDirectory);
  }
});

test("session and decision commands append valid job-scoped events", () => {
  const root = tempDir("research-governance");
  const initialized = completeSocialProject(root);
  const session = logSession(initialized.projectDir, {
    agent: "Claude",
    summary: "Reviewed counter-signals."
  });
  const decision = logDecision(initialized.projectDir, {
    agent: "Claude",
    title: "Keep date window",
    decision: "Use the original seven-day window",
    rationale: "The user requested current social reaction."
  });
  assert.match(session.event.session_id, /^SES-/);
  assert.match(decision.event.decision_id, /^DEC-/);
  assert.equal(validateProject(initialized.projectDir).ok, true);
});

test("feedback is captured automatically and reusable changes require a decision", () => {
  const root = tempDir("research-learning");
  const initialized = completeSocialProject(root);
  const captured = captureLearning(initialized.projectDir, {
    agent: "Codex",
    feedback: "Do not summarize disagreement as consensus.",
    learning: "Preserve counter-signals in the conclusion.",
    scope: "package"
  });
  assert.match(captured.event.learning_id, /^LRN-/);
  let memory = readLearningMemory(initialized.projectDir);
  assert.equal(memory.pending.length, 1);
  assert.equal(memory.approved.length, 0);
  decideLearning(initialized.projectDir, {
    learningId: captured.event.learning_id,
    decision: "approved",
    agent: "Codex",
    notes: "User explicitly approved implementation."
  });
  memory = readLearningMemory(initialized.projectDir);
  assert.equal(memory.pending.length, 0);
  assert.equal(memory.approved.length, 1);
  const rootMemory = readLearningMemory(path.join(root, "research"));
  assert.equal(rootMemory.approved.length, 1);
  assert.equal(rootMemory.approved[0].learning_id, captured.event.learning_id);
  assert.equal(validateProject(initialized.projectDir).ok, true);
});

test("validation blocks a job without a completed browser trace", () => {
  const root = tempDir("research-browser-gate");
  const initialized = completeSocialProject(root);
  const browser = JSON.parse(fs.readFileSync(initialized.files.browser, "utf8"));
  browser.status = "pending";
  writeJson(initialized.files.browser, browser);
  const validation = validateProject(initialized.projectDir);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes("browser.status")));
});

test("validation requires a research session and material decision beyond routing", () => {
  const root = tempDir("research-governance-gates");
  const initialized = completeSocialProject(root);
  const sessions = readNdjson(initialized.files.sessions);
  const decisions = readNdjson(initialized.files.decisions);
  fs.writeFileSync(initialized.files.sessions, `${JSON.stringify(sessions[0])}\n`, "utf8");
  fs.writeFileSync(initialized.files.decisions, `${JSON.stringify(decisions[0])}\n`, "utf8");
  const validation = validateProject(initialized.projectDir);
  assert.ok(validation.errors.some((error) => error.includes("non-router research work event")));
  assert.ok(validation.errors.some((error) => error.includes("material research decision")));
});

test("every web evidence source must appear in the opened browser trace", () => {
  const root = tempDir("research-opened-evidence");
  const initialized = completeSocialProject(root);
  const browser = JSON.parse(fs.readFileSync(initialized.files.browser, "utf8"));
  browser.opened_urls = ["https://x.com/example/status/1"];
  writeJson(initialized.files.browser, browser);
  const validation = validateProject(initialized.projectDir);
  assert.ok(validation.errors.some((error) => error.includes("evidence.sources[1].url must appear")));
});

test("corroborated claims require distinct locations and publishers", () => {
  const root = tempDir("research-corroboration");
  const initialized = completeSocialProject(root);
  const evidence = JSON.parse(fs.readFileSync(initialized.files.evidence, "utf8"));
  evidence.sources[1].publisher = "Example Organization";
  evidence.sources.push({
    id: "src-official-copy",
    title: "Duplicate record entry",
    publisher: "Example Organization",
    source_type: "official",
    url: "https://example.com/official-release",
    captured_at: "2026-08-06"
  });
  evidence.claims[0].verification = "corroborated";
  evidence.claims[0].source_ids = ["src-official", "src-official-copy"];
  writeJson(initialized.files.evidence, evidence);
  const validation = validateProject(initialized.projectDir);
  assert.ok(validation.errors.some((error) => error.includes("distinct evidence locations")));
  assert.ok(validation.errors.some((error) => error.includes("distinct source publishers")));
});

test("browser trace enforces X, Digg, Reddit and conditional Google", () => {
  const root = tempDir("research-discovery");
  const initialized = initProject({
    topic: "Synthetic social topic",
    type: "social-media",
    output: path.join(root, "research", "topic")
  });
  const searches = [
    "site:x.com synthetic social topic",
    "site:digg.com synthetic social topic",
    "site:reddit.com synthetic social topic"
  ];
  assert.throws(() => recordBrowserTrace(initialized.projectDir, {
    agent: "Codex",
    tool: "browser",
    searches,
    discoverySites: ["reddit.com", "digg.com", "x.com"],
    discoveryOutcomes: ["blocked", "blocked", "blocked"],
    googleQuery: "synthetic social topic",
    googleOpenedUrls: ["https://example.com/result"]
  }), /x\.com -> digg\.com -> reddit\.com/);
  assert.throws(() => recordBrowserTrace(initialized.projectDir, {
    agent: "Codex",
    tool: "browser",
    searches,
    discoverySites: ["x.com", "digg.com", "reddit.com"],
    discoveryOutcomes: ["blocked", "no-useful-results", "blocked"],
    openedUrls: ["https://example.com/result"]
  }), /requires --google-query/);
});

test("a valid job produces a governed brief and completion event", () => {
  const root = tempDir("research-valid");
  const initialized = completeSocialProject(root);
  const validation = validateProject(initialized.projectDir);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const brief = writeBrief(initialized.projectDir);
  const text = fs.readFileSync(brief.destination, "utf8");
  assert.match(text, /## Session log/);
  assert.match(text, /## Decision ledger/);
  assert.match(text, /Social Media Research/);
  assert.match(text, /Validation passed and RESEARCH\.md was generated/);
  const job = JSON.parse(fs.readFileSync(initialized.files.job, "utf8"));
  assert.equal(job.status, "completed");
  assert.ok(readNdjson(initialized.files.sessions).some((event) => event.status === "completed"));
  assert.match(fs.readFileSync(ledgerFiles(initialized.projectDir).jobsIndex, "utf8"), /"completed"/);
});

test("malformed governance NDJSON returns a clean validation error", () => {
  const root = tempDir("research-malformed-ledger");
  const initialized = completeSocialProject(root);
  fs.appendFileSync(initialized.files.decisions, "not-json\n", "utf8");
  const validation = validateProject(initialized.projectDir);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes("decisions.ndjson")));
});

test("unverified publishable claims block the brief", () => {
  const root = tempDir("research-unverified");
  const initialized = completeSocialProject(root);
  const evidence = JSON.parse(fs.readFileSync(initialized.files.evidence, "utf8"));
  evidence.claims[0].verification = "unverified";
  writeJson(initialized.files.evidence, evidence);
  assert.equal(validateProject(initialized.projectDir).ok, false);
  assert.throws(() => writeBrief(initialized.projectDir), /not valid/);
});

test("specialist source references must resolve", () => {
  const root = tempDir("research-crossrefs");
  const initialized = completeSocialProject(root);
  const analysis = JSON.parse(fs.readFileSync(initialized.files.analysis, "utf8"));
  analysis.specialist.verification_source_ids = ["src-missing"];
  writeJson(initialized.files.analysis, analysis);
  assert.ok(validateProject(initialized.projectDir).errors.some((error) => error.includes("src-missing")));
});

test("valid evidence produces an importable VibeTasks bundle", () => {
  const root = tempDir("research-packet");
  const initialized = completeSocialProject(root);
  const validation = validateProject(initialized.projectDir);
  const packet = buildVibeTasksPacket(validation, "2026-08-06T13:00:00.000Z");
  assert.equal(packet.format, "vibetasks-export");
  assert.equal(packet.tasks.length, 1);
  const written = writeVibeTasksPacket(initialized.projectDir);
  assert.equal(path.basename(written.destination), "VIBETASKS-TASKS.json");
});

test("drop-in discovery finds a parent VibeTasks checkout", () => {
  const root = tempDir("research-dropin");
  const parent = path.join(root, "VibeTasks");
  const agent = path.join(parent, "Content Research Agent", "src");
  fs.mkdirSync(agent, { recursive: true });
  writeJson(path.join(parent, "package.json"), { name: "vibetasks" });
  assert.equal(findVibeTasks(agent), parent);
});

test("manifest declares social-only production scope and data-free defaults", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const manifest = JSON.parse(fs.readFileSync(new URL("../agent.json", import.meta.url), "utf8"));
  assert.equal(manifest.credit, "By TheVibeFounder");
  assert.deepEqual(manifest.production_specialists, ["social-media"]);
  assert.equal(manifest.privacy.telemetry, false);
  assert.equal(manifest.privacy.bundled_user_data, false);
  assert.equal(manifest.local_model.required, false);
  assert.equal(manifest.local_model.family, "Gemma 4");
  assert.ok(manifest.commands.includes("learning-capture"));
  assert.ok(manifest.outputs.includes("sessions.ndjson"));
});

test("current package tree passes the public-safety policy", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = runPublicSafetyCheck({ root, history: false });
  assert.equal(result.ok, true, result.violations.join("\n"));
});

test("web-search mode validates with snippet evidence and no opened pages", () => {
  const root = tempDir("research-search-mode");
  const initialized = completeSearchProject(root);
  const validation = validateProject(initialized.projectDir);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const trace = JSON.parse(fs.readFileSync(initialized.files.browser, "utf8"));
  assert.equal(trace.mode, "web-search");
  assert.equal(trace.first_research_action, "web-search");
  assert.deepEqual(trace.opened_urls, []);
  assert.equal(trace.snippets.length, 2);
  assert.ok(validation.warnings.some((warning) => warning.includes("discovery-grade")));
});

test("a snippet-only source cannot carry a verified claim", () => {
  const root = tempDir("research-search-ceiling");
  const initialized = completeSearchProject(root);
  const evidence = JSON.parse(fs.readFileSync(initialized.files.evidence, "utf8"));
  evidence.claims[0].verification = "verified";
  writeJson(initialized.files.evidence, evidence);
  const validation = validateProject(initialized.projectDir);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes("cannot be verified from search snippets alone")));
});

test("an opened source still supports a verified claim in web-search mode", () => {
  const root = tempDir("research-search-opened");
  const initialized = completeSearchProject(root);
  searchSweep(initialized.projectDir, {
    snippets: [
      X_SNIPPET,
      {
        ...X_SNIPPET,
        id: "SNIP-X-2",
        url: "https://x.com/other/status/2",
        title: "Second independent discussion",
        snippet: "A second author independently reports the same release."
      }
    ],
    openedUrls: ["https://x.com/example/status/1"]
  });
  const evidence = JSON.parse(fs.readFileSync(initialized.files.evidence, "utf8"));
  evidence.claims[0].verification = "verified";
  evidence.claims[0].source_ids = ["src-x-1"];
  writeJson(initialized.files.evidence, evidence);
  const validation = validateProject(initialized.projectDir);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
});

test("search trace keeps the ordered X, Digg, Reddit sweep", () => {
  const root = tempDir("research-search-order");
  const initialized = completeSearchProject(root);
  assert.throws(() => searchSweep(initialized.projectDir, {
    discoverySites: ["reddit.com", "x.com", "digg.com"]
  }), /ordered discovery sites/);
  assert.throws(() => searchSweep(initialized.projectDir, {
    searches: [
      "site:x.com topic",
      "site:reddit.com topic",
      "site:digg.com topic"
    ]
  }), /query 2 must target digg\.com/);
});

test("search outcomes must match the snippets actually captured", () => {
  const root = tempDir("research-search-outcomes");
  const initialized = completeSearchProject(root);
  assert.throws(() => searchSweep(initialized.projectDir, {
    discoveryOutcomes: ["useful", "useful", "blocked"]
  }), /marked digg\.com useful but captured no snippet/);
  assert.throws(() => searchSweep(initialized.projectDir, {
    discoveryOutcomes: ["no-useful-results", "no-useful-results", "blocked"],
    fallbackQuery: "AI coding agent signals",
    snippets: [X_SNIPPET]
  }), /captured a x\.com snippet but recorded outcome no-useful-results/);
});

test("the open-web fallback is gated on an all-non-useful sweep", () => {
  const root = tempDir("research-search-fallback");
  const initialized = completeSearchProject(root);
  assert.throws(() => searchSweep(initialized.projectDir, {
    fallbackQuery: "AI coding agent signals"
  }), /allows the open-web fallback only when/);
  assert.throws(() => searchSweep(initialized.projectDir, {
    discoveryOutcomes: ["blocked", "no-useful-results", "blocked"],
    snippets: []
  }), /requires at least one captured --snippet/);
  const recorded = searchSweep(initialized.projectDir, {
    discoveryOutcomes: ["blocked", "no-useful-results", "blocked"],
    fallbackQuery: "AI coding agent release notes",
    snippets: [{
      ...X_SNIPPET,
      id: "SNIP-WEB-1",
      site: "open-web",
      query: "AI coding agent release notes",
      url: "https://example.com/release-notes",
      title: "Release notes"
    }]
  });
  assert.equal(recorded.trace.google_fallback.provider, "open-web");
  assert.equal(recorded.trace.google_fallback.used, true);
  assert.equal(recorded.trace.searches[3], "AI coding agent release notes");
});

test("an off-domain result cannot be filed as a platform signal", () => {
  const root = tempDir("research-search-offdomain");
  const initialized = completeSearchProject(root);
  assert.throws(() => searchSweep(initialized.projectDir, {
    snippets: [{ ...X_SNIPPET, url: "https://arxiv.org/pdf/2606.19380" }]
  }), /is not on x\.com/);
  assert.equal(hostMatchesSite("https://www.reddit.com/r/a/b", "reddit.com"), true);
  assert.equal(hostMatchesSite("https://old.reddit.com/r/a/b", "reddit.com"), true);
  assert.equal(hostMatchesSite("https://reddit.com.evil.test/x", "reddit.com"), false);
  assert.equal(hostMatchesSite("https://arxiv.org/pdf/1", "open-web"), true);
});

test("a supplied URL must be cited or recorded as unreachable in web-search mode", () => {
  const root = tempDir("research-search-supplied");
  const initialized = initProject({
    topic: "AI coding agent signals",
    goal: "Inspect a supplied post",
    type: "social-media",
    url: undefined,
    urls: ["https://www.reddit.com/r/programming/comments/abc"],
    output: path.join(root, "research", "supplied")
  });
  assert.throws(() => searchSweep(initialized.projectDir, {
    unreachableUrls: ["https://www.reddit.com/r/programming/comments/abc"]
  }), /requires --notes explaining/);
  searchSweep(initialized.projectDir, {
    unreachableUrls: ["https://www.reddit.com/r/programming/comments/abc"],
    notes: "reddit.com returns HTTP 403 to this host and is absent from search results."
  });
  const validation = validateProject(initialized.projectDir);
  assert.ok(
    !validation.errors.some((error) => error.includes("supplied URL")),
    "a recorded unreachable URL satisfies the supplied-URL gate"
  );
  searchSweep(initialized.projectDir, {});
  const missing = validateProject(initialized.projectDir);
  assert.ok(missing.errors.some((error) => error.includes("unreachable the supplied URL")));
});

test("the brief reports the discovery mode and grades each source", () => {
  const root = tempDir("research-search-brief");
  const initialized = completeSearchProject(root);
  const { destination } = writeBrief(initialized.projectDir);
  const markdown = fs.readFileSync(destination, "utf8");
  assert.match(markdown, /discovery_mode: "web-search"/);
  assert.match(markdown, /## Captured search snippets/);
  assert.match(markdown, /snippet-grade/);
  assert.ok(!markdown.includes("opened-grade"), "no source was opened in this job");
});

test("browser mode still records opened pages and no snippets", () => {
  const root = tempDir("research-browser-mode");
  const initialized = completeSocialProject(root);
  const trace = JSON.parse(fs.readFileSync(initialized.files.browser, "utf8"));
  assert.equal(trace.mode, "browser");
  assert.deepEqual(trace.snippets, []);
  const validation = validateProject(initialized.projectDir);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.ok(!validation.warnings.some((warning) => warning.includes("discovery-grade")));
});

test("search-log parses repeatable snippet and unreachable options", () => {
  const parsed = parseArgs([
    "research/job",
    "--agent", "Claude",
    "--snippet", "{\"site\":\"x.com\"}",
    "--snippet", "{\"site\":\"digg.com\"}",
    "--unreachable", "https://www.reddit.com/r/a",
    "--fallback-query", "topic",
    "--snippets-file", "snips.json"
  ]);
  assert.equal(parsed.options.snippet.length, 2);
  assert.deepEqual(parsed.options.unreachable, ["https://www.reddit.com/r/a"]);
  assert.equal(parsed.options["fallback-query"], "topic");
  assert.equal(parsed.options["snippets-file"], "snips.json");
});

test("the committed corpus is well formed and every snippet is on-domain", () => {
  const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const corpusDir = path.join(agentRoot, "corpus");
  const manifest = JSON.parse(fs.readFileSync(path.join(corpusDir, "manifest.json"), "utf8"));
  const sweepFiles = fs.readdirSync(path.join(corpusDir, "sweeps")).filter((f) => f.endsWith(".json"));
  assert.equal(manifest.sweeps.length, sweepFiles.length, "manifest lists every sweep file");

  let total = 0;
  const ids = new Set();
  for (const file of sweepFiles) {
    const sweep = JSON.parse(fs.readFileSync(path.join(corpusDir, "sweeps", file), "utf8"));
    assert.ok(Array.isArray(sweep.snippets) && sweep.snippets.length > 0, `${file} has snippets`);
    for (const [index, snippet] of sweep.snippets.entries()) {
      const parsed = parseSnippet(snippet, index);
      assert.ok(hostMatchesSite(parsed.url, parsed.site), `${file}:${parsed.id} is on-domain`);
      assert.ok(!ids.has(parsed.id), `${parsed.id} is unique across the corpus`);
      ids.add(parsed.id);
      total += 1;
    }
    const entry = manifest.sweeps.find((s) => s.sweep_id === sweep.sweep_id);
    assert.ok(entry, `${file} appears in the manifest`);
    assert.equal(entry.snippet_count, sweep.snippets.length, `${file} count matches the manifest`);
  }
  assert.equal(manifest.totals.snippets, total, "manifest total matches the sweeps");
});

test("the committed example job still validates and carries no verified claim", () => {
  const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const example = path.join(agentRoot, "examples", "xr-guild-social-signal");
  const validation = validateProject(example);
  assert.equal(validation.ok, true, validation.errors.join("\n"));

  const trace = JSON.parse(fs.readFileSync(path.join(example, "browser.json"), "utf8"));
  assert.equal(trace.mode, "web-search");
  assert.deepEqual(trace.opened_urls, [], "no page was opened in this environment");
  assert.equal(trace.discovery_outcomes[2], "blocked", "reddit is recorded as blocked");

  const evidence = JSON.parse(fs.readFileSync(path.join(example, "evidence.json"), "utf8"));
  assert.ok(
    evidence.claims.every((claim) => claim.verification !== "verified"),
    "snippet-only evidence cannot yield a verified claim"
  );
  assert.ok(
    evidence.claims.every((claim) => claim.verification !== "unverified" || claim.publishable === false),
    "an unverified claim is never publishable"
  );
  assert.ok(evidence.gaps.length >= 3, "the coverage gaps are recorded");
});
