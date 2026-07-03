import { create } from 'zustand'

// Floating images pinned over the canvas (session-only; not persisted).
export type Pin = { id: string; url: string; x: number; y: number; w: number }

type State = {
  pins: Pin[]
  add: (url: string) => void
  remove: (id: string) => void
  move: (id: string, x: number, y: number) => void
  resize: (id: string, w: number) => void
  clear: () => void
}

export const usePins = create<State>()((set) => ({
  pins: [],
  add: (url) =>
    set((s) => ({
      pins: [
        ...s.pins,
        {
          id: crypto.randomUUID(),
          url,
          x: 140 + (s.pins.length % 5) * 24,
          y: 120 + (s.pins.length % 5) * 24,
          w: 340,
        },
      ],
    })),
  remove: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
  move: (id, x, y) =>
    set((s) => ({ pins: s.pins.map((p) => (p.id === id ? { ...p, x, y } : p)) })),
  resize: (id, w) =>
    set((s) => ({ pins: s.pins.map((p) => (p.id === id ? { ...p, w } : p)) })),
  clear: () => set({ pins: [] }),
}))
