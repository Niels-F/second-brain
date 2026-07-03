import { useEffect, useState } from 'react'
import { useProjects, useUpdateProject } from '../projects/hooks'
import { usePins } from '../pinboard/store'
import { PinLayer } from '../pinboard/PinLayer'
import { getGithubToken, setGithubToken } from '../../lib/github'
import { AiSettings } from '../ai/AiSettings'
import { ChatPanel } from '../chat/ChatPanel'
import { MindMapCanvas } from './MindMapCanvas'

export function ProjectWorkspace({
  projectId,
  onBack,
}: {
  projectId: string
  onBack: () => void
}) {
  const projects = useProjects()
  const project = projects.data?.find((p) => p.id === projectId)
  const update = useUpdateProject()
  const [chatOpen, setChatOpen] = useState(false)

  // Clear pinned images when leaving the project.
  useEffect(() => () => usePins.getState().clear(), [])

  function handleConnectRepo() {
    const repo = window.prompt(
      'GitHub repo as owner/name (leave blank to disconnect)',
      project?.github_repo ?? '',
    )
    if (repo === null) return
    const trimmed = repo.trim()
    if (!trimmed) {
      update.mutate({
        id: projectId,
        fields: { github_repo: null, github_branch: null },
      })
      return
    }
    const branch =
      window.prompt('Branch', project?.github_branch ?? 'main')?.trim() || 'main'
    update.mutate({
      id: projectId,
      fields: { github_repo: trimmed, github_branch: branch },
    })
  }

  function handleSetToken() {
    const t = window.prompt(
      'GitHub personal access token (stored on this device only; blank to clear)',
      getGithubToken() ?? '',
    )
    if (t !== null) setGithubToken(t.trim() || null)
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center gap-4 border-b border-neutral-800 px-4 py-3">
        <button
          onClick={onBack}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← All projects
        </button>
        <h1 className="text-lg font-semibold">{project?.name ?? 'Project'}</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="rounded border border-indigo-700 bg-indigo-950/40 px-3 py-1 text-indigo-200 hover:bg-indigo-950/70"
          >
            💬 Partner
          </button>
          <AiSettings />
          <button
            onClick={handleConnectRepo}
            title="Connect a GitHub repo to this project"
            className="rounded border border-neutral-700 px-3 py-1 text-neutral-300 hover:bg-neutral-900"
          >
            {project?.github_repo ? `▣ ${project.github_repo}` : 'Connect repo'}
          </button>
          <button
            onClick={handleSetToken}
            title="Set your GitHub token (stored on this device only)"
            className="rounded border border-neutral-700 px-3 py-1 text-neutral-400 hover:bg-neutral-900"
          >
            Token
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <MindMapCanvas projectId={projectId} />
        </div>
        {chatOpen && project && (
          <ChatPanel project={project} onClose={() => setChatOpen(false)} />
        )}
      </div>
      <PinLayer />
    </div>
  )
}
