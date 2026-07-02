import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setAiInstructions, setChatSummary } from '../chat/api'
import {
  getKeepRecent,
  setKeepRecent,
  getNumCtx,
  setNumCtx,
} from '../../lib/aiConfig'
import { getThink, setThink } from '../../lib/ollama'
import type { Project } from '../projects/types'

export function AiParamsPanel({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [instructions, setInstr] = useState(project.ai_instructions ?? '')
  const [summary, setSummary] = useState(project.chat_summary ?? '')
  const [keepRecent, setKeep] = useState(getKeepRecent())
  const [numCtx, setCtx] = useState(getNumCtx())
  const [think, setThinkState] = useState(getThink())
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      setKeepRecent(keepRecent)
      setNumCtx(numCtx)
      setThink(think)
      await setAiInstructions(project.id, instructions.trim())
      const s = summary.trim()
      await setChatSummary(project.id, s, s ? project.chat_summary_count : 0)
      qc.invalidateQueries({ queryKey: ['projects'] })
    } finally {
      setSaving(false)
      onClose()
    }
  }

  async function clearMemory() {
    setSummary('')
    await setChatSummary(project.id, '', 0)
    qc.invalidateQueries({ queryKey: ['projects'] })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-5 text-sm text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate font-semibold">AI parameters — {project.name}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            ✕
          </button>
        </div>

        <label className="block">
          <span className="text-xs text-neutral-500">
            Instructions for this project (how you want the partner to think)
          </span>
          <textarea
            value={instructions}
            onChange={(e) => setInstr(e.target.value)}
            rows={4}
            placeholder="e.g. I'm exploring reservoir computing — be rigorous, push back, prefer math over prose."
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 outline-none focus:border-indigo-500"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs text-neutral-500">
            Memory — rolling summary (editable; covers {project.chat_summary_count}{' '}
            messages)
          </span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            placeholder="(builds automatically as you chat)"
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 outline-none focus:border-indigo-500"
          />
          <button
            onClick={clearMemory}
            className="mt-1 text-xs text-neutral-500 hover:text-red-400"
          >
            Clear memory
          </button>
        </label>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-neutral-500">Verbatim window</span>
            <input
              type="number"
              min={2}
              max={50}
              value={keepRecent}
              onChange={(e) => setKeep(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-500">Context (num_ctx)</span>
            <input
              type="number"
              min={2048}
              step={1024}
              value={numCtx}
              onChange={(e) => setCtx(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-500">Default reply</span>
            <button
              onClick={() => setThinkState(!think)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 hover:bg-neutral-700"
            >
              {think ? '🧠 Think' : '⚡ Fast'}
            </button>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-neutral-400 hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
