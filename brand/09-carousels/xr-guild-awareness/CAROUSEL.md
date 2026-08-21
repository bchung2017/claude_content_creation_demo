# XR Guild — awareness carousel

**Topic:** XR Guild · **Goal:** spread awareness of XR communities
**Format:** carousel, 8 slides at 1080×1350
**Brand source:** `BRAND-GUIDE.md` — every colour, typeface, and rule

---

## Status — read before posting

**The slides are final and rendered.** All 8 PNGs were registered through the
workspace, which checked each one's dimensions and PNG integrity and recorded a
SHA-256. The caption is registered against the exact carousel checksum
`9ecfb44f562efb1f…`.

**Two caveats, both deliberate:**

1. **The research stage did not run.** It requires an authenticated browser
   session with X, Reddit, and Digg, which was not available. Rather than
   fabricate sources to satisfy the validator, this was built entirely from XR
   Guild's own description of itself plus the brand guide. **No slide makes an
   external or third-party claim, and no statistic is cited anywhere.**
   `validate` still reports the research and hook stages incomplete — that is
   accurate reporting, not a defect.
2. **The identity is a proposal.** `BRAND-GUIDE.md` is a proposed refresh, not
   approved XR Guild identity, and these slides carry it. Fine for internal
   review; it needs sign-off before going on the real channels.

---

## The slides

### 01 · cover

`slides/slide-01.png` · 1080×1350

**EVERYONE GETS A TURN**

You don't need to own a headset to try one.

*Visual job:* Lens texture behind. Wordmark top-left. Single display headline filling the lower two thirds.

### 02 · problem

`slides/slide-02.png` · 1080×1350

**01**

Most people never try XR.  
Not for lack of curiosity. Because finding out whether you even like it costs several hundred dollars up front.

*Visual job:* Flat indigo. No texture. Headline over body, generous space.

### 03 · shift

`slides/slide-03.png` · 1080×1350

**02**

That is what a community is for.  
Somewhere the headset already exists, and somebody hands it to you.

*Visual job:* Flat indigo. Cyan rule above the headline as the single accent.

### 04 · who

`slides/slide-04.png` · 1080×1350

**03**

XR Guild is one of them.  
A 501(c)3 non-profit, founded in 2022 and run entirely by volunteers. Its members work across XR and spatial computing under a shared set of ethical principles.

*Visual job:* Panel card on indigo to separate the factual block from the argument.

### 05 · events

`slides/slide-05.png` · 1080×1350

**04**

And it throws demo nights.  
In a bar, with tables of headsets and people who are glad to show you how any of it works.

*Visual job:* Lens texture, dimmed. Headline anchored low.

### 06 · audience

`slides/slide-06.png` · 1080×1350

**05**

Beginners are the point.  
Not a tolerated edge case. If you have never worn one, you are exactly who the night is for — and you do not have to join anything to walk in.

*Visual job:* Flat indigo. Cyan sets only the word Beginners.

### 07 · broader

`slides/slide-07.png` · 1080×1350

**06**

There is probably one near you.  
XR meetups run in cities all over. Search your city and “XR” or “VR meetup”. If nothing turns up, four people and one headset is a real start.

*Visual job:* Flat indigo. The generalising slide — this one carries the awareness goal beyond XR Guild itself.

### 08 · cta

`slides/slide-08.png` · 1080×1350

**COME AND GET A TURN**

The headset gets passed around.

*Visual job:* Lens texture. Wordmark. The no-barrier pill in cyan, which the brand guide makes mandatory on event-facing work. Luma handle in mono.

---

## Caption

```
Most people never try XR. Not for lack of curiosity — because finding out whether you even like it costs several hundred dollars up front.

That is what a community is for. Somewhere the headset already exists, and somebody hands it to you.

XR Guild is one of them. A 501(c)3 non-profit, founded in 2022 and run entirely by volunteers, whose members work across XR and spatial computing under a shared set of ethical principles. It also throws demo nights: in a bar, with tables of headsets and people who are glad to show you how any of it works.

Beginners are the point — not a tolerated edge case. If you have never worn one, you are exactly who the night is for, and you do not have to join anything to walk in.

And if you are nowhere near us: XR meetups run in cities all over. Search your city and "XR" or "VR meetup". If nothing turns up, four people and one headset is a real start.

Grab a free spot on Luma. Turn up, try a headset, leave whenever you like.
```

No hashtags, by brand rule — the guide rules out invented hashtags and growth
tactics, and forbids urgency or scarcity language.

---

## Rebuilding

The copy lives in `carousel.json`, not in the HTML. Edit it there, then:

```bash
python3 brand/tools/build_carousel.py <project-dir> <project-dir>
```

Each page measures itself and steps the headline down until it fits the frame,
so longer copy cannot silently clip.
