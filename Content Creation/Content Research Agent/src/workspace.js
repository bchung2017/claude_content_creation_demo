import fs from "node:fs";
import path from "node:path";
import { emptySpecialistAnalysis, getProfile } from "./profiles.js";
import { routeResearch } from "./router.js";
import { createRecordId, initializeLedgers, readNdjson } from "./ledger.js";

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "research-project";
}

export function readJson(file) {
  try {
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("expected a JSON object");
    }
    return value;
  } catch (error) {
    throw new Error(`cannot read ${file}: ${error.message}`);
  }
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function projectFiles(projectDir) {
  return {
    job: path.join(projectDir, "job.json"),
    request: path.join(projectDir, "request.json"),
    route: path.join(projectDir, "route.json"),
    browser: path.join(projectDir, "browser.json"),
    evidence: path.join(projectDir, "evidence.json"),
    analysis: path.join(projectDir, "analysis.json"),
    assets: path.join(projectDir, "assets", "manifest.json"),
    sessions: path.join(projectDir, "sessions.ndjson"),
    decisions: path.join(projectDir, "decisions.ndjson"),
    learnings: path.join(projectDir, "learnings.ndjson"),
    brief: path.join(projectDir, "RESEARCH.md"),
    packet: path.join(projectDir, "VIBETASKS-TASKS.json")
  };
}

export function initProject({
  topic,
  goal = "",
  urls = [],
  type = "",
  output
}) {
  if (!topic?.trim()) throw new Error("init requires --topic");
  const route = routeResearch({ topic, goal, type });
  if (route.status !== "routed") {
    if (route.status === "needs_specialist") {
      throw new Error(
        `${route.requested_type} specialist is not installed. Build it from ${route.template}; social-media is the only production specialist.`
      );
    }
    const choices = route.alternatives.map((item) => item.content_type).filter(Boolean);
    throw new Error(
      `routing is ambiguous. Re-run with --type <${choices.join("|") || "content-type"}> or add --goal`
    );
  }
  const profile = getProfile(route.content_type);
  const now = new Date().toISOString();
  const projectId = createRecordId("JOB", now);
  const jobSuffix = projectId.split("-").at(-1);
  const projectDir = path.resolve(output || path.join("research", `${slugify(topic)}-${jobSuffix}`));
  if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0) {
    throw new Error(`project directory already exists and is not empty: ${projectDir}`);
  }
  fs.mkdirSync(path.join(projectDir, "assets"), { recursive: true });
  const files = projectFiles(projectDir);
  const routed = { ...route, project_id: projectId, routed_at: now };
  const topicUrl = /^https?:\/\//i.test(topic.trim()) ? topic.trim() : "";
  const inputUrls = [...new Set([topicUrl, ...urls].filter(Boolean))];

  writeJson(files.request, {
    schema_version: "2.0",
    project_id: projectId,
    topic: topic.trim(),
    research_goal: goal.trim(),
    input_urls: inputUrls,
    requested_content_type: type || "auto",
    created_at: now
  });
  writeJson(files.route, routed);
  writeJson(files.browser, {
    schema_version: "1.2",
    project_id: projectId,
    status: "pending",
    first_research_action: "browser",
    started_at: "",
    agent: "",
    tool: "",
    searches: [],
    discovery_sites: [],
    discovery_outcomes: [],
    google_fallback: {
      provider: "google.com",
      used: false,
      query: "",
      opened_urls: [],
      reason: ""
    },
    opened_urls: [],
    notes: ""
  });
  writeJson(files.evidence, {
    schema_version: "1.0",
    project_id: projectId,
    as_of: "",
    summary: "",
    sources: [],
    claims: [],
    gaps: []
  });
  writeJson(files.analysis, {
    schema_version: "1.0",
    project_id: projectId,
    content_type: profile.id,
    conclusion: "",
    scope: "",
    specialist: emptySpecialistAnalysis(profile)
  });
  writeJson(files.assets, {
    schema_version: "1.0",
    project_id: projectId,
    assets: []
  });
  initializeLedgers({
    projectDir,
    jobId: projectId,
    topic: topic.trim(),
    route: routed,
    now
  });
  return { projectDir, files, route: routed, profile };
}

export function loadProject(projectDir) {
  const absolute = path.resolve(projectDir);
  const files = projectFiles(absolute);
  return {
    projectDir: absolute,
    files,
    job: readJson(files.job),
    request: readJson(files.request),
    route: readJson(files.route),
    browser: readJson(files.browser),
    evidence: readJson(files.evidence),
    analysis: readJson(files.analysis),
    assets: readJson(files.assets),
    sessions: readNdjson(files.sessions),
    decisions: readNdjson(files.decisions),
    learnings: readNdjson(files.learnings)
  };
}

export function findVibeTasks(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    const packageFile = path.join(current, "package.json");
    if (fs.existsSync(packageFile)) {
      try {
        const pkg = readJson(packageFile);
        if (pkg.name === "vibetasks") return current;
      } catch {}
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
