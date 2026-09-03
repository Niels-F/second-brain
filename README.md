# Second Brain

A personal tool for juggling multiple projects and **reconnecting to each one fast** — picking
up exactly where you left off, even weeks later.

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

## AI-assisted reconnect

The app is paired with an LLM that has read access to a project's nodes, used two ways:

- **"What's next?"** — reads all of a project's nodes (titles, status, next-action, notes) and
  returns a short status summary plus the single most important next action, so re-entering a
  project takes one click instead of re-reading everything yourself.
- **Chat with memory** — a per-project chat that keeps recent messages verbatim and folds older
  ones into a rolling summary (so context doesn't grow unbounded), plus optional **semantic
  recall**: older messages can be backfilled with embeddings and pulled back in by similarity
  when relevant.

**Local-first, cloud-optional.** The default provider is a **local LLM via [Ollama](https://ollama.com/)**
(Qwen 2.5 by default, with a "thinking" toggle for deeper-vs-faster replies, adjustable context
window, and one-click model unload to free RAM) — nothing leaves the machine. Google Gemini is
available as an alternate cloud provider if you supply your own API key (stored in
`localStorage` only). Semantic recall uses Ollama's `mxbai-embed-large` for local embeddings and
degrades gracefully (skips retrieval) if Ollama isn't running.

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

## Docs in this folder

- [PLAN.md](PLAN.md) — screens, flow, and the phased build roadmap.
- [DATA-MODEL.md](DATA-MODEL.md) — entities, fields, and the Postgres/Supabase schema.
- [STACK.md](STACK.md) — tech choices, why, and Phase-0 setup commands.
