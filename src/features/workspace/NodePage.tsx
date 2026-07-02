import { useEffect, useState } from 'react'
import { useUpdateNode } from '../nodes/hooks'
import { askAI } from '../../lib/ai'
import type { MindNode } from '../nodes/types'

// Only re-summarize when the text changed meaningfully (>= ~5% length delta),
// so trivial edits don't trigger a slow AI call.
function changedEnough(oldText: string, newText: string, threshold = 0.05): boolean {
  const o = oldText.trim()
  const n = newText.trim()
  if (o === n) return false
  if (!o) return true
  return Math.abs(n.length - o.length) / o.length >= threshold
}

// A full "page" that opens as its own layer over the map. Write freely; on close
// the AI partner writes a short gist that shows on the node.
export function NodePage({
  node,
  projectId,
  onClose,
}: {
  node: MindNode
  projectId: string
  onClose: () => void
}) {
  const updateNode = useUpdateNode(projectId)
  const [content, setContent] = useState(node.content ?? '')
  const [busy, setBusy] = useState(false)

  const words = content.trim() ? content.trim().split(/\s+/).length : 0

  async function saveAndClose() {
    if (busy) return
    const old = node.content ?? ''
    if (content === old) {
      onClose()
      return
    }
    setBusy(true)
    try {
      let summary = node.summary ?? null
      if (!content.trim()) {
        summary = null
      } else if (changedEnough(old, content)) {
        // Best-effort gist — forced fast (/no_think) and never blocks saving.
        try {
          const s = await askAI(
            `Summarize this note into one or two plain sentences (the gist only, no preamble).\n\nTitle: ${node.title}\n\nNote:\n${content}`,
            'You write short, faithful summaries for a mind-map node.',
            { fast: true },
          )
          summary = s.trim()
        } catch {
          /* keep previous summary */
        }
      }
      // Always persist the text (small edits just skip re-summarizing).
      await updateNode.mutateAsync({ id: node.id, fields: { content, summary } })
    } finally {
      setBusy(false)
      onClose()
    }
  }

  // Esc closes (and saves). Rebinds with the latest content.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') saveAndClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-6">
      <div className="page-open mt-8 flex w-full max-w-3xl flex-col rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
          <h2 className="truncate font-semibold text-neutral-100">{node.title}</h2>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>{words} words</span>
            <button
              onClick={saveAndClose}
              disabled={busy}
              className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Done'}
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
          placeholder="Put your thoughts on paper…  (markdown supported)"
          className="min-h-[60vh] w-full resize-none rounded-b-xl bg-transparent px-6 py-5 text-[15px] leading-relaxed text-neutral-200 outline-none"
        />
      </div>
    </div>
  )
}
