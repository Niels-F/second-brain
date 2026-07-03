import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMessage, listMessages } from './api'

export function useMessages(projectId: string) {
  return useQuery({
    queryKey: ['messages', projectId],
    queryFn: () => listMessages(projectId),
  })
}

export function useAddMessage(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      role: 'user' | 'assistant'
      content: string
      recalled?: { role: string; content: string }[]
    }) => addMessage(projectId, vars.role, vars.content, vars.recalled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', projectId] }),
  })
}
