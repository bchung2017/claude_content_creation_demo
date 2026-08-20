import fs from "node:fs";
import path from "node:path";
import { validateProject } from "./validate.js";

function bullet(values) {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : "- none";
}

export function writeBrief(projectDir, outFile) {
  const result = validateProject(projectDir);
  if (!result.ok) throw new Error(`validation failed: ${result.errors.join("; ")}`);
  const { request, brand, research, hook, caption, carousel, manifest } = result;
  const usedClaimIds = new Set([
    ...(hook.claim_ids || []),
    ...(caption.claim_ids || []),
    ...carousel.slides.flatMap((slide) => slide.claim_ids || [])
  ]);
  const claimAttributions = research.claims
    .filter((claim) => usedClaimIds.has(claim.id) && claim.verification === "company-reported")
    .map((claim) => `[${claim.id}] ${claim.text} — ${claim.attribution}`);
  const lines = [
    `# ${request.topic}`,
    "",
    `Format: carousel · ${carousel.format?.width || 1080}×${carousel.format?.height || 1350}`,
    `Goal: ${request.goal}`,
    "",
    "## Brand direction",
    "",
    `Brand: ${brand.name}`,
    `Audience: ${brand.audience}`,
    `Voice: ${brand.voice.join(", ")}`,
    `Visual direction: ${brand.visual.direction}`,
    `Colors: ${brand.visual.colors.join(", ")}`,
    `Typography: ${brand.visual.typography.join(", ")}`,
    `Imagery: ${brand.visual.imagery.join(", ")}`,
    `Logo use: ${brand.visual.logo_usage}`,
    `Do: ${brand.content_rules.do.join("; ") || "none recorded"}`,
    `Avoid: ${brand.content_rules.avoid.join("; ") || "none recorded"}`,
    brand.cta_style ? `CTA style: ${brand.cta_style}` : "",
    "",
    "## Hook",
    "",
    hook.primary,
    "",
    "## Caption",
    "",
    caption.text,
    caption.attribution ? `\nAttribution: ${caption.attribution}` : "",
    caption.disclosure ? `\nDisclosure: ${caption.disclosure}` : "",
    "",
    "## Slides",
    "",
    ...carousel.slides.flatMap((slide, index) => [
      `### ${index + 1}. ${slide.role}`,
      "",
      slide.headline ? `**${slide.headline}**` : "",
      slide.body || "",
      `Visual job: ${slide.visual_job}`,
      `Claims: ${(slide.claim_ids || []).join(", ") || "none"}`,
      `Assets: ${(slide.asset_ids || []).join(", ") || "none"}`,
      ""
    ]),
    "## Final PNG slides",
    "",
    ...carousel.rendered_slides.map((slide) =>
      `- [${slide.slide_id}] ${slide.file} (${slide.width}×${slide.height})`
    ),
    "",
    "## Evidence summary",
    "",
    research.summary,
    "",
    "## Claim attribution",
    "",
    bullet(claimAttributions),
    "",
    "## Sources",
    "",
    bullet(research.sources.map((source) => `[${source.id}] ${source.title} — ${source.url || source.local_path}`)),
    "",
    "## Assets",
    "",
    bullet(manifest.assets.map((asset) => `[${asset.id}] ${asset.kind || "asset"} — ${asset.rights_status} — ${asset.usage}`)),
    "",
    "## Open gaps",
    "",
    bullet((research.gaps || []).map((gap) => typeof gap === "string" ? gap : gap.text || JSON.stringify(gap))),
    ""
  ].filter((line, index, all) => !(line === "" && all[index - 1] === ""));
  const destination = path.resolve(outFile || path.join(projectDir, "CAROUSEL.md"));
  fs.writeFileSync(destination, `${lines.join("\n")}\n`);
  return destination;
}
