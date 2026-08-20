import path from "node:path";
import { validateProject } from "./validate.js";
import { writeJson } from "./workspace.js";

function sourceUrls(evidence) {
  return [...new Set(evidence.sources.map((source) => source.url).filter(Boolean))].slice(0, 10);
}

function taskNotes(validation) {
  const { request, evidence, analysis } = validation.project;
  const sources = sourceUrls(evidence);
  return [
    `Research goal: ${request.research_goal || "Not specified"}`,
    `Conclusion: ${analysis.conclusion}`,
    `Scope: ${analysis.scope}`,
    `Evidence summary: ${evidence.summary}`,
    sources.length ? `Sources:\n${sources.map((url) => `- ${url}`).join("\n")}` : "",
    "Validated brief: RESEARCH.md"
  ].filter(Boolean).join("\n\n");
}

export function buildVibeTasksPacket(validation, now = new Date().toISOString()) {
  if (!validation.ok) {
    throw new Error(`research project is not valid:\n- ${validation.errors.join("\n- ")}`);
  }
  const { request } = validation.project;
  return {
    format: "vibetasks-export",
    version: 1,
    exported_at: now,
    tasks: [
      {
        title: `Review research: ${request.topic}`,
        notes: taskNotes(validation),
        status: "inbox",
        priority: 2,
        due_date: null,
        reminder_at: null,
        created_at: now,
        completed_at: null
      }
    ]
  };
}

export function writeVibeTasksPacket(projectDir, output) {
  const validation = validateProject(projectDir);
  const packet = buildVibeTasksPacket(validation);
  const destination = path.resolve(output || path.join(projectDir, "VIBETASKS-TASKS.json"));
  writeJson(destination, packet);
  return { destination, packet, validation };
}
