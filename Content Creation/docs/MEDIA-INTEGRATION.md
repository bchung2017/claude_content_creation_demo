# Media integration

By TheVibeFounder

Content Creation does not bundle a downloader. It uses a simple provider order:

```text
Installed FrameGrab CLI
        ↓ unavailable
Browser fallback for a public X/Twitter post
        ↓ unsupported
Stop and request another approved asset
```

## 1. Choose the route

Run from the Content Creation root:

```bash
node bin/content-creation.js media-route --url <source-url>
```

The command looks for `FRAMEGRAB_CLI` first, then `framegrab` on `PATH`. FrameGrab is
optional, external, and never installed or copied by this package.

## 2A. FrameGrab CLI is available

Read the detected executable's `--help` and use only its documented command.
Do not assume a private API or server contract. Save the result locally, then
continue to registration below.

## 2B. Browser fallback is available

This route is only for public posts on `x.com` or `twitter.com`:

1. Open exactly `https://ssstwitter.com/` in the browser.
2. Paste the public post URL.
3. Choose **Download**.
4. Choose an available quality and save the file.

sssTwitter is a third-party website, not part of this package. Its page or
availability may change. Do not enter credentials, submit a private or
protected post, bypass access controls, automate an undocumented API, or
continue through an unexpected redirect. The source URL is shared with that
third party when it is submitted.

If the source is not a public X/Twitter post and FrameGrab is unavailable, the
route stops. Use an owned or licensed alternative or make FrameGrab available
separately.

## 3. Register the saved file

```bash
node bin/content-creation.js media-register <project-folder> \
  --url <source-url> \
  --file <downloaded-file> \
  --usage "Slide 3 proof" \
  --provider <framegrab-cli-or-ssstwitter-browser> \
  --rights <permission-status>
```

Registration verifies the file exists, copies it to
`assets/media/<asset-id>.<extension>` inside the ignored project, calculates a
SHA-256 hash, and adds the source and usage record to `assets/manifest.json`.

## Permission boundary

Every asset must be marked `owned`, `official`, `licensed`,
`permission-needed`, or `reference-only`. A successful download does not grant
permission to publish. The final carousel cannot use an asset marked
`permission-needed` or `reference-only`.

By TheVibeFounder
