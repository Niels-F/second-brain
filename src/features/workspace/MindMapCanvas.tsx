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
import {
  createNode as apiCreateNode,
  updateNodePosition as apiUpdatePosition,
} from '../nodes/api'
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
        link: n.link ?? null,
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

// Left→right tidy-tree layout from the links: roots on the left, children to the
// right (x = depth), siblings ordered by creation time and parents centered over
// their children (y). Returns the new position for every node.
function computeTreeLayout(
  nodes: MindNode[],
  links: Link[],
): Map<string, { x: number; y: number }> {
  const X = 260
  const Y = 90
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const children = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  nodes.forEach((n) => {
    children.set(n.id, [])
    indeg.set(n.id, 0)
  })
  for (const l of links) {
    if (!byId.has(l.source_node_id) || !byId.has(l.target_node_id)) continue
    children.get(l.source_node_id)!.push(l.target_node_id)
    indeg.set(l.target_node_id, (indeg.get(l.target_node_id) ?? 0) + 1)
  }
  const ctime = (id: string) => byId.get(id)?.created_at ?? ''
  for (const arr of children.values()) {
    arr.sort((a, b) => ctime(a).localeCompare(ctime(b)))
  }

  // depth = longest path from a root (bounded passes, cycle-safe)
  const depth = new Map<string, number>(nodes.map((n) => [n.id, 0]))
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false
    for (const l of links) {
      if (!byId.has(l.source_node_id) || !byId.has(l.target_node_id)) continue
      const d = (depth.get(l.source_node_id) ?? 0) + 1
      if (d > (depth.get(l.target_node_id) ?? 0)) {
        depth.set(l.target_node_id, d)
        changed = true
      }
    }
    if (!changed) break
  }

  // y via DFS over the forest; parents centered over their children
  const roots = nodes
    .filter((n) => (indeg.get(n.id) ?? 0) === 0)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((n) => n.id)
  const yRow = new Map<string, number>()
  const visited = new Set<string>()
  let nextRow = 0
  function dfs(id: string): number {
    if (visited.has(id)) return yRow.get(id) ?? 0
    visited.add(id)
    const kids = (children.get(id) ?? []).filter((k) => !visited.has(k))
    if (kids.length === 0) {
      const r = nextRow++
      yRow.set(id, r)
      return r
    }
    const rows = kids.map(dfs)
    const avg = rows.reduce((a, b) => a + b, 0) / rows.length
    yRow.set(id, avg)
    return avg
  }
  roots.forEach(dfs)
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      visited.add(n.id)
      yRow.set(n.id, nextRow++)
    }
  }

  const out = new Map<string, { x: number; y: number }>()
  for (const n of nodes) {
    out.set(n.id, {
      x: (depth.get(n.id) ?? 0) * X + 40,
      y: (yRow.get(n.id) ?? 0) * Y + 40,
    })
  }
  return out
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
      const links = qc.getQueryData<Link[]>(['links', projectId]) ?? []
      const parent = all.find((n) => n.id === parentId)
      const baseX = parent?.pos_x ?? 0
      const baseY = parent?.pos_y ?? 0

      // Place the child to the right of the parent, stacked below any existing
      // siblings so nothing overlaps — and nothing else moves.
      const siblingIds = new Set(
        links
          .filter((l) => l.source_node_id === parentId)
          .map((l) => l.target_node_id),
      )
      const siblings = all.filter((n) => siblingIds.has(n.id))
      const posX = baseX + 240
      const posY =
        siblings.length === 0
          ? baseY
          : Math.max(...siblings.map((s) => s.pos_y)) + 90

      const child = await apiCreateNode({
        projectId,
        categoryId: parent?.category_id ?? null,
        title: 'New node',
        posX,
        posY,
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

  // Arrange nodes as a left→right tree, persist positions, then re-frame.
  async function handleTidy() {
    const ns = nodesQ.data ?? []
    const ls = linksQ.data ?? []
    if (ns.length === 0) return
    const positions = computeTreeLayout(ns, ls)
    setRfNodes((cur) =>
      cur.map((n) => {
        const p = positions.get(n.id)
        return p ? { ...n, position: { x: p.x, y: p.y } } : n
      }),
    )
    await Promise.all(
      ns.map((n) => {
        const p = positions.get(n.id)
        return p ? apiUpdatePosition(n.id, p.x, p.y) : Promise.resolve()
      }),
    )
    qc.invalidateQueries({ queryKey: ['nodes', projectId] })
    rfRef.current?.fitView({ duration: 600 })
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
        <button
          onClick={handleTidy}
          title="Arrange nodes left→right by their links (roots left, children right)"
          className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          ✨ Tidy up
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
        minZoom={0.1}
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
