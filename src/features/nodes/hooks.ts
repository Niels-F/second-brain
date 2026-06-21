import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createNode,
  deleteNode,
  listNodes,
  updateNode,
  updateNodePosition,
} from './api'
import type { MindNode } from './types'

export function useNodes(projectId: string) {
  return useQuery({
    queryKey: ['nodes', projectId],
    queryFn: () => listNodes(projectId),
  })
}

export function useCreateNode(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createNode,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nodes', projectId] }),
  })
}

export function useUpdateNodePosition(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; posX: number; posY: number }) =>
      updateNodePosition(vars.id, vars.posX, vars.posY),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nodes', projectId] }),
  })
}

type NodeFields = Partial<
  Pick<MindNode, 'title' | 'content' | 'next_action' | 'maturity' | 'image_url' | 'status'>
>

export function useUpdateNode(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; fields: NodeFields }) =>
      updateNode(vars.id, vars.fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nodes', projectId] }),
  })
}

export function useDeleteNode(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nodes', projectId] }),
  })
}
