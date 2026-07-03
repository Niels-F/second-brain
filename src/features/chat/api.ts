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
  recalled?: { role: string; content: string }[],
): Promise<string> {
  const { data, error } = await supabase
    .from('message')
    .insert({ project_id: projectId, role, content, recalled: recalled ?? null })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// Store a message's embedding (pgvector text format).
export async function setMessageEmbedding(
  id: string,
  embedding: number[],
): Promise<void> {
  const { error } = await supabase
    .from('message')
    .update({ embedding: `[${embedding.join(',')}]` })
    .eq('id', id)
  if (error) throw error
}

// Messages missing an embedding (for backfilling older history).
export async function listUnembedded(
  projectId: string,
): Promise<{ id: string; content: string }[]> {
  const { data, error } = await supabase
    .from('message')
    .select('id, content')
    .eq('project_id', projectId)
    .is('embedding', null)
  if (error) throw error
  return data ?? []
}

// Semantic search over a project's messages via the match_messages RPC.
export async function matchMessages(
  projectId: string,
  queryEmbedding: number[],
  count: number,
): Promise<{ id: string; role: string; content: string }[]> {
  const { data, error } = await supabase.rpc('match_messages', {
    p_project: projectId,
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_count: count,
  })
  if (error) throw error
  return data ?? []
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
