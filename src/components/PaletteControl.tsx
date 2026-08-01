import type { PosterPalette } from './FlightPoster'

type PaletteControlProps = {
  palettes: PosterPalette[]
  selected: number
  onSelect: (index: number) => void
}

export function PaletteControl({ palettes, selected, onSelect }: PaletteControlProps) {
  return (
    <div className="palette-control" aria-label="Poster background color">
      <span>Background</span>
      <div className="swatches">
        {palettes.map((palette, index) => (
          <button
            key={palette.name}
            type="button"
            className={index === selected ? 'swatch is-selected' : 'swatch'}
            style={{ background: palette.background }}
            aria-label={`Use ${palette.name} background`}
            aria-pressed={index === selected}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
    </div>
  )
}
