import { supabase } from '../../lib/supabase'
import type { Category } from './types'

export async function listCategories(projectId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('category')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

// The default axes we give a brand-new project. Editable later.
const DEFAULTS = [
  { name: 'Theory', color: '#8b5cf6' },
  { name: 'Tests', color: '#10b981' },
  { name: 'Resume', color: '#f59e0b' },
]

export async function createDefaultCategories(projectId: string): Promise<void> {
  const rows = DEFAULTS.map((c, i) => ({
    project_id: projectId,
    name: c.name,
    color: c.color,
    sort_order: i,
  }))
  const { error } = await supabase.from('category').insert(rows)
  if (error) throw error
}
