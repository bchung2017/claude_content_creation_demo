import fs from "node:fs";
import path from "node:path";
import { list, nonEmpty, readJson } from "./json.js";
import { validateRenderedSlides } from "./slides.js";
import { carouselSha256 } from "./caption.js";

const RIGHTS = new Set(["owned", "official", "licensed", "permission-needed", "reference-only"]);
const BRAND_SOURCES = new Set(["guide", "questions"]);
const VERIFICATION = new Set(["verified", "corroborated", "company-reported", "unverified", "disputed"]);
const RESEARCH_JOB_ID = /^JOB-\d{8}-[a-f0-9]{8}$/;
const DISCOVERY_SITES = ["x.com", "digg.com", "reddit.com"];
const RESEARCH_MODES = ["browser", "web-search"];

function unique(values) {
  return [...new Set(values)];
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function checkReferences(ids, known, label, errors) {
  for (const id of list(ids)) {
    if (!known.has(id)) errors.push(`${label} references unknown id: ${id}`);
  }
}

function checkPublishableReferences(ids, claims, label, errors) {
  for (const id of list(ids)) {
    const claim = claims.find((item) => item.id === id);
    if (claim && claim.publishable !== true) {
      errors.push(`${label} references nonpublishable claim: ${id}`);
    }
  }
}

export function validateProject(projectDir) {
  const errors = [];
  const warnings = [];
  const required = [
    "request.json",
    "brand.json",
    "route.json",
    "research.json",
    "hook.json",
    "caption.json",
    "carousel.json",
    path.join("assets", "manifest.json")
  ];
  const missing = required.filter((file) => !fs.existsSync(path.join(projectDir, file)));
  if (missing.length) return { ok: false, errors: missing.map((file) => `missing ${file}`), warnings: [] };

  let request;
  let brand;
  let route;
  let research;
  let hook;
  let caption;
  let carousel;
  let manifest;
  try {
    request = readJson(path.join(projectDir, "request.json"));
    brand = readJson(path.join(projectDir, "brand.json"));
    route = readJson(path.join(projectDir, "route.json"));
    research = readJson(path.join(projectDir, "research.json"));
    hook = readJson(path.join(projectDir, "hook.json"));
    caption = readJson(path.join(projectDir, "caption.json"));
    carousel = readJson(path.join(projectDir, "carousel.json"));
    manifest = readJson(path.join(projectDir, "assets", "manifest.json"));
  } catch (error) {
    return { ok: false, errors: [`invalid JSON: ${error.message}`], warnings: [] };
  }

  if (request.format !== "carousel") errors.push("request.format must be carousel");
  if (brand.schema_version !== "1.0") errors.push("brand.schema_version must be 1.0");
  if (brand.status !== "completed") errors.push("brand.status must be completed before content work");
  const brandSource = record(brand.source);
  if (!brandSource || !BRAND_SOURCES.has(brandSource.type)) {
    errors.push("brand.source.type must be guide or questions");
  }
  if (brandSource?.type === "guide" && !nonEmpty(brandSource.path)) {
    errors.push("brand.source.path is required when a guide is used");
  }
  if (brandSource?.type === "guide" && brandSource.priority !== "primary") {
    errors.push("brand.source.priority must be primary when a guide is used");
  }
  if (!nonEmpty(brand.name)) errors.push("brand.name is required");
  if (!nonEmpty(brand.audience)) errors.push("brand.audience is required");
  if (!list(brand.voice).some(nonEmpty)) errors.push("brand.voice needs at least one direction");
  const brandVisual = record(brand.visual);
  if (!brandVisual || !nonEmpty(brandVisual.direction)) {
    errors.push("brand.visual.direction is required");
  }
  if (!list(brandVisual?.colors).some(nonEmpty)) errors.push("brand.visual.colors needs at least one direction");
  if (!list(brandVisual?.typography).some(nonEmpty)) errors.push("brand.visual.typography needs at least one direction");
  if (!list(brandVisual?.imagery).some(nonEmpty)) errors.push("brand.visual.imagery needs at least one direction");
  if (!nonEmpty(brandVisual?.logo_usage)) errors.push("brand.visual.logo_usage is required");
  const brandRules = record(brand.content_rules);
  if (!brandRules || !list(brandRules.do).some(nonEmpty)) {
    errors.push("brand.content_rules.do needs at least one rule");
  }
  if (!brandRules || !list(brandRules.avoid).some(nonEmpty)) {
    errors.push("brand.content_rules.avoid needs at least one rule");
  }
  if (!nonEmpty(brand.cta_style)) errors.push("brand.cta_style is required");
  if (route.format !== "carousel") errors.push("route.format must be carousel");
  if (research.schema_version !== "2.0") errors.push("research.schema_version must be 2.0");
  if (research.status !== "completed") errors.push("research.status must be completed");
  if (research.project_id !== request.project_id) errors.push("research.project_id must match request.project_id");
  if (!nonEmpty(research.summary)) errors.push("research.summary is required");
  if (!nonEmpty(research.as_of)) warnings.push("research.as_of is missing");

  const origin = record(research.origin);
  if (!origin) {
    errors.push("research.origin must be a validated research-agent origin");
  } else {
    if (origin.agent !== "social-media-research-agent") errors.push("research.origin.agent must be social-media-research-agent");
    if (!RESEARCH_JOB_ID.test(origin.job_id || "")) errors.push("research.origin.job_id must use the JOB-YYYYMMDD-xxxxxxxx format");
    if (origin.content_type !== "social-media") errors.push("research.origin.content_type must be social-media");
    if (!nonEmpty(origin.specialist)) errors.push("research.origin.specialist is required");
  }
  if (route.input_kind !== "validated-research-handoff") {
    errors.push("route.input_kind must be validated-research-handoff");
  }
  if (route.selected_specialist !== "hook-writer-agent") {
    errors.push("route.selected_specialist must be hook-writer-agent after research import");
  }
  if (!origin || route.research_job_id !== origin.job_id) {
    errors.push("route.research_job_id must match research.origin.job_id");
  }

  const browser = record(research.browser);
  if (!browser) {
    errors.push("research.browser must contain the completed browser trace");
  } else {
    if (browser.project_id !== origin?.job_id) errors.push("research.browser.project_id must match research.origin.job_id");
    if (browser.status !== "completed") errors.push("research.browser.status must be completed");
    const mode = nonEmpty(browser.mode) ? browser.mode : "browser";
    if (!RESEARCH_MODES.includes(mode)) {
      errors.push(`research.browser.mode must be ${RESEARCH_MODES.join(" or ")}`);
    }
    if (browser.first_research_action !== mode) {
      errors.push(`research.browser.first_research_action must be ${mode}`);
    }
    if (!Array.isArray(browser.searches) || browser.searches.length < 3) {
      errors.push("research.browser.searches must contain the required discovery sweep");
    }
    if (!Array.isArray(browser.discovery_sites) ||
      browser.discovery_sites.length !== DISCOVERY_SITES.length ||
      browser.discovery_sites.some((site, index) => site !== DISCOVERY_SITES[index])) {
      errors.push("research.browser.discovery_sites must preserve x.com, digg.com, reddit.com order");
    }
    const openedUrls = list(browser.opened_urls);
    const snippets = list(browser.snippets);
    if (mode === "web-search") {
      if (!Array.isArray(browser.snippets) || snippets.length === 0) {
        errors.push("research.browser.snippets must contain at least one captured result in web-search mode");
      }
    } else if (openedUrls.length === 0) {
      errors.push("research.browser.opened_urls must contain at least one underlying source");
    }
  }

  const analysis = record(research.analysis);
  if (!analysis) {
    errors.push("research.analysis must contain the specialist analysis");
  } else {
    if (analysis.project_id !== origin?.job_id) errors.push("research.analysis.project_id must match research.origin.job_id");
    if (analysis.content_type !== origin?.content_type) errors.push("research.analysis.content_type must match research.origin.content_type");
    if (!nonEmpty(analysis.conclusion)) errors.push("research.analysis.conclusion is required");
    if (!record(analysis.specialist)) errors.push("research.analysis.specialist must be an object");
  }

  const governance = record(research.governance);
  if (!governance) {
    errors.push("research.governance must contain session, decision, and learning ledgers");
  } else {
    if (!Array.isArray(governance.sessions) || governance.sessions.length === 0) {
      errors.push("research.governance.sessions must contain at least one event");
    }
    if (!Array.isArray(governance.decisions) || governance.decisions.length === 0) {
      errors.push("research.governance.decisions must contain at least one event");
    }
    if (!Array.isArray(governance.learnings)) {
      errors.push("research.governance.learnings must be an event array");
    }
    for (const event of [...list(governance.sessions), ...list(governance.decisions), ...list(governance.learnings)]) {
      if (event?.job_id !== origin?.job_id) errors.push("every governance event job_id must match research.origin.job_id");
    }
  }

  const sources = list(research.sources);
  const sourceIds = new Set(sources.map((source) => source.id).filter(nonEmpty));
  const claims = list(research.claims);
  const claimIds = new Set(claims.map((claim) => claim.id).filter(nonEmpty));
  const assets = list(manifest.assets);
  const assetIds = new Set(assets.map((asset) => asset.id).filter(nonEmpty));

  if (!sources.length) errors.push("research.sources must contain at least one source");
  if (!claims.length) errors.push("research.claims must contain at least one claim");
  for (const source of sources) {
    if (!nonEmpty(source.id)) errors.push("every source needs an id");
    if (!nonEmpty(source.url) && !nonEmpty(source.local_path)) {
      errors.push(`source ${source.id || "unknown"} needs a url or local_path`);
    }
    if (!nonEmpty(source.title)) warnings.push(`source ${source.id || "unknown"} has no title`);
    if (nonEmpty(source.url) && browser && !list(browser.opened_urls).includes(source.url)) {
      errors.push(`web source ${source.id || "unknown"} must appear in research.browser.opened_urls`);
    }
  }
  for (const claim of claims) {
    if (!nonEmpty(claim.id)) errors.push("every claim needs an id");
    if (!nonEmpty(claim.text)) errors.push(`claim ${claim.id || "unknown"} needs text`);
    if (!VERIFICATION.has(claim.verification)) errors.push(`claim ${claim.id || "unknown"} has invalid verification`);
    checkReferences(claim.source_ids, sourceIds, `claim ${claim.id || "unknown"}`, errors);
    if (claim.publishable === true && !list(claim.source_ids).length) errors.push(`publishable claim ${claim.id} needs a source`);
    if (claim.publishable === true && ["unverified", "disputed"].includes(claim.verification)) {
      errors.push(`claim ${claim.id} cannot be publishable while ${claim.verification}`);
    }
    if (claim.publishable === true && claim.verification === "company-reported" && !nonEmpty(claim.attribution)) {
      errors.push(`publishable company-reported claim ${claim.id} needs attribution`);
    }
  }
  if (!claims.some((claim) => claim.publishable === true)) errors.push("at least one claim must be publishable");
  if (list(research.gaps).some((gap) => gap && (gap.blocking === true || gap.status === "blocking"))) {
    errors.push("research.gaps contains a blocking gap");
  }

  if (hook.status !== "completed") errors.push("hook.status must be completed");
  if (!nonEmpty(hook.primary)) errors.push("hook.primary is required");
  checkReferences(hook.claim_ids, claimIds, "hook", errors);
  checkPublishableReferences(hook.claim_ids, claims, "hook", errors);
  if (!list(hook.claim_ids).length) errors.push("hook.claim_ids must contain at least one claim");

  if (caption.status !== "completed") errors.push("caption.status must be completed");
  if (!nonEmpty(caption.text)) errors.push("caption.text is required");
  if (!/^[a-f0-9]{64}$/.test(caption.carousel_sha256 || "")) {
    errors.push("caption.carousel_sha256 must be registered after the final carousel");
  } else if (caption.carousel_sha256 !== carouselSha256(projectDir)) {
    errors.push("caption.carousel_sha256 does not match the final carousel; rerun the Caption Writer");
  }
  checkReferences(caption.claim_ids, claimIds, "caption", errors);
  checkPublishableReferences(caption.claim_ids, claims, "caption", errors);
  checkReferences(caption.source_ids, sourceIds, "caption", errors);
  const captionNeedsAttribution = list(caption.claim_ids).some((claimId) => {
    const claim = claims.find((item) => item.id === claimId);
    return claim?.publishable === true && claim.verification === "company-reported";
  });
  if (captionNeedsAttribution && !nonEmpty(caption.attribution)) {
    errors.push("caption.attribution is required for company-reported claims");
  }

  if (carousel.status !== "completed") errors.push("carousel.status must be completed");
  const slides = list(carousel.slides);
  if (slides.length < 1 || slides.length > 10) errors.push("carousel.slides must contain 1–10 slides");
  for (const slide of slides) {
    if (!nonEmpty(slide.id)) errors.push("every slide needs an id");
    if (!nonEmpty(slide.role)) errors.push(`slide ${slide.id || "unknown"} needs a role`);
    if (!nonEmpty(slide.headline) && !nonEmpty(slide.body)) errors.push(`slide ${slide.id || "unknown"} needs copy`);
    if (!nonEmpty(slide.visual_job)) errors.push(`slide ${slide.id || "unknown"} needs a visual_job`);
    checkReferences(slide.claim_ids, claimIds, `slide ${slide.id || "unknown"}`, errors);
    checkPublishableReferences(slide.claim_ids, claims, `slide ${slide.id || "unknown"}`, errors);
    checkReferences(slide.asset_ids, assetIds, `slide ${slide.id || "unknown"}`, errors);
  }
  if (slides[0] && slides[0].role !== "cover") warnings.push("the first slide is not marked cover");
  validateRenderedSlides({ projectDir, carousel, errors });

  for (const asset of assets) {
    if (!nonEmpty(asset.id)) errors.push("every asset needs an id");
    if (!nonEmpty(asset.source_url)) errors.push(`asset ${asset.id || "unknown"} needs source_url`);
    if (!RIGHTS.has(asset.rights_status)) errors.push(`asset ${asset.id || "unknown"} has invalid rights_status`);
    if (!nonEmpty(asset.usage)) errors.push(`asset ${asset.id || "unknown"} needs usage`);
    if (!nonEmpty(asset.local_path)) warnings.push(`asset ${asset.id || "unknown"} has no local_path yet`);
  }

  const referencedAssets = unique(slides.flatMap((slide) => list(slide.asset_ids)));
  for (const assetId of referencedAssets) {
    if (!assetIds.has(assetId)) errors.push(`carousel references asset not in manifest: ${assetId}`);
  }
  if (referencedAssets.some((assetId) => assets.find((asset) => asset.id === assetId)?.rights_status === "permission-needed")) {
    errors.push("carousel cannot reference an asset marked permission-needed");
  }
  if (referencedAssets.some((assetId) => assets.find((asset) => asset.id === assetId)?.rights_status === "reference-only")) {
    errors.push("carousel cannot reference an asset marked reference-only");
  }

  return { ok: errors.length === 0, errors, warnings, request, brand, route, research, hook, caption, carousel, manifest };
}
