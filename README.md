# Agentic Ontology Integration Leaderboard

A lean, data-driven leaderboard for comparing ontology matching, relation
extraction, and relation reasoning workflows.

Live site: <https://lamng3.github.io/benchmark_leaderboard/>

## Run locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>.

## Update results

Benchmark results live in [`data/leaderboard.json`](data/leaderboard.json).
The data schema and design decisions are documented in
[`docs/DESIGN.md`](docs/DESIGN.md).
The reader-facing evaluation method is published in
[`methodology.html`](methodology.html).

The project has no package dependencies or build step and can be served
directly by GitHub Pages.
