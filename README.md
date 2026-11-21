# sric.me

Personal site of Sricharan Chiruvolu: a minimal, terminal-flavoured blog and about page,
plus a photography portfolio. Plain Jekyll, no theme gem, no JavaScript framework.
GitHub Pages builds it from the **`gh-pages`** branch (the only branch) and serves it at
<https://sric.me>.

- **Home** `index.html` · **About** `about.md` · **Random Musings** `blog/index.html` (paginated)
- **Photography** `photography/index.html` (album tiles) → one page per album

## Quick start

```bash
brew install ruby@3.3 webp      # once: Ruby for Jekyll, cwebp for photos
bin/serve                       # http://localhost:4000 (first run installs gems)
```

| Task | Command |
|---|---|
| Preview locally, live reload | `bin/serve` |
| New blog post | `bin/new-post "Title"` (or `--draft "Title"`) |
| Share card for a post | `bin/og-card _posts/<file>.md` |
| Add photos to an album | `bin/add-photos <album> ~/path/*.jpg` |
| Production build + checks | `bin/build` |
| Publish | commit, then `git push` (to `gh-pages`) |

GitHub rebuilds the site about a minute after a push.

## Writing a post

```bash
bin/new-post "My post title"     # creates _posts/YYYY-MM-DD-my-post-title.md
```

Front matter:

```yaml
title: "Full title, shown on the page"
description: One sentence, under ~155 characters. Used in lists, Google and link previews.
tags: [ml, 3d]
seo_title: Shorter title for Google, ~55 characters    # optional, only if title is long
image: /assets/og/posts/my-post-title.png             # optional share card (bin/og-card)
last_modified_at: 2026-11-20                          # optional, when you substantially edit
```

- **Math** (KaTeX, on for all posts): `$$ x^2 $$` inside a sentence is inline; `$$ … $$` on
  its own lines is a display block. `\\( … \\)` also works inline. Inside math, avoid `|`
  (use `\lvert`/`\rVert`); in plain-text paragraphs avoid bare `_` pairs, which Markdown
  turns into italics.
- **Code**: fenced blocks with a language (```` ```python ````) are highlighted.
- **Images**: put them in `assets/<post-slug>/`, prefer WebP, always write alt text:
  `![What the image shows](/assets/<post-slug>/figure.webp){: width="1600" height="900"}`.
- **Backdating**: the date comes from the file name. Rename the file to change it.
- **Drafts**: `_drafts/` posts show with `bin/serve` only, never on the live site.

## Adding photos

```bash
bin/add-photos astro ~/Pictures/Export/*.jpg
```

For each image the script:

1. writes a full-size WebP (your export's size, capped at **3840 px**, never upscaled,
   quality 90) and a 900 px thumbnail to `assets/photos/<album>/` and `…/thumbs/`,
2. strips EXIF and GPS (keeps the colour profile),
3. records pixel sizes in `_data/photo_sizes.yml`,
4. creates the album page `photography/<album>.html` the first time an album is used.

Files are named after the source file (lower-cased, spaces → dashes), so **rename exports
to what the photo shows first** (`milky-way-over-the-desert.jpg`, not `DSCF1234.jpg`):
it becomes the alt text and the image URL.

Then, in `_data/photography.yml`:

- **Albums** are listed under `categories:` (slug + name; optional `description`, `cover`).
  Tiles are sorted alphabetically and albums with no photos are hidden. To create a new
  album, add a `slug`/`name` entry before running `bin/add-photos`.
- **Captions** go under `captions:` as `file-name.webp: Caption, Place · Month Year`.
  Captions are also the alt text and appear in Google Images data.

**Remove a photo**: delete `assets/photos/<album>/<name>.webp`, its `thumbs/` copy and its
lines in `_data/photo_sizes.yml` and `captions:`.

**Size budget**: GitHub Pages caps a site at 1 GB. A 4K photo is ~0.5–3.5 MB, so there is
room for a few hundred. Use `MAX_PX=3000 bin/add-photos …` to go smaller.

## Editing other content

| What | Where |
|---|---|
| Name, tagline, site description, social profiles, job/employer facts | `_config.yml` |
| Home page text | `index.html` |
| About page | `about.md` |
| Photography intro text | `photography/index.html` |
| Footer | `_includes/footer.html` |
| Colours and fonts (light + dark) | `_sass/_tokens.scss` |

Changes to `_config.yml` need a restart of `bin/serve`.

## Contact form

The About page has a contact form (`_includes/contact-form.html`, `assets/js/contact.js`).
GitHub Pages can't send email, so submissions go through [Formspree](https://formspree.io),
the usual choice for Jekyll sites (free tier: 50 messages a month, spam filtering).

- Messages go to `sricharanchiruvolu+sricmeweb@googlemail.com` with the subject
  `[sric.me] Message from <name>`. Reply-To is the visitor's email, so just hit reply.
  In Gmail, filter on `to:(+sricmeweb)` to label them.
- **Setup (once)**: sign in at formspree.io, create a form whose recipient is the address
  above, then put its ID (the part after `formspree.io/f/`) in `_config.yml` under
  `contact.formspree_id`. Restart `bin/serve`, send a test message, publish.
- **Until an ID is set**, the form still works: it opens the visitor's own email app with
  the same address, subject and message filled in.
- Spam: a hidden `_gotcha` honeypot field plus Formspree's own filtering.

## How it fits together

```
_config.yml              site settings, author facts, SEO, plugins
_data/photography.yml    albums, captions, photos-per-batch
_data/photo_sizes.yml    pixel sizes (written by bin/add-photos)
_layouts/                default · page · post · gallery (album page)
_includes/               head (SEO, fonts, KaTeX) · header · footer
                         photos.html (finds album photos) · person-jsonld.html
_sass/                   tokens · base · chrome (header/footer) · home · blog
                         prose (article typography) · syntax · photography
assets/js/site.js        theme toggle, album batch loading, lightbox
assets/og/               share images; og/posts/ per-post cards
bin/                     serve · build · new-post · og-card · add-photos (+ _env)
```

- **Plugins** (all GitHub Pages–supported): jekyll-seo-tag, jekyll-sitemap, jekyll-feed,
  jekyll-paginate, jekyll-redirect-from. Local versions are pinned by the `github-pages` gem.
- **SEO**: titles/descriptions/Open Graph via jekyll-seo-tag, JSON-LD profile on Home and
  About, `ImageGallery` data on albums, `sitemap.xml`, `robots.txt`, RSS at `/feed.xml`.
  Moved a page? Add `redirect_from: [/old-url/]` to its front matter.
- **Albums load in batches** of 24 thumbnails (`batch_size` in `_data/photography.yml`);
  full-size images load only in the lightbox.

## Troubleshooting

- *"Ruby 3.3 not found"*: `brew install ruby@3.3`.
- *"cwebp not found"*: `brew install webp`.
- *Sass "Invalid US-ASCII character"*: keep `_sass/*.scss` ASCII-only (use `\2192` escapes).
- *Old CSS/JS after a deploy*: assets are cache-busted per build; hard-refresh once.
- *Gems out of date / Dependabot alert*: `bundle update <gem>` then `bin/build`, commit
  `Gemfile.lock`.

Old branches are archived as tags (`archive/main-2024`, `archive/raincrash-patch-1`).

## License

See [LICENSE.md](LICENSE.md): code MIT, content © Sricharan Chiruvolu.
