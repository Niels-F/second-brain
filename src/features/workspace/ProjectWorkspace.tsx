import { useProjects } from '../projects/hooks'

// Placeholder for now. Phase 2 turns this into the 2D mind map (React Flow).
export function ProjectWorkspace({
  projectId,
  onBack,
}: {
  projectId: string
  onBack: () => void
}) {
  const projects = useProjects()
  const project = projects.data?.find((p) => p.id === projectId)

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={onBack}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← All projects
        </button>
        <h1 className="mt-4 text-2xl font-semibold">{project?.name ?? 'Project'}</h1>
        <div className="mt-8 rounded-lg border border-dashed border-neutral-700 bg-neutral-900/50 p-10 text-center text-neutral-500">
          The 2D mind map for this project arrives in Phase 2.
        </div>
      </div>
    </main>
  )
}
