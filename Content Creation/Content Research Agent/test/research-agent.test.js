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
  assert.equal(report.browser.required, true);
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
  assert.equal(noChrome.ok, false);
  assert.equal(noChrome.browser.chrome.installed, false);
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
