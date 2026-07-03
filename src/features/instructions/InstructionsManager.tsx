import { useState } from 'react'
import {
  useInstructions,
  useCreateInstruction,
  useUpdateInstruction,
  useDeleteInstruction,
} from './hooks'
import { InstructionEditor } from './InstructionEditor'
import type { InstructionDoc } from './types'

export function InstructionsManager({ projectId }: { projectId: string }) {
  const q = useInstructions(projectId)
  const create = useCreateInstruction(projectId)
  const update = useUpdateInstruction(projectId)
  const del = useDeleteInstruction(projectId)
  const [editing, setEditing] = useState<InstructionDoc | null>(null)

  const docs = q.data ?? []

  function addDoc() {
    const name = window.prompt('Name for this instruction doc', 'Instructions')?.trim()
    if (name) create.mutate(name)
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
      <button
        onClick={addDoc}
        className="mt-1 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
      >
        + Add doc
      </button>

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
