import { useEffect, useState, type ChangeEvent } from 'react'
import type { MindNode } from '../nodes/types'
import type { Category } from '../categories/types'
import { uploadNodeImage } from '../nodes/api'
import { useDeleteNode, useUpdateNode } from '../nodes/hooks'

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

  const [title, setTitle] = useState(node.title)
  const [content, setContent] = useState(node.content ?? '')
  const [nextAction, setNextAction] = useState(node.next_action ?? '')
  const [maturity, setMaturity] = useState(node.maturity)
  const [imageUrl, setImageUrl] = useState<string | null>(node.image_url ?? null)
  const [uploading, setUploading] = useState(false)

  // When a different node is selected, refill the form with its values.
  useEffect(() => {
    setTitle(node.title)
    setContent(node.content ?? '')
    setNextAction(node.next_action ?? '')
    setMaturity(node.maturity)
    setImageUrl(node.image_url ?? null)
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
