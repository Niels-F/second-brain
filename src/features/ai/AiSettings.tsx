import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProvider, setProvider, type AiProvider } from '../../lib/ai'
import {
  getOllamaModel,
  setOllamaModel,
  listOllamaModels,
  listRunningModels,
  unloadOllamaModel,
} from '../../lib/ollama'
import {
  getGeminiKey,
  setGeminiKey,
  getGeminiModel,
  setGeminiModel,
  GEMINI_MODELS,
} from '../../lib/gemini'

export function AiSettings() {
  const [open, setOpen] = useState(false)
  const [provider, setProv] = useState<AiProvider>(getProvider())
  const [ollamaModel, setOllamaM] = useState(getOllamaModel())
  const [geminiModel, setGeminiM] = useState(getGeminiModel())
  const [geminiKey, setKeyState] = useState(getGeminiKey() ?? '')
  const [unloading, setUnloading] = useState(false)

  const tagsQ = useQuery({
    queryKey: ['ollama-tags'],
    queryFn: listOllamaModels,
    enabled: open && provider === 'ollama',
  })
  // Poll status whenever the local provider is selected, even with the panel
  // closed, so the header dot stays live.
  const psQ = useQuery({
    queryKey: ['ollama-ps'],
    queryFn: listRunningModels,
    enabled: provider === 'ollama',
    refetchInterval: 4000,
  })

  function save() {
    setProvider(provider)
    setOllamaModel(ollamaModel)
    setGeminiModel(geminiModel)
    if (geminiKey.trim()) setGeminiKey(geminiKey.trim())
    setOpen(false)
  }

  // Close without saving — reset local edits back to what's persisted.
  function close() {
    setProv(getProvider())
    setOllamaM(getOllamaModel())
    setGeminiM(getGeminiModel())
    setKeyState(getGeminiKey() ?? '')
    setOpen(false)
  }

  async function unloadAll() {
    setUnloading(true)
    try {
      await Promise.all((psQ.data ?? []).map((m) => unloadOllamaModel(m.name)))
      await psQ.refetch()
    } finally {
      setUnloading(false)
    }
  }

  const running = psQ.data ?? []
  const loaded = running.some((m) => m.name === ollamaModel)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={
          provider === 'ollama'
            ? loaded
              ? 'Local model loaded & running'
              : 'Local model idle (loads on first message)'
            : 'Cloud (Gemini)'
        }
        className="flex items-center gap-1.5 rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-400 hover:bg-neutral-900"
      >
        <span
          className={
            'inline-block h-2 w-2 rounded-full ' +
            (provider === 'ollama'
              ? loaded
                ? 'bg-emerald-400'
                : 'bg-neutral-600'
              : 'bg-indigo-400')
          }
        />
        AI ⚙
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-5 text-sm text-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">AI settings</h2>
              <button
                onClick={close}
                className="text-neutral-500 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              {(['ollama', 'gemini'] as AiProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProv(p)}
                  className={
                    'flex-1 rounded-md border px-3 py-1.5 ' +
                    (provider === p
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                      : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800')
                  }
                >
                  {p === 'ollama' ? 'Local (Ollama)' : 'Cloud (Gemini)'}
                </button>
              ))}
            </div>

            {provider === 'ollama' ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs text-neutral-500">Model</span>
                  <select
                    value={ollamaModel}
                    onChange={(e) => setOllamaM(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5"
                  >
                    {(tagsQ.data ?? [ollamaModel]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {tagsQ.isLoading && (
                    <span className="text-[11px] text-neutral-600">Loading models…</span>
                  )}
                  {tagsQ.isError && (
                    <span className="text-[11px] text-red-400">Can't reach Ollama</span>
                  )}
                </label>

                <div className="rounded-md border border-neutral-800 bg-neutral-950 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        'inline-block h-2 w-2 rounded-full ' +
                        (loaded ? 'bg-emerald-400' : 'bg-neutral-600')
                      }
                    />
                    <span className="text-xs">
                      {loaded
                        ? 'Loaded & ready (in RAM)'
                        : 'Idle — loads on first message (a few seconds)'}
                    </span>
                  </div>
                  {running.length > 0 && (
                    <p className="mt-1 text-[11px] text-neutral-500">
                      In memory:{' '}
                      {running
                        .map((m) => `${m.name} (${(m.sizeVram / 1e9).toFixed(1)} GB)`)
                        .join(', ')}
                    </p>
                  )}
                  <button
                    onClick={unloadAll}
                    disabled={unloading || running.length === 0}
                    className="mt-2 rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800 disabled:opacity-40"
                  >
                    {unloading ? 'Unloading…' : 'Unload model (free RAM)'}
                  </button>
                  <p className="mt-2 text-[11px] text-neutral-600">
                    Unloading frees RAM now; the model reloads automatically next time
                    you chat. To stop the Ollama server entirely, run{' '}
                    <code>brew services stop ollama</code> in a terminal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs text-neutral-500">Model</span>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiM(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5"
                  >
                    {GEMINI_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500">API key</span>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setKeyState(e.target.value)}
                    placeholder="AIza…"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5"
                  />
                </label>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={close}
                className="rounded-md px-3 py-1.5 text-neutral-400 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-md bg-indigo-600 px-4 py-1.5 font-medium text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
