# Agentic Ontology Integration Leaderboard

## Purpose

This repository hosts a static, data-driven leaderboard for agentic ontology
integration workflows. It compares ontology matching (OM), relation extraction
(RE), and relation reasoning (RR) configurations across ontology pairs.

## Architecture

- `index.html`: semantic page structure and static copy.
- `methodology.html`: reader-facing benchmark methodology.
- `styles.css`: visual system and responsive behavior.
- `app.js`: data loading, filtering, ranking, and rendering.
- `data/leaderboard.json`: benchmark source of truth.
- `docs/`: design and methodology documentation.

The site intentionally has no build step or framework. Keep it deployable as
plain static files on GitHub Pages.

## Working rules

- Preserve the generic public task labels `TaskA`, `TaskB`, and `TaskC`.
- Put benchmark values in `data/`; do not hard-code result rows in JavaScript.
- Put design decisions and methodology changes in `docs/`.
- Never compare or aggregate rows from incompatible task protocols.
- Treat model and workflow as independent dimensions of every run.
- Use exact model/version identifiers when known; otherwise use `Not reported`.
- Keep protocol differences and caveats visible to readers.
- Treat ties as ties and preserve source-data order for equal scores.
- Use semantic HTML and maintain keyboard, screen-reader, reduced-motion, and
  narrow-screen support.
- Escape or render data through DOM text nodes; benchmark data is not trusted
  HTML.
- Avoid dependencies unless they solve a demonstrated need that native browser
  APIs cannot reasonably address.
- Keep URLs stable: task, ontology-pair, and model state belongs in the hash.

## Data changes

For routine benchmark updates:

1. Edit `data/leaderboard.json`.
2. Store metrics as numbers and presentation-only labels as strings.
3. Define every displayed metric in the task's `columns` array.
4. Set `rankBy` to a numeric metric present in every row.
5. Validate the JSON, JavaScript syntax, and all task/pair/model filters.

Do not invent missing experimental values. Mark unavailable values explicitly
or request the source result.
