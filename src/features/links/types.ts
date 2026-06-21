// An undirected connection between two nodes. Stored once; in Phase 4 we'll
// render cross-category links as colored "portal" nodes on both ends.
export type Link = {
  id: string
  project_id: string
  source_node_id: string
  target_node_id: string
  label: string | null
  created_at: string
}
