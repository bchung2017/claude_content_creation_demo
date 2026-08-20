# XR Guild — Brand Guide

**Version 1.0 · 2026**

This guide exists so that any XR Guild volunteer can make something — a flyer, a
post, an invoice, a pitch to a venue — and have it look and sound like the guild
without asking anyone first.

Every rule here has a reason next to it. If a rule ever stops making sense for a
real situation, the reason will tell you what to protect while you break it.

---

## 1. The idea

> **The headset gets passed around.**

That is the whole brand in one sentence. XR Guild is people handing each other
something to try. Not a company, not a course, not a members' club — a room where
the good thing gets passed to the next person.

Everything in this guide follows from it. Every flyer, post, and sign has the same
job: **get one more person to try something.**

### Three principles

**01 · Pass it on.**
The demo is the point. Someone else should be wearing the headset within ten
minutes. Content should show hands, faces, and turn-taking — never a product on a
plain background.

**02 · Nobody has to already know.**
Beginners are the audience, not a tolerated edge case. Every public sentence
assumes zero prior XR knowledge and zero jargon. If a sentence needs you to know
what "6DoF" means, rewrite it.

**03 · The room is the point.**
The guild is people, not a product or a platform. When choosing between showing
technology and showing people, show people.

### The word "guild"

A guild historically meant a closed trade association — members, gatekeeping,
credentials. **That is the opposite of what XR Guild is.** We use the word for the
other half of its meaning: shared craft, and people teaching each other.

This has consequences that are not optional:

- Never use tiers, levels, membership, approval, "insiders", or "the community"
  as a thing you can be outside of.
- Say *beginners welcome* explicitly. Do not imply it and hope people feel it.
- Anyone can demo. Demoing is not a status that gets earned.

The one word this brand must never earn is **exclusive.**

---

## 2. Audience

XR Guild is for **enthusiasts, educators, and beginners** — people who are curious
about virtual and augmented reality and want to try it with other people.

They are mostly **not** professional XR developers. Someone arriving may have never
worn a headset. Someone else may teach this for a living. Both should feel equally
expected at the door.

They find us on **Luma** and **LinkedIn**, and they meet us in person — at demo
nights held in bars and clubs, free to attend.

**What they want:** to try something new, with other people, without having to
prove anything first.

**What puts them off:** feeling like the room already knows each other, feeling
behind, or feeling sold to.

---

## 3. Identity

### The master

**`brand/01-logos/xr-guild-wordmark-stacked-cyan-on-indigo.svg` is the master
lockup.** XR stacked above GUILD, GUILD tracked out so both lines share one width
and the block reads as a single shape.

If you are unsure which file to use, use that one.

> **Why a master matters.** XR Guild currently has many logo variations and no
> designated primary. That is the usual reason a brand feels inconsistent — not
> bad design, just no agreed default. Everything below is a *variation with a
> stated job*, not an alternative to pick by taste.

### The variations, and when each is correct

| File | Use it for |
|---|---|
| `xr-guild-wordmark-stacked-cyan-on-indigo.svg` | **Master.** Anywhere you need the logo and have a background to place it on. |
| `xr-guild-wordmark-stacked-white.svg` | On photography, on the lens texture, on any dark busy background. |
| `xr-guild-wordmark-stacked-cyan.svg` | On solid indigo or void where you want the mark to sing rather than sit quietly. |
| `xr-guild-wordmark-stacked-black.svg` | Documents, invoices, anything printed on white. |
| `xr-guild-wordmark-horizontal-white.svg` | Wide, short spaces — a page header, an email signature, a banner. |
| `xr-guild-wordmark-horizontal-black.svg` | The same, on light backgrounds. |
| `xr-guild-mark-xr-tile-*.svg` | Square spaces and anything under about 120px: avatars, app icons, stickers. |

### Clear space

Keep clear space equal to **the height of the X** on all four sides. Nothing —
text, edge, another logo, a photo subject — comes inside it.

### Minimum sizes

- Stacked wordmark: **90px** wide on screen, **24mm** in print. Below that GUILD
  fills in and stops being a word.
