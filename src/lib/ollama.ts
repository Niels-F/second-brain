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
    throw new Error(`Ollama ${res.status} (check the model name is pulled)`)
  }
  const data = await res.json()
  return data?.response ?? '(no response)'
}
