import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import type { Project } from '../projects/types'
import { ProjectOrb } from './ProjectOrb'

// Even spread over a sphere (fibonacci distribution) — a real 3D constellation.
function positionFor(
  i: number,
  total: number,
  radius: number,
): [number, number, number] {
  const k = i + 0.5
  const phi = Math.acos(1 - (2 * k) / Math.max(1, total))
  const theta = Math.PI * (1 + Math.sqrt(5)) * k
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  ]
}

export default function Projects3D({
  projects,
  onOpen,
}: {
  projects: Project[]
  onOpen: (id: string) => void
}) {
  // The constellation grows with the project count (so orbs keep their spacing),
  // and the camera distance + zoom-out limit grow with it, so you can always
  // pull back far enough to see every project.
  const radius = Math.max(8, 2.4 * Math.sqrt(projects.length))
  const camZ = radius * 2.6

  return (
    <Canvas camera={{ position: [0, 0, camZ], fov: 50 }}>
      <color attach="background" args={['#070710']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <Stars
        radius={Math.max(80, radius * 5)}
        depth={40}
        count={3000}
        factor={4}
        fade
        speed={1}
      />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={radius * 6} />
      <Suspense fallback={null}>
        {projects.map((p, i) => (
          <ProjectOrb
            key={p.id}
            project={p}
            position={positionFor(i, projects.length, radius)}
            featured={i < 3}
            onOpen={onOpen}
          />
        ))}
      </Suspense>
    </Canvas>
  )
}
