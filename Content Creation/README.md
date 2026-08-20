# Content Creation

By TheVibeFounder

Content Creation turns a topic or link into a finished carousel. Students
create this shared folder, then install four AI agents one at a time. The root
workspace files coordinate their work; they are not a fifth agent.

## Before you start

1. Use Google Chrome.
2. Create and sign into X, Reddit, and Digg in Chrome.
3. Enable browser control:
   - Claude: install and enable the official **Claude in Chrome** extension.
   - Codex: use Codex with its browser connection enabled.

If browser access is unavailable, the Research Agent stops.

## Build your Content Creation folder

1. Create a main folder for your brand and content work.
2. If you already have a brand guide, place it in that main folder.
3. Put `01-content-research-agent-v1.2.1.zip` inside the main folder.
4. Extract it there. On a Mac, double-click it in Finder. The ZIP creates the
   `Content Creation` folder for you.
5. Open the new `Content Creation` folder in Codex or Claude and paste:

> Install this agent and set up my Content Creation folder.

The Research ZIP installs the Research Agent and the shared workspace files.
The complete install order is:

1. `01-content-research-agent-v1.2.1.zip`
2. `02-hook-writer-agent-v1.2.1.zip`
3. `03-carousel-maker-agent-v1.2.1.zip`
4. `04-caption-writer-agent-v1.2.1.zip`

After uploading each remaining ZIP into the Content Creation folder, paste:

> Install this agent and check my Content Creation setup.

The workspace check shows what is installed and tells you which ZIP comes
next. Setup does not ask for a topic or start a carousel.

Keep the ZIPs if you want. The student health check ignores ZIPs, Finder
metadata, and everything created under `projects/`.

## Create a carousel

After setup is ready, paste this prompt:

```text
Create a carousel about [topic or link].
My goal is [goal].
Use the brand guide in the parent folder as the primary source for every brand decision. Render every final slide as a 1080×1350 PNG. Do not stop at CAROUSEL.md.
```

Replace `[topic or link]` and `[goal]` before you send it.

## Your brand guide

The brand guide in the parent folder is the primary source for:

- colors;
- type;
- logo;
- voice;
- visual direction;
- every other brand choice.

If the guide is missing, unclear, or incomplete, the agent asks you before it
designs. It uses [`templates/BRAND-GUIDE-TEMPLATE.md`](templates/BRAND-GUIDE-TEMPLATE.md)
to interview you, saves your completed guide beside the `Content Creation`
folder, and checks every required brand choice. The fictional
[`Signal Garden` example](examples/FICTIONAL-BRAND-GUIDE.md) shows what a
complete guide looks like without sharing or copying a real brand.

## How it works

1. The shared workspace loads the primary brand guide.
2. Research checks X, Digg, then Reddit. It uses Google only when all three
   produce no useful leads. Important facts are checked against a trusted
   source.
3. Hook writes the first slide and a few options.
4. Carousel Maker plans, designs, and renders every slide.
5. Caption Writer reads the finished carousel and writes the post caption.
6. The shared workspace checks the facts, copy, sources, media, caption, and PNG files.

Each run stays in its own local folder. Nothing is posted automatically.

During setup, the agent also checks:

- Node.js 20 or newer;
- browser access for research;
- which of the four agents are installed and compatible;
- an available way to save media when the carousel needs it.

If something is missing, it explains the next step. It asks before installing
anything.

## When it stops

- No browser: research cannot run.
- No trusted source: the claim is left out.
- No permission to use media: the media is not used.
- Brand guide missing or unclear: design waits for your answer.
- A file does not match: that step is fixed before work continues.

## What you get

You receive both:

1. `CAROUSEL.md` — the plan and source. It contains:

   - the hook;
   - slide-by-slide copy;
   - the caption;
   - sources;
   - media notes.

2. Numbered PNG files — the ready-to-post slides, such as `slide-01.png`
   through `slide-08.png`, or through the chosen slide count.

The job is not finished with only `CAROUSEL.md`.

## What you do next

1. Open every numbered PNG and check the order.
2. Check the facts and sources.
3. Check the media and brand details.
4. Approve and post.

## What you need

- Codex or Claude with access to this folder.
- Node.js 20 or newer.
- Google Chrome with X, Reddit, and Digg signed in.
- Browser control enabled in Claude or Codex.
- FrameGrab only when you want to use its separately installed media CLI.

FrameGrab is optional and is not included. Without it, a public X/Twitter post
can use the browser fallback. Other media sources need FrameGrab or a manually
approved file.

## Files and privacy

Your topic, research, and downloaded media stay inside the ignored `projects/`
folder on your computer. Do not add private account details, credentials,
downloaded media, or private brand files to the reusable package.

This package is for internal team use. It is not approved for public release.

## More help

- [Setup help](docs/TROUBLESHOOTING.md)
- [A closer look at the workflow](docs/WORKFLOW.md)
- [Brand guide help](docs/BRAND-GUIDE-WORKFLOW.md)

Original work and agent architecture created By TheVibeFounder. Keep
[`NOTICE.md`](NOTICE.md) with the package. Official checks use
`npm run verify:credit` to protect the credit, copyright, license, and notice.

By TheVibeFounder
