import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const LEARNING_SCOPES = new Set(["job", "package"]);
const LEARNING_DECISIONS = new Set(["approved", "declined"]);
const SESSION_STATUSES = new Set(["started", "progress", "completed", "blocked"]);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function dateStamp(value) {
  return new Date(value).toISOString().slice(0, 10).replaceAll("-", "");
}

export function createRecordId(prefix, now = new Date().toISOString()) {
  return `${prefix}-${dateStamp(now)}-${crypto.randomBytes(4).toString("hex")}`;
}

export function ledgerFiles(projectDir) {
  const absolute = path.resolve(projectDir);
  const researchRoot = path.dirname(absolute);
  return {
    job: path.join(absolute, "job.json"),
    sessions: path.join(absolute, "sessions.ndjson"),
    decisions: path.join(absolute, "decisions.ndjson"),
    learnings: path.join(absolute, "learnings.ndjson"),
    jobsIndex: path.join(researchRoot, "JOBS.csv"),
    sharedLearningEvents: path.join(researchRoot, "LEARNING-EVENTS.ndjson")
  };
}

export function appendNdjson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`, "utf8");
}

export function readNdjson(file) {
  if (!fs.existsSync(file)) throw new Error(`missing NDJSON file: ${file}`);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line, index) => {
    try {
      const value = JSON.parse(line);
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("expected a JSON object");
      }
      return value;
    } catch (error) {
      throw new Error(`cannot read ${file} line ${index + 1}: ${error.message}`);
    }
  });
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll(/\r?\n/g, " ").replaceAll('"', '""')}"`;
}

function appendJobIndex(file, row) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      "job_id,event,status,occurred_at,content_type,topic,project_dir\n",
      "utf8"
    );
  }
  fs.appendFileSync(file, `${[
    row.job_id,
    row.event,
    row.status,
    row.occurred_at,
    row.content_type,
    row.topic,
    row.project_dir
  ].map(csvCell).join(",")}\n`, "utf8");
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(file) {
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`cannot read ${file}: expected a JSON object`);
  }
  return value;
}

export function initializeLedgers({ projectDir, jobId, topic, route, now }) {
  const files = ledgerFiles(projectDir);
  const job = {
    schema_version: "1.0",
    job_id: jobId,
    status: "active",
    topic,
    content_type: route.content_type,
    specialist: route.specialist,
    created_at: now,
    updated_at: now
  };
  writeJson(files.job, job);
  fs.writeFileSync(files.sessions, "", "utf8");
  fs.writeFileSync(files.decisions, "", "utf8");
  fs.writeFileSync(files.learnings, "", "utf8");

  const session = {
    schema_version: "1.0",
    session_id: createRecordId("SES", now),
    job_id: jobId,
    status: "started",
    agent: "router",
    summary: "Initialized the social-media research job.",
    created_at: now
  };
  appendNdjson(files.sessions, session);

  const decision = {
    schema_version: "1.0",
    decision_id: createRecordId("DEC", now),
    job_id: jobId,
    title: "Select production research specialist",
    decision: route.content_type,
    rationale: route.reasons.join(" "),
    made_by: "router",
    created_at: now
  };
  appendNdjson(files.decisions, decision);
  appendJobIndex(files.jobsIndex, {
    job_id: jobId,
    event: "created",
    status: job.status,
    occurred_at: now,
    content_type: route.content_type,
    topic,
    project_dir: path.resolve(projectDir)
  });
  if (!fs.existsSync(files.sharedLearningEvents)) {
    fs.writeFileSync(files.sharedLearningEvents, "", "utf8");
  }
  return { files, job, session, decision };
}

export function logSession(projectDir, {
  agent,
  summary,
  status = "progress",
  now = new Date().toISOString()
}) {
  if (!nonEmpty(agent)) throw new Error("session-log requires --agent");
  if (!nonEmpty(summary)) throw new Error("session-log requires --summary");
  if (!SESSION_STATUSES.has(status)) throw new Error(`invalid session status: ${status}`);
  const files = ledgerFiles(projectDir);
  const job = readJson(files.job);
  const event = {
    schema_version: "1.0",
    session_id: createRecordId("SES", now),
    job_id: job.job_id,
    status,
    agent: agent.trim(),
    summary: summary.trim(),
    created_at: now
  };
  appendNdjson(files.sessions, event);
  return { destination: files.sessions, event };
}

