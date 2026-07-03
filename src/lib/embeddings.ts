// Local text embeddings via Ollama's mxbai-embed-large (1024-dim). Best-effort:
// returns null if Ollama/the model isn't available, so retrieval degrades gracefully.
export async function embed(text: string): Promise<number[] | null> {
  try {
    const res = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mxbai-embed-large', input: text }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const v = data?.embeddings?.[0]
    return Array.isArray(v) ? (v as number[]) : null
  } catch {
    return null
  }
}
