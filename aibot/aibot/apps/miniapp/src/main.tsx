import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// Init Telegram Web App
try {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready()
    tg.expand()

    // Request fullscreen on mobile
    try {
      if (typeof (tg as any).requestFullscreen === 'function') {
        (tg as any).requestFullscreen()
      }
    } catch {}

    // Adapt colors to theme
    try {
      const isDark = tg.colorScheme === 'dark'
      tg.setHeaderColor(isDark ? '#1a1a1e' : '#ffffff')
      tg.setBackgroundColor(isDark ? '#1a1a1e' : '#f5f5f0')
    } catch {}

    // Set safe area top padding
    function updateSafeArea() {
      try {
        const csa = (tg as any).contentSafeAreaInset
        const sa = (tg as any).safeAreaInset
        const top = (csa?.top ?? 0) + (sa?.top ?? 0)
        if (top > 0) {
          document.documentElement.style.setProperty('--tg-top', `${top}px`)
        }
      } catch {}
    }

    updateSafeArea()

    try {
      if (typeof (tg as any).onEvent === 'function') {
        (tg as any).onEvent('contentSafeAreaChanged', updateSafeArea)
        (tg as any).onEvent('safeAreaChanged', updateSafeArea)
      }
    } catch {}

    setTimeout(updateSafeArea, 500)
  }
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
