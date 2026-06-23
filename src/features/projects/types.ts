// Mirrors the `project` table in DATA-MODEL.md. Timestamps come back as ISO strings.
export type Project = {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string | null
  emoji: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  last_opened_at: string | null
}
