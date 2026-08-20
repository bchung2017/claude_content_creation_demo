# Safe setup contract

Run this check before the first research job on a machine.

## Required

- Node.js 20 or newer.
- Codex or Claude with filesystem and terminal access.
- Google Chrome.
- X, Reddit, and Digg accounts, already signed in within Chrome.
- Codex with its browser connection enabled, or the official Claude in Chrome
  extension/connector installed and enabled.

This release has zero npm dependencies. Do not run `npm install`. Do not
install browser automation, scraping libraries, or unknown plugins to work
around a missing host capability.

## Required setup

1. Detect the operating system and shell.
2. Run `node --version`.
3. If Node is missing or older than 20, explain the trusted installation path
   and obtain approval required for a system change.
4. Install a current Node.js LTS through an already trusted package manager or
   the official Node.js installer. Never use an opaque download-and-execute
   command or unofficial binary.
5. Verify Node again, then run:

   ```text
   node bin/content-research-agent.js doctor
   ```

   The doctor checks normal system and user application locations on macOS,
   Chrome locations on Windows, and Chrome or Chromium—including common snap
   locations—on Linux. For a nonstandard install, set
   `CONTENT_CREATION_CHROME` to the browser executable path and rerun it.

6. Let the user create and sign in to X, Reddit, and Digg. Never ask for or
   store their passwords, cookies, or account details.
7. Confirm the Codex or Claude host exposes browser control. If missing,
   explain how to enable the supported connection and stop. The folder cannot
   install browser access for the host. Do not claim Codex requires a separate
   Chrome extension when its host already supplies the browser connection.

On Windows, all documented commands are one line and work in PowerShell or
cmd. Quote paths containing spaces.

## Optional local model

Gemma 4 through Ollama is optional. It can classify feedback or review evidence
that has already been opened, but it never replaces the browser or verifies a
claim. Follow `LOCAL-MODEL.md`: detect first, explain hardware/storage and the
download, then obtain explicit approval before installing Ollama or pulling a
model. Declining or failing this step does not block the agent.

VibeTasks is also optional and is only needed for an explicit task-export
handoff. Local setup and local routing are not external research actions.
