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

  // Set safe area top padding for fullscreen mode
  function updateSafeArea() {
    const csa = (tg as any).contentSafeAreaInset
    const sa = (tg as any).safeAreaInset
    const top = (csa?.top ?? 0) + (sa?.top ?? 0)
    document.documentElement.style.setProperty('--tg-top', `${top}px`)
  }

  updateSafeArea()

  // Listen for viewport changes
  if (typeof (tg as any).onEvent === 'function') {
    (tg as any).onEvent('contentSafeAreaChanged', updateSafeArea)
    (tg as any).onEvent('safeAreaChanged', updateSafeArea)
    (tg as any).onEvent('fullscreenChanged', updateSafeArea)
  }

  // Fallback: check after a short delay (some clients fire events late)
  setTimeout(updateSafeArea, 300)
  setTimeout(updateSafeArea, 1000)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
