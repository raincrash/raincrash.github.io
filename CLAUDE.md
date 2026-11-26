# Working on sric.me

Personal site of Sricharan Chiruvolu (Sri). Read README.md for commands and structure.
This file is the short version plus the rules that matter when an agent edits the site.

## Ground rules

- **Single branch**: `gh-pages` is the default branch and is what GitHub Pages deploys.
  Pushing to it publishes to https://sric.me within about a minute.
- **Never push without Sri's OK.** Show the change locally first (`bin/serve`, port 4000;
  `.claude/launch.json` has a `jekyll` preview config), then commit and push only when asked.
- **Always run `bin/build` before committing.** It must print `OK: …`.
- Keep `_sass/*.scss` ASCII-only (libsass in GitHub Pages rejects non-ASCII).
- Only GitHub Pages–whitelisted plugins; no custom Ruby plugins (they don't run on Pages).
- Don't reintroduce a theme gem; everything lives in this repo.
- **Design system** (README, "Design"): the wireframe icosahedron is the only mark; one
  orange accent; Inter for UI/headings, Source Serif for post text, mono only for dates,
  meta and code. Use the tokens in `_sass/_tokens.scss`, never new colours or fonts.
  Keep it minimal: no new decorations, per-page logos or terminal-style flourishes.

## Adding a blog post

1. `bin/new-post "Title"` → edit `_posts/YYYY-MM-DD-slug.md`.
2. Front matter: `title`, `description` (≤155 chars), `tags`. If the title is longer than
   ~55 chars, add a shorter `seo_title`. Run `bin/og-card <post>` and add the `image:` line.
3. Check math, code and images render in `bin/serve`; run `bin/build`.

**Sri's writing style** (see existing posts): first person, conversational, a playful
one-line hook to open ("Flat earthers are right.", "Your face is a cloud of fuzzy blobs."),
concepts built up step by step under `##`/`###` headings, real math where it helps, short
code snippets, an honest "what you lose / where it breaks" section, a short closing, and a
`## References` list with links. British spelling (colour, realise). Plain, direct
sentences; no buzzwords.

**Accuracy**: fact-check every claim, citation, year and formula; verify any parameter
counts or numbers by computing them. Don't reveal internal details about Sri's employer
(Beyond Presence) beyond what's on his public LinkedIn.

## Adding photos

1. Ask which album each photo belongs to if it isn't obvious (albums: Astro, Film,
   Landscape, Macro, Nature, Portraits, Street, Travel, Wildlife; add new ones to
   `_data/photography.yml` first).
2. Copy the exports to a temp folder, **renamed to what they show**
   (`elephant-dust-bath.jpg`), then `bin/add-photos <album> <files>`.
3. Add captions under `captions:` in `_data/photography.yml`:
   `Subject, Place · Month Year`. Ask Sri for places; don't guess locations.
   Capture dates can be read from the export file names or `mdls` metadata.
4. Optionally set the album `cover:`. Run `bin/build`, check `/photography/` in the browser.

Sri exports from Capture One; anything ≥2000 px is fine. Low-res Instagram exports
(1080 px) look soft full-screen: flag them.

## Content facts (keep consistent)

- Role: AI Research Lead at Beyond Presence, Munich. Previously Colossyan, Sporttotal,
  Meshcapade (now Epic Games). Studied at TU Munich.
- Tagline: "AI Research Lead · generative AI, computer vision & 3D · Munich".
- Photography: film and digital. Current cameras are listed once, on /photography/
  (`cameras:` in `_data/photography.yml`); don't repeat them elsewhere in copy.
- Contact: email is the preferred channel; the About page has a Formspree contact form
  (setup in README, "Contact form"). Website mail uses the `+sricmeweb` plus address and a
  `[sric.me]` subject prefix. Socials: GitHub, LinkedIn, Instagram
  (@shots.by.sri). No Twitter, no SpeakerDeck.
