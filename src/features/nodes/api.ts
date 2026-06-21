import { supabase } from '../../lib/supabase'
import type { MindNode } from './types'

export async function listNodes(projectId: string): Promise<MindNode[]> {
  const { data, error } = await supabase
    .from('node')
    .select('*')
    .eq('project_id', projectId)
  if (error) throw error
  return data ?? []
}

export async function createNode(input: {
  projectId: string
  categoryId: string | null
  title: string
  posX: number
  posY: number
}): Promise<MindNode> {
  const { data, error } = await supabase
    .from('node')
    .insert({
      project_id: input.projectId,
      category_id: input.categoryId,
      title: input.title,
      pos_x: input.posX,
      pos_y: input.posY,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Lightweight update used while dragging — only the position.
export async function updateNodePosition(
  id: string,
  posX: number,
  posY: number,
): Promise<void> {
  const { error } = await supabase
    .from('node')
    .update({ pos_x: posX, pos_y: posY })
    .eq('id', id)
  if (error) throw error
}

// Editing content also bumps last_touched_at (powers recency + Resume in Phase 3).
export async function updateNode(
  id: string,
  fields: Partial<
    Pick<MindNode, 'title' | 'content' | 'next_action' | 'maturity' | 'image_url'>
  >,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('node')
    .update({ ...fields, updated_at: now, last_touched_at: now })
    .eq('id', id)
  if (error) throw error
}

export async function deleteNode(id: string): Promise<void> {
  const { error } = await supabase.from('node').delete().eq('id', id)
  if (error) throw error
}

// Upload an image file to Supabase Storage and return its public URL.
export async function uploadNodeImage(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser()
  const userId = u.user?.id
  if (!userId) throw new Error('Not signed in')
  const ext = file.name.split('.').pop()
  const path = `${userId}/${crypto.randomUUID()}${ext ? '.' + ext : ''}`
  const { error } = await supabase.storage.from('node-images').upload(path, file)
  if (error) throw error
  return supabase.storage.from('node-images').getPublicUrl(path).data.publicUrl
}
