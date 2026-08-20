# XR Guild — Brand Kit

Everything needed to make something that looks and sounds like XR Guild, without
having to ask anyone first.

**Start with [`BRAND-GUIDE.md`](BRAND-GUIDE.md)** — that is the guide. This file is
the map: what every folder holds, and how to open and change each thing.

---

## If you have five minutes

| You want to… | Open this |
|---|---|
| Announce an event on Luma | `brand/04-social/src/luma-event-cover.html` |
| Post about it on LinkedIn | `brand/04-social/src/linkedin-post.html` |
| Ask a bar or club to host us | `brand/06-proposals/xr-guild-venue-pitch.pdf` |
| Send a sponsor a proposal | `brand/06-proposals/xr-guild-sponsorship-proposal.pdf` |
| Invoice a sponsor | `brand/05-invoices/xr-guild-invoice-template.pdf` |
| Put the logo on something | `brand/01-logos/xr-guild-wordmark-stacked-cyan-on-indigo.svg` |
| Give a talk | `brand/07-presentations/src/presentation-cover.html` |

### How to edit a template

Every template is a plain HTML file. No design software needed.

1. Open the `.html` file in `src/` with any text editor.
2. Change the words. Anything you need to replace is **highlighted yellow** on
   screen — that highlight disappears automatically when you export.
3. Open the file in Chrome to see it.
4. Export:
   - **Graphics** — take a screenshot, or re-run the build script below.
   - **Documents** — File → Print → Save as PDF. Set margins to None and turn on
     Background graphics.
5. **Send the PDF, never the HTML.**

---

## What is in each folder

### `brand/00-fonts/` — Typefaces
`space-grotesk-latin.woff2` · `figtree-latin.woff2` · `jetbrains-mono-latin.woff2`

The three fonts, latin subsets. All are SIL Open Font License — free to install,
use, and share. Install them on your own machine from Google Fonts if you want to
use them in Docs, Slides, or Canva.

### `brand/01-logos/` — Wordmarks and marks
Nine SVG files. The letterforms are converted to outlines, so they render
correctly for anyone, whether or not they have the font installed.

**The master is `xr-guild-wordmark-stacked-cyan-on-indigo.svg`.** The rest are
variations with specific jobs — see section 3 of the brand guide.

### `brand/02-favicons/` — Website icons
`favicon.svg` · `favicon-16/32/48.png` · `favicon-180-apple-touch.png` · `favicon.ico`

