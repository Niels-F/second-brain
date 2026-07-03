import { useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { usePins, type Pin } from './store'

export function PinnedImage({ pin }: { pin: Pin }) {
  const remove = usePins((s) => s.remove)
  const move = usePins((s) => s.move)
  const resize = usePins((s) => s.resize)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const resizeRef = useRef<{ x0: number; w0: number } | null>(null)

  const onMove = useCallback(
    (e: globalThis.MouseEvent) => {
      const d = dragRef.current
      if (d) move(pin.id, e.clientX - d.dx, e.clientY - d.dy)
      const r = resizeRef.current
      if (r) resize(pin.id, Math.max(140, r.w0 + (e.clientX - r.x0)))
    },
    [move, resize, pin.id],
  )
  const onUp = useCallback(() => {
    dragRef.current = null
    resizeRef.current = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }, [onMove])

  function startDrag(e: ReactMouseEvent) {
    dragRef.current = { dx: e.clientX - pin.x, dy: e.clientY - pin.y }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  function startResize(e: ReactMouseEvent) {
    e.stopPropagation()
    resizeRef.current = { x0: e.clientX, w0: pin.w }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="fixed z-40 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
      style={{ left: pin.x, top: pin.y, width: pin.w }}
    >
      <div
        onMouseDown={startDrag}
        className="flex cursor-move items-center justify-between bg-neutral-800 px-2 py-1 text-xs text-neutral-400"
      >
        <span>📌 pinned</span>
        <button onClick={() => remove(pin.id)} className="hover:text-red-400">
          ✕
        </button>
      </div>
      <img
        src={pin.url}
        alt=""
        draggable={false}
        className="block w-full select-none"
      />
      <div
        onMouseDown={startResize}
        className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize bg-neutral-600"
      />
    </div>
  )
}
