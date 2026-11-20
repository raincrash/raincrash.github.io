# sric.me

Personal site: a minimal, terminal-flavoured blog + about page, and a photography
portfolio. Plain Jekyll, built by GitHub Pages from the `gh-pages` branch. No gem theme;
everything is in this repo.

## Run locally

```bash
bin/serve            # http://localhost:4000, live reload, drafts visible
```

First run installs gems into `vendor/bundle`. Needs Homebrew Ruby 3.3
(`brew install ruby@3.3`); the `github-pages` gem pins the same Jekyll and plugin
versions GitHub uses, so what you see locally is what gets deployed.

## Write a post

```bash
bin/new-post "Title of the post"           # _posts/YYYY-MM-DD-title-of-the-post.md
bin/new-post --draft "Half-baked idea"     # _drafts/, shown locally only
```

Front matter: `title`, `description` (shown in the post list, search results and link
previews: always write one) and `tags`. Optional `image: /assets/<post>/cover.jpg` sets the
link-preview card (1200×630 works best); otherwise the default card in `assets/og/` is used.
Give every image real alt text: `![what it shows](/assets/...)`.
Math is on for all posts (KaTeX): `$$ x^2 $$` inside a sentence is inline,
`$$ … $$` on its own lines is a display block. `\( … \)` and `\[ … \]` work too.
Put post images in `assets/<post-name>/` and reference them as `/assets/<post-name>/x.png`.

The blog lists 8 posts per page (`paginate` in `_config.yml`).

## Add photos

```bash
bin/add-photos astro ~/Pictures/export/*.jpg
```

That's it: the script writes a full-size WebP (your export's size, capped at 3840px on the
long edge, never upscaled, quality 90) and a 900px thumbnail per image into
`assets/photos/<category>/`, with EXIF/GPS stripped, and creates the album page
(`photography/<category>.html`) the first time a category is used. Albums pick up every
file in their folder automatically. Override with `MAX_PX=2000 QUALITY=92 bin/add-photos ...`.
GitHub Pages caps a site at 1 GB; at ~1–3.5 MB per 4K photo that's room for a few hundred. Needs `cwebp` (`brew install webp`); macOS only.

- `/photography/` shows one tile per album; each album lives at `/photography/<slug>/`.
- Album pages load 24 thumbnails at first and more as you scroll (`batch_size` in
  `_data/photography.yml`), so large albums stay fast.
- Albums, their order, optional `description` and `cover` image live in
  `_data/photography.yml`. Empty albums are hidden. To add one, add a `slug`/`name` pair.
- Captions are optional: add `file-name.webp: Caption` under `captions:` in the same file.
- To remove a photo, delete both `assets/photos/<cat>/<name>.webp` and its `thumbs/` copy.

## SEO

Handled by `jekyll-seo-tag`, `jekyll-sitemap` and `jekyll-redirect-from` (all supported by GitHub
Pages): titles, descriptions, canonical URLs, Open Graph/Twitter cards, JSON-LD (a `Person`
profile on Home/About, `BlogPosting` on posts), `sitemap.xml` and `robots.txt`.
Social profiles live under `social.links` in `_config.yml`. To verify the site in Google Search
Console, uncomment `webmaster_verifications` there and paste your code. Moved a page? Add
`redirect_from: [/old-url/]` to its front matter.

## Layout

```
_config.yml            site settings, social handles, pagination
_data/photography.yml  photo categories + captions
_layouts/              default, page, post, gallery (album page)
_includes/             head, header, footer, photos (gallery file discovery)
_sass/                 tokens (colours/fonts, light + dark), page styles
assets/js/site.js      theme toggle, album batch loading, lightbox
index.html  about.md  blog/index.html  photography/index.html
bin/                   serve, new-post, add-photos
```

## License

Code: MIT (`LICENSE-CODE.md`). Photographs: see `LICENSE-IMAGES.md`.
