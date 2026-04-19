# CLAUDE.md

Instructions for AI agents contributing to this profile repository.

## Repository purpose

This is my GitHub profile repository (`klasolsson81/klasolsson81`). It renders as my GitHub profile landing page.

## Structure

```
klasolsson81/
├── README.md                        ← profile landing page
├── CLAUDE.md                        ← this file (agent conventions)
├── .github/workflows/
│   └── metrics.yml                  ← daily metrics generation
└── metrics.svg                      ← auto-generated, do not edit
```

## Editing rules

**Do not edit `metrics.svg` directly.** It is regenerated daily by the `Metrics` workflow via `lowlighter/metrics`. Edits will be overwritten on the next run.

**Preserve the visual structure of README.md.** The layout uses `<div align="center">`, `<table>`, `<picture>` and capsule-render/typing SVGs intentionally. Don't replace these with plain markdown unless explicitly asked.

**Tone in README prose**: short, declarative. No buzzwords ("passionate", "ninja", "guru"). No em-dash dramatic pauses. British/American spelling fine, stay consistent.

## Adding or updating a project

Project entries in the featured table follow this shape:

```html
### Project Name &nbsp;<img src="https://img.shields.io/badge/STATUS-COLOR?style=flat-square" />
<br/>
<p><strong>One-line summary</strong></p>
<p>Two-sentence description with technical specifics.</p>
<p>
<img src="https://img.shields.io/badge/Tech-COLOR?style=flat-square&logo=X&logoColor=white" />
...
</p>
```

Status badges:
- `IN_PROGRESS-FF9100` (orange) — active development
- `LIVE-00C853` (green) — in production
- `DELIVERED-00C853` (green) — completed engagement, handed off
- `ARCHIVED-808080` (gray) — dormant

Four projects maximum in the grid. If a fifth is added, remove the weakest.

## Metrics workflow

Runs `lowlighter/metrics@latest` with `isocalendar` + `languages` plugins. Requires repository secret `METRICS_TOKEN` — a classic PAT with `repo`, `read:org`, `read:user` scopes. Fine-grained tokens do not work (GraphQL unsupported by metrics).

If the workflow fails, check:
1. PAT expiration (classic PATs expire — set a calendar reminder).
2. `lowlighter/metrics` version changes (pin to a tag if upstream breaks).
3. Rate limits (don't trigger manually more than once per ~30 min).

## Stack for my main projects

Agent context when working on linked projects:
- **Backend**: .NET 8 + Clean Architecture, MediatR for CQRS, FluentValidation, Pipeline Behaviors
- **Frontend**: Next.js + TypeScript + Tailwind, Framer Motion for animation
- **Database**: PostgreSQL (via Supabase or self-hosted), SQL Server on .NET projects
- **Cloud**: Vercel for frontends, AWS for JobbPilot, Azure on some .NET deploys
- **AI**: OpenAI, Claude (via Anthropic SDK), multi-agent Claude Code workflows
- **Testing**: xUnit on .NET, Vitest + Playwright on TypeScript projects
