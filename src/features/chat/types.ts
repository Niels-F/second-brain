export type ChatMessage = {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: string
  recalled: { role: string; content: string }[] | null
  created_at: string
}
