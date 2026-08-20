import fs from "node:fs";
import path from "node:path";

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function list(value) {
  return Array.isArray(value) ? value : [];
}

