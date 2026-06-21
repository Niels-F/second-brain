import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import type { Project } from '../projects/types'

export function ProjectOrb({
  project,
  position,
  onOpen,
}: {
  project: Project
  position: [number, number, number]
  onOpen: (id: string) => void
}) {
  const ref = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const color = project.color ?? '#6366f1'

  // Gentle bobbing so the projects feel like they're floating.
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.3
    }
  })

  return (
    <group ref={ref} position={position}>
      <mesh
        scale={hovered ? 1.25 : 1}
        onClick={() => onOpen(project.id)}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.7 : 0.25}
        />
      </mesh>
      <Html center position={[0, -1.3, 0]} distanceFactor={10}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {project.name}
        </div>
      </Html>
    </group>
  )
}
