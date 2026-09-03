# Stack & setup

Chosen for: a web app, synced across devices, built by someone comfortable coding.

## Choices

| Layer | Pick | Why |
|---|---|---|
| Build / framework | **Vite + React + TypeScript** | Fast dev loop, types catch bugs early, huge ecosystem. |
| Styling | **Tailwind CSS** | Quick, consistent UI without context-switching to CSS files. |
| 2D mind map | **React Flow (`@xyflow/react`)** | Purpose-built for node/edge editors: dragging, panning, custom nodes. Saves weeks. |
| 3D entrance | **react-three-fiber + drei** | React wrapper over three.js. Only needed in Phase 5. |
| Client state | **Zustand** | Tiny, simple store for UI state (selected node, view mode). |
| Server state / cache | **TanStack Query** | Handles fetching, caching, and refetch-on-focus — pairs well with sync. |
| Backend + DB + auth + sync | **Supabase** | Postgres + Auth + Realtime + row-level security with almost no backend code. Relational DB fits our node/link model. |

Why Supabase over Firebase: our data is **relational** (nodes linked to nodes). Postgres models
that naturally and lets the DB enforce per-user isolation via row-level security. Firestore's
document model would fight the link structure.

## Phase 0 — setup commands

Run from inside the project folder:

```bash
# Scaffold Vite into the current folder
npm create vite@latest . -- --template react-ts
npm install

# Core deps
npm install @xyflow/react zustand @tanstack/react-query @supabase/supabase-js

# Styling (Tailwind v4 — Vite plugin, no PostCSS config or tailwind.config.js needed)
npm install -D tailwindcss @tailwindcss/vite

# 3D (only needed at Phase 5 — can install later)
# npm install three @react-three/fiber @react-three/drei
```

Then:

1. Create a free project at supabase.com; copy `.env.example` to `.env.local` and fill in
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase dashboard → Project Settings → API).
2. Run the schema from [DATA-MODEL.md](DATA-MODEL.md) in the Supabase SQL editor.
3. Enable email magic-link auth in the Supabase dashboard.
4. `npm run dev` and confirm the app boots.

## Suggested source layout (created when we start building)

```
src/
  lib/supabase.ts        # client + typed queries
  store/                 # zustand stores
  features/
    entrance/            # fast lane + (later) 3D space
    workspace/           # 2D mind map (React Flow)
    node-panel/          # side drawer with the next-action field
  components/            # shared UI
  App.tsx
```
