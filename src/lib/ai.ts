import { askGemini } from './gemini'
import { askOllama } from './ollama'

export type AiProvider = 'gemini' | 'ollama'
const PROVIDER_KEY = 'sb_ai_provider'

export function getProvider(): AiProvider {
  return localStorage.getItem(PROVIDER_KEY) === 'ollama' ? 'ollama' : 'gemini'
}

export function setProvider(p: AiProvider) {
  localStorage.setItem(PROVIDER_KEY, p)
}

// Single entry point — routes to local Ollama or cloud Gemini.
export function askAI(prompt: string, system?: string): Promise<string> {
  return getProvider() === 'ollama'
    ? askOllama(prompt, system)
    : askGemini(prompt, system)
}
