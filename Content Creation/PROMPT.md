# Content Creation workspace prompt

Discover and coordinate separately installed content agents in their defined
order.

Use one prompt at a time.

After extracting the Research ZIP in the main folder and opening the new
Content Creation folder, use:

> Install this agent and set up my Content Creation folder.

After uploading one of the numbered agent ZIPs into the Content Creation
folder, use:

> Install this agent and check my Content Creation setup.

At any time, use:

> Check my Content Creation setup and tell me what is installed.

After setup, or when the folder is already ready, use:

> Create a carousel about [topic or link].
>
> My goal is [goal].
>
> Use the brand guide in the parent folder as the primary source for every
> brand decision. Render every final slide as a 1080×1350 PNG. Do not stop at
> CAROUSEL.md.

If the request is only setup or installation, do not ask for a topic and do not
start content work. Complete only the requested setup step, report the four
agent statuses, and name the next numbered ZIP.

When one of ZIPs 02–04 has been uploaded, locate only that archive. List its entries
before extraction. Each ZIP must contain one expected agent folder. The first
Research ZIP is different: it contains one `Content Creation` folder with the
Research Agent and approved shared workspace bootstrap files. It should be
extracted in the main folder before Content Creation is opened.
It must not contain an absolute path, `..` path segment, symbolic link, `.git`, credential,
or generated project/media folder. Stop if the archive is unexpected. Extract
the approved folder directly inside Content Creation, leave the original ZIP
unchanged, and run the setup check. Do not overwrite an existing agent folder;
report it and ask before replacing or upgrading it.
If the setup check reports `nested`, move the named agent folder out of its
wrapper so it is a direct child of Content Creation. Do not install another
copy. If it reports `invalid` or `incomplete`, show the exact corrupt, empty,
missing, or invalid file and stop before replacing anything.

## First-run setup

1. Detect the operating system and shell, then read `AGENTS.md`, `NOTICE.md`,
   `docs/SETUP.md`, and `package.json`. Treat the attribution rules in
   `NOTICE.md` as a release invariant.
2. Check for Node.js 20 or newer. If it is missing or too old, explain the
   trusted installation method, request any approval needed, install a current
   Node.js LTS release, and verify the version.
3. Before research, ask the user to confirm these prerequisites:
   - Google Chrome is installed.
   - They have X, Reddit, and Digg accounts and are already signed in to each
     site in Chrome.
   - Codex has its browser connection enabled, or the official Claude in
     Chrome extension/connector is installed and enabled.
   Never create an account, ask for a password, or store account details. Let
   the user complete sign-in. If browser control is unavailable, stop.
4. Install npm dependencies only when `package.json` declares any. This release
   declares zero, so do not run `npm install`, and do not install a browser,
   scraper, downloader, or unknown substitute into the package.
5. Run `node bin/content-creation.js doctor`, then
   `node bin/content-creation.js agents`. The shared workspace can be ready while the
   four-stage pipeline is still incomplete. Report every installed and missing
   agent. Never replace a missing specialist with another agent. The doctor
   must detect Chrome rather than assume it exists. Browser connection and
   account sign-in remain explicit user confirmations; never report them as
   verified automatically.
   A missing future agent is an expected staged-install state. A nested,
   corrupt, incompatible, incomplete, or duplicate installed agent blocks the
   health check.
6. Read the doctor's media report. FrameGrab is optional and is not bundled. If
   its CLI is present, report that it can be used. If it is absent, report that
   public X/Twitter media can use the browser fallback. Do not install FrameGrab
   or any substitute unless the user separately asks for it.
