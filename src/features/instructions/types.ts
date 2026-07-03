// A named markdown instruction doc (CLAUDE.md-style) fed to the partner.
export type InstructionDoc = {
  id: string
  project_id: string
  name: string
  content: string | null
  active: boolean
  created_at: string
}
