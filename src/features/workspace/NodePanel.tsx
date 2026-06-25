import { useEffect, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { MindNode, NodeStatus } from '../nodes/types'
import type { Category } from '../categories/types'
import { uploadNodeImage } from '../nodes/api'
import { openExternalLink } from '../../lib/openLink'
import { useDeleteNode, useUpdateNode } from '../nodes/hooks'
import { useProjects } from '../projects/hooks'
import { GitHubFilePreview } from './GitHubFilePreview'
import { listRepoFiles } from '../../lib/github'

export function NodePanel({
  node,
  categories,
  projectId,
  onClose,
}: {
  node: MindNode
  categories: Category[]
  projectId: string
  onClose: () => void
}) {
  const updateNode = useUpdateNode(projectId)
  const deleteNode = useDeleteNode(projectId)
  const projects = useProjects()
  const project = projects.data?.find((p) => p.id === projectId)
  const filesQ = useQuery({
    queryKey: ['ghtree', project?.github_repo, project?.github_branch],
    queryFn: () =>
      listRepoFiles(project!.github_repo!, project!.github_branch ?? 'main'),
    enabled: !!project?.github_repo,
  })

  const [title, setTitle] = useState(node.title)
  const [content, setContent] = useState(node.content ?? '')
  const [nextAction, setNextAction] = useState(node.next_action ?? '')
  const [maturity, setMaturity] = useState(node.maturity)
  const [imageUrl, setImageUrl] = useState<string | null>(node.image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<NodeStatus>(node.status)
  const [link, setLink] = useState(node.link ?? '')
  const [githubPath, setGithubPath] = useState(node.github_path ?? '')

  // When a different node is selected, refill the form with its values.
  useEffect(() => {
    setTitle(node.title)
    setContent(node.content ?? '')
    setNextAction(node.next_action ?? '')
    setMaturity(node.maturity)
    setImageUrl(node.image_url ?? null)
    setStatus(node.status)
    setLink(node.link ?? '')
    setGithubPath(node.github_path ?? '')
  }, [node.id])

  const category = categories.find((c) => c.id === node.category_id)

  function handleSave() {
    updateNode.mutate({
      id: node.id,
      fields: {
        title: title.trim() || 'Untitled',
        content,
        next_action: nextAction,
        maturity,
        image_url: imageUrl,
        status,
        link: link.trim() || null,
        github_path: githubPath.trim() || null,
      },
    })
  }

  function handleDelete() {
    if (window.confirm('Delete this node?')) {
      deleteNode.mutate(node.id, { onSuccess: onClose })
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadNodeImage(file)
      setImageUrl(url)
      updateNode.mutate({ id: node.id, fields: { image_url: url } })
    } catch (err) {
      window.alert('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveImage() {
    setImageUrl(null)
    updateNode.mutate({ id: node.id, fields: { image_url: null } })
  }

  function setNodeStatus(s: NodeStatus) {
    setStatus(s)
    updateNode.mutate({ id: node.id, fields: { status: s } })
  }

  return (
    <aside className="absolute right-0 top-0 z-20 flex h-full w-80 flex-col gap-4 overflow-y-auto border-l border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-neutral-400">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: category?.color ?? '#94a3b8' }}
          />
          {category?.name ?? 'No axis'}
        </span>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
          ✕
        </button>
      </div>

      <label className="block">
        <span className="text-xs text-neutral-500">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
      </label>

      {/* The reason this whole app exists. */}
      <label className="block">
        <span className="text-xs font-medium text-indigo-300">
          Next action / where I left off
        </span>
        <textarea
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          rows={3}
          placeholder="e.g. stuck on token refresh — try X next"
          className="mt-1 w-full rounded-md border border-indigo-800 bg-indigo-950/30 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
      </label>

      <label className="block">
        <span className="text-xs text-neutral-500">Notes</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
      </label>

      <label className="block">
        <span className="text-xs text-neutral-500">Link (file path or URL)</span>
        <div className="mt-1 flex gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/path/to/file.py  or  https://…"
            className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => openExternalLink(link)}
            disabled={!link.trim()}
            className="shrink-0 rounded-md border border-neutral-700 px-3 text-sm hover:bg-neutral-800 disabled:opacity-40"
          >
            Open
          </button>
        </div>
        <span className="mt-1 block text-[11px] text-neutral-600">
          A path starting with / opens in VS Code. A URL opens in the browser.
        </span>
      </label>

      <div>
        <span className="text-xs text-neutral-500">GitHub file</span>
        {project?.github_repo ? (
          <>
            <input
              list="gh-files"
              value={githubPath}
              onChange={(e) => setGithubPath(e.target.value)}
              placeholder="start typing to pick a file…"
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
            <datalist id="gh-files">
              {(filesQ.data ?? []).map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            {filesQ.isLoading && (
              <span className="mt-1 block text-[11px] text-neutral-600">
                Loading file list…
              </span>
            )}
            {filesQ.isError && (
              <span className="mt-1 block text-[11px] text-red-400">
                Couldn't list files: {(filesQ.error as Error).message}
              </span>
            )}
            {node.github_path && (
              <div className="mt-2">
                <GitHubFilePreview
                  repo={project.github_repo}
                  branch={project.github_branch ?? 'main'}
                  path={node.github_path}
                />
              </div>
            )}
          </>
        ) : (
          <p className="mt-1 text-[11px] text-neutral-600">
            Connect a repo to this project (top bar) to preview files here.
          </p>
        )}
      </div>

      {/* Picture / graph */}
      <div>
        <span className="text-xs text-neutral-500">Picture</span>
        {imageUrl ? (
          <div className="mt-1 space-y-2">
            <img
              src={imageUrl}
              alt=""
              className="max-h-40 w-full rounded-md object-cover"
            />
            <button
              onClick={handleRemoveImage}
              className="text-xs text-neutral-400 hover:text-red-400"
            >
              Remove picture
            </button>
          </div>
        ) : (
          <label className="mt-1 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-neutral-700 bg-neutral-800 px-2 py-3 text-sm text-neutral-400 hover:border-neutral-600">
            {uploading ? 'Uploading…' : '+ Upload image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <span className="text-xs text-neutral-500">Outcome</span>
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => setNodeStatus('success')}
            className={
              'flex-1 rounded-md border px-2 py-1.5 text-sm ' +
              (status === 'success'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800')
            }
          >
            ✓ Success
          </button>
          <button
            onClick={() => setNodeStatus('fail')}
            className={
              'flex-1 rounded-md border px-2 py-1.5 text-sm ' +
              (status === 'fail'
                ? 'border-red-500 bg-red-950/40 text-red-300'
                : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800')
            }
          >
            ✗ Fail
          </button>
          <button
            onClick={() => setNodeStatus(null)}
            className="rounded-md border border-neutral-700 px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-800"
          >
            Clear
          </button>
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-neutral-500">
          Maturity: {Math.round(maturity * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={maturity}
          onChange={(e) => setMaturity(Number(e.target.value))}
          className="mt-1 w-full"
        />
      </label>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <button
          onClick={handleDelete}
          className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
        >
          Delete
        </button>
        <button
          onClick={handleSave}
          disabled={updateNode.isPending}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {updateNode.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </aside>
  )
}
