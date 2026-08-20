# Setup

## Shared agent runtime

- Node.js 20 or newer.
- Codex or Claude Code with filesystem access.
- Google Chrome.
- X, Reddit, and Digg accounts, already signed in within Chrome.
- Codex with its browser connection enabled, or the official Claude in Chrome
  extension/connector installed and enabled.

The root `PROMPT.md` detects the operating system, verifies Node.js 20+, and
guides a trusted Node.js LTS installation only after required approval. The
agent packages have zero npm dependencies; do not install a browser framework,
scraper, or downloader into them.

The user completes all account creation and sign-in. The agents never request
or store passwords, cookies, or account details. If the supported browser
connection is unavailable, research stops.

Run from the `Content Creation` folder:

```bash
node bin/content-creation.js doctor
npm run check
```

`npm run check` is a student health check. It checks Node, Chrome, workspace
files, attribution, and every installed agent and declared skill. It does not
scan the student's ZIPs, Finder metadata, brand data, generated slides, or
anything under `projects/` as release material.

## Brand guide

Place `Content Creation` inside the main workspace. Put an existing brand guide
beside it when one is available. Then run:

```bash
node bin/content-creation.js brand-discover
```

If one guide is found, the agent reads it. If several are found, it asks which
one applies. If none is found, it uses the included template to interview the
user and saves a reusable guide beside `Content Creation`. It then runs
`brand-check` on the project’s `brand.json` before content work. See
[`BRAND-GUIDE-WORKFLOW.md`](BRAND-GUIDE-WORKFLOW.md).

## Optional media tools

FrameGrab is not included. The doctor looks for an optional `framegrab`
executable on `PATH`, or at the path set in `FRAMEGRAB_CLI`. Content Creation
does not install or update it.

Check the route for a source URL before downloading:

```bash
node bin/content-creation.js media-route --url "https://x.com/example/status/123"
```

When FrameGrab is unavailable, public X/Twitter posts can use the browser at
`https://ssstwitter.com/`. Do not enter credentials, use private or protected
posts, or bypass access controls. Other media hosts require FrameGrab or a manual
approved asset.

## Chrome in a nonstandard location

The doctor checks normal system and user application locations on macOS,
Chrome locations on Windows, and Chrome or Chromium—including common snap
locations—on Linux. If the browser is installed elsewhere, set
`CONTENT_CREATION_CHROME` to the browser executable path and rerun the doctor.
This override identifies the local executable only; it does not prove that the
Codex/Claude browser connection is enabled or that accounts are signed in.

After saving a file, register it. Registration copies the file into the
ignored project and records its source, use, permission status, and SHA-256:

```bash
node bin/content-creation.js media-register <project-folder> \
  --url "https://x.com/example/status/123" \
  --file <downloaded-file> \
  --usage "Slide 3 proof" \
  --provider ssstwitter-browser
```

## Final PNG slides

`CAROUSEL.md` is the editable content plan, not the finished visual output.
The Carousel Maker must render every slide at 1080×1350 and register it:

```bash
node bin/content-creation.js slide-register <project-folder> \
  --slide slide-1 \
  --file <rendered-slide.png>
```

Registration saves stable names such as `output/slide-01.png`, checks the PNG
and dimensions, and records its SHA-256. Final validation fails until every
planned slide has one registered PNG.

The Caption Writer runs after this. When its draft matches the final slides,
register it against the exact carousel:

```bash
node bin/content-creation.js caption-register <project-folder>
```
