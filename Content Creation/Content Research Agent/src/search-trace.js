import path from "node:path";
import { projectFiles, readJson, writeJson } from "./workspace.js";
import { TRACE_SCHEMA_VERSION } from "./browser-trace.js";
import {
  DISCOVERY_ORDER,
  DISCOVERY_OUTCOMES,
  OPEN_WEB_FALLBACK,
  WEB_SEARCH_MODE,
  hostMatchesSite,
  isOrderedDiscovery,
  nonEmpty,
  queryTargetsDiscoverySite,
  uniqueStrings,
  validHttpUrl
} from "./discovery.js";

export const SNIPPET_SITES = new Set([...DISCOVERY_ORDER, OPEN_WEB_FALLBACK]);
const SNIPPET_FIELDS = ["site", "query", "title", "url", "snippet"];

function fail(message) {
  throw new Error(`search-log ${message}`);
}

/**
 * Accepts a snippet as a JSON object or as a JSON string, so the CLI can take
 * either `--snippet '{...}'` or a `--snippets-file` array.
 */
export function parseSnippet(input, index) {
  let value = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input);
    } catch (error) {
      fail(`--snippet ${index + 1} must be a JSON object: ${error.message}`);
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`--snippet ${index + 1} must be a JSON object`);
  }
  for (const field of SNIPPET_FIELDS) {
    if (!nonEmpty(value[field])) fail(`--snippet ${index + 1} needs a non-empty ${field}`);
  }
  const site = value.site.trim().toLowerCase();
  if (!SNIPPET_SITES.has(site)) {
    fail(`--snippet ${index + 1} site must be one of ${[...SNIPPET_SITES].join(", ")}`);
  }
  if (!validHttpUrl(value.url)) fail(`--snippet ${index + 1} url must use http(s)`);
  if (!hostMatchesSite(value.url, site)) {
    fail(`--snippet ${index + 1} url ${value.url} is not on ${site}; host web search returns off-domain results, so file it under ${OPEN_WEB_FALLBACK} or drop it`);
  }
  const retrievedAt = nonEmpty(value.retrieved_at) ? value.retrieved_at.trim() : "";
  if (retrievedAt && Number.isNaN(Date.parse(retrievedAt))) {
    fail(`--snippet ${index + 1} retrieved_at must be an ISO date`);
  }
  return {
    id: nonEmpty(value.id) ? value.id.trim() : `SNIP-${index + 1}`,
    site,
    query: value.query.trim(),
    title: value.title.trim(),
    url: value.url.trim(),
    snippet: value.snippet.trim(),
    retrieved_at: retrievedAt
  };
}

export function normalizeSnippets(inputs, defaultRetrievedAt) {
  const snippets = inputs.map((input, index) => parseSnippet(input, index));
  const ids = new Set();
  for (const snippet of snippets) {
    if (ids.has(snippet.id)) fail(`snippet id ${snippet.id} is duplicated`);
    ids.add(snippet.id);
    if (!snippet.retrieved_at) snippet.retrieved_at = defaultRetrievedAt;
  }
  return snippets;
}

/**
 * Records a web-search-first discovery trace.
 *
 * Same ordered X -> Digg -> Reddit sweep as browser mode, but the external
 * action is host web search and the captured evidence is result snippets
 * rather than opened pages. Snippets are discovery-grade: `validate` refuses
 * to let a snippet-only source carry a `verified` claim.
 */
