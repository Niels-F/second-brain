import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLink, deleteLink, listLinks } from './api'

export function useLinks(projectId: string) {
  return useQuery({
    queryKey: ['links', projectId],
    queryFn: () => listLinks(projectId),
  })
}

export function useCreateLink(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createLink,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links', projectId] }),
  })
}

export function useDeleteLink(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLink(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links', projectId] }),
  })
}
