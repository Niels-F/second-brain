import { Handle, Position, type NodeProps } from '@xyflow/react'

// The shape we stuff into each React Flow node's `data`.
export type MindNodeData = {
  label: string
  color: string
  image: string | null
  onAddChild: (id: string) => void
}

export function MindMapNode({ id, data }: NodeProps) {
  const d = data as unknown as MindNodeData
  return (
    <div
      style={{ borderLeftColor: d.color }}
      className="relative rounded-lg border border-l-4 border-neutral-700 bg-neutral-900 px-3 py-2 text-[13px] text-neutral-200 shadow"
    >
      <Handle type="target" position={Position.Top} className="!bg-neutral-500" />

      <div className="flex items-center gap-2">
        {d.image && (
          <img src={d.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
        )}
        <span className="max-w-[160px] truncate">{d.label}</span>
      </div>

      {/* Spawn a connected child node */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          d.onAddChild(id)
        }}
        title="Add a connected node"
        className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs leading-none text-white hover:bg-indigo-500"
      >
        +
      </button>

      <Handle type="source" position={Position.Bottom} className="!bg-neutral-500" />
    </div>
  )
}
