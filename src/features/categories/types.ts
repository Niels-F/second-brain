// A category is one "axis" within a project (e.g. Theory, Tests, Resume).
export type Category = {
  id: string
  project_id: string
  name: string
  color: string
  sort_order: number
}
