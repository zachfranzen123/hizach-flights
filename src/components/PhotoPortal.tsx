import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Check, ImagePlus, KeyRound, LoaderCircle, Lock, Plane, Shuffle, Trash2, Upload, X } from 'lucide-react'

type Treatment = 'black-and-white' | 'six-color'
type FrameMode = 'automatic' | 'flight' | 'photo'

type Photo = {
  id: string
  name: string
  enabled: boolean
  treatment: Treatment
  createdAt: string
  updatedAt: string
}

type FrameSettings = {
  mode: FrameMode
  rotation: 'shuffle' | 'ordered'
  updatedAt: string
}

type LibraryResponse = { photos: Photo[]; settings: FrameSettings }
type Phase = 'loading' | 'locked' | 'ready' | 'error'

const defaultSettings: FrameSettings = { mode: 'automatic', rotation: 'shuffle', updatedAt: '' }
const palette = [
  [22, 28, 32], [244, 240, 226], [33, 77, 137],
  [184, 59, 48], [218, 166, 42], [53, 101, 77],
] as const

function processPixels(context: CanvasRenderingContext2D, width: number, height: number, treatment: Treatment, brightness: number, contrast: number) {
  const image = context.getImageData(0, 0, width, height)
  const data = image.data
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  for (let index = 0; index < data.length; index += 4) {
    let red = Math.max(0, Math.min(255, contrastFactor * (data[index] - 128) + 128 + brightness))
    let green = Math.max(0, Math.min(255, contrastFactor * (data[index + 1] - 128) + 128 + brightness))
    let blue = Math.max(0, Math.min(255, contrastFactor * (data[index + 2] - 128) + 128 + brightness))

    if (treatment === 'black-and-white') {
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114
      red = luminance
      green = luminance
      blue = luminance
    } else {
      let best: readonly [number, number, number] = palette[0]
      let distance = Number.POSITIVE_INFINITY
      for (const color of palette) {
        const nextDistance = (red - color[0]) ** 2 + (green - color[1]) ** 2 + (blue - color[2]) ** 2
        if (nextDistance < distance) {
          best = color
          distance = nextDistance
        }
      }
      ;[red, green, blue] = best
    }

    data[index] = red
    data[index + 1] = green
    data[index + 2] = blue
  }
  context.putImageData(image, 0, 0)
}

function drawPhoto(canvas: HTMLCanvasElement, image: HTMLImageElement, options: {
  fit: 'fill' | 'fit'
  treatment: Treatment
  brightness: number
  contrast: number
  offsetX: number
  offsetY: number
  zoom: number
}, outputWidth = 450, outputHeight = 600) {
  canvas.width = outputWidth
  canvas.height = outputHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return
  context.fillStyle = '#f3efe5'
  context.fillRect(0, 0, outputWidth, outputHeight)

  const baseScale = options.fit === 'fill'
    ? Math.max(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight)
    : Math.min(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight)
  const scale = baseScale * options.zoom
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const availableX = Math.max(0, width - outputWidth)
  const availableY = Math.max(0, height - outputHeight)
  const x = (outputWidth - width) / 2 - (options.offsetX / 100) * availableX / 2
  const y = (outputHeight - height) / 2 - (options.offsetY / 100) * availableY / 2
  context.drawImage(image, x, y, width, height)
  processPixels(context, outputWidth, outputHeight, options.treatment, options.brightness, options.contrast)
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not prepare the photo.')), 'image/jpeg', quality)
  })
}

