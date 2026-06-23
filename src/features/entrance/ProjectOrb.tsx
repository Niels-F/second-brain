import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html, Image } from '@react-three/drei'
import { AdditiveBlending, CanvasTexture, type Group, type Sprite } from 'three'
import type { Project } from '../projects/types'

// A soft radial-gradient texture reused for every glow halo — looks far better
// than a flat sphere (real falloff, no hard edges).
function makeGlowTexture(): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}
const glowTexture = makeGlowTexture()

export function ProjectOrb({
  project,
  position,
  featured,
  onOpen,
}: {
  project: Project
  position: [number, number, number]
  featured: boolean // one of the last 3 opened → glowing halo
  onOpen: (id: string) => void
}) {
  const ref = useRef<Group>(null)
  const haloRef = useRef<Sprite>(null)
  const [hovered, setHovered] = useState(false)
  const color = project.color ?? '#6366f1'

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t + position[0]) * 0.3
    }
    if (haloRef.current) {
      const s = 3.4 + Math.sin(t * 4 + position[0]) * 0.8
      haloRef.current.scale.set(s, s, 1)
    }
  })

  return (
    <group ref={ref} position={position}>
      {featured && (
        <sprite ref={haloRef} scale={[3.4, 3.4, 1]}>
          <spriteMaterial
            map={glowTexture}
            color={color}
            transparent
            opacity={0.9}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      )}

      <mesh
        scale={hovered ? 1.2 : 1}
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
          emissiveIntensity={hovered ? 1 : featured ? 0.7 : 0.25}
        />
      </mesh>

      {project.image_url ? (
        // Real textured plane in the 3D scene (Billboard keeps it facing you).
        <Billboard position={[0, 1.7, 0]}>
          <Image url={project.image_url} scale={1.2} transparent />
        </Billboard>
      ) : project.emoji ? (
        <Html center position={[0, 1.5, 0]} distanceFactor={8}>
          <span className="pointer-events-none text-3xl leading-none">
            {project.emoji}
          </span>
        </Html>
      ) : null}

      <Html center position={[0, -1.7, 0]} distanceFactor={14}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-black/60 px-3 py-1 text-lg font-semibold text-white">
          {project.name}
        </div>
      </Html>
    </group>
  )
}
