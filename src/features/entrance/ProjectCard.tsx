import { useDeleteProject, useRenameProject } from '../projects/hooks'
import type { Project } from '../projects/types'

function formatOpened(iso: string | null) {
  if (!iso) return 'Never opened'
  return 'Last opened ' + new Date(iso).toLocaleString()
}

export function ProjectCard({
  project,
  onOpen,
}: {
  project: Project
  onOpen: (id: string) => void
}) {
  const rename = useRenameProject()
  const del = useDeleteProject()

  // Simple browser dialogs for now — we'll replace these with nicer inline UI later.
  function handleRename() {
    const name = window.prompt('Rename project', project.name)?.trim()
    if (name && name !== project.name) rename.mutate({ id: project.id, name })
  }

  function handleDelete() {
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      del.mutate(project.id)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
      <button onClick={() => onOpen(project.id)} className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium">{project.name}</span>
        <span className="block text-xs text-neutral-500">
          {formatOpened(project.last_opened_at)}
        </span>
      </button>
      <div className="ml-3 flex shrink-0 gap-1">
        <button
          onClick={handleRename}
          className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
        >
          Rename
        </button>
        <button
          onClick={handleDelete}
          className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