export function PhotoPortal() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [settings, setSettings] = useState<FrameSettings>(defaultSettings)
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [fit, setFit] = useState<'fill' | 'fit'>('fill')
  const [treatment, setTreatment] = useState<Treatment>('black-and-white')
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(15)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragOrigin = useRef({ pointerX: 0, pointerY: 0, offsetX: 0, offsetY: 0 })

  const loadLibrary = useCallback(async () => {
    setPhase('loading')
    try {
      const response = await fetch('/api/photos', { credentials: 'same-origin' })
      if (response.status === 401) {
        setPhase('locked')
        return
      }
      if (!response.ok) throw new Error('The photo library could not be loaded.')
      const data = await response.json() as LibraryResponse
      setPhotos(data.photos)
      setSettings(data.settings)
      setPhase('ready')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The photo library could not be loaded.')
      setPhase('error')
    }
  }, [])

  useEffect(() => { void loadLibrary() }, [loadLibrary])

  useEffect(() => {
    return () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl) }
  }, [sourceUrl])

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return
    drawPhoto(canvasRef.current, sourceImage, { fit, treatment, brightness, contrast, offsetX: offset.x, offsetY: offset.y, zoom })
  }, [brightness, contrast, fit, offset, sourceImage, treatment, zoom])

  function selectFile(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > 30_000_000) {
      setMessage('Choose an image smaller than 30 MB.')
      return
    }
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    const nextUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      setSourceImage(image)
      setSelectedFile(file)
      setSourceUrl(nextUrl)
      setFit('fill')
      setOffset({ x: 0, y: 0 })
      setZoom(1)
      setMessage('')
    }
    image.onerror = () => {
      URL.revokeObjectURL(nextUrl)
      setMessage('That image could not be opened.')
    }
    image.src = nextUrl
  }

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setPhase('loading')
    const response = await fetch('/api/unlock', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
    })
    if (!response.ok) {
      setMessage('That display token was not accepted.')
      setPhase('locked')
      return
    }
    setToken('')
    await loadLibrary()
  }

  async function uploadPhoto() {
    if (!sourceImage || !selectedFile) return
    setUploading(true)
    setMessage('')
    try {
      const displayCanvas = document.createElement('canvas')
      const thumbnailCanvas = document.createElement('canvas')
      const options = { fit, treatment, brightness, contrast, offsetX: offset.x, offsetY: offset.y, zoom }
      drawPhoto(displayCanvas, sourceImage, options, 1200, 1600)
      drawPhoto(thumbnailCanvas, sourceImage, options, 300, 400)
      const [display, thumbnail] = await Promise.all([canvasBlob(displayCanvas, 0.9), canvasBlob(thumbnailCanvas, 0.82)])
      const form = new FormData()
      form.set('display', display, 'display.jpg')
      form.set('thumbnail', thumbnail, 'thumbnail.jpg')
      form.set('name', selectedFile.name)
      form.set('treatment', treatment)
      const response = await fetch('/api/photos', { method: 'POST', credentials: 'same-origin', body: form })
      const data = await response.json() as { photo?: Photo; error?: string }
      if (!response.ok || !data.photo) throw new Error(data.error ?? 'The photo could not be uploaded.')
      setPhotos((current) => [data.photo as Photo, ...current])
      clearEditor()
      setMessage('Photo added to the frame rotation.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The photo could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  function clearEditor() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    setSourceUrl('')
    setSourceImage(null)
    setSelectedFile(null)
    setOffset({ x: 0, y: 0 })
  }

  async function updateSettings(update: Partial<FrameSettings>) {
    const optimistic = { ...settings, ...update }
    setSettings(optimistic)
    const response = await fetch('/api/frame-settings', {
      method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update),
    })
    if (!response.ok) {
      setMessage('The frame setting could not be saved.')
      await loadLibrary()
    }
  }

  async function togglePhoto(photo: Photo) {
    setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, enabled: !item.enabled } : item))
    const response = await fetch(`/api/photos/${photo.id}`, {
      method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !photo.enabled }),
    })
    if (!response.ok) {
      setMessage('The photo setting could not be saved.')
      await loadLibrary()
    }
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm(`Remove “${photo.name}” from the frame?`)) return
    const response = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE', credentials: 'same-origin' })
    if (response.ok) setPhotos((current) => current.filter((item) => item.id !== photo.id))
    else setMessage('The photo could not be removed.')
  }

  function startDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!sourceImage) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, offsetX: offset.x, offsetY: offset.y }
    setDragging(true)
  }

  function moveDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!dragging) return
    setOffset({
      x: Math.max(-100, Math.min(100, dragOrigin.current.offsetX - (event.clientX - dragOrigin.current.pointerX) / 2)),
      y: Math.max(-100, Math.min(100, dragOrigin.current.offsetY - (event.clientY - dragOrigin.current.pointerY) / 2)),
    })
  }

  if (phase === 'loading') return <PortalState icon={<LoaderCircle className="state-spinner" />} title="Opening photo library" />
  if (phase === 'error') return <PortalState title="Couldn’t open the library" message={message} action="Try again" onAction={() => void loadLibrary()} />
  if (phase === 'locked') {
    return (
      <main className="photo-login">
        <form onSubmit={unlock}>
          <KeyRound aria-hidden="true" />
          <p className="eyebrow">Private frame</p>
          <h1>Open my photo library.</h1>
          <p>Use the same private token as the flight display.</p>
          <label htmlFor="photo-token">Display token</label>
          <input id="photo-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoFocus />
          {message && <p className="portal-error" role="alert">{message}</p>}
          <button type="submit">Unlock library</button>
        </form>
      </main>
    )
  }

  const activeCount = photos.filter((photo) => photo.enabled).length
  return (
    <div className="photo-portal">
      <header className="portal-header">
        <a href="/" className="portal-brand">HiZach <span>/ Frame</span></a>
        <nav aria-label="Frame navigation">
          <a href="/">Flight display</a>
          <a href="/photos" aria-current="page">Photo library</a>
        </nav>
        <span className="private-mark"><Lock aria-hidden="true" /> Private</span>
      </header>

      <main>
        <section className="portal-intro">
          <p className="eyebrow">One frame at home</p>
          <h1>Photos for the frame.</h1>
          <p>Upload, crop and choose what rotates between flights.</p>
        </section>

        <section className="portal-workspace">
          <div className={`frame-preview ${sourceImage ? 'has-photo' : ''}`}>
            <div className="frame-mat">
              {sourceImage ? (
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDrag}
                  onPointerMove={moveDrag}
                  onPointerUp={() => setDragging(false)}
                  onPointerCancel={() => setDragging(false)}
                  aria-label="Photo crop preview. Drag to reposition."
                />
              ) : photos[0] ? (
                <img src={`/api/photos/${photos[0].id}/display`} alt="Current frame photo preview" />
              ) : (
                <div className="empty-frame">
                  <ImagePlus aria-hidden="true" />
                  <p>Your first photo<br />will appear here.</p>
                </div>
              )}
            </div>
            <p>{sourceImage ? 'Drag the image to reframe it' : photos.length ? 'Latest photo in the library' : 'Empty frame · ready for a photo'}</p>
          </div>

          <div className="portal-controls">
            <div className="control-section upload-section">
              <div>
                <span className="section-number">01</span>
                <h2>Add a photo</h2>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => { const file = event.target.files?.[0]; if (file) selectFile(file) }}
                hidden
              />
              <button className="upload-dropzone" type="button" onClick={() => fileInputRef.current?.click()}>
                <Upload aria-hidden="true" />
                <span>{selectedFile ? selectedFile.name : 'Choose a photo'}</span>
                <small>JPG, PNG or WebP · up to 30 MB</small>
              </button>
            </div>

            <div className="control-section">
              <div className="control-heading">
                <div><span className="section-number">02</span><h2>Frame mode</h2></div>
                <span>{settings.mode === 'automatic' ? 'Follows my flights' : 'Manual override'}</span>
              </div>
              <div className="segmented three" role="group" aria-label="Frame mode">
                {(['automatic', 'flight', 'photo'] as FrameMode[]).map((mode) => (
                  <button type="button" className={settings.mode === mode ? 'selected' : ''} onClick={() => void updateSettings({ mode })} key={mode}>
                    {mode === 'flight' && <Plane aria-hidden="true" />}{mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <p className="control-note">Automatic shows a flight 3 hours before departure, then returns to photos after landing when there is no close connection.</p>
            </div>

            <div className={`control-section crop-section ${sourceImage ? '' : 'is-disabled'}`}>
              <div><span className="section-number">03</span><h2>Crop & preview</h2></div>
              <div className="option-row">
                <span>Layout</span>
                <div className="segmented">
                  <button type="button" className={fit === 'fill' ? 'selected' : ''} onClick={() => setFit('fill')} disabled={!sourceImage}>Fill</button>
                  <button type="button" className={fit === 'fit' ? 'selected' : ''} onClick={() => setFit('fit')} disabled={!sourceImage}>Fit</button>
                </div>
              </div>
              <div className="option-row">
                <span>Display</span>
                <div className="segmented">
                  <button type="button" className={treatment === 'black-and-white' ? 'selected' : ''} onClick={() => setTreatment('black-and-white')} disabled={!sourceImage}>B&amp;W</button>
                  <button type="button" className={treatment === 'six-color' ? 'selected' : ''} onClick={() => setTreatment('six-color')} disabled={!sourceImage}>Six color</button>
                </div>
              </div>
              <label className="slider-row"><span>Zoom</span><input type="range" min="1" max="2" step="0.02" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} disabled={!sourceImage} /></label>
              <label className="slider-row"><span>Contrast</span><input type="range" min="-40" max="70" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} disabled={!sourceImage} /></label>
              <label className="slider-row"><span>Brightness</span><input type="range" min="-55" max="55" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} disabled={!sourceImage} /></label>
              <div className="editor-actions">
                <button type="button" className="text-action" onClick={clearEditor} disabled={!sourceImage}><X aria-hidden="true" />Clear</button>
                <button type="button" className="save-photo" onClick={() => void uploadPhoto()} disabled={!sourceImage || uploading}>
                  {uploading ? <LoaderCircle className="state-spinner" aria-hidden="true" /> : <Check aria-hidden="true" />}
                  {uploading ? 'Saving…' : 'Add to rotation'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rotation-section">
          <div className="rotation-heading">
            <div><p className="eyebrow">On the frame</p><h2>Photo rotation</h2></div>
            <button type="button" className={settings.rotation === 'shuffle' ? 'shuffle-on' : ''} onClick={() => void updateSettings({ rotation: settings.rotation === 'shuffle' ? 'ordered' : 'shuffle' })}>
              <Shuffle aria-hidden="true" /> {settings.rotation === 'shuffle' ? 'Shuffle on' : 'In order'}
            </button>
          </div>

          {photos.length === 0 ? (
            <button type="button" className="empty-library" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus aria-hidden="true" />
              <span>No photos yet. Add the first image for your frame.</span>
            </button>
          ) : (
            <div className="photo-rail">
              {photos.map((photo) => (
                <article className={`photo-card ${photo.enabled ? '' : 'is-paused'}`} key={photo.id}>
                  <img src={`/api/photos/${photo.id}/thumbnail`} alt="" loading="lazy" />
                  <div className="photo-card-info">
                    <div><p>{photo.name}</p><span>{photo.treatment === 'black-and-white' ? 'Black & white' : 'Six color'}</span></div>
                    <button className={`photo-toggle ${photo.enabled ? 'is-on' : ''}`} type="button" onClick={() => void togglePhoto(photo)} aria-label={`${photo.enabled ? 'Pause' : 'Include'} ${photo.name}`} aria-pressed={photo.enabled}><span /></button>
                    <button className="delete-photo" type="button" onClick={() => void deletePhoto(photo)} aria-label={`Delete ${photo.name}`}><Trash2 aria-hidden="true" /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {message && <div className="portal-toast" role="status">{message}<button type="button" onClick={() => setMessage('')} aria-label="Dismiss"><X /></button></div>}
      </main>

      <footer className="portal-footer">
        <p>Private R2 library · {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · {activeCount} active</p>
        <a href="/">Back to flight project</a>
      </footer>
    </div>
  )
}

function PortalState({ icon, title, message, action, onAction }: { icon?: React.ReactNode; title: string; message?: string; action?: string; onAction?: () => void }) {
  return <main className="portal-state">{icon}<h1>{title}</h1>{message && <p>{message}</p>}{action && <button type="button" onClick={onAction}>{action}</button>}</main>
}
