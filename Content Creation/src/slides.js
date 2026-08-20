import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "./json.js";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let value = 0; value < 256; value += 1) {
    let current = value;
    for (let bit = 0; bit < 8; bit += 1) {
      current = (current & 1) ? (0xedb88320 ^ (current >>> 1)) : (current >>> 1);
    }
    table[value] = current >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function insideProject(projectDir, candidate) {
  const relative = path.relative(projectDir, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

export function renderedSlidePath(index) {
  return path.posix.join("output", `slide-${String(index + 1).padStart(2, "0")}.png`);
}

export function inspectPng(file) {
  const data = fs.readFileSync(file);
  if (data.length < 45 || !data.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${file} is not a complete PNG file`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let sawHeader = false;
  let sawImageData = false;
  let sawEnd = false;
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const typeStart = offset + 4;
    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + length;
    const chunkEnd = payloadEnd + 4;
    if (chunkEnd > data.length) throw new Error(`${file} contains a truncated PNG chunk`);

    const type = data.toString("ascii", typeStart, payloadStart);
    const expectedCrc = data.readUInt32BE(payloadEnd);
    const actualCrc = crc32(data.subarray(typeStart, payloadEnd));
    if (expectedCrc !== actualCrc) throw new Error(`${file} contains an invalid ${type} checksum`);

    if (!sawHeader) {
      if (type !== "IHDR" || length !== 13) throw new Error(`${file} has no valid PNG header`);
      width = data.readUInt32BE(payloadStart);
      height = data.readUInt32BE(payloadStart + 4);
      if (width < 1 || height < 1) throw new Error(`${file} has invalid PNG dimensions`);
      sawHeader = true;
    } else if (type === "IHDR") {
      throw new Error(`${file} contains more than one PNG header`);
    }

    if (type === "IDAT" && length > 0) sawImageData = true;
    if (type === "IEND") {
      if (length !== 0 || chunkEnd !== data.length) throw new Error(`${file} has an invalid PNG ending`);
      sawEnd = true;
      break;
    }
    offset = chunkEnd;
  }

  if (!sawHeader || !sawImageData || !sawEnd) throw new Error(`${file} is not a complete PNG file`);
  return { width, height, sha256: sha256(file), bytes: data.length };
}

export function registerRenderedSlide({ projectDir, file, slideId }) {
  const project = path.resolve(projectDir);
  const source = path.resolve(file);
  if (!fs.existsSync(source)) throw new Error(`rendered slide file not found: ${source}`);

  const carouselFile = path.join(project, "carousel.json");
  const carousel = readJson(carouselFile);
  const slides = Array.isArray(carousel.slides) ? carousel.slides : [];
  const index = slides.findIndex((slide) => slide.id === slideId);
  if (index < 0) throw new Error(`carousel has no slide with id: ${slideId}`);

  const metadata = inspectPng(source);
  const expectedWidth = Number(carousel.format?.width || 1080);
  const expectedHeight = Number(carousel.format?.height || 1350);
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    throw new Error(`${source} is ${metadata.width}x${metadata.height}; expected ${expectedWidth}x${expectedHeight}`);
  }

  const relativeFile = renderedSlidePath(index);
  const destination = path.join(project, ...relativeFile.split("/"));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (source !== destination) fs.copyFileSync(source, destination);
  const registered = inspectPng(destination);
  const entry = {
    slide_id: slideId,
    file: relativeFile,
    width: registered.width,
    height: registered.height,
    sha256: registered.sha256
  };

  const existing = Array.isArray(carousel.rendered_slides) ? carousel.rendered_slides : [];
  const byId = new Map(existing.map((item) => [item.slide_id, item]));
  byId.set(slideId, entry);
  const renderedSlides = slides.map((slide) => byId.get(slide.id)).filter(Boolean);
  const complete = renderedSlides.length === slides.length;
  writeJson(carouselFile, {
    ...carousel,
    status: complete ? "completed" : "rendering",
    rendered_slides: renderedSlides
  });
  return { ...entry, complete, remaining: slides.length - renderedSlides.length };
}

export function validateRenderedSlides({ projectDir, carousel, errors }) {
  const project = path.resolve(projectDir);
  const slides = Array.isArray(carousel.slides) ? carousel.slides : [];
  const rendered = Array.isArray(carousel.rendered_slides) ? carousel.rendered_slides : [];
  const expectedWidth = Number(carousel.format?.width || 1080);
  const expectedHeight = Number(carousel.format?.height || 1350);
  const slideIds = new Set(slides.map((slide) => slide.id));
  const seen = new Set();

  for (const output of rendered) {
    const slideId = output?.slide_id;
    if (!slideIds.has(slideId)) {
      errors.push(`rendered slide references unknown slide id: ${slideId || "missing"}`);
      continue;
    }
    if (seen.has(slideId)) {
      errors.push(`rendered slide is duplicated: ${slideId}`);
      continue;
    }
    seen.add(slideId);

    const index = slides.findIndex((slide) => slide.id === slideId);
    const expectedFile = renderedSlidePath(index);
    if (output.file !== expectedFile) {
      errors.push(`rendered slide ${slideId} must use ${expectedFile}`);
      continue;
    }
    const absolute = path.resolve(project, ...output.file.split("/"));
    if (!insideProject(project, absolute) || !fs.existsSync(absolute)) {
      errors.push(`rendered slide ${slideId} file is missing: ${output.file}`);
      continue;
    }
    try {
      const metadata = inspectPng(absolute);
      if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
        errors.push(`rendered slide ${slideId} must be ${expectedWidth}x${expectedHeight}, got ${metadata.width}x${metadata.height}`);
      }
      if (output.width !== metadata.width || output.height !== metadata.height) {
        errors.push(`rendered slide ${slideId} metadata does not match its PNG`);
      }
      if (output.sha256 !== metadata.sha256) {
        errors.push(`rendered slide ${slideId} checksum does not match its PNG`);
      }
    } catch (error) {
      errors.push(`rendered slide ${slideId} is invalid: ${error.message}`);
    }
  }

  for (const slide of slides) {
    if (!seen.has(slide.id)) errors.push(`slide ${slide.id || "unknown"} has no rendered PNG`);
  }
  if (rendered.length !== slides.length) {
    errors.push("carousel.rendered_slides must contain exactly one PNG for every slide");
  }
}
