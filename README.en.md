# xaf · quality gates for long-form X Articles

[简体中文](README.md) | **English**

Pre-publish checks for long-form articles: structure, images, writing quality and compliance risks — one command.
Plus a **local figure generator**: no API, exact CJK text, batchable.

> Companion tool: [x-md-publisher](https://github.com/avabb0916/x-md-publisher) (Markdown → X Article drafts)
>
> ```bash
> xaf check article.md && xpub article.md
> ```
> They are **independent**: xaf decides whether to publish; xpub works without it.

## Why

When writing, people read for content and miss structure. Structure problems are the deadly ones:

- an extra `#` makes readers think the article ended
- tables and code fences get dropped on X
- “not X, but Y” repeated nine times reads like AI
- a wrong image path silently drops two figures

These are easy to miss by eye and trivial for a script.

## Install

```bash
git clone https://github.com/avabb0916/x-article-factory.git
cd x-article-factory
npm install
```

Requires Node.js ≥ 20 (Chrome only needed for figure generation).

## Usage

### Check

```bash
xaf check article.md
xaf check article.md --json
xaf check article.md --config my.json
```

Exit codes: `0` pass / `1` has errors / `2` execution failure — CI friendly.

### Figures

```bash
xaf figures figures.json --out ./images
```

Five built-in templates: `cover` (1600×640, 5:2), `steps`, `table`, `checklist`, `quote`.
Rendering is local HTML → Chrome screenshot, so CJK text is always correct and it costs nothing.

### Init

```bash
xaf init my-article
```

## Rules

17 rules across five groups: structure, platform limits, images, writing quality, compliance.
See [docs/RULES.md](docs/RULES.md).

## Real-world result

On an article that "looked fine", xaf found five issues a human missed:

| Issue | By eye | xaf |
|---|---|---|
| 11 third-level headings (will be downgraded) | missed | ✓ |
| only 1555 characters (thought 2400) | missed | ✓ |
| 3 images (guideline 5–9) | missed | ✓ |
| “not X, but Y” × 4 | missed | ✓ |
| 7-row table + 3 code fences | missed | ✓ |

## Develop

```bash
npm test        # node:test, 7 cases
```

## License

MIT
