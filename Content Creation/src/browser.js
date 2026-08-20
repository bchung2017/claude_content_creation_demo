import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const EXECUTABLES = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    path.join(os.homedir(), "Applications", "Google Chrome.app", "Contents", "MacOS", "Google Chrome"),
    path.join(os.homedir(), "Applications", "Google Chrome Canary.app", "Contents", "MacOS", "Google Chrome Canary")
  ],
  linux: ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"],
  win32: [
    ["PROGRAMFILES", "Google", "Chrome", "Application", "chrome.exe"],
    ["PROGRAMFILES(X86)", "Google", "Chrome", "Application", "chrome.exe"],
    ["LOCALAPPDATA", "Google", "Chrome", "Application", "chrome.exe"]
  ]
};

function executableOnPath(name, env, exists, platform) {
  for (const directory of String(env.PATH || "").split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(directory, name);
    if (exists(candidate)) return candidate;
    if (platform === "win32" && exists(`${candidate}.exe`)) return `${candidate}.exe`;
  }
  return null;
}

export function detectChrome({ platform = process.platform, env = process.env, exists = fs.existsSync } = {}) {
  const override = env.CONTENT_CREATION_CHROME;
  if (override && exists(override)) {
    return { available: true, executable: override, detected_by: "CONTENT_CREATION_CHROME" };
  }

  if (platform === "darwin") {
    const executable = EXECUTABLES.darwin.find((candidate) => exists(candidate));
    return executable
      ? { available: true, executable, detected_by: "standard-macos-location" }
      : { available: false, executable: null, detected_by: null };
  }

  if (platform === "win32") {
    for (const [variable, ...parts] of EXECUTABLES.win32) {
      if (!env[variable]) continue;
      const executable = path.join(env[variable], ...parts);
      if (exists(executable)) return { available: true, executable, detected_by: variable };
    }
    const executable = executableOnPath("chrome", env, exists, platform);
    return executable
      ? { available: true, executable, detected_by: "PATH" }
      : { available: false, executable: null, detected_by: null };
  }

  for (const name of EXECUTABLES.linux) {
    const executable = executableOnPath(name, env, exists, platform);
    if (executable) return { available: true, executable, detected_by: "PATH" };
  }
  for (const executable of ["/snap/bin/chromium", "/usr/bin/chromium", "/usr/bin/chromium-browser"]) {
    if (exists(executable)) return { available: true, executable, detected_by: "standard-linux-location" };
  }
  return { available: false, executable: null, detected_by: null };
}
