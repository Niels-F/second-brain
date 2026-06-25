import { supabase } from '../../lib/supabase'
import type { Project } from './types'

// All the raw database calls for projects live here. The UI never talks to
// Supabase directly — it goes through these functions (and the hooks below).

// Most-recently-opened first; never-opened projects (null) sink to the bottom.
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('project')
    .select('*')
    .order('last_opened_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createProject(name: string): Promise<Project> {
  // The security policy requires user_id = the logged-in user, so set it here.
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('project')
    .insert({ name, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameProject(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('project')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('project').delete().eq('id', id)
  if (error) throw error
}

// Stamp last_opened_at = now. This is what powers "Resume last project".
export async function touchProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('project')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateProject(
  id: string,
  fields: Partial<
    Pick<
      Project,
      'name' | 'emoji' | 'image_url' | 'color' | 'github_repo' | 'github_branch'
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from('project')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// Reuses the node-images bucket (it's just an image store).
export async function uploadProjectImage(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser()
  const userId = u.user?.id
  if (!userId) throw new Error('Not signed in')
  const ext = file.name.split('.').pop()
  const path = `${userId}/proj-${crypto.randomUUID()}${ext ? '.' + ext : ''}`
  const { error } = await supabase.storage.from('node-images').upload(path, file)
  if (error) throw error
  return supabase.storage.from('node-images').getPublicUrl(path).data.publicUrl
}
