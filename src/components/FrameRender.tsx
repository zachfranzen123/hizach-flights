import { useEffect, useMemo, useState } from 'react'
import { palettes } from '../App'
import type { Flight } from '../data/sampleFlight'
import { FlightPoster } from './FlightPoster'
import { toPosterFlight, type LiveFlight } from './DisplayDialog'

type FrameData = {
  flight: LiveFlight
  paletteIndex: number
  overlayVariant: number
}

export function FrameRender() {
  const [data, setData] = useState<FrameData | null>(null)
  const [ready, setReady] = useState(false)
  const query = window.location.search

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`/api/frame-data${query}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Frame data unavailable')
        return response.json() as Promise<FrameData>
      })
      .then(setData)
      .catch(() => setData(null))
    return () => controller.abort()
  }, [query])

  const flight = useMemo<Flight | null>(() => {
    if (!data) return null
    return {
      ...toPosterFlight(data.flight),
      overlayVariant: data.overlayVariant,
    }
  }, [data])

  useEffect(() => {
    if (!flight) return
    let cancelled = false
    const settle = async () => {
      await document.fonts.ready
      const images = Array.from(document.images)
      await Promise.all(images.map((image) => {
        if (image.complete) return Promise.resolve()
        return new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })
      }))
      if (!cancelled) setReady(true)
    }
    void settle()
    return () => { cancelled = true }
  }, [flight])

  if (!data || !flight) return <main className="frame-render-loading" />

  return (
    <main className={`frame-render-root${ready ? ' frame-render-ready' : ''}`}>
      <FlightPoster flight={flight} palette={palettes[data.paletteIndex] ?? palettes[0]} />
    </main>
  )
}
