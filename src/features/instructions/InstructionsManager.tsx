import { useState, type ChangeEvent } from 'react'
import {
  useInstructions,
  useCreateInstruction,
  useUpdateInstruction,
  useDeleteInstruction,
} from './hooks'
import { InstructionEditor } from './InstructionEditor'
import { fetchRepoFile } from '../../lib/github'
import type { InstructionDoc } from './types'
import type { Project } from '../projects/types'

export function InstructionsManager({ project }: { project: Project }) {
  const projectId = project.id
  const q = useInstructions(projectId)
  const create = useCreateInstruction(projectId)
  const update = useUpdateInstruction(projectId)
  const del = useDeleteInstruction(projectId)
  const [editing, setEditing] = useState<InstructionDoc | null>(null)

  const docs = q.data ?? []

  function addDoc() {
    const name = window.prompt('Name for this instruction doc', 'Instructions')?.trim()
    if (name) create.mutate({ name })
  }

  async function importMd(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    create.mutate({ name: file.name.replace(/\.[^.]+$/, ''), content: text })
  }

  async function importGithub() {
    if (!project.github_repo) {
      window.alert('Connect a GitHub repo to this project first (top bar).')
      return
    }
    const path = window.prompt('Repo file path (e.g. docs/context.md)')?.trim()
    if (!path) return
    try {
      const f = await fetchRepoFile(
        project.github_repo,
        project.github_branch ?? 'main',
        path,
      )
      create.mutate({
        name: path.split('/').pop() || 'GitHub doc',
        content: f.text ?? '',
      })
    } catch (err) {
      window.alert('Import failed: ' + (err as Error).message)
    }
  }

  return (
    <div className="mt-1 space-y-1">
      {docs.length === 0 && (
        <p className="text-[11px] text-neutral-600">
          No docs yet — add one the partner will always read.
        </p>
      )}
      {docs.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1"
        >
          <input
            type="checkbox"
            checked={d.active}
            onChange={() => update.mutate({ id: d.id, fields: { active: !d.active } })}
            title="Feed this doc to the partner"
          />
          <button
            onClick={() => setEditing(d)}
            className="min-w-0 flex-1 truncate text-left text-sm text-neutral-200 hover:text-white"
          >
            {d.name}
          </button>
          <button
            onClick={() => setEditing(d)}
            className="text-xs text-neutral-500 hover:text-neutral-200"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${d.name}"?`)) del.mutate(d.id)
            }}
            className="text-xs text-neutral-500 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      ))}

      <div className="mt-1 flex flex-wrap gap-2 text-xs">
        <button
          onClick={addDoc}
          className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
        >
          + Add doc
        </button>
        <label className="cursor-pointer rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800">
          Import .md
          <input
            type="file"
            accept=".md,.markdown,.txt,text/*"
            onChange={importMd}
            className="hidden"
          />
        </label>
        <button
          onClick={importGithub}
          className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-800"
        >
          From GitHub
        </button>
      </div>

      {editing && (
        <InstructionEditor
          doc={editing}
          projectId={projectId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
