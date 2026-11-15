# CLAUDE.md

Instructions for AI agents working in this repository.

## What this is

My GitHub profile repository (`klasolsson81/klasolsson81`). `README.md` on `main` renders as my profile page, and it works as a portfolio. Every image it shows is built from this repository; nothing is fetched from a third-party image service.

## Layout

```
README.md              the profile page
assets/                committed images the README references
  *.svg                hero, link pills, pipeline figure (dark and light; wide, medium and narrow)
  showcase/*.webp      project showcase images, composed from screenshots (wide and -narrow)
content/facts.json     numbers that are not read live, each with a date and a source
design/tokens.json     colours for both themes and for each product
design/glyphs.json     generated glyph atlas (do not edit)
scripts/               the generator and the dev helpers
.github/workflows/live.yml   daily job for the two live images
```

The branch `generated` holds the two live images (activity, Jobbliggaren stats) as a single force-pushed commit. The README links to them by absolute `raw.githubusercontent.com` URL. Do not commit to that branch by hand.

## Commands

```bash
npm ci
npm run svg        # hero, pills, pipeline -> assets/
npm run compose    # showcase images -> assets/showcase/ (needs .work/shots, see below)
npm run live       # activity + stats -> .work/live (needs GH_TOKEN)
npm run preview    # README through GitHub's Markdown API -> .work/preview/index.html
npm run shoot      # screenshots of the preview -> .work/review/
npm run check      # the guard described below; add -- --links to request every URL
npm run glyphs     # only after changing fonts or the character set
```

## Rules the page depends on

`npm run check` enforces most of these. Run it before every commit.

- **No third-party image hosts.** Images are repo-relative, or this repository's own `generated` branch.
- **Text in images is outlined.** `scripts/lib/text.mjs` draws text from the glyph atlas. No `<text>`, no `@font-face`, no `foreignObject` in any SVG.
- **Three canvases.** Wide drawings are 846 units wide for the desktop column, medium ones 580 for the columns in between (tablets, small windows), narrow ones 330 for a phone, where the column is about 309 px. Each is read at close to 1:1. Never shrink a wide image for a narrower column: text under about 9 px is unreadable. Keep caps labels at 9.5 units or more and sentences at 10 or more on every canvas.
- **Width is chosen by `<picture>`, theme by link fragment.** Each drawing appears twice: once inside `<a href="…-dark.svg#gh-dark-mode-only">` and once inside `<a href="…-light.svg#gh-light-mode-only">`. GitHub hides the link whose theme is not active, also for signed-in visitors with a fixed theme. Inside each link a `<picture>` switches on width only: `(min-width: 1240px)` wide, `(min-width: 880px)` medium, and the narrow file as the `<img>`. Never put `prefers-color-scheme` and `min-width` in the same `<source>`: GitHub rewrites themed sources and drops the width condition, so a phone would get the wide file. GitHub documents the fragments as deprecated; if both themes ever show at once, that is why. The three link pills switch on theme only and use a plain themed `<picture>`.
- **Showcase images are composed screenshots** on the product's own colours, so one file serves both themes. Each has a `-medium` and a `-narrow` sibling, switched at the same widths as the drawings. A narrower canvas shows less, larger: a single card or a single phone instead of the whole composition. The strip of smaller projects is the exception: it sits on the page colour, so it has dark and light files and uses the link-fragment pairing. They are not wrapped in links: GitHub then links each to its full-size file, which lets a phone reader enlarge it.
- **Every animation has a still state.** The un-animated drawing must be complete and correct, and each SVG carries a `prefers-reduced-motion` rule. Nothing fades content in: every frame shows the whole drawing. Animate only `opacity`, `transform` and `stroke-dashoffset`, keep loops slow, keep the three pills in phase, and give every animation a finite count so the page comes to rest after about 45 seconds. The still state is the frame the page settles on, so make it the best frame, not the emptiest. Playwright's reduced-motion emulation does not reach SVGs loaded as images; `npm run shoot -- --reduce` sets a browser-level preference instead.
- **Real text stays text.** Headings, descriptions, stack lists and links are Markdown. An image never carries information that is not also in its alt text or the surrounding prose. Numbers shown in the two live images are repeated, rounded, in a sentence under each.
- **No layout tables.** The toolbox is the one table, because it is tabular. Images that belong side by side are composed into one image.
- **Multi-word chips do not break.** Write them as `<code>EF&nbsp;Core</code>`; a space inside backticks lets the chip split across lines.
- **`width` only on `<img>`**, never `height`: inside `<picture>` a height attribute distorts the image on narrow screens.
- **Link text names the destination**, never "Live" or "here".

## Content rules

- **Facts come from the repositories and my current CV**, not from klasolsson.se, which is out of date.
- **Every number has a source.** Live numbers are read by `scripts/render-live.mjs`. Anything else goes in `content/facts.json` with a date and where it was read. A statement about how the work was done (what ran in CI, what was reviewed, what a failed deploy does) is checked against the repository's history before it is written.
- **Yobber is an employer's product.** Show only the public site or the candidate view. No employer or admin views, no customer names, no incident details, no data sizes, and only my own contribution numbers without the team's totals.
- **No personal data in screenshots.** No email addresses, no contact persons from job ads, no children's names, no working QR codes or links to private pages. Jobbliggaren test data may show real employers only in neutral states (an open ad with its match grade, saved, draft, sent, a deadline); offers, interviews and rejections belong to invented employers.
- **Tone:** short and declarative. No buzzwords, no exclamation marks, no dramatic dashes. English throughout.
- **Order of the featured projects:** Jobbliggaren, Yobber, KalasKoll.

## Screenshots

Source screenshots are not committed (the repository is public). They live in `.work/shots/`, which is git-ignored, and `scripts/showcases.mjs` says how each showcase is composed from them.

- Jobbliggaren: signed-in views from a local development stack with a fictional test account. Never from production, never the demo mode. `.work/capture-jbl/capture.cjs` retakes them once the stack is up.
- KalasKoll: `node scripts/capture/kalaskoll.mjs <dir>` crops existing screenshots and replaces the invitation's QR code.
- Yobber and the smaller projects: `node scripts/shoot-url.mjs <url> <out.png>` against their public pages.

## Checking a change

1. `npm run check`
2. `npm run preview && npm run shoot`, then look at `.work/review/` in dark and light, at 1440 and 375 wide.
3. Push the branch and open `README.md` on that branch on github.com. The profile page itself only renders `main`.
