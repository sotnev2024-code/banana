import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// Init Telegram Web App
const tg = window.Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()

  // Request fullscreen on mobile
  if (typeof (tg as any).requestFullscreen === 'function') {
    try { (tg as any).requestFullscreen() } catch {}
  }

  // Adapt colors to theme
  const isDark = tg.colorScheme === 'dark'
  tg.setHeaderColor(isDark ? '#1a1a1e' : '#ffffff')
  tg.setBackgroundColor(isDark ? '#1a1a1e' : '#f5f5f0')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
