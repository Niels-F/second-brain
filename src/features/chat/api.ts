import { supabase } from '../../lib/supabase'
import type { ChatMessage } from './types'

export async function listMessages(projectId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('message')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addMessage(
  projectId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from('message')
    .insert({ project_id: projectId, role, content })
  if (error) throw error
}

// Persist the rolling conversation summary + how many messages it covers.
export async function setChatSummary(
  projectId: string,
  summary: string,
  count: number,
): Promise<void> {
  const { error } = await supabase
    .from('project')
    .update({ chat_summary: summary, chat_summary_count: count })
    .eq('id', projectId)
  if (error) throw error
}

// Per-project instructions for the partner ("how to think about this project").
export async function setAiInstructions(
  projectId: string,
  text: string,
): Promise<void> {
  const { error } = await supabase
    .from('project')
    .update({ ai_instructions: text || null })
    .eq('id', projectId)
  if (error) throw error
}
