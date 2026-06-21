import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { CSSProperties } from 'react'
import type { NodeStatus } from '../nodes/types'

// The shape we stuff into each React Flow node's `data`.
export type MindNodeData = {
  label: string
  color: string
  image: string | null
  isLatest: boolean // the most-recently-touched node → gentle pulse, everything else stays normal
  status: NodeStatus // success / fail ring
  onAddChild: (id: string) => void
}

const STATUS_COLOR: Record<'success' | 'fail', string> = {
  success: '#22c55e',
  fail: '#ef4444',
}

export function MindMapNode({ id, data }: NodeProps) {
  const d = data as unknown as MindNodeData

  const style: CSSProperties & Record<string, string | number> = {
    borderLeftColor: d.color,
  }

  // Success/fail ring — outline so it doesn't clash with the glow box-shadow.
  if (d.status) {
    style.outline = `2px solid ${STATUS_COLOR[d.status]}`
    style.outlineOffset = '2px'
  }

  // Only the single most-recently-touched node glows (pulses). Color via CSS var.
  if (d.isLatest) {
    style['--glow-color'] = d.color
  }

  return (
    <div
      style={style}
      className={
        'relative rounded-lg border border-l-4 border-neutral-700 bg-neutral-900 px-3 py-2 text-[13px] text-neutral-200' +
        (d.isLatest ? ' node-pulse' : '')
      }
    >
      <Handle type="target" position={Position.Top} className="!bg-neutral-500" />

      <div className="flex items-center gap-2">
        {d.image && (
          <img src={d.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
        )}
        <span className="max-w-[160px] truncate">{d.label}</span>
      </div>

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
