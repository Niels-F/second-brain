import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDefaultCategories, listCategories } from './api'

export function useCategories(projectId: string) {
  return useQuery({
    queryKey: ['categories', projectId],
    queryFn: () => listCategories(projectId),
  })
}

export function useSeedCategories(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createDefaultCategories(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', projectId] }),
  })
}