- Horizontal wordmark: **150px** wide on screen.
- XR tile: **16px**. It has been tested at 16px and holds.

### Logo rules

- **Do** place the wordmark on indigo, void, the lens texture, or a photograph
  dark enough to keep it legible.
- **Do** use the XR tile whenever the space is square or small.
- **Don't** stretch, rotate, outline, add a shadow to, or recolour the wordmark
  outside the palette in section 4.
- **Don't** fill the letterforms with the lens texture or a photograph. The
  texture goes *behind* the mark. Filled letterforms stop being readable at exactly
  the sizes that matter most.
- **Don't** rebuild the wordmark by typing "XR GUILD" in Space Grotesk. The
  spacing is specific. Use the file.
- **Don't** put another organisation's logo inside an XR Guild lockup — see
  section 9.

---

## 4. Colors

Dark ground, cool accents. The system is dark-first because XR Guild happens in
bars and clubs at night, and a bright surface in a dark room is unreadable and
unwelcoming.

| Role | Name | Hex | Where it goes |
|---|---|---|---|
| Ground | **Void** | `#08070F` | Deepest surfaces, full-bleed backgrounds, favicon ground |
| **Primary** | **Indigo** | `#181143` | The main brand ground. The colour people should remember. |
| Raised | **Panel** | `#221A57` | Cards and panels sitting on indigo |
| **Accent** | **Cyan** | `#5CE1F2` | Signal. One use per surface. |
| Text | **White** | `#FFFFFF` | Headlines and primary text on dark |
| Text | **Silver** | `#C3CADE` | Body text on dark |
| Text | **Muted** | `#8E96B4` | Captions and metadata only — never body text |
| Light ground | **Paper** | `#F4F5F9` | Documents, invoices, print |
| Print | **Black** | `#000000` | Single-colour print and embroidery only |

Machine-readable values: `brand/tokens/xr-guild-palette.json`
Implementation: `brand/tokens/xr-guild-tokens.css`

### The one-accent rule

**Cyan marks one thing per surface.** The action, the date, or the mark — pick
one. Cyan used three times on a poster stops being a signal and becomes
decoration, and the thing you actually wanted people to notice disappears.

### Cool, but never cold

The palette is cool. The brand is warm. Since colour cannot carry the warmth
here, it has to come from everywhere else:

- Plain, welcoming language (section 6).
- Photographs of actual people mid-demo — faces, hands, laughing (section 7).
- Generous spacing. Crowded layouts read as urgent and impersonal.
- Softened corners: `14px` on panels, fully rounded on the no-barrier pill.

A layout that is cool *and* tight *and* impersonal has failed the brief even if
every hex value is correct.

### Contrast

Every colour pair this guide endorses has been measured against WCAG 2.1, not
estimated. Re-run `python3 brand/tools/contrast.py` after any change.

| Pair | Ratio | Grade |
|---|---|---|
| White on Indigo | 17.50:1 | AAA |
| Cyan on Indigo | 11.26:1 | AAA |
| Silver on Indigo | 10.69:1 | AAA |
| Muted on Indigo | 5.98:1 | AA — captions only |
| Indigo on Cyan | 11.26:1 | AAA |
| Indigo on Paper | 16.06:1 | AAA |

Muted is the only value that lands at AA rather than AAA. That is why it is
restricted to captions and metadata, and never body text.

---

## 5. Typography

Three typefaces, three jobs. All three are **SIL Open Font License** — free to
install and use, which matters when a dozen volunteers need them.

| Job | Typeface | Use it for |
|---|---|---|
| **Display** | Space Grotesk Bold, tracking `-0.02em` | Headlines, the wordmark, numbers that matter |
| **Text** | Figtree 400 / 500 / 700 | Everything a person reads to understand or act |
| **Detail** | JetBrains Mono 400 / 500, tracking `0.08em`, uppercase | Dates, times, addresses, invoice numbers, labels |

Fallback stacks are defined in `brand/tokens/xr-guild-tokens.css`. Font files are
in `brand/00-fonts/`.

