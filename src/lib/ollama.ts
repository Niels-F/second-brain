// Local AI via Ollama (http://localhost:11434). Works while you run the app
// locally; a deployed HTTPS site can't reach http-localhost (mixed content).
// Ollama must be started with browser access allowed (OLLAMA_ORIGINS).

const MODEL_KEY = 'sb_ollama_model'
const DEFAULT_MODEL = 'qwen2.5'

export function getOllamaModel(): string {
  return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL
}

export function setOllamaModel(m: string) {
  localStorage.setItem(MODEL_KEY, m)
}

export async function askOllama(prompt: string, system?: string): Promise<string> {
  let res: Response
  try {
    res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: getOllamaModel(),
        prompt,
        system,
        stream: false,
        // Ollama defaults to a tiny context (~4k); raise it so the partner can
        // hold real project memory. Bigger = more RAM + slower.
        options: { num_ctx: 8192 },
      }),
    })
  } catch {
    throw new Error(
      'Could not reach Ollama. Is it running, and started with OLLAMA_ORIGINS allowing this app?',
    )
  }
  if (!res.ok) {
    let msg = `Ollama ${res.status}`
    try {
      const e = await res.json()
      if (e?.error) msg += `: ${e.error}`
    } catch {
      /* ignore parse error */
    }
    throw new Error(msg)
  }
  const data = await res.json()
  return data?.response ?? '(no response)'
}

// Installed models (for the dropdown).
export async function listOllamaModels(): Promise<string[]> {
  const res = await fetch('http://localhost:11434/api/tags')
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  return ((data.models ?? []) as Array<{ name: string }>)
    .map((m) => m.name)
    .sort()
}

// Currently loaded models (status / "running in background").
export async function listRunningModels(): Promise<
  { name: string; sizeVram: number }[]
> {
  const res = await fetch('http://localhost:11434/api/ps')
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  return ((data.models ?? []) as Array<{ name: string; size_vram?: number; size?: number }>).map(
    (m) => ({ name: m.name, sizeVram: m.size_vram ?? m.size ?? 0 }),
  )
}

// Unload a model from RAM now (it reloads automatically on the next request).
export async function unloadOllamaModel(model: string): Promise<void> {
  await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, keep_alive: 0 }),
  })
}
