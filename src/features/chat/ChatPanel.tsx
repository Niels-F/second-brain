import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { useMessages, useAddMessage } from './hooks'
import { useNodes } from '../nodes/hooks'
import { askAI, getProvider } from '../../lib/ai'
import { getGeminiKey, setGeminiKey } from '../../lib/gemini'
import type { Project } from '../projects/types'

export function ChatPanel({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const projectId = project.id
  const messagesQ = useMessages(projectId)
  const nodesQ = useNodes(projectId)
  const addMessage = useAddMessage(projectId)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = messagesQ.data ?? []

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length, thinking])

  // The project context re-fed to the partner every turn — this is its "memory".
  function projectContext(): string {
    const nodes = nodesQ.data ?? []
    const nodeLines =
      nodes
        .map((n) => {
          const bits = [`- ${n.title}`]
          if (n.status) bits.push(`[${n.status}]`)
          if (n.next_action) bits.push(`next: ${n.next_action}`)
          return bits.join(' ')
        })
        .join('\n') || '(no nodes yet)'
    const goal = project.description ? `Goal: ${project.description}\n` : ''
    return `Project: ${project.name}\n${goal}\nMap (nodes):\n${nodeLines}`
  }

  async function send() {
    const text = input.trim()
    if (!text || thinking) return

    if (getProvider() === 'gemini' && !getGeminiKey()) {
      const k = window.prompt('Gemini API key (or switch to local via AI ⚙)')
      if (!k || !k.trim()) return
      setGeminiKey(k.trim())
    }

    setInput('')
    setError(null)
    await addMessage.mutateAsync({ role: 'user', content: text })
    setThinking(true)

    const history = messages
      .slice(-20)
      .map((m) => `${m.role === 'user' ? 'User' : 'Partner'}: ${m.content}`)
      .join('\n')
    const system =
      "You are the user's ongoing reasoning partner for this project. You remember prior context and decisions from the conversation and the project map. Help them think and plan — recall where things stand, suggest next steps, ask sharp questions. Be concise and concrete. Don't dump large code; focus on reasoning."
    const prompt = `${projectContext()}\n\nConversation so far:\n${history}\nUser: ${text}\n\nPartner:`

    try {
      const reply = await askAI(prompt, system)
      await addMessage.mutateAsync({ role: 'assistant', content: reply })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setThinking(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send()
  }
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-l border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h2 className="truncate font-semibold text-neutral-100">
          💬 Partner — {project.name}
        </h2>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-200"
        >
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && (
          <p className="text-neutral-500">
            Ask me where we left off, or what to do next. I read this project's
            map and remember our past chats.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'text-neutral-200'
                : 'rounded-md bg-neutral-800/60 p-2 text-neutral-300'
            }
          >
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
              {m.role === 'user' ? 'You' : 'Partner'}
            </span>
            {m.role === 'assistant' ? (
              <div className="github-md">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
          </div>
        ))}
        {thinking && <p className="text-neutral-500">Thinking…</p>}
        {error && <p className="text-red-400">{error}</p>}
      </div>

      <form onSubmit={onSubmit} className="border-t border-neutral-800 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          placeholder="Where were we? / what's the next step?"
          className="w-full resize-none rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="mt-2 w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {thinking ? 'Thinking…' : 'Send'}
        </button>
      </form>
    </aside>
  )
}
