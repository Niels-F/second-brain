import { useProjects } from '../projects/hooks'
import { MindMapCanvas } from './MindMapCanvas'

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
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center gap-4 border-b border-neutral-800 px-4 py-3">
        <button
          onClick={onBack}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← All projects
        </button>
        <h1 className="text-lg font-semibold">{project?.name ?? 'Project'}</h1>
      </header>
      <div className="min-h-0 flex-1">
        <MindMapCanvas projectId={projectId} />
      </div>
    </div>
  )
}
