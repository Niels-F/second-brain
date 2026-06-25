// Minimal GitHub read access using a personal access token kept in localStorage
// (stays on this device; never sent to our backend). Good enough for a personal
// tool; move server-side when the app is deployed.

const TOKEN_KEY = 'sb_github_token'

export function getGithubToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setGithubToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export type RepoFile = {
  name: string
  kind: 'markdown' | 'image' | 'text'
  text?: string
  dataUrl?: string
}

function base64ToText(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// repo = "owner/name"
export async function fetchRepoFile(
  repo: string,
  branch: string,
  path: string,
): Promise<RepoFile> {
  const token = getGithubToken()
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(
    branch || 'main',
  )}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const hint = res.status === 404 ? ' (file/repo not found, or token lacks access)' : ''
    throw new Error(`GitHub ${res.status}${hint}`)
  }
  const data = await res.json()
  if (Array.isArray(data)) throw new Error('That path is a folder, not a file')

  const name: string = data.name ?? path
  const b64: string = data.content ?? ''
  const lower = name.toLowerCase()

  if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower)) {
    const ext = lower.endsWith('.svg') ? 'svg+xml' : lower.split('.').pop()
    return {
      name,
      kind: 'image',
      dataUrl: `data:image/${ext};base64,${b64.replace(/\n/g, '')}`,
    }
  }

  const text = b64 ? base64ToText(b64) : ''
  return { name, kind: lower.endsWith('.md') ? 'markdown' : 'text', text }
}

// All file paths in the repo (for the file picker / autocomplete).
export async function listRepoFiles(
  repo: string,
  branch: string,
): Promise<string[]> {
  const token = getGithubToken()
  const url = `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(
    branch || 'main',
  )}?recursive=1`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = await res.json()
  const tree: Array<{ path: string; type: string }> = data.tree ?? []
  return tree
    .filter((t) => t.type === 'blob')
    .map((t) => t.path)
    .sort()
}
