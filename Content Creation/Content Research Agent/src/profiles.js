const field = (label, type, options = {}) => ({ label, type, ...options });

export const PROFILES = Object.freeze({
  "social-media": {
    id: "social-media",
    displayName: "Social Media Research",
    skill: "social-media-research",
    mode: "multi_source_social",
    maturity: "production",
    sourcePriority: ["primary", "official", "independent", "community"],
    analysisFields: {
      topic_scope: field("Topic scope", "string"),
      sample_definition: field("Sample definition", "string"),
      time_window: field("Time window", "string"),
      claim_ranking_method: field("Claim ranking method", "string"),
      stopping_rule: field("Stopping rule", "string"),
      signal_counts: field("Platform signal counts", "array", { min: 3 }),
      platform_findings: field("Platform findings", "array", { min: 1 }),
      firsthand_signals: field("Firsthand signals", "array"),
      narrative_patterns: field("Narrative patterns", "array", { min: 1 }),
      disagreements: field("Disagreements and counter-signals", "array"),
      verification_source_ids: field("Verification sources", "array", { min: 1 }),
      coverage_gaps: field("Coverage gaps", "array")
    }
  }
});

export const PROFILE_IDS = Object.freeze(Object.keys(PROFILES));

export function getProfile(id) {
  const profile = PROFILES[id];
  if (!profile) {
    throw new Error(`unknown production specialist "${id}". Available: ${PROFILE_IDS.join(", ")}`);
  }
  return profile;
}

export function emptySpecialistAnalysis(profile) {
  return Object.fromEntries(
    Object.entries(profile.analysisFields).map(([key, definition]) => [
      key,
      definition.type === "array" ? [] : ""
    ])
  );
}
