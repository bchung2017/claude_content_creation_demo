import fs from "node:fs";
import path from "node:path";

const SKIP_DIRECTORIES = new Set([
  ".git", ".hg", ".svn", ".venv", "build", "coverage", "dist",
  "downloads", "node_modules", "projects", "venv"
]);
const GUIDE_EXTENSIONS = new Set([
  ".doc", ".docx", ".json", ".key", ".md", ".pages", ".pdf", ".ppt",
  ".pptx", ".txt", ".webloc", ".yaml", ".yml"
]);

function normalizedName(value) {
  return value
    .normalize("NFKD")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function looksLikeBrandGuide(name) {
  const normalized = normalizedName(name);
  return normalized === "brand" ||
    /\bbrand(?:ing)? (?:guide|guidelines|book|kit|identity|system)\b/.test(normalized) ||
    /\bvisual identity\b/.test(normalized);
}

function isInside(candidate, directory) {
  const relative = path.relative(directory, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function canonicalDirectory(directory) {
  const absolute = path.resolve(directory);
  return fs.realpathSync.native ? fs.realpathSync.native(absolute) : fs.realpathSync(absolute);
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function listHasText(value) {
  return Array.isArray(value) && value.some(nonEmpty);
}

export const BRAND_GUIDE_RUBRIC = [
  { id: "name", label: "brand name", present: (brand) => nonEmpty(brand?.name), question: "What is the brand name?" },
  { id: "audience", label: "audience", present: (brand) => nonEmpty(brand?.audience), question: "Who is this brand for?" },
  { id: "voice", label: "voice", present: (brand) => listHasText(brand?.voice), question: "Which three words describe the brand voice?" },
  { id: "colors", label: "colors", present: (brand) => listHasText(brand?.visual?.colors), question: "Which colors should the brand use, including exact values when available?" },
  { id: "typography", label: "typography", present: (brand) => listHasText(brand?.visual?.typography), question: "Which typefaces or safe fallbacks should be used?" },
  { id: "logo_usage", label: "logo rules", present: (brand) => nonEmpty(brand?.visual?.logo_usage), question: "How should the logo be used, or should this brand be text-only?" },
  { id: "imagery", label: "imagery", present: (brand) => listHasText(brand?.visual?.imagery), question: "What kind of imagery or screenshots fit the brand?" },
  { id: "visual_direction", label: "visual direction", present: (brand) => nonEmpty(brand?.visual?.direction), question: "What should the overall visual style feel like?" },
  { id: "content_do", label: "content do rules", present: (brand) => listHasText(brand?.content_rules?.do), question: "What should the content consistently do?" },
  { id: "content_avoid", label: "content avoid rules", present: (brand) => listHasText(brand?.content_rules?.avoid), question: "What should the content never do?" },
  { id: "cta_style", label: "CTA style", present: (brand) => nonEmpty(brand?.cta_style), question: "How should calls to action sound?" }
];

export function evaluateBrandProfile(brand) {
  const checks = BRAND_GUIDE_RUBRIC.map((item) => ({
    id: item.id,
    label: item.label,
    complete: item.present(brand),
    question: item.question
  }));
  const missing = checks.filter((item) => !item.complete);
  return {
    complete: missing.length === 0,
    completed_count: checks.length - missing.length,
    total_count: checks.length,
    checks,
    questions: missing.map((item) => item.question),
    next: missing.length
      ? `Ask ${missing.length} question${missing.length === 1 ? "" : "s"}, update the guide and brand.json, then run brand-check again.`
      : "Brand guidance is complete. Keep the selected guide primary and continue to research."
  };
}

export function formatBrandCheck(report) {
  const lines = [
    `Brand guide check · ${report.completed_count}/${report.total_count}`,
    "",
    ...report.checks.map((item) => `${item.complete ? "✓" : "✗"} ${item.label}`),
    ""
  ];
  if (report.questions.length) {
    lines.push("Questions to finish the guide:");
    report.questions.forEach((question, index) => lines.push(`${index + 1}. ${question}`));
  } else {
    lines.push(report.next);
  }
  return lines.join("\n");
}

export function discoverBrandGuides({
  packageRoot,
  workspaceRoot = path.dirname(path.resolve(packageRoot)),
  maxDepth = Number.POSITIVE_INFINITY,
  maxEntries = Number.POSITIVE_INFINITY
}) {
  const reusableRoot = canonicalDirectory(packageRoot);
  const workspace = canonicalDirectory(workspaceRoot);
  if (!fs.existsSync(workspace) || !fs.statSync(workspace).isDirectory()) {
    throw new Error("brand workspace must be an existing directory");
  }

  const candidates = [];
  let inspected = 0;
  let truncated = false;

  function walk(directory, depth) {
    if (truncated || depth > maxDepth) return;
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      inspected += 1;
      if (inspected > maxEntries) {
        truncated = true;
        return;
      }
      if (entry.isSymbolicLink()) continue;
      const absolute = path.join(directory, entry.name);
      if (isInside(absolute, reusableRoot)) continue;
      if (entry.isDirectory()) {
        if (looksLikeBrandGuide(entry.name)) {
          candidates.push({
            kind: "directory",
            path: absolute,
            relative_path: path.relative(workspace, absolute) || "."
          });
          continue;
        }
        if (!SKIP_DIRECTORIES.has(entry.name.toLowerCase())) walk(absolute, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      if (GUIDE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) && looksLikeBrandGuide(entry.name)) {
        candidates.push({
          kind: "file",
          path: absolute,
          relative_path: path.relative(workspace, absolute)
        });
      }
    }
  }

  walk(workspace, 0);
  const status = candidates.length === 0 ? "missing" : candidates.length === 1 ? "found" : "multiple";
  return {
    status,
    workspace_root: workspace,
    package_root_excluded: reusableRoot,
    candidates,
    inspected_entries: inspected,
    truncated,
    next: status === "found"
      ? "Read the guide, then complete brand.json before research."
      : status === "multiple"
        ? "Ask the user which brand guide applies, then complete brand.json."
        : "Use the brand-guide interview for every missing rubric item, save a reusable guide outside this package, then complete brand.json."
  };
}
