# Plan — screens, flow, roadmap

## Screens & flow

```
┌─────────────────────────────────────────────────────────┐
│  ENTRANCE                                                 │
│  • Fast lane (default): project list + search +           │
│    "Resume last project" button                           │
│  • 3D space of all projects (optional, toggle / built last)│
└───────────────┬─────────────────────────────────────────┘
                │  pick a project
                ▼
┌─────────────────────────────────────────────────────────┐
│  PROJECT WORKSPACE (2D mind map)                          │
│  • Nodes grouped by category axis (tests / theory / …)    │
│  • Recency glow on recently-touched nodes                 │
│  • Portal nodes for cross-category links                  │
│  • "Resume" → camera flies to last-touched node           │
└───────────────┬─────────────────────────────────────────┘
                │  click a node
                ▼
┌─────────────────────────────────────────────────────────┐
│  NODE PANEL (side drawer, not a new screen)               │
│  • Title, notes/content                                   │
│  • "Next action / where I left off"  (the key field)      │
│  • Maturity slider, links list, last-touched timestamp    │
└─────────────────────────────────────────────────────────┘
```

Three views total: **Entrance**, **Workspace**, and a **Node panel** that slides over the
workspace. Deliberately small — fewer places to get lost.

## Build roadmap

Each phase is independently usable. Stop after any phase and you still have a working tool.

- **Phase 0 — Foundations.** Vite + React + TS project, Tailwind, Supabase project, auth
  (magic-link), database schema + row-level security. See [STACK.md](STACK.md).
- **Phase 1 — Projects + fast lane.** Create/rename/delete projects. Entrance list with search
  and **"jump to last project"** (uses `last_opened_at`). *This alone is already useful.*
- **Phase 2 — 2D mind map.** Render nodes per project with React Flow, grouped by category axis.
  Create/edit/move nodes. Node panel with notes + **next-action** field. Save positions.
- **Phase 3 — The reconnect loop.** `last_touched_at` on nodes → recency glow. **Resume** button
  (fly to last-touched node). One-click cold-start: open → resume → land on last node.
- **Phase 4 — Links + portals.** Create links between nodes; render cross-category links as
  colored portal nodes; bidirectional; preview far-side next-action; click to jump.
- **Phase 5 — 3D entrance.** react-three-fiber scene of all projects; click to enter. Fast lane
  stays. Pure polish — only after the core feels good in daily use.
- **Phase 6 — Sync hardening.** Multi-device testing, conflict handling, optional offline cache.

## Critical note on your choices (sync from day one)

You chose **sync across devices**, which means auth + a backend are required *before* you can see
the 2D map working — you can't defer them the way a local-only build could. That's fine, just be
aware Phase 0 is heavier than it would otherwise be.

The pragmatic path: build directly against **Supabase** from the start (its client is barely more
work than local storage, and it gives auth + sync + a relational DB out of the box). This avoids
building a throwaway local version and migrating later. Details in [STACK.md](STACK.md).
