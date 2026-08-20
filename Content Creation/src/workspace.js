import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { writeJson } from "./json.js";

export const PROJECT_FILES = [
  "request.json",
  "brand.json",
  "route.json",
  "research.json",
  "hook.json",
  "caption.json",
  "carousel.json",
  path.join("assets", "manifest.json")
];

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "carousel-project";
}

export function initProject({ topic, goal = "Create an evidence-led carousel", urls = [], out }) {
  const uniqueSuffix = crypto.randomBytes(4).toString("hex");
  const projectDir = path.resolve(out || path.join("projects", `${slugify(topic)}-${uniqueSuffix}`));
  if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0) {
    throw new Error(`project directory already exists and is not empty: ${projectDir}`);
  }
  fs.mkdirSync(path.join(projectDir, "assets"), { recursive: true });
  const createdAt = new Date().toISOString();
  const projectId = path.basename(projectDir);
  writeJson(path.join(projectDir, "request.json"), {
    schema_version: "1.0",
    project_id: projectId,
    format: "carousel",
    topic,
    goal,
    source_urls: urls,
    created_at: createdAt
  });
  writeJson(path.join(projectDir, "brand.json"), {
    schema_version: "1.0",
    status: "needs_input",
    source: null,
    name: "",
    audience: "",
    voice: [],
    visual: { direction: "", colors: [], typography: [], imagery: [], logo_usage: "" },
    content_rules: { do: [], avoid: [] },
    cta_style: "",
    notes: ""
  });
  writeJson(path.join(projectDir, "route.json"), {
    schema_version: "1.0",
    input_kind: urls.length ? "topic-and-links" : "topic",
    selected_specialist: "content-research-agent",
    format: "carousel",
    reason: "Research must precede copy and slide planning."
  });
  writeJson(path.join(projectDir, "research.json"), {
    schema_version: "1.0",
    status: "in_progress",
    as_of: null,
    summary: "",
    sources: [],
    claims: [],
    gaps: []
  });
  writeJson(path.join(projectDir, "hook.json"), {
    schema_version: "1.0",
    status: "not_started",
    primary: "",
    alternatives: [],
    claim_ids: [],
    rationale: ""
  });
  writeJson(path.join(projectDir, "caption.json"), {
    schema_version: "1.0",
    status: "not_started",
    text: "",
    claim_ids: [],
    source_ids: [],
    attribution: "",
    disclosure: "",
    carousel_sha256: "",
    completed_at: ""
  });
  writeJson(path.join(projectDir, "carousel.json"), {
    schema_version: "1.0",
    status: "not_started",
    format: { name: "carousel", width: 1080, height: 1350 },
    slides: [],
    rendered_slides: []
  });
  writeJson(path.join(projectDir, "assets", "manifest.json"), {
    schema_version: "1.0",
    assets: []
  });
  return projectDir;
}

export function projectPath(project, relative) {
  return path.resolve(project, relative);
}