export function recordSearchTrace(projectDir, {
  agent,
  tool,
  searches = [],
  discoverySites = [],
  discoveryOutcomes = [],
  fallbackQuery = "",
  snippets = [],
  openedUrls = [],
  unreachableUrls = [],
  notes = "",
  startedAt = new Date().toISOString()
}) {
  if (!nonEmpty(agent)) fail("requires --agent");
  if (!nonEmpty(tool)) fail("requires --tool");
  const uniqueSearches = uniqueStrings(searches);
  const normalizedDiscoverySites = discoverySites
    .filter(nonEmpty)
    .map((site) => site.trim().toLowerCase());
  const normalizedOutcomes = discoveryOutcomes
    .filter(nonEmpty)
    .map((outcome) => outcome.trim().toLowerCase());

  if (!isOrderedDiscovery(normalizedDiscoverySites)) {
    fail(`requires ordered discovery sites: ${DISCOVERY_ORDER.join(" -> ")}`);
  }
  for (const [index, site] of DISCOVERY_ORDER.entries()) {
    if (!uniqueSearches[index] || !queryTargetsDiscoverySite(uniqueSearches[index], site)) {
      fail(`query ${index + 1} must target ${site}`);
    }
  }
  if (
    normalizedOutcomes.length !== DISCOVERY_ORDER.length ||
    normalizedOutcomes.some((outcome) => !DISCOVERY_OUTCOMES.has(outcome))
  ) {
    fail("requires one outcome per discovery site: useful, no-useful-results, or blocked");
  }

  const normalizedSnippets = normalizeSnippets(snippets, startedAt);
  if (!normalizedSnippets.length) fail("requires at least one captured --snippet");

  const bySite = new Map();
  for (const snippet of normalizedSnippets) {
    bySite.set(snippet.site, [...(bySite.get(snippet.site) || []), snippet]);
  }
  for (const [index, site] of DISCOVERY_ORDER.entries()) {
    const captured = bySite.get(site) || [];
    const outcome = normalizedOutcomes[index];
    if (outcome === "useful" && !captured.length) {
      fail(`marked ${site} useful but captured no snippet from it`);
    }
    if (outcome !== "useful" && captured.length) {
      fail(`captured a ${site} snippet but recorded outcome ${outcome}`);
    }
  }

  const needsFallback = normalizedOutcomes.every((outcome) => outcome !== "useful");
  const fallbackSnippets = bySite.get(OPEN_WEB_FALLBACK) || [];
  const trimmedFallbackQuery = fallbackQuery.trim();
  if (needsFallback && !trimmedFallbackQuery) {
    fail("requires --fallback-query when X, Digg, and Reddit have no useful leads");
  }
  if (!needsFallback && trimmedFallbackQuery) {
    fail("allows the open-web fallback only when X, Digg, and Reddit have no useful leads");
  }
  if (needsFallback && !fallbackSnippets.length) {
    fail(`requires at least one ${OPEN_WEB_FALLBACK} snippet when the fallback is used`);
  }
  if (!needsFallback && fallbackSnippets.length) {
    fail(`allows ${OPEN_WEB_FALLBACK} snippets only when the fallback is used`);
  }

  const uniqueOpened = uniqueStrings(openedUrls);
  for (const url of uniqueOpened) {
    if (!validHttpUrl(url)) fail(`--opened must use http(s): ${url}`);
  }
  const uniqueUnreachable = uniqueStrings(unreachableUrls);
  for (const url of uniqueUnreachable) {
    if (!validHttpUrl(url)) fail(`--unreachable must use http(s): ${url}`);
  }
  const trimmedNotes = notes.trim();
  if (uniqueUnreachable.length && !trimmedNotes) {
    fail("requires --notes explaining why the unreachable URLs could not be read");
  }

  const files = projectFiles(path.resolve(projectDir));
  const request = readJson(files.request);
  const browser = readJson(files.browser);
  if (browser.project_id !== request.project_id) {
    throw new Error("browser.json and request.json must share one project_id");
  }

  const additionalSearches = uniqueSearches
    .slice(3)
    .filter((search) => search !== trimmedFallbackQuery);
  const recordedSearches = needsFallback
    ? [...uniqueSearches.slice(0, 3), trimmedFallbackQuery, ...additionalSearches]
    : uniqueSearches;

  const trace = {
    schema_version: TRACE_SCHEMA_VERSION,
    project_id: request.project_id,
    status: "completed",
    mode: WEB_SEARCH_MODE,
    first_research_action: WEB_SEARCH_MODE,
    started_at: startedAt,
    agent: agent.trim(),
    tool: tool.trim(),
    searches: recordedSearches,
    discovery_sites: normalizedDiscoverySites,
    discovery_outcomes: normalizedOutcomes,
    google_fallback: {
      provider: OPEN_WEB_FALLBACK,
      used: needsFallback,
      query: needsFallback ? trimmedFallbackQuery : "",
      opened_urls: [],
      reason: needsFallback ? "X, Digg, and Reddit returned no useful leads." : ""
    },
    snippets: normalizedSnippets,
    opened_urls: uniqueOpened,
    unreachable_urls: uniqueUnreachable,
    notes: trimmedNotes
  };
  writeJson(files.browser, trace);
  return { destination: files.browser, trace };
}
