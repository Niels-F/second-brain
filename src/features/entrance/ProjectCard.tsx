import type { ChangeEvent } from 'react'
import {
  useDeleteProject,
  useRenameProject,
  useUpdateProject,
} from '../projects/hooks'
import { uploadProjectImage } from '../projects/api'
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
  const update = useUpdateProject()

  function handleRename() {
    const name = window.prompt('Rename project', project.name)?.trim()
    if (name && name !== project.name) rename.mutate({ id: project.id, name })
  }

  function handleDelete() {
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      del.mutate(project.id)
    }
  }

  function handleEmoji() {
    const e = window.prompt(
      'Paste an emoji for this project (leave blank to clear)',
      project.emoji ?? '',
    )
    if (e !== null) {
      update.mutate(
        { id: project.id, fields: { emoji: e.trim() || null } },
        { onError: (err) => window.alert('Save failed: ' + (err as Error).message) },
      )
    }
  }

  async function handleImage(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    try {
      const url = await uploadProjectImage(file)
      update.mutate(
        { id: project.id, fields: { image_url: url } },
        { onError: (e) => window.alert('Save failed: ' + (e as Error).message) },
      )
    } catch (err) {
      window.alert('Upload failed: ' + (err as Error).message)
    }
  }

  function handleClearIcon() {
    update.mutate(
      { id: project.id, fields: { image_url: null, emoji: null } },
      { onError: (e) => window.alert('Save failed: ' + (e as Error).message) },
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
      {project.image_url ? (
        <img
          src={project.image_url}
          alt=""
          className="h-9 w-9 shrink-0 rounded object-cover"
        />
      ) : project.emoji ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl">
          {project.emoji}
        </span>
      ) : (
        <span
          className="h-9 w-9 shrink-0 rounded-full"
          style={{ background: project.color ?? '#6366f1' }}
        />
      )}

      <button
        onClick={() => onOpen(project.id)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate font-medium">{project.name}</span>
        <span className="block text-xs text-neutral-500">
          {formatOpened(project.last_opened_at)}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1 text-xs text-neutral-400">
        <button
          onClick={handleEmoji}
          className="rounded px-2 py-1 hover:bg-neutral-800 hover:text-neutral-200"
        >
          Emoji
        </button>
        <label className="cursor-pointer rounded px-2 py-1 hover:bg-neutral-800 hover:text-neutral-200">
          Image
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />
        </label>
        {(project.image_url || project.emoji) && (
          <button
            onClick={handleClearIcon}
            className="rounded px-2 py-1 hover:bg-neutral-800 hover:text-neutral-200"
          >
            Clear icon
          </button>
        )}
        <button
          onClick={handleRename}
          className="rounded px-2 py-1 hover:bg-neutral-800 hover:text-neutral-200"
        >
          Rename
        </button>
        <button
          onClick={handleDelete}
          className="rounded px-2 py-1 hover:bg-neutral-800 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
