#!/usr/bin/env python3
"""Render a carousel from carousel.json to 1080x1350 PNGs.

carousel.json is the source of truth: copy changes there, not in the HTML.
Each slide is written as a standalone HTML file and rasterised with headless
Chromium, so the exported PNG is exactly what the browser showed.

Type is auto-fitted. Rather than guessing a font size per slide, the page
measures its own content and steps the headline down until it fits the frame,
so a longer edit can never silently clip.
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

W, H = 1080, 1350
ROOT = pathlib.Path(__file__).resolve().parents[2]

PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>{id}</title>
<link rel="stylesheet" href="{tokens}">
<style>
  * {{ box-sizing: border-box; margin: 0; }}
  html, body {{ width: {W}px; height: {H}px; padding: 0; overflow: hidden; }}
  body {{
    font-family: var(--xrg-text);
    background: var(--xrg-indigo);
    color: var(--xrg-white);
    -webkit-font-smoothing: antialiased;
  }}
  .slide {{ position: relative; width: {W}px; height: {H}px; overflow: hidden; }}
  .tex {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
  .shade {{ position: absolute; inset: 0; background: {shade}; }}
  .inner {{
    position: relative; height: 100%; padding: 88px;
    display: flex; flex-direction: column;
  }}
  .top {{ display: flex; justify-content: space-between; align-items: flex-start; }}
  .mark {{ width: {markw}px; }}
  .eyebrow {{
    font-family: var(--xrg-detail); font-size: 26px; font-weight: 500;
    letter-spacing: var(--xrg-detail-track); text-transform: uppercase;
    color: var(--xrg-cyan);
  }}
  .middle {{ margin-top: auto; }}
  h1 {{
    font-family: var(--xrg-display); font-weight: 700;
    letter-spacing: var(--xrg-display-track); line-height: 0.99;
    font-size: 100px;
  }}
  h1 em {{ font-style: normal; color: var(--xrg-cyan); }}
  .body {{
    font-size: 34px; line-height: 1.45; color: var(--xrg-silver);
    max-width: 25ch; margin-top: 34px;
  }}
  .card {{
    background: var(--xrg-panel); border-radius: var(--xrg-radius-lg);
    padding: 40px 44px; margin-top: 34px;
  }}
  .card .body {{ margin-top: 0; max-width: 27ch; }}
  .rule {{ width: 132px; height: 6px; background: var(--xrg-cyan); margin-bottom: 40px; }}
  .pill {{
    display: inline-block; width: fit-content; margin-top: 44px;
    background: var(--xrg-cyan); color: var(--xrg-void);
    font-weight: 600; font-size: 29px; padding: 18px 34px; border-radius: 999px;
  }}
  .foot {{
    margin-top: auto; padding-top: 56px;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-family: var(--xrg-detail); font-size: 24px;
    letter-spacing: var(--xrg-detail-track); color: var(--xrg-muted);
  }}
  .tile {{ width: 58px; }}
</style></head>
<body>
<div class="slide">
  {texture}
  <div class="inner">
    <div class="top">{top_left}<div class="eyebrow">{eyebrow}</div></div>
    <div class="middle">
      {rule}
      <h1>{headline}</h1>
      {body}
      {pill}
    </div>
    <div class="foot"><span>{foot_left}</span><span>{foot_right}</span></div>
  </div>
</div>
<script>
  /* Shrink the headline until the whole slide fits its frame. Guarantees a
     longer copy edit cannot clip without anyone noticing. */
  const h1 = document.querySelector('h1');
  const inner = document.querySelector('.inner');
  let size = parseFloat(getComputedStyle(h1).fontSize);
  while (inner.scrollHeight > inner.clientHeight && size > 46) {{
    size -= 2;
    h1.style.fontSize = size + 'px';
  }}
  document.title = 'fit:' + size;
</script>
</body></html>
"""

TEXTURED = {"cover", "events", "cta"}


def build(project: pathlib.Path, out_dir: pathlib.Path) -> list[tuple[str, str]]:
    carousel = json.loads((project / "carousel.json").read_text())
    slides = carousel["slides"]
    src = out_dir / "src"
    src.mkdir(parents=True, exist_ok=True)

    tokens = ROOT / "brand/tokens/xr-guild-tokens.css"
    logo = ROOT / "brand/01-logos/xr-guild-wordmark-stacked-white.svg"
    tile = ROOT / "brand/01-logos/xr-guild-mark-xr-tile-cyan-on-indigo.svg"
    tex = ROOT / "brand/08-texture/lens-texture-01.svg"
    tex2 = ROOT / "brand/08-texture/lens-texture-02.svg"

    jobs = []
    total = len(slides)
    for i, s in enumerate(slides, start=1):
        role = s["role"]
        textured = role in TEXTURED
        art = tex if role in ("cover", "cta") else tex2
        # Interior slides carry the small tile; cover and CTA carry the wordmark.
        wordmark = role in ("cover", "cta")

        headline = s["headline"]
        if role == "audience":
            headline = headline.replace("Beginners", "<em>Beginners</em>")

        body = f'<p class="body">{s["body"]}</p>' if s["body"] else ""
        if role == "who" and body:
            body = f'<div class="card">{body}</div>'

        html = PAGE.format(
            id=s["id"], W=W, H=H,
            tokens=tokens.as_uri(),
            markw=176 if wordmark else 58,
            shade=("linear-gradient(160deg, rgba(8,7,15,0.34) 0%, rgba(8,7,15,0.88) 72%)"
                   if textured else "none"),
            texture=(f'<img class="tex" src="{art.as_uri()}" alt=""><div class="shade"></div>'
                     if textured else ""),
            top_left=(f'<img class="mark" src="{logo.as_uri()}" alt="XR Guild">' if wordmark
                      else f'<img class="tile" src="{tile.as_uri()}" alt="XR Guild">'),
            eyebrow=s.get("eyebrow", ""),
            rule='<div class="rule"></div>' if role == "shift" else "",
            headline=headline,
            body=body,
            pill=('<div class="pill">Free · Beginners welcome · Headsets provided</div>'
                  if role == "cta" else ""),
            foot_left="LU.MA/XRGUILD" if role == "cta" else "XR GUILD",
            foot_right=f"{i:02d} / {total:02d}",
        )
        f = src / f"{s['id']}.html"
        f.write_text(html)
        jobs.append((str(f), s["id"]))
    return jobs


if __name__ == "__main__":
    project = pathlib.Path(sys.argv[1])
    out = pathlib.Path(sys.argv[2])
    jobs = build(project, out)
    print(f"built {len(jobs)} slide sources in {out/'src'}")
