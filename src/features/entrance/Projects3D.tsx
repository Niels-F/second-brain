import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Project } from '../projects/types'
import { ProjectOrb } from './ProjectOrb'

// Spread the projects around a loose ring with a little vertical stagger.
function positionFor(i: number, total: number): [number, number, number] {
  const angle = (i / Math.max(1, total)) * Math.PI * 2
  const radius = 6 + (i % 2) * 1.5
  const y = ((i % 3) - 1) * 1.5
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius]
}

export default function Projects3D({
  projects,
  onOpen,
}: {
  projects: Project[]
  onOpen: (id: string) => void
}) {
  return (
    <Canvas camera={{ position: [0, 2, 16], fov: 50 }}>
      <color attach="background" args={['#0a0a0a']} />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <OrbitControls enablePan={false} minDistance={6} maxDistance={30} />
      {projects.map((p, i) => (
        <ProjectOrb
          key={p.id}
          project={p}
          position={positionFor(i, projects.length)}
          onOpen={onOpen}
        />
      ))}
    </Canvas>
  )
}
