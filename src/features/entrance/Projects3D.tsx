import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import type { Project } from '../projects/types'
import { ProjectOrb } from './ProjectOrb'

// Even spread over a sphere (fibonacci distribution) — a real 3D constellation.
function positionFor(i: number, total: number): [number, number, number] {
  const r = 8
  const k = i + 0.5
  const phi = Math.acos(1 - (2 * k) / Math.max(1, total))
  const theta = Math.PI * (1 + Math.sqrt(5)) * k
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ]
}

export default function Projects3D({
  projects,
  onOpen,
}: {
  projects: Project[]
  onOpen: (id: string) => void
}) {
  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
      <color attach="background" args={['#070710']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <Stars radius={60} depth={40} count={3000} factor={4} fade speed={1} />
      <OrbitControls enablePan={false} minDistance={8} maxDistance={40} />
      <Suspense fallback={null}>
        {projects.map((p, i) => (
          <ProjectOrb
            key={p.id}
            project={p}
            position={positionFor(i, projects.length)}
            featured={i < 3}
            onOpen={onOpen}
          />
        ))}
      </Suspense>
    </Canvas>
  )
}
