import fs from "node:fs";
import {
  DISCOVERY_ORDER,
  DISCOVERY_OUTCOMES,
  GOOGLE_FALLBACK,
  queryTargetsDiscoverySite
} from "./browser-trace.js";
import { getProfile } from "./profiles.js";
import { loadProject, projectFiles } from "./workspace.js";

const SOURCE_TYPES = new Set(["primary", "official", "independent", "community", "user-supplied"]);
const CLAIM_KINDS = new Set([
  "fact",
  "quote",
  "number",
  "price",
  "performance",
  "availability",
  "company-claim",
  "inference"
]);
const VERIFICATIONS = new Set([
  "verified",
  "corroborated",
  "company-reported",
  "unverified",
  "disputed"
]);
const RIGHTS = new Set(["owned", "official", "licensed", "permission-needed", "reference-only"]);
const JOB_STATUSES = new Set(["active", "completed", "blocked"]);
const SESSION_STATUSES = new Set(["started", "progress", "completed", "blocked"]);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validDate(value) {
  return nonEmpty(value) && !Number.isNaN(Date.parse(value));
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSpecialist(profile, specialist, errors) {
  if (!specialist || typeof specialist !== "object" || Array.isArray(specialist)) {
    errors.push("analysis.specialist must be an object");
    return;
  }
  for (const [key, definition] of Object.entries(profile.analysisFields)) {
    const value = specialist[key];
    const location = `analysis.specialist.${key}`;
    if (definition.type === "string" && !nonEmpty(value)) {
      errors.push(`${location} is required`);
    }
    if (definition.type === "array") {
      if (!Array.isArray(value)) errors.push(`${location} must be an array`);
      else if ((definition.min ?? 0) > value.length) {
        errors.push(`${location} needs at least ${definition.min} item(s)`);
      }
    }
  }
}

function validateIdList(value, location, knownIds, errors, minimum = 0) {
  if (!Array.isArray(value)) {
    if (minimum > 0) errors.push(`${location} must be an array with at least ${minimum} id(s)`);
    return;
  }
  if (value.length < minimum) errors.push(`${location} needs at least ${minimum} id(s)`);
  for (const [index, id] of value.entries()) {
    if (!nonEmpty(id)) errors.push(`${location}[${index}] must be a non-empty id`);
    else if (!knownIds.has(id)) errors.push(`${location}[${index}] references missing id ${id}`);
  }
}

function validateSpecialistReferences(profile, specialist, sourceIds, claimIds, assetIds, errors) {
  for (const key of Object.keys(profile.analysisFields)) {
    if (!(key in specialist)) continue;
    if (key.endsWith("_source_ids")) {
      validateIdList(specialist[key], `analysis.specialist.${key}`, sourceIds, errors);
    } else if (key.endsWith("_claim_ids")) {
      validateIdList(specialist[key], `analysis.specialist.${key}`, claimIds, errors);
    } else if (key.endsWith("_asset_ids")) {
      validateIdList(specialist[key], `analysis.specialist.${key}`, assetIds, errors);
    }
  }
}

export function validateProject(projectDir) {
  const errors = [];
  const warnings = [];
  const files = projectFiles(projectDir);
  for (const [name, file] of Object.entries(files)) {
    if (name === "brief" || name === "packet") continue;
    if (!fs.existsSync(file)) errors.push(`missing ${name} file: ${file}`);
  }
  if (errors.length) return { ok: false, errors, warnings, project: null };

  let project;
  try {
    project = loadProject(projectDir);
  } catch (error) {
    return { ok: false, errors: [error.message], warnings, project: null };
  }
  const { job, request, route, browser, evidence, analysis, assets, sessions, decisions, learnings } = project;
  const ids = [
    job.job_id,
    request.project_id,
    route.project_id,
    browser.project_id,
    evidence.project_id,
    analysis.project_id,
    assets.project_id
  ];
  if (new Set(ids).size !== 1 || !ids[0]) errors.push("job and project files must share one non-empty JOB id");
  if (!/^JOB-\d{8}-[a-f0-9]{8}$/.test(job.job_id || "")) {
    errors.push("job.job_id must use the JOB-YYYYMMDD-xxxxxxxx format");
  }
  if (!JOB_STATUSES.has(job.status)) errors.push("job.status is invalid");
  if (job.content_type !== route.content_type) errors.push("job.content_type must match route.content_type");
  if (route.status !== "routed" || !route.content_type) errors.push("route.json must contain a completed route");
  if (route.maturity !== "production") errors.push("route.maturity must be production");

  let profile;
  try {
    profile = getProfile(route.content_type);
  } catch (error) {
    errors.push(error.message);
  }
  if (analysis.content_type !== route.content_type) {
    errors.push("analysis.content_type must match route.content_type");
  }
  if (!Array.isArray(sessions) || sessions.length === 0) {
    errors.push("sessions.ndjson needs at least one session event");
  } else {
    for (const [index, session] of sessions.entries()) {
      const at = `sessions[${index}]`;
      if (!/^SES-\d{8}-[a-f0-9]{8}$/.test(session.session_id || "")) errors.push(`${at}.session_id is invalid`);
      if (session.job_id !== job.job_id) errors.push(`${at}.job_id must match job.job_id`);
      if (!SESSION_STATUSES.has(session.status)) errors.push(`${at}.status is invalid`);
      if (!nonEmpty(session.agent)) errors.push(`${at}.agent is required`);
      if (!nonEmpty(session.summary)) errors.push(`${at}.summary is required`);
      if (!validDate(session.created_at)) errors.push(`${at}.created_at must be an ISO date`);
    }
    if (!sessions.some((session) => session.agent !== "router" && session.status !== "started")) {
      errors.push("sessions.ndjson needs at least one non-router research work event");
    }
  }
  if (!Array.isArray(decisions) || decisions.length === 0) {
    errors.push("decisions.ndjson needs at least one decision event");
  } else {
    for (const [index, decision] of decisions.entries()) {
      const at = `decisions[${index}]`;
      if (!/^DEC-\d{8}-[a-f0-9]{8}$/.test(decision.decision_id || "")) errors.push(`${at}.decision_id is invalid`);
      if (decision.job_id !== job.job_id) errors.push(`${at}.job_id must match job.job_id`);
      if (!nonEmpty(decision.title)) errors.push(`${at}.title is required`);
      if (!nonEmpty(decision.decision)) errors.push(`${at}.decision is required`);
      if (!nonEmpty(decision.rationale)) errors.push(`${at}.rationale is required`);
      if (!nonEmpty(decision.made_by)) errors.push(`${at}.made_by is required`);
      if (!validDate(decision.created_at)) errors.push(`${at}.created_at must be an ISO date`);
    }
    if (!decisions.some((decision) => decision.made_by !== "router")) {
      errors.push("decisions.ndjson needs at least one material research decision");
    }
  }
  if (!Array.isArray(learnings)) {
    errors.push("learnings.ndjson must be an event array");
  } else {
    const capturedLearningIds = new Set();
    for (const [index, learning] of learnings.entries()) {
      const at = `learnings[${index}]`;
      if (!/^LRN-\d{8}-[a-f0-9]{8}$/.test(learning.learning_id || "")) errors.push(`${at}.learning_id is invalid`);
      if (learning.job_id !== job.job_id) errors.push(`${at}.job_id must match job.job_id`);
      if (!["captured", "decision"].includes(learning.event)) errors.push(`${at}.event is invalid`);
      if (!validDate(learning.created_at)) errors.push(`${at}.created_at must be an ISO date`);
      if (!nonEmpty(learning.agent)) errors.push(`${at}.agent is required`);
      if (learning.event === "captured") {
        if (capturedLearningIds.has(learning.learning_id)) errors.push(`${at}.learning_id duplicates a capture`);
        else capturedLearningIds.add(learning.learning_id);
        if (!nonEmpty(learning.feedback)) errors.push(`${at}.feedback is required`);
        if (!nonEmpty(learning.learning)) errors.push(`${at}.learning is required`);
        if (!["job", "package"].includes(learning.scope)) errors.push(`${at}.scope is invalid`);
        if (learning.approval_status !== "pending") errors.push(`${at}.approval_status must be pending`);
      }
      if (learning.event === "decision") {
        if (!capturedLearningIds.has(learning.learning_id)) errors.push(`${at}.learning_id has no earlier capture`);
        if (!["approved", "declined"].includes(learning.decision)) errors.push(`${at}.decision is invalid`);
      }
    }
  }
  if (browser.status !== "completed") {
    errors.push("browser.status must be completed before validation");
  }
  if (browser.first_research_action !== "browser") {
    errors.push("browser.first_research_action must be browser");
  }
  if (!validDate(browser.started_at)) errors.push("browser.started_at must be an ISO date or timestamp");
  if (!nonEmpty(browser.agent)) errors.push("browser.agent is required");
  if (!nonEmpty(browser.tool)) errors.push("browser.tool is required");
  if (!Array.isArray(browser.searches)) errors.push("browser.searches must be an array");
  if (!Array.isArray(browser.discovery_sites)) {
    errors.push("browser.discovery_sites must be an array");
  } else if (
    browser.discovery_sites.length !== DISCOVERY_ORDER.length ||
    browser.discovery_sites.some((site, index) => site !== DISCOVERY_ORDER[index])
  ) {
    errors.push(`browser.discovery_sites must preserve the order ${DISCOVERY_ORDER.join(" -> ")}`);
  }
  const outcomes = Array.isArray(browser.discovery_outcomes)
    ? browser.discovery_outcomes
    : [];
  const outcomesValid = outcomes.length === DISCOVERY_ORDER.length &&
    outcomes.every((outcome) => DISCOVERY_OUTCOMES.has(outcome));
  if (!Array.isArray(browser.discovery_outcomes)) {
    errors.push("browser.discovery_outcomes must be an array");
  } else if (!outcomesValid) {
    errors.push("browser.discovery_outcomes needs one valid outcome per discovery site");
  }
  if (!Array.isArray(browser.opened_urls)) {
    errors.push("browser.opened_urls must be an array");
  } else {
    if (browser.opened_urls.length === 0) {
      errors.push("browser.opened_urls needs at least one underlying source");
    }
    for (const [index, url] of browser.opened_urls.entries()) {
      if (!validHttpUrl(url)) errors.push(`browser.opened_urls[${index}] must use http(s)`);
    }
  }
  const searches = Array.isArray(browser.searches) ? browser.searches.filter(nonEmpty) : [];
  const openedUrls = Array.isArray(browser.opened_urls) ? browser.opened_urls : [];
  for (const [index, site] of DISCOVERY_ORDER.entries()) {
    if (!searches[index] || !queryTargetsDiscoverySite(searches[index], site)) {
      errors.push(`browser.searches[${index}] must target ${site}`);
    }
  }
  const google = browser.google_fallback;
  if (!google || typeof google !== "object" || Array.isArray(google)) {
    errors.push("browser.google_fallback must be an object");
  } else {
    if (google.provider !== GOOGLE_FALLBACK) {
      errors.push(`browser.google_fallback.provider must be ${GOOGLE_FALLBACK}`);
    }
    if (typeof google.used !== "boolean") {
      errors.push("browser.google_fallback.used must be a boolean");
    }
    if (outcomesValid) {
      const needsGoogle = outcomes.every((outcome) => outcome !== "useful");
      if (needsGoogle) {
        if (google.used !== true) {
          errors.push("browser.google_fallback.used must be true when all three discovery sites have no useful leads");
        }
        if (!nonEmpty(google.query)) {
          errors.push("browser.google_fallback.query is required when Google fallback is used");
        } else if (searches[3] !== google.query) {
          errors.push("browser.searches[3] must record the Google fallback query");
        }
        if (!Array.isArray(google.opened_urls) || google.opened_urls.length === 0) {
          errors.push("browser.google_fallback.opened_urls needs at least one underlying source");
        } else {
          for (const [index, url] of google.opened_urls.entries()) {
            if (!validHttpUrl(url)) {
              errors.push(`browser.google_fallback.opened_urls[${index}] must use http(s)`);
            } else if (!openedUrls.includes(url)) {
              errors.push(`browser.opened_urls must include Google fallback source ${url}`);
            }
          }
        }
        if (!nonEmpty(google.reason)) {
          errors.push("browser.google_fallback.reason is required when Google fallback is used");
        }
      } else {
        if (google.used !== false) {
          errors.push("browser.google_fallback must remain unused when a discovery site has useful leads");
        }
        if (nonEmpty(google.query)) {
          errors.push("browser.google_fallback.query must be empty when fallback is unused");
        }
        if (!Array.isArray(google.opened_urls) || google.opened_urls.length !== 0) {
          errors.push("browser.google_fallback.opened_urls must be empty when fallback is unused");
        }
      }
    }
  }
  for (const url of request.input_urls || []) {
    if (validHttpUrl(url) && !openedUrls.includes(url)) {
      errors.push(`browser.opened_urls must include the supplied URL ${url}`);
    }
  }
  if (!validDate(evidence.as_of)) errors.push("evidence.as_of must be an ISO date or timestamp");
  if (!nonEmpty(evidence.summary)) errors.push("evidence.summary is required");
  if (!Array.isArray(evidence.sources) || evidence.sources.length === 0) {
    errors.push("evidence.sources needs at least one source");
  }
  if (!Array.isArray(evidence.claims) || evidence.claims.length === 0) {
    errors.push("evidence.claims needs at least one claim");
  }

  const sourceIds = new Set();
  const sourceById = new Map();
  for (const [index, source] of (evidence.sources || []).entries()) {
    const at = `evidence.sources[${index}]`;
    if (!nonEmpty(source.id)) errors.push(`${at}.id is required`);
    else if (sourceIds.has(source.id)) errors.push(`${at}.id duplicates ${source.id}`);
    else {
      sourceIds.add(source.id);
      sourceById.set(source.id, source);
    }
    if (!nonEmpty(source.title)) errors.push(`${at}.title is required`);
    if (!SOURCE_TYPES.has(source.source_type)) errors.push(`${at}.source_type is invalid`);
    if (!validDate(source.captured_at)) errors.push(`${at}.captured_at must be an ISO date`);
    if (!validHttpUrl(source.url) && !nonEmpty(source.local_path)) {
      errors.push(`${at} needs an http(s) url or local_path`);
    }
    if (source.url && !validHttpUrl(source.url)) errors.push(`${at}.url must use http(s)`);
    if (validHttpUrl(source.url) && !openedUrls.includes(source.url)) {
      errors.push(`${at}.url must appear in browser.opened_urls`);
    }
  }

  const claimIds = new Set();
  for (const [index, claim] of (evidence.claims || []).entries()) {
    const at = `evidence.claims[${index}]`;
    if (!nonEmpty(claim.id)) errors.push(`${at}.id is required`);
    else if (claimIds.has(claim.id)) errors.push(`${at}.id duplicates ${claim.id}`);
    else {
      claimIds.add(claim.id);
    }
    if (!nonEmpty(claim.text)) errors.push(`${at}.text is required`);
    if (!CLAIM_KINDS.has(claim.kind)) errors.push(`${at}.kind is invalid`);
    if (!VERIFICATIONS.has(claim.verification)) errors.push(`${at}.verification is invalid`);
    if (!Array.isArray(claim.source_ids) || claim.source_ids.length === 0) {
      errors.push(`${at}.source_ids needs at least one source`);
    } else {
      for (const sourceId of claim.source_ids) {
        if (!sourceIds.has(sourceId)) errors.push(`${at}.source_ids references missing source ${sourceId}`);
      }
    }
    if (claim.verification === "corroborated") {
      const corroboratingSources = [...new Set(claim.source_ids || [])]
        .map((sourceId) => sourceById.get(sourceId))
        .filter(Boolean);
      const locations = new Set(corroboratingSources.map((source) => source.url || source.local_path));
      const publishers = new Set(corroboratingSources.map((source) => source.publisher).filter(nonEmpty));
      if (corroboratingSources.length < 2 || locations.size < 2) {
        errors.push(`${at}.source_ids needs at least two distinct evidence locations when corroborated`);
      }
      if (publishers.size < 2) {
        errors.push(`${at} needs at least two distinct source publishers when corroborated`);
      }
    }
    if (!nonEmpty(claim.evidence)) errors.push(`${at}.evidence is required`);
    if (["number", "price", "performance", "availability"].includes(claim.kind) && !validDate(claim.as_of)) {
      errors.push(`${at}.as_of is required for time-sensitive claims`);
    }
    if (claim.publishable === true && claim.verification === "unverified") {
      errors.push(`${at} cannot be publishable while unverified`);
    }
    if (claim.publishable === true && ["company-reported", "disputed"].includes(claim.verification) && !nonEmpty(claim.attribution)) {
      errors.push(`${at}.attribution is required for ${claim.verification} publishable claims`);
    }
    if (claim.kind === "quote" && claim.exact_quote !== true) {
      errors.push(`${at}.exact_quote must be true for direct quotations`);
    }
  }

  if (!Array.isArray(evidence.gaps)) errors.push("evidence.gaps must be an array");
  for (const [index, gap] of (evidence.gaps || []).entries()) {
    if (!nonEmpty(gap.description)) errors.push(`evidence.gaps[${index}].description is required`);
    if (gap.blocking === true) errors.push(`blocking research gap: ${gap.description || `gap ${index + 1}`}`);
  }

  const assetIds = new Set();
  if (!Array.isArray(assets.assets)) errors.push("assets.assets must be an array");
  for (const [index, asset] of (Array.isArray(assets.assets) ? assets.assets : []).entries()) {
    const at = `assets.assets[${index}]`;
    if (!nonEmpty(asset.id)) errors.push(`${at}.id is required`);
    else if (assetIds.has(asset.id)) errors.push(`${at}.id duplicates ${asset.id}`);
    else assetIds.add(asset.id);
    if (!nonEmpty(asset.kind)) errors.push(`${at}.kind is required`);
    if (!sourceIds.has(asset.source_id)) errors.push(`${at}.source_id references missing source ${asset.source_id}`);
    if (!RIGHTS.has(asset.rights_status)) errors.push(`${at}.rights_status is invalid`);
    if (!nonEmpty(asset.usage)) errors.push(`${at}.usage is required`);
  }

  if (!nonEmpty(analysis.conclusion)) errors.push("analysis.conclusion is required");
  if (!nonEmpty(analysis.scope)) errors.push("analysis.scope is required");
  if (profile) {
    validateSpecialist(profile, analysis.specialist, errors);
    if (analysis.specialist && typeof analysis.specialist === "object" && !Array.isArray(analysis.specialist)) {
      validateSpecialistReferences(
        profile,
        analysis.specialist,
        sourceIds,
        claimIds,
        assetIds,
        errors
      );
    }
    if (profile.id === "social-media" && Array.isArray(analysis.specialist?.signal_counts)) {
      const platforms = new Set();
      for (const [index, count] of analysis.specialist.signal_counts.entries()) {
        const at = `analysis.specialist.signal_counts[${index}]`;
        if (!count || typeof count !== "object" || Array.isArray(count)) {
          errors.push(`${at} must be an object`);
          continue;
        }
        if (!["x.com", "digg.com", "reddit.com"].includes(count.platform)) {
          errors.push(`${at}.platform must be x.com, digg.com, or reddit.com`);
        } else if (platforms.has(count.platform)) {
          errors.push(`${at}.platform duplicates ${count.platform}`);
        } else platforms.add(count.platform);
        if (!Number.isInteger(count.unique_authors) || count.unique_authors < 0) {
          errors.push(`${at}.unique_authors must be a non-negative integer`);
        }
        if (!Number.isInteger(count.qualifying_posts) || count.qualifying_posts < 0) {
          errors.push(`${at}.qualifying_posts must be a non-negative integer`);
        }
      }
      for (const platform of ["x.com", "digg.com", "reddit.com"]) {
        if (!platforms.has(platform)) errors.push(`analysis.specialist.signal_counts needs ${platform}`);
      }
    }
  }

  const officialOrPrimary = (evidence.sources || []).filter((source) =>
    ["official", "primary", "user-supplied"].includes(source.source_type)
  );
  if (!officialOrPrimary.length) warnings.push("No primary, official, or user-supplied source is recorded.");
  const publishableClaims = (evidence.claims || []).filter((claim) => claim.publishable === true);
  if (!publishableClaims.length) warnings.push("No claim is marked publishable.");

  return { ok: errors.length === 0, errors, warnings, project, profile };
}
