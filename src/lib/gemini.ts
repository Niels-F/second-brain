// Minimal Google Gemini access. API key kept in localStorage (this device only;
// never sent to our backend). Move server-side when the app is deployed.

const KEY = 'sb_gemini_key'
const MODEL_KEY = 'sb_gemini_model'
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'

export const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
]

export function getGeminiModel(): string {
  return localStorage.getItem(MODEL_KEY) || DEFAULT_GEMINI_MODEL
}

export function setGeminiModel(m: string) {
  localStorage.setItem(MODEL_KEY, m)
}

export function getGeminiKey(): string | null {
  return localStorage.getItem(KEY)
}

export function setGeminiKey(k: string | null) {
  if (k) localStorage.setItem(KEY, k)
  else localStorage.removeItem(KEY)
}

export async function askGemini(prompt: string, system?: string): Promise<string> {
  const key = getGeminiKey()
  if (!key) throw new Error('No Gemini API key set')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent?key=${encodeURIComponent(
    key,
  )}`
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  }
  if (system) body.systemInstruction = { parts: [{ text: system }] }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let msg = `Gemini ${res.status}`
    try {
      const e = await res.json()
      msg = e?.error?.message ?? msg
    } catch {
      /* ignore parse error */
    }
    throw new Error(msg)
  }
  const data = await res.json()
  const parts: Array<{ text?: string }> =
    data?.candidates?.[0]?.content?.parts ?? []
  return parts.map((p) => p.text ?? '').join('') || '(no response)'
}
