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

    // Disable swipe-down to close
    try {
      if (typeof (tg as any).disableVerticalSwipes === 'function') {
        (tg as any).disableVerticalSwipes()
      }
    } catch {}

    // Neon dark theme for Telegram header + background
    try {
      tg.setHeaderColor('#060607')
      tg.setBackgroundColor('#060607')
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