**Why these.** Space Grotesk is geometric and slightly odd — close to the
letterforms already in the XR Guild artwork, without being a hard sci-fi face
that would fight the welcome. Figtree is a warm humanist sans doing the job the
cool palette cannot. JetBrains Mono makes practical detail — *when and where* —
look deliberate rather than like leftover small print.

### Rules

- Negative tracking is allowed **only** on display type. Never track body text
  tight to fit; cut words instead.
- Mono is for facts, never for sentences. A paragraph in mono reads as a machine
  talking.
- One display size per surface. Two competing headlines means neither wins.
- Sentence case for headlines. ALL CAPS is reserved for mono labels.

---

## 6. Voice

XR Guild speaks like a person who is genuinely glad you came and assumes you know
nothing yet — without ever making that assumption feel like a judgement.

**Voice traits:** open · warm · plain

**Write like this:**
> Come try something you have never worn. Free, and you do not need to know
> anything about VR to enjoy it.

**Do not sound like this:**
> XR Guild is the premier community for XR professionals and enthusiasts.
> Apply to join our exclusive network of industry innovators.

### The invitation grammar

Every public announcement carries the same four parts, in this order. It is what
makes a poster, a Luma page, and a LinkedIn post feel like the same guild.

| Part | What it does | Example |
|---|---|---|
| **1. Who this is** | A short mono eyebrow. Orientation, not a headline. | `EVERYONE GETS A TURN` |
| **2. The invitation** | Plain speech, in display type. Speaks to one person. | "Come try something you have never worn." |
| **3. Where and when** | Unmissable, in mono. Date, time, venue. | `Thursday 18 September · 7:00–10:00 PM` |
| **4. The no-barrier line** | The cyan pill. **Never omitted.** | `Free · Beginners welcome · Headsets provided` |

**Part 4 is not decoration and it is not optional.** It is the single most
important element on any XR Guild announcement, because the audience's main
reason for not coming is suspecting the room is not for them. Removing it to save
space means saving space by removing the point.

### CTA style

Calls to action invite a next step and name what it costs — which is nothing.
Never urgency, scarcity, or pressure. No "limited spots", no "don't miss out",
no "apply".

> **Grab a free spot on Luma. Turn up, try a headset, leave whenever you like.**

---

## 7. Imagery

**Use:** photographs of real people at real events — someone mid-demo, someone
being handed a headset, someone laughing at what they are seeing, a room with
people in it. Faces and hands.

**Treatment:** shot as-is in venue lighting. Dark and a little imperfect is fine
and honest. Darken behind text where needed rather than washing the whole image
out. Never heavy filters or colour grading toward the palette — real light beats
brand-consistent light.

**Avoid:**
- Product shots of headsets on plain backgrounds with nobody holding them.
- Stock photography of any kind, especially "people in VR" stock, which always
  looks like a press release.
- Generic 3D grids, wireframe globes, purple neon abstractions, and every other
  default visual for "the metaverse".
- Photographs of people who did not agree to be photographed. Ask at the door.

**The lens texture** (`brand/08-texture/`) is the alternative when you have no
photograph. It is a background only — the wordmark sits *on* it, never *in* it.
It keeps the iridescent quality of the existing XR Guild artwork inside the cool
palette.

### Visual direction

Dark, roomy, and human. Cool indigo ground with one cyan signal, heavy geometric
headlines, generous space, softened corners, and real photographs of people
trying things. It should look like a good night in a dark room — not like a
technology company.

---

## 8. Content rules

**Always:**

- Say what it costs. It is free — that is the most important fact on the page.
- Say beginners are welcome, in those words.
- Name the date, time, and venue in a way you can read across a bar.
- Show people, not products.
- Use the real attendance number when quoting one.

**Never:**

- Imply membership, approval, tiers, or that anyone is on the inside.
- Use jargon in public copy. No acronyms without the plain words.
- Use urgency or scarcity to drive signups.
- Put a venue's or partner's logo into an XR Guild lockup (section 9).
- Promise attendee data to a sponsor. Attendees are guests, not leads.
- Photograph people who did not agree to it.

---

## 9. Rules that protect the guild

