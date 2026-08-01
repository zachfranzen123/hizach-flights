import { X } from 'lucide-react'
import type { Flight } from '../data/sampleFlight'
import { FlightPoster, type PosterPalette } from './FlightPoster'

type DisplayDialogProps = {
  open: boolean
  onClose: () => void
  flight: Flight
  palette: PosterPalette
}

export function DisplayDialog({ open, onClose, flight, palette }: DisplayDialogProps) {
  if (!open) return null

  return (
    <div className="display-dialog" role="dialog" aria-modal="true" aria-label="Private poster display preview">
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close display preview">
        <X aria-hidden="true" />
      </button>
      <FlightPoster flight={flight} palette={palette} className="poster-fullscreen" />
    </div>
  )
}
