# Engram — a second brain with a local-LLM partner that remembers

> *engram* (n.) — the physical trace a memory leaves behind.

A personal tool for juggling multiple projects and **reconnecting to each one fast** — picking
up exactly where you left off, even weeks later. Its core is a **project-aware reasoning partner
running on a local LLM**, built around a three-tier memory system so the conversation stays
useful across weeks without blowing up the context window.

## North star

> Every feature must make "pick up where I left off" faster. Not visual flair — *reconnection speed*.

Any feature that doesn't serve this is decoration, and gets cut or deferred.

## The product in one paragraph

A web app. The front door is a 3D space where all your projects float (pure delight — built
last). Pick a project and you drop into its **2D mind map**, organized along category axes you
define (tests, theory, resume, …). Each node holds your working notes and, crucially, a
**"next action / where I left off"** field. Recently-touched nodes glow. Links across categories
appear as differently-colored **portal nodes**. One **Resume** button flies you to the last
thing you were doing.

## The one-click reconnect (the whole point)

```
Open app  →  "Resume last project"  →  lands in its 2D map  →  parked on the last node you
touched, with its "next action" already showing.
```

Closed app to "oh right, *this* is what I was doing" in a single click.

---

# The AI layer

The partner's job is not to write code — it's to answer *"where were we, and what's next?"*
That constraint drove every design decision below: the model needs **long-horizon recall of a
specific project**, cheaply, on consumer hardware, with no data leaving the machine.

## Three-tier memory

A naive chat app re-sends the whole history every turn and dies at the context limit. This one
splits history into three tiers, assembled fresh on every message:

| Tier | What it holds | How it's built |
|---|---|---|
| **Verbatim window** | The last *N* messages (configurable, default 10) | Sent raw — recent turns need full fidelity |
| **Rolling summary** | Everything older, compressed | The LLM summarizes its own history in the background; a watermark (`chat_summary_count`) records how many messages the summary already covers, so folding resumes exactly where it stopped and never double-counts |
| **Semantic recall** | The 4 most relevant *old* messages for this specific question | The question is embedded locally and matched against message embeddings via a pgvector similarity RPC in Postgres, then de-duplicated against anything already in the verbatim window |

Compaction runs **in the background, forced into fast mode**, so maintaining memory never slows
down a reply, and a ref guard prevents overlapping compaction runs from racing each other.

Each turn's prompt is assembled as:

```
project context  (name, goal, active instruction docs, node map w/ status + next-action)
      ↓
rolling summary  ("Memory — summary of earlier conversation")
      ↓
semantic recall  ("Relevant earlier messages")
      ↓
verbatim window  (last N turns)
      ↓
the user's message
```

### Recall is auditable

When the partner answers using recalled messages, the reply carries a
**"🔎 recalled N earlier messages"** disclosure that expands to show exactly which past
exchanges were pulled in. Retrieval is a common source of silent wrongness, so what the model
retrieved is inspectable rather than hidden — the recalled set is persisted on the message row,
not just computed at render time.

## Instruction docs (CLAUDE.md-style)

Per-project, named markdown documents that are **always** prepended to the partner's context —
the place to put "how to think about this project" (conventions, theory background, what to
avoid). Each doc has an **active toggle**, so context can be composed per session rather than
being all-or-nothing, and docs can be created inline, imported from a local `.md` file, or
**pulled directly from a connected GitHub repo** by path.

## Local-first, cloud-optional

One `askAI()` entry point sits in front of two providers, so the rest of the app never knows
which is in use:

- **Local (default): [Ollama](https://ollama.com/)** — Qwen 2.5 by default, nothing leaves the
  machine.
- **Cloud (optional): Google Gemini** — requires your own API key.

Local embeddings use **`mxbai-embed-large` (1024-dim)** through Ollama, so semantic recall is
local too.

## Runtime control over the local model

Rather than treating the LLM as a black box, the UI exposes the knobs that actually matter:

- **🧠 Think / ⚡ Fast** — toggles Qwen's chain-of-thought via Ollama's `think` parameter for
  deeper-but-slower vs. quick replies. (The `/no_think` prompt token is *not* honored through
  the API — it has to be the request parameter.) Individual calls can force fast mode
  regardless of the global setting; background summarization always does.
- **Context window (`num_ctx`)** — Ollama silently defaults to a ~4k context, which quietly
  truncates exactly the memory this app depends on; it's raised and made configurable.
- **Live model status** — the header dot polls Ollama's `/api/ps` to show whether the model is
  loaded in RAM or idle, with installed models discovered from `/api/tags`.
- **Unload model (free RAM)** — sends `keep_alive: 0` to evict a multi-GB model from memory on
  demand; it reloads automatically on the next message.
- **Backfill embeddings** — a progress-tracked pass that embeds pre-existing messages, so
  semantic recall works retroactively on history created before the feature existed.

## Degrading gracefully

Every AI path is best-effort, because a local model that isn't running should never break the
notes app wrapped around it:

- Embeddings return `null` if Ollama is unreachable → retrieval is skipped, chat still works.
- Models that reject the `think` parameter are retried once without it.
- A failed summary compaction is simply retried on the next turn.
- Ollama connection failures surface an actionable message (`OLLAMA_ORIGINS` not set) rather
  than a raw fetch error.

## Known limitations

- The Gemini key lives in `localStorage` (device-only, never sent to the app's backend). That's
  fine for local use but **should move server-side before any real deployment**.
- A deployed HTTPS site can't reach `http://localhost:11434` (mixed content), so the local
  provider is for running the app locally — the cloud provider covers the hosted case.

---

## Core design decisions (settled during brainstorm)

- **2D is home.** Daily work happens in the 2D mind map. It's the real product.
- **3D is cosmetic.** The 3D project space is for delight at the entrance only — built **last**,
  timeboxed. Nothing in the core depends on it.
- **Always a fast lane.** A boring project list + **"jump to last project"** sits next to the 3D
  entrance, so the flythrough is enjoyed by choice, never a toll on every launch.
- **Cross-category links = portal nodes.** Shown inside the 2D map in a distinct color; they
  preview the far side's label + next-action, are clickable to jump, and are **bidirectional**
  (a link shows on both ends, so connections don't rot).
- **Recency is a glow layer**, not an axis. Maturity (rough → settled) is the one meaningful
  position gradient.
- **Build order:** ship the 2D core first, use it on a real project, *then* add the 3D entrance.

## Stack

React 19 + TypeScript + Vite + Tailwind. **React Flow** (`@xyflow/react`) for the 2D mind map,
**react-three-fiber / drei** for the 3D entrance, TanStack Query for server state, Zustand for
local UI state. **Supabase** (Postgres + `pgvector` + auth) for persistence — semantic recall is
a `vector(1024)` column queried by cosine distance through a `match_messages` SQL function.
Inference via Ollama (local) or Gemini (cloud).

## Docs in this folder

- [PLAN.md](PLAN.md) — screens, flow, and the phased build roadmap.
- [DATA-MODEL.md](DATA-MODEL.md) — entities, fields, and the Postgres/Supabase schema.
- [STACK.md](STACK.md) — tech choices, why, and Phase-0 setup commands.
