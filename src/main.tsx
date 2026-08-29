import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { FrameRender } from './components/FrameRender'
import { PhotoPortal } from './components/PhotoPortal'
import './styles.css'
import './photo-portal.css'

const page = window.location.pathname === '/photos'
  ? <PhotoPortal />
  : window.location.pathname === '/frame-render'
    ? <FrameRender />
    : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page}
  </StrictMode>,
)
