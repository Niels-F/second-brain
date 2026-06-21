import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQueryClient } from '@tanstack/react-query'
import { useCategories, useSeedCategories } from '../categories/hooks'
import { useCreateNode, useNodes, useUpdateNodePosition } from '../nodes/hooks'
import { useCreateLink, useDeleteLink, useLinks } from '../links/hooks'
import { createNode as apiCreateNode } from '../nodes/api'
import { createLink as apiCreateLink } from '../links/api'
import type { MindNode } from '../nodes/types'
import type { Link } from '../links/types'
import { NodePanel } from './NodePanel'
import { MindMapNode } from './MindMapNode'

// Registered once so React Flow knows how to render our 'mind' node type.
const nodeTypes = { mind: MindMapNode }

function toRFNodes(
  nodes: MindNode[],
  colorById: Map<string, string>,
  onAddChild: (id: string) => void,
  latestId: string | null,
): RFNode[] {
  return nodes.map((n) => {
    const color = (n.category_id && colorById.get(n.category_id)) || '#94a3b8'
    return {
      id: n.id,
      type: 'mind',
      position: { x: n.pos_x, y: n.pos_y },
      data: {
        label: n.title,
        color,
        image: n.image_url ?? null,
        isLatest: n.id === latestId,
        status: n.status ?? null,
        onAddChild,
      },
    }
  })
}

function toRFEdges(links: Link[]): RFEdge[] {
  return links.map((l) => ({
    id: l.id,
    source: l.source_node_id,
    target: l.target_node_id,
    markerEnd: { type: MarkerType.ArrowClosed },
  }))
}

export function MindMapCanvas({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const categoriesQ = useCategories(projectId)
  const seed = useSeedCategories(projectId)
  const nodesQ = useNodes(projectId)
  const createNode = useCreateNode(projectId)
  const updatePosition = useUpdateNodePosition(projectId)
  const linksQ = useLinks(projectId)
  const createLink = useCreateLink(projectId)
  const deleteLink = useDeleteLink(projectId)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const rfRef = useRef<ReactFlowInstance | null>(null)

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

  // The "+" on a node: create a child nearby and link parent → child.
  // Uses the API functions directly (not the mutation hooks) so this callback
  // stays referentially stable — otherwise the sync effect below re-runs every
  // render and React Flow loops ("Maximum update depth exceeded").
  const handleAddChild = useCallback(
    async (parentId: string) => {
      const all = qc.getQueryData<MindNode[]>(['nodes', projectId]) ?? []
      const parent = all.find((n) => n.id === parentId)
      const child = await apiCreateNode({
        projectId,
        categoryId: parent?.category_id ?? null,
        title: 'New node',
        posX: (parent?.pos_x ?? 0) + 220,
        posY: (parent?.pos_y ?? 0) + 40,
      })
      await apiCreateLink({ projectId, sourceId: parentId, targetId: child.id })
      qc.invalidateQueries({ queryKey: ['nodes', projectId] })
      qc.invalidateQueries({ queryKey: ['links', projectId] })
      setSelectedNodeId(child.id)
    },
    [qc, projectId],
  )

  // React Flow keeps its own copy of nodes/edges; we sync from the database.
  // The single most-recently-touched node — it gets the pulsing glow.
  const latestId = useMemo(() => {
    const all = nodesQ.data ?? []
    if (all.length === 0) return null
    return all.reduce((a, b) =>
      new Date(b.last_touched_at) > new Date(a.last_touched_at) ? b : a,
    ).id
  }, [nodesQ.data])

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode>([])
  useEffect(() => {
    if (nodesQ.data)
      setRfNodes(toRFNodes(nodesQ.data, colorById, handleAddChild, latestId))
  }, [nodesQ.data, colorById, handleAddChild, latestId, setRfNodes])

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

  function handleConnect(conn: Connection) {
    if (!conn.source || !conn.target || conn.source === conn.target) return
    const exists = (linksQ.data ?? []).some(
      (l) => l.source_node_id === conn.source && l.target_node_id === conn.target,
    )
    if (exists) return
    createLink.mutate({ projectId, sourceId: conn.source, targetId: conn.target })
  }

  // Resume: fly the camera to the most-recently-touched node and open it.
  function handleResume() {
    const all = nodesQ.data ?? []
    if (all.length === 0) return
    const last = all.reduce((a, b) =>
      new Date(b.last_touched_at) > new Date(a.last_touched_at) ? b : a,
    )
    rfRef.current?.fitView({ nodes: [{ id: last.id }], duration: 800, maxZoom: 1.5 })
    setSelectedNodeId(last.id)
  }

  const selectedNode = nodesQ.data?.find((n) => n.id === selectedNodeId) ?? null

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/90 p-2 backdrop-blur">
        <button
          onClick={handleResume}
          title="Fly to the last node you touched"
          className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          ↩ Resume
        </button>
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
          click the + on a node to branch · drag a node's dot onto another to link
        </span>
      </div>

      <ReactFlow
        colorMode="dark"
        nodeTypes={nodeTypes}
        onInit={(inst) => {
          rfRef.current = inst
        }}
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
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

      {selectedNode && (
        <NodePanel
          node={selectedNode}
          categories={categories}
          projectId={projectId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  )
}
