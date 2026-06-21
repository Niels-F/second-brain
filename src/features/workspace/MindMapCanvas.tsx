import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCategories, useSeedCategories } from '../categories/hooks'
import { useCreateNode, useNodes, useUpdateNodePosition } from '../nodes/hooks'
import { useCreateLink, useDeleteLink, useLinks } from '../links/hooks'
import type { MindNode } from '../nodes/types'
import type { Link } from '../links/types'

type NodeData = { label: string; color: string }

// Convert our database rows into the shape React Flow wants to render.
function toRFNodes(
  nodes: MindNode[],
  colorById: Map<string, string>,
): RFNode<NodeData>[] {
  return nodes.map((n) => {
    const color = (n.category_id && colorById.get(n.category_id)) || '#94a3b8'
    return {
      id: n.id,
      position: { x: n.pos_x, y: n.pos_y },
      data: { label: n.title, color },
      style: {
        background: '#171717',
        color: '#e5e5e5',
        border: '1px solid #404040',
        borderLeft: `4px solid ${color}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
      },
    }
  })
}

function toRFEdges(links: Link[]): RFEdge[] {
  return links.map((l) => ({
    id: l.id,
    source: l.source_node_id,
    target: l.target_node_id,
  }))
}

export function MindMapCanvas({ projectId }: { projectId: string }) {
  const categoriesQ = useCategories(projectId)
  const seed = useSeedCategories(projectId)
  const nodesQ = useNodes(projectId)
  const createNode = useCreateNode(projectId)
  const updatePosition = useUpdateNodePosition(projectId)
  const linksQ = useLinks(projectId)
  const createLink = useCreateLink(projectId)
  const deleteLink = useDeleteLink(projectId)

  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data])
  const colorById = useMemo(() => {
    const m = new Map<string, string>()
    categories.forEach((c) => m.set(c.id, c.color))
    return m
  }, [categories])

  // First time a project with no axes is opened, create the default ones.
  const seededRef = useRef(false)
  useEffect(() => {
    if (categoriesQ.isSuccess && categories.length === 0 && !seededRef.current) {
      seededRef.current = true
      seed.mutate()
    }
  }, [categoriesQ.isSuccess, categories.length, seed])

  // React Flow keeps its own copy of nodes/edges (so interaction is smooth); we
  // sync from the database whenever the server data changes.
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode<NodeData>>([])
  useEffect(() => {
    if (nodesQ.data) setRfNodes(toRFNodes(nodesQ.data, colorById))
  }, [nodesQ.data, colorById, setRfNodes])

  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<RFEdge>([])
  useEffect(() => {
    if (linksQ.data) setRfEdges(toRFEdges(linksQ.data))
  }, [linksQ.data, setRfEdges])

  const [selectedCat, setSelectedCat] = useState<string>('')
  useEffect(() => {
    if (!selectedCat && categories.length > 0) setSelectedCat(categories[0].id)
  }, [categories, selectedCat])

  function handleAdd() {
    const title = window.prompt('New node title')?.trim()
    if (!title) return
    const catIndex = categories.findIndex((c) => c.id === selectedCat)
    const countInCat = (nodesQ.data ?? []).filter(
      (n) => n.category_id === selectedCat,
    ).length
    // Lay new nodes out in a column per category — a first hint of the "axes".
    const posX = (catIndex < 0 ? 0 : catIndex) * 260 + 40
    const posY = countInCat * 90 + 40
    createNode.mutate({
      projectId,
      categoryId: selectedCat || null,
      title,
      posX,
      posY,
    })
  }

  // Fired when you drag from one node's handle and release on another.
  function handleConnect(conn: Connection) {
    if (!conn.source || !conn.target || conn.source === conn.target) return
    const exists = (linksQ.data ?? []).some(
      (l) => l.source_node_id === conn.source && l.target_node_id === conn.target,
    )
    if (exists) return
    createLink.mutate({
      projectId,
      sourceId: conn.source,
      targetId: conn.target,
    })
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/90 p-2 backdrop-blur">
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add node
        </button>
        <span className="ml-1 text-xs text-neutral-500">
          drag a node's dot onto another to link · select a link + Backspace to remove
        </span>
      </div>

      <ReactFlow
        colorMode="dark"
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={(_, node) =>
          updatePosition.mutate({
            id: node.id,
            posX: node.position.x,
            posY: node.position.y,
          })
        }
        onEdgesDelete={(deleted) => deleted.forEach((e) => deleteLink.mutate(e.id))}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
