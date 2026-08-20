import { getProfile } from "./profiles.js";

const SOCIAL_SIGNAL = /\b(x\.com|twitter|tweet|thread|reddit|digg|bluesky|mastodon|social media|social-media|community posts?|public conversation|sentiment|viral)\b/i;
const SOCIAL_GOAL = /\b(what (?:people|users|founders|developers|customers) (?:are )?saying|social (?:reaction|response|conversation|sentiment|signals?)|posts?|threads?|accounts?|on (?:x|twitter|reddit|digg|bluesky|mastodon))\b/i;

const SOURCE_ACTION = /\b(inspect|review|summari[sz]e|analy[sz]e|read|extract|transcribe|audit|verify|check|open|parse)\b/i;
const CUSTOM_RESEARCH = /\b(market research|market size|competitive landscape|industry analysis|customer segmentation|total addressable market|law|legal|regulation|regulatory|compliance|statute|case law|contractor classification|clinical evidence|clinical trials?|scientific evidence|peer-reviewed|literature review|medical research|efficacy|safety evidence|financial analysis|financial health|financial statements?|balance sheet|cash flow|income statement|valuation analysis|investment research|credit risk)\b/i;
const EXTENSION_SIGNALS = [
  ["document", /\b(pdf|document|paper|report|whitepaper|study|presentation)\b/i, /\.(pdf|docx?|pptx?)(?:\b|$)/i],
  ["software-project", /\b(repository|repo|source code|github|gitlab|commit|pull request|package)\b/i, /(?:github\.com|gitlab\.com)/i],
  ["audio-video", /\b(audio|video|podcast|recording|transcript|interview|youtube|vimeo)\b/i, /\.(mp3|m4a|wav|mp4|mov|webm)(?:\b|$)/i],
  ["product-record", /\b(product record|product page|company record|pricing page|terms|availability)\b/i, null],
  ["web-page", /\b(web page|article|blog post|news page|landing page)\b/i, null]
];

const TYPE_ALIASES = Object.freeze({
  "social-source": "social-media",
  "open-topic": "social-media"
});

function routed(reasons) {
  const profile = getProfile("social-media");
  return {
    schema_version: "2.0",
    status: "routed",
    content_type: profile.id,
    specialist: profile.skill,
    maturity: profile.maturity,
    confidence: 0.98,
    reasons,
    alternatives: []
  };
}

function needsSpecialist(requestedType, reason) {
  return {
    schema_version: "2.0",
    status: "needs_specialist",
    content_type: null,
    specialist: null,
    requested_type: requestedType,
    maturity: "not-installed",
    confidence: 1,
    reasons: [reason],
    template: "specialists/template",
    alternatives: []
  };
}

function detectExtension(text) {
  if (CUSTOM_RESEARCH.test(text)) return "custom";
  for (const [type, artifact, directSource] of EXTENSION_SIGNALS) {
    if (directSource?.test(text) || (SOURCE_ACTION.test(text) && artifact.test(text))) return type;
  }
  return null;
}

export function routeResearch({ topic = "", goal = "", type = "" }) {
  const requestedType = TYPE_ALIASES[type] || type;
  const text = `${goal}\n${topic}`.trim();
  const extension = detectExtension(text);
  const socialGoal = SOCIAL_GOAL.test(goal) || /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com|reddit\.com|digg\.com|bsky\.app|mastodon\.)/i.test(topic.trim());
  if (requestedType === "social-media") {
    if (extension && !socialGoal) {
      return needsSpecialist(
        extension,
        `The input is primarily ${extension} research. Add a social-reaction goal before selecting social-media.`
      );
    }
    return routed(["The caller selected the production social-media specialist."]);
  }
  if (requestedType) {
    return needsSpecialist(
      requestedType,
      `The ${requestedType} specialist is not installed. Build it from specialists/template before running this job.`
    );
  }

  if (extension && !socialGoal) {
    return needsSpecialist(
      extension,
      `This request needs a ${extension} specialist; only social-media research is production-ready.`
    );
  }

  if (!text) {
    return {
      schema_version: "2.0",
      status: "needs_confirmation",
      content_type: null,
      specialist: null,
      maturity: null,
      confidence: 0,
      reasons: ["Provide a social-media topic, post, thread, account, or research question."],
      alternatives: [{ content_type: "social-media", maturity: "production" }]
    };
  }

  if (/^https?:\/\//i.test(topic.trim()) && !SOCIAL_SIGNAL.test(text)) {
    return needsSpecialist(
      "web-page",
      "This is not recognizably a social-media URL; the generic web-page specialist is not installed."
    );
  }

  return routed([
    SOCIAL_SIGNAL.test(text) || socialGoal
      ? "Detected a social-media source or research goal."
      : "A general topic uses the production social-media discovery package."
  ]);
}
