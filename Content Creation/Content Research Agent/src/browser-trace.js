import path from "node:path";
import { projectFiles, readJson, writeJson } from "./workspace.js";

export const DISCOVERY_ORDER = ["x.com", "digg.com", "reddit.com"];
export const DISCOVERY_OUTCOMES = new Set(["useful", "no-useful-results", "blocked"]);
export const GOOGLE_FALLBACK = "google.com";

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(nonEmpty).map((value) => value.trim()))];
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isOrderedDiscovery(sites) {
  return sites.length === DISCOVERY_ORDER.length &&
    sites.every((site, index) => site.toLowerCase() === DISCOVERY_ORDER[index]);
}

export function queryTargetsDiscoverySite(query, site) {
  return query.toLowerCase().includes(`site:${site}`);
}

export function recordBrowserTrace(projectDir, {
  agent,
  tool,
  searches = [],
  discoverySites = [],
  discoveryOutcomes = [],
  googleQuery = "",
  googleOpenedUrls = [],
  openedUrls = [],
  notes = "",
  startedAt = new Date().toISOString()
}) {
  if (!nonEmpty(agent)) throw new Error("browser-log requires --agent");
  if (!nonEmpty(tool)) throw new Error("browser-log requires --tool");
  const uniqueSearches = uniqueStrings(searches);
  const normalizedDiscoverySites = discoverySites
    .filter(nonEmpty)
    .map((site) => site.trim().toLowerCase());
  const normalizedOutcomes = discoveryOutcomes
    .filter(nonEmpty)
    .map((outcome) => outcome.trim().toLowerCase());
  const uniqueGoogleUrls = uniqueStrings(googleOpenedUrls);
  const uniqueUrls = uniqueStrings([...openedUrls, ...uniqueGoogleUrls]);
  if (!isOrderedDiscovery(normalizedDiscoverySites)) {
    throw new Error(`browser-log requires ordered discovery sites: ${DISCOVERY_ORDER.join(" -> ")}`);
  }
  for (const [index, site] of DISCOVERY_ORDER.entries()) {
    if (!uniqueSearches[index] || !queryTargetsDiscoverySite(uniqueSearches[index], site)) {
      throw new Error(`browser-log query ${index + 1} must target ${site}`);
    }
  }
  if (
    normalizedOutcomes.length !== DISCOVERY_ORDER.length ||
    normalizedOutcomes.some((outcome) => !DISCOVERY_OUTCOMES.has(outcome))
  ) {
    throw new Error("browser-log requires one outcome per discovery site: useful, no-useful-results, or blocked");
  }
  const needsGoogle = normalizedOutcomes.every((outcome) => outcome !== "useful");
  if (needsGoogle && !nonEmpty(googleQuery)) {
    throw new Error("browser-log requires --google-query when X, Digg, and Reddit have no useful leads");
  }
  if (!needsGoogle && nonEmpty(googleQuery)) {
    throw new Error("browser-log allows Google fallback only when X, Digg, and Reddit have no useful leads");
  }
  if (needsGoogle && !uniqueGoogleUrls.length) {
    throw new Error("browser-log requires --google-opened when Google fallback is used");
  }
  if (!needsGoogle && uniqueGoogleUrls.length) {
    throw new Error("browser-log allows --google-opened only when Google fallback is used");
  }
  if (!uniqueUrls.length) {
    throw new Error("browser-log requires at least one opened underlying source");
  }
  for (const url of uniqueUrls) {
    if (!validHttpUrl(url)) throw new Error(`browser-log --opened must use http(s): ${url}`);
  }

  const files = projectFiles(path.resolve(projectDir));
  const request = readJson(files.request);
  const browser = readJson(files.browser);
  if (browser.project_id !== request.project_id) {
    throw new Error("browser.json and request.json must share one project_id");
  }
  const googleSearch = googleQuery.trim();
  const additionalSearches = uniqueSearches
    .slice(3)
    .filter((search) => search !== googleSearch);
  const recordedSearches = needsGoogle
    ? [...uniqueSearches.slice(0, 3), googleSearch, ...additionalSearches]
    : uniqueSearches;
  const trace = {
    schema_version: "1.2",
    project_id: request.project_id,
    status: "completed",
    first_research_action: "browser",
    started_at: startedAt,
    agent: agent.trim(),
    tool: tool.trim(),
    searches: recordedSearches,
    discovery_sites: normalizedDiscoverySites,
    discovery_outcomes: normalizedOutcomes,
    google_fallback: {
      provider: GOOGLE_FALLBACK,
      used: needsGoogle,
      query: needsGoogle ? googleQuery.trim() : "",
      opened_urls: needsGoogle ? uniqueGoogleUrls : [],
      reason: needsGoogle ? "X, Digg, and Reddit returned no useful leads." : ""
    },
    opened_urls: uniqueUrls,
    notes: notes.trim()
  };
  writeJson(files.browser, trace);
  return { destination: files.browser, trace };
}
