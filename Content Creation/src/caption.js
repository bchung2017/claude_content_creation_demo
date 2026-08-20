import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { nonEmpty, readJson, writeJson } from "./json.js";
import { validateRenderedSlides } from "./slides.js";

export function carouselSha256(projectDir) {
  const file = path.join(path.resolve(projectDir), "carousel.json");
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function registerCaption({ projectDir }) {
  const project = path.resolve(projectDir);
  const carousel = readJson(path.join(project, "carousel.json"));
  const caption = readJson(path.join(project, "caption.json"));
  if (carousel.status !== "completed") {
    throw new Error("caption registration requires a completed carousel");
  }
  const errors = [];
  validateRenderedSlides({ projectDir: project, carousel, errors });
  if (errors.length) throw new Error(`caption registration requires valid final slides: ${errors.join("; ")}`);
  if (!nonEmpty(caption.text)) throw new Error("caption.text is required before registration");
  const registered = {
    ...caption,
    schema_version: "1.0",
    status: "completed",
    carousel_sha256: carouselSha256(project),
    completed_at: new Date().toISOString()
  };
  writeJson(path.join(project, "caption.json"), registered);
  return {
    status: registered.status,
    destination: path.join(project, "caption.json"),
    carousel_sha256: registered.carousel_sha256
  };
}