7. Treat the parent of the `Content Creation` folder as the default main
   workspace. Run `node bin/content-creation.js brand-discover`. If the package
   is nested more deeply and the user identifies another main folder, rerun it
   with `--workspace <main-folder>`.
   - One guide: use it as the primary source for colors, typography, logo use,
     imagery, voice, visual direction, and every other brand decision.
   - Several guides: ask which one applies.
   - No guide: read `templates/BRAND-GUIDE-TEMPLATE.md`, conduct the structured
     interview, and save a completed `<Brand Name>-Brand-Guide.md` beside the
     Content Creation folder. The user owns this reusable guide.
   - Incomplete guide: score it against brand name, audience, voice, colors,
     typography, logo use, imagery, visual direction, content do rules,
     content avoid rules, and CTA style. Ask only the missing questions and
     update the user-owned guide.
   - When the user needs an example, show
     `examples/FICTIONAL-BRAND-GUIDE.md`. It demonstrates completeness only;
     never use its style as the user's default.
   Never copy a private guide or identity asset into the reusable package.
8. Report a short setup summary and stop. The install order is Content Research
   Agent, Hook Writer Agent, Carousel Maker Agent, then Caption Writer Agent.
   Start a project only after a separate topic-first creation request.

## Project workflow

1. Run `node bin/content-creation.js agents`. Stop and name the next required
   agent when the four-stage pipeline is incomplete. Otherwise initialize an
   ignored project from the user's topic, links, and goal.
2. Complete the project's `brand.json` from the selected runtime guide or the
   user's answers. Set `status` to `completed` only when the brand name,
   audience, voice, colors, typography, logo use, imagery, visual direction,
   do/avoid rules, and CTA style are clear. Run
   `node bin/content-creation.js brand-check <content-project>` and resolve
   every missing item. A selected guide is always the primary source;
   ask instead of inventing a missing or ambiguous choice. Keep the source
   guide outside the reusable package. Every writing and carousel agent
   must use this profile without letting brand preferences override evidence.
3. Record the initialized content project's absolute path. Use the brand
   audience and content rules to frame the research goal without allowing them
   to predetermine the facts. Then enter the
   installed Research Agent by locating its `agent.json` id rather than
   assuming its folder name. Read its `PROMPT.md` and run the social-media
   research workflow. Store its working job inside the content project's
   `research-work/` folder. It must finish with a validated `RESEARCH.md`.
4. Return to the Content Creation root, then import that exact job into the
   initialized content project:
   `node bin/content-creation.js research-import <content-project> --from <research-project>`
5. Route `brand.json` and the completed `research.json` to `Hook Writer Agent/`.
6. Route the brand, research, and hook files to `Carousel Maker Agent/` for slide copy
   and visual jobs. When media is needed, run
   `node bin/content-creation.js media-route --url <source-url>`.
   - If it selects `framegrab-cli`, read the installed command's `--help`, use
     only its documented interface, and do not alter or install it.
   - If it selects `ssstwitter-browser`, open exactly
     `https://ssstwitter.com/`, paste only a public X/Twitter post URL, choose
     an available quality, and save the result. Do not enter credentials, use
     private or protected posts, bypass access controls, automate a hidden API,
     or continue through an unexpected redirect.
   - If the route is blocked, revise the visual job or report the missing media
     provider. Do not improvise another downloader.
   After a file is saved, run `media-register` with its source URL, file, use,
   provider, and permission status. The command copies it into the ignored
   project and records its SHA-256 receipt.
7. The Carousel Maker must render every planned slide as an actual 1080×1350
   PNG. For each file, run:
   `node bin/content-creation.js slide-register <content-project> --slide <slide-id> --file <png>`
   Registration saves numbered files under `output/`, checks the PNG and its
   dimensions, records its SHA-256, and marks the carousel complete only when
   every planned slide is present. A `carousel.json` or `CAROUSEL.md` without
   the PNG files is unfinished.
8. Route the completed brand, research, hook, and carousel files to the Caption
   Writer Agent. It must write the caption after reviewing the slide sequence
   and the registered final PNGs. Then run
   `node bin/content-creation.js caption-register <content-project>` to bind the
   caption to that exact final carousel.
9. Run `validate`, resolve every error, review warnings, and generate
   `CAROUSEL.md` with `brief`. Return both the plan path and every numbered PNG
   path. Nothing is posted automatically.

Do not place private account data, credentials, identity assets, publication
strategy, or downloaded media in this reusable repository.
