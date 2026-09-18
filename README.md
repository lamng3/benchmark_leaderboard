# Agentic Ontology Integration Leaderboard

A lean, data-driven leaderboard for comparing ontology matching, relation
extraction, and relation reasoning workflows.

## Run locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>.

## Update results

Benchmark results live in [`data/leaderboard.json`](data/leaderboard.json).
The data schema and design decisions are documented in
[`docs/DESIGN.md`](docs/DESIGN.md).

The project has no package dependencies or build step and can be served
directly by GitHub Pages.
