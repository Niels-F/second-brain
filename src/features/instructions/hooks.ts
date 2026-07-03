import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listInstructions,
  createInstruction,
  updateInstruction,
  deleteInstruction,
} from './api'
import type { InstructionDoc } from './types'

export function useInstructions(projectId: string) {
  return useQuery({
    queryKey: ['instructions', projectId],
    queryFn: () => listInstructions(projectId),
  })
}

export function useCreateInstruction(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { name: string; content?: string }) =>
      createInstruction(projectId, vars.name, vars.content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructions', projectId] }),
  })
}

type Fields = Partial<Pick<InstructionDoc, 'name' | 'content' | 'active'>>

export function useUpdateInstruction(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; fields: Fields }) =>
      updateInstruction(vars.id, vars.fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructions', projectId] }),
  })
}

export function useDeleteInstruction(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteInstruction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructions', projectId] }),
  })
}
