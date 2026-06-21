# Data model

The model is small and relational — which is exactly why we use Postgres (via Supabase) rather
than a document store: links between nodes *are* relations.

## Entities

- **profile** — one per user (managed by Supabase Auth). Owns everything below.
- **project** — a thing you work on. Has a name, color, and `last_opened_at` (powers
  "jump to last project").
- **category** — an axis *within* a project (tests, theory, resume, …). Per-project and
  configurable, with a color used to tint its nodes.
- **node** — one idea/task in the mind map. Belongs to a project and a category. Holds the
  content, the **next-action** field, a **maturity** value (the position gradient), its 2D
  position, and `last_touched_at` (powers recency glow + Resume).
- **link** — an undirected connection between two nodes. When the two nodes are in different
  categories, the UI renders it as a **portal node** on both ends. Stored once; shown on both
  sides → bidirectional for free.

## How features map to fields

| Feature | Field(s) |
|---|---|
| Jump to last project | `project.last_opened_at` |
| Resume (fly to last node) | `node.last_touched_at` (max per project) |
| Recency glow | `node.last_touched_at` |
| Next action / where I left off | `node.next_action` |
| Maturity gradient (optional auto-layout) | `node.maturity` |
| Category axes + colors | `category.*` |
| Portal nodes (cross-category, bidirectional) | `link` where source/target categories differ |

## Schema (Postgres / Supabase)

```sql
-- Projects
create table if not exists project (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  color         text default '#6366f1',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_opened_at timestamptz
);

-- Category axes (per project)
create table if not exists category (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references project(id) on delete cascade,
  name        text not null,
  color       text default '#94a3b8',
  sort_order  int  not null default 0
);

-- Nodes
create table if not exists node (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references project(id) on delete cascade,
  category_id   uuid references category(id) on delete set null,
  title         text not null,
  content       text,                        -- notes / markdown
  next_action   text,                        -- "where I left off"
  maturity      real not null default 0,     -- 0 = rough, 1 = settled
  pos_x         real not null default 0,
  pos_y         real not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_touched_at timestamptz not null default now()
);

-- Links (undirected; rendered as portals when categories differ)
create table if not exists link (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references project(id) on delete cascade,
  source_node_id uuid not null references node(id) on delete cascade,
  target_node_id uuid not null references node(id) on delete cascade,
  label         text,
  created_at    timestamptz not null default now(),
  unique (source_node_id, target_node_id)
);

-- Row-level security: every user sees only their own data.
alter table project  enable row level security;
alter table category enable row level security;
alter table node     enable row level security;
alter table link     enable row level security;

drop policy if exists "own projects" on project;
create policy "own projects" on project
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- category / node / link inherit ownership through their project:
drop policy if exists "own categories" on category;
create policy "own categories" on category for all using (
  exists (select 1 from project p where p.id = category.project_id and p.user_id = auth.uid())
);
drop policy if exists "own nodes" on node;
create policy "own nodes" on node for all using (
  exists (select 1 from project p where p.id = node.project_id and p.user_id = auth.uid())
);
drop policy if exists "own links" on link;
create policy "own links" on link for all using (
  exists (select 1 from project p where p.id = link.project_id and p.user_id = auth.uid())
);
```

> Note on layout: React Flow needs explicit `pos_x` / `pos_y`, so we store them. `maturity` is
> kept separately so we can *optionally* offer an auto-layout that places nodes by category +
> maturity (distance from center) without losing manual positions.
