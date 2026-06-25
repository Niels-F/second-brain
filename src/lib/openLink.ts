// Opens a node's link. An absolute file path (starts with "/") is opened in
// VS Code via its vscode:// URL scheme; anything else opens as a normal URL
// (https links in a new tab, vscode:// links handed to VS Code).
export function openExternalLink(raw: string) {
  let url = raw.trim()
  if (!url) return
  if (url.startsWith('/')) url = 'vscode://file' + url

  const a = document.createElement('a')
  a.href = url
  if (/^https?:/i.test(url)) {
    a.target = '_blank'
    a.rel = 'noopener'
  }
  a.click()
}
