# Leaderboard design

## Product direction

The leaderboard presents agentic ontology integration as a workflow evaluation
problem. It takes interaction cues from the CQ4OE benchmark—task tabs, compact
filters, grouped configurations, and dense result tables—while using an
independent visual identity and information architecture.

The experience should feel:

- **Credible:** restrained color, explicit protocols, and no decorative scores.
- **Fast:** static files, no framework, and one small JSON request.
- **Explorable:** every task and ontology pair is directly linkable in the URL.
- **Attributable:** model capability and workflow lift remain separate.

## Information architecture

1. **Hero:** explains the benchmark and exposes its current scale.
2. **Dashboard views:** Results, Models, and Workflows reuse the same filters.
3. **Compact filter bar:** task, model, ontology pair, and text search.
4. **Results:** ranks on the primary metric and expands secondary metrics only
   when requested.
5. **Models / Workflows:** condenses repeated rows into coverage cards within
   the selected task and protocol.
6. **Methodology:** explains the evaluation unit and fair-comparison rules.

## Task mapping

| Public label | Source experiment | Ranking metric |
| --- | --- | --- |
| TaskA | Interleaved OM ↔ RR on ENVO–SWEET | Pass@1 |
| TaskB | OM–RE component interaction on OSKGC | F1 |
| TaskC | OM–RE workflow ordering on OSKGC | F1 |

Task names intentionally remain generic so experiment names can evolve without
changing navigation. The task card supplies the meaningful experiment title.

## Visual system

- **Dark forest green:** research credibility and strong table hierarchy.
- **Lime:** active graph nodes and benchmark accents.
- **Orange:** ontology-pair selection, distinct from task selection.
- **Manrope + DM Mono:** readable prose paired with technical metadata.
- **Orbit motif:** a lightweight representation of agents and ontology nodes.

The primary table stays narrow at every task: rank, model, workflow, ontology
pair, primary score, and a details action. Secondary metrics appear in an
expandable row. Motion is minimal and disabled when `prefers-reduced-motion`
is set.

## Data model

`data/leaderboard.json` is the source of truth. Each task defines:

- a benchmark-level model catalog for tracked evaluation candidates;
- stable ID, display labels, description, protocol, and footnote;
- a `defaultModel` fallback for legacy results without model identity;
- `rankBy`, used for descending ranking;
- ordered column definitions with display types;
- rows containing the supplied benchmark values.

The renderer derives filter options and summary counts from the data. It gives
equal scores equal ranks and preserves source order for ties.

A complete run should identify both `model` and `workflow`. They are independent
experimental dimensions: model captures underlying LLM capability, while
workflow captures orchestration, ordering, iteration, and feedback. Current
source results omit model identity and therefore display `Not reported`.
Tracked models without scored rows remain selectable and display
`Awaiting runs`; this is coverage metadata, not a benchmark result.

## Updating the benchmark

1. Edit only `data/leaderboard.json` for routine result additions.
2. Keep numeric metrics as numbers, not formatted strings.
3. Add a column definition before adding a new metric to rows.
4. State protocol differences in the task note.
5. Add the exact model and version to each new row.
6. Validate JSON and inspect each task, pair, and model at desktop and mobile widths.

Do not compare rows across tasks: their protocols and primary metrics differ.
