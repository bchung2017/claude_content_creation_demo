# Troubleshooting

By TheVibeFounder

Start from the `Content Creation` folder. Run this first:

```bash
node bin/content-creation.js doctor
```

## Node.js is missing or too old

This release needs Node.js 20 or newer.

```bash
node --version
```

Ask Codex or Claude to install a current Node.js LTS release using the trusted
method for the machine. Approve the installation when prompted, then run the
doctor command again. Do not run `npm install`; this release has no npm
dependencies.

## Browser access is unavailable

The Research Agent requires real browser access. Reopen the folder in a Codex
or Claude environment that can browse the web, then restart the project.

Do not ask the agent to guess, use memory as evidence, or skip the browser
record. The workflow is designed to stop here.

The doctor can detect whether Google Chrome is installed. It cannot inspect a
private browser session, so it also asks the user to confirm that browser
control is enabled and that X, Reddit, and Digg are already signed in.

If Chrome or Chromium is installed in a nonstandard location, set
`CONTENT_CREATION_CHROME` to its executable path and rerun the doctor. Common
system, user-application, and Linux snap locations are detected automatically.

## An agent still shows as missing after extraction

Run:

```bash
node bin/content-creation.js agents
```

If the status says `nested`, the ZIP created an extra wrapper folder. Move the
named agent folder directly into `Content Creation`; do not reinstall it. The
correct shape is:

```text
Content Creation/
├── Content Research Agent/
├── Hook Writer Agent/
├── Carousel Maker Agent/
└── Caption Writer Agent/
```

If the status says `invalid` or `incomplete`, do not continue. The check found
a corrupt manifest, an empty instruction file, or a missing/invalid skill.
Upload a clean copy of that numbered ZIP and ask before replacing the folder.

The search checks nested folders at any practical extraction depth and also
looks beside `Content Creation` for an agent Finder extracted into the main
folder. If it finds the complete agent elsewhere, it tells you the exact folder
to move instead of telling you to reinstall it.

## `npm run check` is red

The student health check may be red for an old Node version, a missing browser,
or a nested, corrupt, incompatible, incomplete, or duplicate installed agent.
Read the short `Next:` instruction and fix that item first.

The check must not be red merely because the folder contains downloaded ZIPs,
`.DS_Store`, a student's brand information, downloaded project media, or final
PNG slides. Those are student working files, not release files. If one of them
causes a failure, confirm that the installed package is v1.2.1 or newer.

## FrameGrab is not detected

FrameGrab is optional and is not included. Run:

```bash
node bin/content-creation.js doctor
```

If you installed FrameGrab separately and the doctor cannot find it, put its
executable on `PATH` or set `FRAMEGRAB_CLI` to the executable path. Content
Creation does not install or repair FrameGrab.

## A media download fails

Ask the router which method is available:

```bash
node bin/content-creation.js media-route --url <source-url>
```

If it selects FrameGrab, read the installed CLI's help and use its documented
command. If it selects the browser fallback, confirm the URL is a public
X/Twitter post, open exactly `https://ssstwitter.com/`, and choose an available
quality. Never enter credentials, use a private or protected post, bypass an
access control, follow an unexpected redirect, or automate a hidden API.

If the router says `blocked`, do not swap in an unrelated downloader. Use an
owned or licensed asset, revise the visual job, or install FrameGrab separately
only when the user asks.

If the carousel can work without that asset, return to the Carousel Maker
Agent and revise the visual job. Otherwise, record the missing asset as a
blocker.

## Media rights are unclear

Mark the asset `reference-only` or `permission-needed`. Replace it with owned
or properly licensed media before the final file. Do not treat a public or
official URL as automatic republication permission.

## Validation fails

Run:

```bash
node bin/content-creation.js validate <project-folder>
```

Read the first error, return it to the agent that owns that file, and run the
check again. Do not manually delete source references just to make it pass.

Common owners are:

- evidence or source error → Research Agent;
- cover premise error → Hook Writer Agent;
- caption or attribution error → Caption Writer Agent;
- slide or asset error → Carousel Maker Agent.

## The request is not a carousel

This package intentionally supports carousel content only. Video scripts,
articles, threads, and email are outside this release. Start a different
workflow instead of stretching these agents beyond their contracts.

By TheVibeFounder
