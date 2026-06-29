import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNodes } from '../nodes/hooks'
import { askAI, getProvider } from '../../lib/ai'
import { getGeminiKey, setGeminiKey } from '../../lib/gemini'

export function WhatsNextButton({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const nodesQ = useNodes(projectId)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (getProvider() === 'gemini' && !getGeminiKey()) {
      const k = window.prompt(
        'Google Gemini API key (free at aistudio.google.com; stored on this device only)',
      )
      if (!k || !k.trim()) return
      setGeminiKey(k.trim())
    }

    const nodes = nodesQ.data ?? []
    setOpen(true)
    setError(null)
    setResult('')

    if (nodes.length === 0) {
      setError('This project has no nodes yet — add a few first.')
      return
    }

    const lines = nodes
      .map((n) => {
        const bits = [`- ${n.title}`]
        if (n.status) bits.push(`[${n.status}]`)
        if (n.next_action) bits.push(`— next: ${n.next_action}`)
        if (n.content) bits.push(`— notes: ${n.content.slice(0, 200)}`)
        return bits.join(' ')
      })
      .join('\n')

    const prompt = `Project: ${projectName}\n\nNodes (tasks / ideas):\n${lines}\n\nWrite: (1) a 2-3 sentence status summary, then (2) the single most important next action to take. Be concrete and concise.`
    const system =
      'You are a focused project assistant helping the user reconnect with a project and decide what to do next. Use only the provided context.'

    setLoading(true)
    try {
      setResult(await askAI(prompt, system))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={run}
        className="rounded border border-indigo-700 bg-indigo-950/40 px-3 py-1 text-indigo-200 hover:bg-indigo-950/70"
      >
        ✨ What's next?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-100">
                ✨ {projectName} — what's next
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-500 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            {loading && <p className="text-neutral-400">Thinking…</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !error && (
              <div className="github-md text-sm text-neutral-200">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
