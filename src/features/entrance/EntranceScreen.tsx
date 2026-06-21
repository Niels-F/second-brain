import { lazy, Suspense, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useCreateProject, useProjects } from '../projects/hooks'
import { ProjectCard } from './ProjectCard'

// Lazy-loaded so the heavy 3D libraries only download when you open the 3D view.
const Projects3D = lazy(() => import('./Projects3D'))

export function EntranceScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { signOut } = useAuth()
  const projects = useProjects()
  const createProject = useCreateProject()
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [view, setView] = useState<'list' | '3d'>('list')

  const items = projects.data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((p) => p.name.toLowerCase().includes(q))
  }, [items, search])

  // The list is ordered most-recently-opened first, so the first project that
  // has actually been opened is the one to "resume".
  const lastOpened = items.find((p) => p.last_opened_at)

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    createProject.mutate(name, { onSuccess: () => setNewName('') })
  }

  if (view === '3d') {
    return (
      <main className="relative h-screen w-full bg-neutral-950 text-neutral-100">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-sm backdrop-blur">
          <button
            onClick={() => setView('list')}
            className="text-neutral-300 hover:text-white"
          >
            ← List
          </button>
          <span className="text-neutral-500">
            {items.length} project{items.length === 1 ? '' : 's'} · drag to orbit · click an orb to open
          </span>
        </div>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center text-neutral-500">
              Loading 3D…
            </div>
          }
        >
          <Projects3D projects={items} onOpen={onOpen} />
        </Suspense>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
              Second Brain
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Your projects</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('3d')}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
            >
              🌐 3D view
            </button>
            <button
              onClick={signOut}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Fast lane: jump straight back to the last project you opened */}
        <button
          onClick={() => lastOpened && onOpen(lastOpened.id)}
          disabled={!lastOpened}
          className="mt-6 w-full rounded-lg border border-indigo-700 bg-indigo-950/40 px-4 py-3 text-left hover:bg-indigo-950/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-sm text-indigo-300">↩ Resume last project</span>
          <span className="mt-0.5 block font-medium">
            {lastOpened ? lastOpened.name : 'Open a project first'}
          </span>
        </button>

        {/* Create a new project */}
        <form onSubmit={handleCreate} className="mt-6 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New project name…"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={createProject.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {createProject.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="mt-4 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />

        {/* The list */}
        <div className="mt-4 space-y-2">
          {projects.isLoading && <p className="text-neutral-500">Loading projects…</p>}
          {projects.isError && (
            <p className="text-red-400">
              Couldn't load projects: {(projects.error as Error).message}
            </p>
          )}
          {!projects.isLoading && filtered.length === 0 && (
            <p className="text-neutral-500">
              {items.length === 0
                ? 'No projects yet — create your first one above.'
                : 'No matches.'}
            </p>
          )}
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </main>
  )
}
