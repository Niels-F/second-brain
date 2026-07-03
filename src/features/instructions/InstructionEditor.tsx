import { useState } from 'react'
import { useUpdateInstruction } from './hooks'
import type { InstructionDoc } from './types'

// A page-sheet editor for one instruction doc (reuses the node-page look).
export function InstructionEditor({
  doc,
  projectId,
  onClose,
}: {
  doc: InstructionDoc
  projectId: string
  onClose: () => void
}) {
  const update = useUpdateInstruction(projectId)
  const [name, setName] = useState(doc.name)
  const [content, setContent] = useState(doc.content ?? '')
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await update.mutateAsync({
        id: doc.id,
        fields: { name: name.trim() || 'Instructions', content },
      })
    } finally {
      setBusy(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-6">
      <div className="page-open mt-8 flex w-full max-w-3xl flex-col rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-neutral-800 px-5 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm font-semibold text-neutral-100 outline-none focus:border-indigo-500"
          />
          <button
            onClick={save}
            disabled={busy}
            className="shrink-0 rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Done'}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
          placeholder="Instructions for the partner (markdown)…"
          className="min-h-[55vh] w-full resize-none rounded-b-xl bg-transparent px-5 py-4 text-[15px] leading-relaxed text-neutral-200 outline-none"
        />
      </div>
    </div>
  )
}
