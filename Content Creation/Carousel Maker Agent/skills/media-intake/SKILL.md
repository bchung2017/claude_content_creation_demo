---
name: media-intake
description: Choose an approved media provider, acquire a carousel asset, and register its source, local copy, hash, use, and permission status. Use during carousel creation when a project needs video, image, audio, or a media receipt.
---

# Media intake

From the workspace root, run:

```bash
node bin/content-creation.js media-route --url <source-url>
```

Follow the returned route:

1. If `framegrab-cli` is selected, read the installed executable's `--help` and
   use its documented command. FrameGrab is separate and is not bundled.
2. If `ssstwitter-browser` is selected, open exactly
   `https://ssstwitter.com/`, paste the public X/Twitter post URL, choose
   **Download**, choose an available quality, and save the file.
3. If the route is blocked, revise the visual job or report the missing
   provider. Do not improvise another downloader.

Never enter credentials, use a private or protected post, bypass access
controls, automate an undocumented third-party API, or follow an unexpected
redirect.

Register the downloaded file with `media-register`. Preserve its source id,
source URL, creator when known, intended slide use, and permission status. The
command copies it into the ignored project and records its SHA-256. If
permission is unclear, use `permission-needed` or `reference-only`. A download
never proves that an asset is licensed.
