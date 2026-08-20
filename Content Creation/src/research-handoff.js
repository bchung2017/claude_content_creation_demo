import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson } from "./json.js";

function readNdjson(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`cannot read ${file} line ${index + 1}: ${error.message}`);
      }
    });
}

function loadValidatedResearchProject(projectDir, researchAgentRoot) {
  const cli = path.join(path.resolve(researchAgentRoot), "bin", "content-research-agent.js");
  if (!fs.existsSync(cli)) throw new Error(`research agent CLI is missing: ${cli}`);
  const validation = spawnSync(process.execPath, [cli, "validate", projectDir, "--json"], {
    encoding: "utf8"
  });
  if (validation.status !== 0) {
    const detail = (validation.stderr || validation.stdout || "unknown validation failure").trim();
    throw new Error(`research handoff is not valid: ${detail}`);
  }
  let result;
  try {
    result = JSON.parse(validation.stdout);
  } catch (error) {
    throw new Error(`research agent returned invalid validation output: ${error.message}`);
  }
  if (!result.ok) throw new Error(`research handoff is not valid: ${(result.errors || []).join("; ")}`);
  const source = path.resolve(projectDir);
  return {
    job: readJson(path.join(source, "job.json")),
    browser: readJson(path.join(source, "browser.json")),
    evidence: readJson(path.join(source, "evidence.json")),
    analysis: readJson(path.join(source, "analysis.json")),
    sessions: readNdjson(path.join(source, "sessions.ndjson")),
    decisions: readNdjson(path.join(source, "decisions.ndjson")),
    learnings: readNdjson(path.join(source, "learnings.ndjson"))
  };
}

export function buildResearchHandoff(project) {
  const { job, browser, evidence, analysis, sessions, decisions, learnings } = project;
  if (job.status !== "completed") {
    throw new Error("research handoff requires a completed JOB status and generated RESEARCH.md");
  }
  return {
    schema_version: "2.0",
    status: "completed",
    origin: {
      agent: "social-media-research-agent",
      job_id: job.job_id,
      content_type: job.content_type,
      specialist: job.specialist
    },
    as_of: evidence.as_of,
    summary: evidence.summary,
    sources: evidence.sources,
    claims: evidence.claims,
    gaps: evidence.gaps,
    browser,
    analysis,
    governance: { sessions, decisions, learnings }
  };
}

export function importResearchHandoff({ projectDir, researchProjectDir, researchAgentRoot }) {
  const target = path.resolve(projectDir);
  const source = path.resolve(researchProjectDir);
  const briefFile = path.join(source, "RESEARCH.md");
  if (!fs.existsSync(briefFile)) {
    throw new Error(`research handoff requires generated RESEARCH.md: ${briefFile}`);
  }
  if (!researchAgentRoot) throw new Error("research handoff requires an installed research agent root");
  const researchProject = loadValidatedResearchProject(source, researchAgentRoot);
  const handoff = buildResearchHandoff(researchProject);
  const requestFile = path.join(target, "request.json");
  const routeFile = path.join(target, "route.json");
  if (!fs.existsSync(requestFile) || !fs.existsSync(routeFile)) {
    throw new Error(`content project is not initialized: ${target}`);
  }
  const request = readJson(requestFile);
  const route = readJson(routeFile);
  writeJson(path.join(target, "research.json"), {
    ...handoff,
    project_id: request.project_id
  });
  writeJson(routeFile, {
    ...route,
    input_kind: "validated-research-handoff",
    selected_specialist: "hook-writer-agent",
    research_job_id: handoff.origin.job_id,
    reason: "A completed, validated Social Media Research Agent handoff is installed."
  });
  return {
    project_dir: target,
    research_project_dir: source,
    research_job_id: handoff.origin.job_id,
    destination: path.join(target, "research.json"),
    next: "hook-writer-agent"
  };
}
