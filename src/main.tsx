import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { PhotoPortal } from './components/PhotoPortal'
import './styles.css'

const page = window.location.pathname === '/photos' ? <PhotoPortal /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page}
  </StrictMode>,
)