**Venue and partner logos.** XR Guild is independent. Placing an institution's or
venue's logo on our artwork implies they sponsor or endorse the guild, which they
have not agreed to. Colleges and venues take this seriously, and the usual
consequence is losing the room rather than receiving a polite email.

- **Do** credit a host in XR Guild's own type: *"Hosted at Lehman College."*
- **Do** use a venue's actual logo only with written permission, for the one
  event it was granted for.
- **Don't** build it into a lockup, a template, or anything reusable.

**Sponsors.** A sponsor may be named and may have a logo placed as a sponsor —
clearly separated from the XR Guild mark, under the word "Sponsored by". Never
inside the clear space.

**Photographs of people.** Ask at the door, and honour it. One person's bad
experience of being posted without asking costs more than any photograph is worth.

---

## 10. Where the files are

| Folder | What is in it |
|---|---|
| `brand/00-fonts/` | The three typefaces, latin subsets, OFL |
| `brand/01-logos/` | Wordmarks and marks, SVG, outlined |
| `brand/02-favicons/` | Favicon SVG, PNG at 16–180px, and `.ico` |
| `brand/03-app-icons/` | iOS 1024, Android 512, Android maskable |
| `brand/04-social/` | Luma cover, LinkedIn post, cover, logo, link card |
| `brand/05-invoices/` | Invoice template — HTML source and PDF |
| `brand/06-proposals/` | Sponsorship proposal / SOW, and the venue pitch sheet |
| `brand/07-presentations/` | Presentation cover slide |
| `brand/08-texture/` | The lens texture |
| `brand/tokens/` | Palette JSON and the CSS every template imports |
| `brand/tools/` | Scripts that regenerate all of the above |

See `README.md` for how to open, edit, and re-export each one.

---

## 11. Still to add

This is a starter system. It is complete enough to use today, and these are the
gaps — honestly listed rather than quietly left out.

### Two decisions only you can make

1. **The Lehman College / CUNY logo.** Current XR Guild artwork carries it, but
   the guild is independent and rents the space. The recommendation in section 9
   is to replace it with a plain text credit. Accept or reject it, then the
   artwork can be updated accordingly.
2. **Retiring the old logo variations.** This guide names one master. The other
   existing variations should either be mapped to a stated job or retired, so
   volunteers stop choosing by taste.

### Things only you can supply

3. **Photography.** The single biggest gap. Section 7 calls for photographs of
   real people mid-demo, and there are none — every graphic currently falls back
   to the lens texture. Ten to fifteen good photos from the next event would do
   more for this brand than any other single addition. Get consent at the door.
4. **Real contact details.** Every template carries placeholder contact info,
   a placeholder Luma handle, and placeholder bank details on the invoice.
   Nothing is safe to send until those are replaced.
5. **Your legal and financial facts.** Whether XR Guild is an entity that can
   receive sponsorship money, who signs, and whether tax applies. The invoice
   and proposal assume answers that have not been confirmed.
6. **Real numbers.** The venue pitch quotes 80–100 attendees and the proposal
   prices at $1,000. Both are placeholders. Use your actual figures — section 8
   requires honest numbers.

### Assets not yet built

7. **In-venue print.** A demo-station sign, name tags, and a door poster. The
   events are physical and there is currently nothing to print for them.
8. **Merchandise.** Stickers and a shirt. Cheap, and a sticker on a laptop is
   the most natural way this particular guild spreads.
9. **A one-slide deck beyond the cover.** Only the cover slide exists; content
   layouts (section, image, list) are not built.
10. **An email signature and a short link.** Small, used constantly.
11. **A website**, if you want one. The favicons, app icons, and link card are
    already sized for it.

### Worth knowing

12. **Platform sizes drift.** Luma and LinkedIn dimensions were checked in
    August 2026 from documentation summaries, since the platform docs themselves
    were unreachable from the machine that built this kit. Re-check them before
    a rebrand or a large print run.
13. **The content agent needs a browser.** All four of its agents are installed,
    but it needs Chrome and signed-in X, Reddit, and Digg accounts before it can
    research anything — see `README.md`.

---

*XR Guild brand guide v1.0. Built from a discovery conversation with the guild's
organiser, August 2026.*
