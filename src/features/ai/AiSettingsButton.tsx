import { getProvider, setProvider } from '../../lib/ai'
import { getOllamaModel, setOllamaModel } from '../../lib/ollama'
import { getGeminiKey, setGeminiKey } from '../../lib/gemini'

export function AiSettingsButton() {
  function configure() {
    const choice = window
      .prompt("AI provider — type 'ollama' (local) or 'gemini' (cloud)", getProvider())
      ?.trim()
      .toLowerCase()
    if (!choice) return

    if (choice === 'ollama') {
      setProvider('ollama')
      const m = window.prompt(
        'Local model (e.g. qwen2.5, qwen2.5-coder:7b, llama3.1:70b)',
        getOllamaModel(),
      )
      if (m && m.trim()) setOllamaModel(m.trim())
    } else {
      setProvider('gemini')
      const k = window.prompt(
        'Gemini API key (leave blank to keep current)',
        getGeminiKey() ?? '',
      )
      if (k && k.trim()) setGeminiKey(k.trim())
    }
  }

  return (
    <button
      onClick={configure}
      title="Choose AI provider — local Ollama or cloud Gemini"
      className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-400 hover:bg-neutral-900"
    >
      AI ⚙
    </button>
  )
}
