import { useState } from 'react'
import { useAuth } from './features/auth/AuthProvider'
import { LoginScreen } from './features/auth/LoginScreen'
import { EntranceScreen } from './features/entrance/EntranceScreen'
import { ProjectWorkspace } from './features/workspace/ProjectWorkspace'
import { useOpenProject } from './features/projects/hooks'

function App() {
  const { session, loading } = useAuth()
  const openProject = useOpenProject()
  const [openId, setOpenId] = useState<string | null>(null)

  function handleOpen(id: string) {
    openProject.mutate(id) // stamp last_opened_at = now, then show the project
    setOpenId(id)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading…
      </main>
    )
  }

  if (!session) return <LoginScreen />

  if (openId) {
    return <ProjectWorkspace projectId={openId} onBack={() => setOpenId(null)} />
  }

  return <EntranceScreen onOpen={handleOpen} />
}

export default App