export function logDecision(projectDir, {
  agent,
  title,
  decision,
  rationale,
  now = new Date().toISOString()
}) {
  for (const [name, value] of Object.entries({ agent, title, decision, rationale })) {
    if (!nonEmpty(value)) throw new Error(`decision-log requires --${name}`);
  }
  const files = ledgerFiles(projectDir);
  const job = readJson(files.job);
  const event = {
    schema_version: "1.0",
    decision_id: createRecordId("DEC", now),
    job_id: job.job_id,
    title: title.trim(),
    decision: decision.trim(),
    rationale: rationale.trim(),
    made_by: agent.trim(),
    created_at: now
  };
  appendNdjson(files.decisions, event);
  return { destination: files.decisions, event };
}

export function captureLearning(projectDir, {
  agent,
  feedback,
  learning,
  scope = "job",
  now = new Date().toISOString()
}) {
  for (const [name, value] of Object.entries({ agent, feedback, learning })) {
    if (!nonEmpty(value)) throw new Error(`learning-capture requires --${name}`);
  }
  if (!LEARNING_SCOPES.has(scope)) throw new Error(`invalid learning scope: ${scope}`);
  const files = ledgerFiles(projectDir);
  const job = readJson(files.job);
  const event = {
    schema_version: "1.0",
    event: "captured",
    learning_id: createRecordId("LRN", now),
    job_id: job.job_id,
    scope,
    feedback: feedback.trim(),
    learning: learning.trim(),
    approval_status: "pending",
    agent: agent.trim(),
    created_at: now
  };
  appendNdjson(files.learnings, event);
  appendNdjson(files.sharedLearningEvents, event);
  return { destination: files.learnings, shared_destination: files.sharedLearningEvents, event };
}

export function decideLearning(projectDir, {
  learningId,
  decision,
  agent,
  notes = "",
  now = new Date().toISOString()
}) {
  if (!nonEmpty(learningId)) throw new Error("learning-decide requires --learning-id");
  if (!LEARNING_DECISIONS.has(decision)) throw new Error("learning-decide requires --decision approved|declined");
  if (!nonEmpty(agent)) throw new Error("learning-decide requires --agent");
  const files = ledgerFiles(projectDir);
  const job = readJson(files.job);
  const events = readNdjson(files.learnings);
  const captured = events.find((event) => event.event === "captured" && event.learning_id === learningId);
  if (!captured) throw new Error(`unknown learning id: ${learningId}`);
  const event = {
    schema_version: "1.0",
    event: "decision",
    learning_id: learningId,
    job_id: job.job_id,
    decision,
    agent: agent.trim(),
    notes: notes.trim(),
    created_at: now
  };
  appendNdjson(files.learnings, event);
  appendNdjson(files.sharedLearningEvents, event);
  return { destination: files.learnings, shared_destination: files.sharedLearningEvents, event };
}

export function readLearningMemory(projectDirOrResearchRoot) {
  const absolute = path.resolve(projectDirOrResearchRoot);
  const directMemory = path.join(absolute, "LEARNING-EVENTS.ndjson");
  const memoryFile = fs.existsSync(directMemory)
    ? directMemory
    : ledgerFiles(absolute).sharedLearningEvents;
  if (!fs.existsSync(memoryFile)) {
    return { approved: [], pending: [], declined: [] };
  }
  const events = readNdjson(memoryFile);
  const records = new Map();
  for (const event of events) {
    const current = records.get(event.learning_id) || {};
    records.set(event.learning_id, { ...current, ...event });
  }
  const all = [...records.values()];
  return {
    approved: all.filter((event) => event.decision === "approved"),
    pending: all.filter((event) => event.event === "captured" && !event.decision),
    declined: all.filter((event) => event.decision === "declined")
  };
}

export function completeJob(projectDir, now = new Date().toISOString()) {
  const files = ledgerFiles(projectDir);
  const job = readJson(files.job);
  if (job.status === "completed") return { job, changed: false };
  job.status = "completed";
  job.updated_at = now;
  writeJson(files.job, job);
  logSession(projectDir, {
    agent: "validator",
    status: "completed",
    summary: "Validation passed and RESEARCH.md was generated.",
    now
  });
  appendJobIndex(files.jobsIndex, {
    job_id: job.job_id,
    event: "completed",
    status: job.status,
    occurred_at: now,
    content_type: job.content_type,
    topic: job.topic,
    project_dir: path.resolve(projectDir)
  });
  return { job, changed: true };
}
