import fs from "node:fs";
import path from "node:path";
import { validateProject } from "./validate.js";
import { completeJob } from "./ledger.js";

function display(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key.replaceAll("_", " ")}: ${display(item)}`)
      .join(" · ");
  }
  return "";
}

function renderValue(value) {
  if (Array.isArray(value)) {
    if (!value.length) return "_None._\n";
    return `${value.map((item) => `- ${display(item)}`).join("\n")}\n`;
  }
  return `${display(value)}\n`;
}

export function renderBrief(validation) {
  if (!validation.ok) {
    throw new Error(`research project is not valid:\n- ${validation.errors.join("\n- ")}`);
  }
  const { project, profile, warnings } = validation;
  const { request, browser, evidence, analysis, assets, sessions, decisions, learnings } = project;
  const sources = evidence.sources.map((source) => {
    const location = source.url || source.local_path;
    return `- **${source.id} · ${source.title}** — ${source.source_type}; captured ${source.captured_at}; ${location}`;
  });
  const claims = evidence.claims.map((claim) => {
    const boundary = claim.attribution ? `; attribution: ${claim.attribution}` : "";
    const freshness = claim.as_of ? `; as of ${claim.as_of}` : "";
    return `- **${claim.id} · ${claim.verification}** — ${claim.text} _(${claim.source_ids.join(", ")}${freshness}${boundary})_`;
  });
  const specialist = Object.entries(profile.analysisFields).map(([key, definition]) =>
    `## ${definition.label}\n\n${renderValue(analysis.specialist[key])}`
  );
  const assetLines = assets.assets.length
    ? assets.assets.map((asset) =>
      `- **${asset.id} · ${asset.kind}** — ${asset.usage}; source ${asset.source_id}; rights: ${asset.rights_status}${asset.local_path ? `; file: \`${asset.local_path}\`` : ""}`
    )
    : ["_No assets recorded._"];
  const gaps = evidence.gaps.length
    ? evidence.gaps.map((gap) => `- ${gap.blocking ? "**BLOCKING** " : ""}${gap.description}`)
    : ["_No open research gaps._"];
  const sessionLines = sessions.map((session) =>
    `- **${session.session_id} · ${session.status}** — ${session.agent}: ${session.summary} (${session.created_at})`
  );
  const decisionLines = decisions.map((decision) =>
    `- **${decision.decision_id} · ${decision.title}** — ${decision.decision}; ${decision.rationale}`
  );
  const learningLines = learnings.length
    ? learnings.map((learning) =>
      `- **${learning.learning_id} · ${learning.event}** — ${learning.learning || learning.decision}${learning.scope ? `; scope: ${learning.scope}` : ""}`
    )
    : ["_No user feedback captured for this job._"];

  return [
    "---",
    `project_id: "${request.project_id}"`,
    `content_type: "${profile.id}"`,
    `specialist: "${profile.skill}"`,
    `as_of: "${evidence.as_of}"`,
    "validation: \"passed\"",
    "browser_first: true",
    "---",
    "",
    `# ${request.topic}`,
    "",
    `**Research mode:** ${profile.displayName}`,
    "",
    "## Executive finding",
    "",
    evidence.summary,
    "",
    "## Conclusion",
    "",
    analysis.conclusion,
    "",
    "## Scope",
    "",
    analysis.scope,
    "",
    "## Browser trace",
    "",
    `- Agent: ${browser.agent}`,
    `- Tool: ${browser.tool}`,
    `- Started: ${browser.started_at}`,
    ...browser.searches.map((query) => `- Search: ${query}`),
    ...browser.opened_urls.map((url) => `- Opened: ${url}`),
    "",
    "## Session log",
    "",
    ...sessionLines,
    "",
    "## Decision ledger",
    "",
    ...decisionLines,
    "",
    "## Learning ledger",
    "",
    ...learningLines,
    "",
    ...specialist.flatMap((section) => [section, ""]),
    "## Source index",
    "",
    ...sources,
    "",
    "## Claim ledger",
    "",
    ...claims,
    "",
    "## Asset manifest",
    "",
    ...assetLines,
    "",
    "## Open gaps and limits",
    "",
    ...gaps,
    ...(warnings.length ? ["", "## Validation warnings", "", ...warnings.map((warning) => `- ${warning}`)] : []),
    ""
  ].join("\n");
}

export function writeBrief(projectDir, output) {
  let validation = validateProject(projectDir);
  let markdown = renderBrief(validation);
  const destination = path.resolve(output || path.join(projectDir, "RESEARCH.md"));
  fs.writeFileSync(destination, markdown, "utf8");
  completeJob(projectDir);
  validation = validateProject(projectDir);
  markdown = renderBrief(validation);
  fs.writeFileSync(destination, markdown, "utf8");
  return { destination, validation };
}
