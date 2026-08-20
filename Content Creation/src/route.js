export function routeInput({ topic, urls = [], hasResearch = false }) {
  if (hasResearch) {
    return {
      input_kind: "research-handoff",
      selected_specialist: "hook-writer-agent",
      next: "hook-writer-agent",
      format: "carousel",
      reason: "A validated research handoff is present; hook writing can begin."
    };
  }
  return {
    input_kind: urls.length ? "topic-and-links" : "topic",
    selected_specialist: "content-research-agent",
    next: "content-research-agent",
    format: "carousel",
    topic,
    source_urls: urls,
    reason: "No validated research handoff was supplied."
  };
}
