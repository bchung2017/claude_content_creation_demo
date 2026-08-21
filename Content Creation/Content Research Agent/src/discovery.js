export const DISCOVERY_ORDER = ["x.com", "digg.com", "reddit.com"];
export const DISCOVERY_OUTCOMES = new Set(["useful", "no-useful-results", "blocked"]);

export const BROWSER_MODE = "browser";
export const WEB_SEARCH_MODE = "web-search";
export const RESEARCH_MODES = new Set([BROWSER_MODE, WEB_SEARCH_MODE]);

export const GOOGLE_FALLBACK = "google.com";
export const OPEN_WEB_FALLBACK = "open-web";

export const FALLBACK_PROVIDER = {
  [BROWSER_MODE]: GOOGLE_FALLBACK,
  [WEB_SEARCH_MODE]: OPEN_WEB_FALLBACK
};

export function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function uniqueStrings(values) {
  return [...new Set(values.filter(nonEmpty).map((value) => value.trim()))];
}

export function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isOrderedDiscovery(sites) {
  return sites.length === DISCOVERY_ORDER.length &&
    sites.every((site, index) => site.toLowerCase() === DISCOVERY_ORDER[index]);
}

export function queryTargetsDiscoverySite(query, site) {
  return query.toLowerCase().includes(`site:${site}`);
}

/**
 * The mode a trace was recorded in. Traces written before web-search mode
 * existed have no `mode` field and are always browser traces.
 */
export function traceMode(trace) {
  return nonEmpty(trace?.mode) ? trace.mode.trim() : BROWSER_MODE;
}

/** Snippet URLs are discovery-grade evidence; opened URLs are proof-grade. */
export function snippetUrls(trace) {
  const snippets = Array.isArray(trace?.snippets) ? trace.snippets : [];
  return uniqueStrings(snippets.map((snippet) => snippet?.url));
}

/** Every URL a source may cite: opened pages plus captured search snippets. */
export function citableUrls(trace) {
  const opened = Array.isArray(trace?.opened_urls) ? trace.opened_urls : [];
  return new Set([...uniqueStrings(opened), ...snippetUrls(trace)]);
}

export function openedUrlSet(trace) {
  const opened = Array.isArray(trace?.opened_urls) ? trace.opened_urls : [];
  return new Set(uniqueStrings(opened));
}

/**
 * Host web search treats a domain filter as a ranking hint, not a hard
 * constraint: a `site:digg.com` sweep routinely returns off-domain results.
 * A snippet may only be filed under a discovery site when its URL really
 * belongs to that site, so an off-domain hit can never be recorded as a
 * platform signal.
 */
export function hostMatchesSite(url, site) {
  if (site === OPEN_WEB_FALLBACK) return true;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host === site || host.endsWith(`.${site}`);
  } catch {
    return false;
  }
}
