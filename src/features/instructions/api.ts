import { supabase } from '../../lib/supabase'
import type { InstructionDoc } from './types'

export async function listInstructions(projectId: string): Promise<InstructionDoc[]> {
  const { data, error } = await supabase
    .from('instruction')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createInstruction(
  projectId: string,
  name: string,
  content?: string,
): Promise<InstructionDoc> {
  const { data, error } = await supabase
    .from('instruction')
    .insert({ project_id: projectId, name, content: content ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInstruction(
  id: string,
  fields: Partial<Pick<InstructionDoc, 'name' | 'content' | 'active'>>,
): Promise<void> {
  const { error } = await supabase.from('instruction').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteInstruction(id: string): Promise<void> {
  const { error } = await supabase.from('instruction').delete().eq('id', id)
  if (error) throw error
}
