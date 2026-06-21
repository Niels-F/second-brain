import { supabase } from '../../lib/supabase'
import type { Link } from './types'

export async function listLinks(projectId: string): Promise<Link[]> {
  const { data, error } = await supabase
    .from('link')
    .select('*')
    .eq('project_id', projectId)
  if (error) throw error
  return data ?? []
}

export async function createLink(input: {
  projectId: string
  sourceId: string
  targetId: string
}): Promise<Link> {
  const { data, error } = await supabase
    .from('link')
    .insert({
      project_id: input.projectId,
      source_node_id: input.sourceId,
      target_node_id: input.targetId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase.from('link').delete().eq('id', id)
  if (error) throw error
}