Drop them at the root of a website and add:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon-180-apple-touch.png">
```

### `brand/03-app-icons/` — App store icons
- `app-icon-ios-1024.png` — iOS. Square, no transparency; iOS rounds it itself.
- `app-icon-android-512.png` — Android standard.
- `app-icon-android-maskable-512.png` — Android maskable. Artwork sits inside the
  central safe zone so it survives being cropped to a circle.
- `app-icon-android-192.png` — web app manifest.

### `brand/04-social/` — Social graphics
| File | Size | For |
|---|---|---|
| `luma-event-cover-1200x1200.png` | 1200×1200 | Luma event cover |
| `luma-host-avatar-500x500.png` | 500×500 | Luma calendar avatar |
| `linkedin-post-1080x1350.png` | 1080×1350 | LinkedIn feed post |
| `linkedin-page-cover-4200x700.png` | 4200×700 | LinkedIn page banner |
| `linkedin-page-logo-300x300.png` | 300×300 | LinkedIn page logo |
| `og-link-card-1200x630.png` | 1200×630 | Link preview when the site is shared |

Editable sources are in `src/`.

> **On the sizes.** Luma asks for square covers at 800px or larger; 1200 gives
> retina headroom. LinkedIn uses a 300×300 page logo and displays page covers at
> 1128×191, recommending a 4200×700 upload; 1080×1350 is the portrait post that
> takes the most room in the mobile feed. These were checked against platform
> documentation in August 2026 via search summaries — the docs themselves were
> unreachable from the machine that built this. **Re-check before a large print
> run or a rebrand**, since platforms change them without notice.

### `brand/05-invoices/` — Invoices
`xr-guild-invoice-template.pdf` (one page) and the HTML source. Sample content is
a sponsor invoice; replace every highlighted field.

### `brand/06-proposals/` — Proposals and pitches
- `xr-guild-sponsorship-proposal.pdf` — two-page proposal / scope of work for a
  sponsor. Deliverables, what is explicitly *not* offered, pricing, signatures.
- `xr-guild-venue-pitch.pdf` — one page for a bar or club manager. Makes the
  "we fill a slow weeknight, you keep the bar" case.

### `brand/07-presentations/` — Slides
`xr-guild-presentation-cover-1920x1080.png` and its HTML source. Edit the words,
export at 1920×1080, drop it into Slides or Keynote as the cover.

### `brand/08-texture/` — The lens texture
Two iridescent background textures in the cool palette. Background only — the
wordmark goes on top of it, never inside the letterforms.

### `brand/tokens/` — The source of truth
- `xr-guild-tokens.css` — every colour, font, and spacing value. Every template
  imports this, so changing a value here changes every asset that uses it.
- `xr-guild-palette.json` — the same values as data, for pasting into Figma or
  Canva.

### `brand/tools/` — Regeneration scripts
Everything in this kit is generated from these, so it can be rebuilt exactly.

```bash
python3 brand/tools/contrast.py       # verify every colour pair against WCAG
python3 brand/tools/fetch_fonts.py    # re-download the font subsets
python3 brand/tools/build_marks.py    # regenerate the wordmarks
python3 brand/tools/build_texture.py  # regenerate the lens texture
python3 brand/tools/build_icons.py    # regenerate favicon + app icon SVGs
python3 brand/tools/build_pngs.py     # render icon PNGs
python3 brand/tools/build_ico.py      # assemble favicon.ico
```

Requires Python 3.11+, `fonttools`, `brotli`, `playwright`, and a Chromium build.

### `brand/discovery-notes.md`
The answers this whole system was built from, plus the two tensions that shaped
it. Read this if you ever wonder *why* something is the way it is.

### `brand/existing-assets/`
The previous XR Guild artwork, kept for reference.

### `reference/`
A third-party brand guide used only as a structural benchmark. **Reference only** —
none of its names, wording, colours, type, or assets are used here.

---

## `Content Creation/` — the content agent

A separately authored Node.js workspace (MIT, by TheVibeFounder) for researching
and producing social carousels. It reads a brand guide and applies it to generated
content.

```bash
cd "Content Creation"
node bin/content-creation.js doctor          # check setup
node bin/content-creation.js brand-discover  # find the brand guide
node bin/content-creation.js brand-check <project-or-json>
```

It is wired to this kit: its discovery finds `BRAND-GUIDE.md` at the repo root,
and `brand/xr-guild-brand.json` is a completed profile in its schema that passes
all eleven of its completeness checks.

**Before relying on it, know:**

- **Only one of its four agents is included.** Content Research Agent is here;
  **Hook Writer, Carousel Maker, and Caption Writer are missing** and must be
  installed separately from whoever supplied this package.
- **It needs Chrome.** Install Chrome, or point it at an existing Chromium with
  `CONTENT_CREATION_CHROME=/path/to/chrome`.
- **It needs you signed in** to X, Reddit, and Digg in that browser.
- **It carries its own `CLAUDE.md` and `AGENTS.md`**, which will load into future
  Claude Code sessions opened in this repository and ask to be followed. That is
  how the package is designed to work; it is worth knowing it is there.
- **It only makes carousels.** Video, articles, threads, and email are explicitly
  out of scope.
- Its licence asks that the credit *By TheVibeFounder* be preserved.

---

## Still to add

Listed at the end of `BRAND-GUIDE.md` and repeated in the handover notes.
