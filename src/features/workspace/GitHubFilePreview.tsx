import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { fetchRepoFile } from '../../lib/github'
import { usePins } from '../pinboard/store'

export function GitHubFilePreview({
  repo,
  branch,
  path,
}: {
  repo: string
  branch: string
  path: string
}) {
  const addPin = usePins((s) => s.add)
  const q = useQuery({
    queryKey: ['ghfile', repo, branch, path],
    queryFn: () => fetchRepoFile(repo, branch, path),
  })

  if (q.isLoading) {
    return <p className="text-xs text-neutral-500">Loading {path}…</p>
  }
  if (q.isError) {
    return <p className="text-xs text-red-400">{(q.error as Error).message}</p>
  }

  const f = q.data!
  if (f.kind === 'image') {
    return (
      <div className="space-y-1">
        <img
          src={f.dataUrl}
          alt={f.name}
          className="max-h-60 w-full rounded object-contain"
        />
        {f.dataUrl && (
          <button
            onClick={() => addPin(f.dataUrl!)}
            className="text-xs text-neutral-400 hover:text-indigo-300"
          >
            📌 Pin to canvas
          </button>
        )}
      </div>
    )
  }
  if (f.kind === 'markdown') {
    return (
      <div className="github-md max-h-72 overflow-y-auto rounded border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300">
        <ReactMarkdown>{f.text ?? ''}</ReactMarkdown>
      </div>
    )
  }
  return (
    <pre className="max-h-72 overflow-auto rounded border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300">
      {f.text}
    </pre>
  )
}
