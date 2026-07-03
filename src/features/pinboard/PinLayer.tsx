import { usePins } from './store'
import { PinnedImage } from './PinnedImage'

export function PinLayer() {
  const pins = usePins((s) => s.pins)
  return (
    <>
      {pins.map((p) => (
        <PinnedImage key={p.id} pin={p} />
      ))}
    </>
  )
}
