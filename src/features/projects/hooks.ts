import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
  touchProject,
  updateProject,
} from './api'
import type { Project } from './types'

// React Query handles caching + loading/error state for us. The "query key"
// ['projects'] identifies this data; after any change we invalidate it so the
// list refetches and the UI updates automatically.
type ProjectFields = Partial<
  Pick<
    Project,
    'name' | 'emoji' | 'image_url' | 'color' | 'github_repo' | 'github_branch'
  >
>

const KEY = ['projects']

export function useProjects() {
  return useQuery({ queryKey: KEY, queryFn: listProjects })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRenameProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; name: string }) => renameProject(vars.id, vars.name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useOpenProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => touchProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; fields: ProjectFields }) =>
      updateProject(vars.id, vars.fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
