# CLAUDE.md

Conventions agents should follow when contributing to this profile repository.

## Repository purpose

This is my GitHub profile repository (`klasolsson81/klasolsson81`). It contains:
- `README.md` — the profile landing page
- `.github/workflows/metrics.yml` — daily metrics generation via `lowlighter/metrics`
- `metrics.svg` — auto-generated, committed by the workflow (do not hand-edit)

## Editing rules

**Do not edit `metrics.svg` directly.** It is regenerated daily by the workflow on push to `main`, on schedule, and on manual dispatch.

**Do not regress to template patterns.** This README was rewritten in April 2026 from a widget-heavy template (typing SVG, streak stats, trophy cabinet, gradient waves) to a simonw-terse senior-dev format. Do not reintroduce:
- `readme-typing-svg`, `capsule-render`, `github-profile-trophy`
- Skill-icon walls, visitor counters, streak cards
- "Currently learning" performance lists, em-dash tricolons, "not just X, but Y" phrasing
- `<br/>` spacing for visual breathing room (use blank lines in markdown)

**Tone**: short declarative sentences. No em-dashes as dramatic pauses. No emojis. No buzzwords ("passionate", "ninja", "guru", "10x"). British/American spelling is fine, stay consistent per section.

**Project entries** follow this shape exactly:
```
**[Name](link)** — One-line description. Technical specifics separated by periods. Stack. Status in italics.
```

## When updating project list

- Lead with active work, then shipped, then delivered/archived.
- "In progress" for active builds, "Live" for production, "Delivered" for completed engagements, "Archived" for dormant.
- Four projects maximum. If a fifth is added, remove the weakest.

## Links

All external links use the full URL (`https://klasolsson.se`, not `klasolsson.se`) in markdown link targets. Display text can be shorter.

## Metrics workflow

Runs `lowlighter/metrics@latest` with plugins: `isocalendar` (full-year), `languages` (indepth, bytes-size), `habits` (facts + charts), `notable`. Requires `METRICS_TOKEN` secret — a classic PAT with `repo` scope. Fine-grained tokens do not work (GraphQL unsupported by metrics).

If the workflow fails, check:
1. PAT expiration (classic PATs expire).
2. Rate limits on the metrics Action.
3. `lowlighter/metrics` version changes — pin to a specific tag if upstream breaks.
