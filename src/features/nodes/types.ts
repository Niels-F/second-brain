// Named MindNode to avoid clashing with the DOM's built-in `Node` type.
export type NodeStatus = 'success' | 'fail' | null

export type MindNode = {
  id: string
  project_id: string
  category_id: string | null
  title: string
  content: string | null
  summary: string | null
  next_action: string | null
  maturity: number
  image_url: string | null
  status: NodeStatus
  link: string | null
  github_path: string | null
  pos_x: number
  pos_y: number
  created_at: string
  updated_at: string
  last_touched_at: string
}
