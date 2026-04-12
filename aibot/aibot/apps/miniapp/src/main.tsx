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
  tg.setHeaderColor('#ffffff')
  tg.setBackgroundColor('#f5f5f0')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
