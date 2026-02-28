import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './context/AuthContext'
import { LedgerProvider } from './context/LedgerContext'
import App from './App'
import { translations } from './i18n'
import './index.css'

// Service worker: show "Refresh to update" banner when new version is available
const LANG_KEY = 'small-business-pnl-lang'
const updateSW = registerSW({
  onNeedRefresh() {
    const lang = localStorage.getItem(LANG_KEY) || 'en'
    const t = translations[lang] || translations.en
    const banner = document.createElement('div')
    banner.setAttribute('role', 'alert')
    banner.style.cssText = `
      position: fixed;
      bottom: calc(80px + env(safe-area-inset-bottom));
      left: 12px;
      right: 12px;
      max-width: 456px;
      margin: 0 auto;
      padding: 14px 18px;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(13,148,136,0.4);
      z-index: 9999;
      font-size: 0.9375rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: pointer;
    `
    banner.innerHTML = `
      <span>${t.updateAvailable || 'New version available'}. ${t.refreshToUpdate || 'Refresh to update'}.</span>
      <span style="font-size: 1.25rem">↻</span>
    `
    banner.onclick = () => {
      banner.remove()
      updateSW()
    }
    document.body.appendChild(banner)
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LedgerProvider>
        <App />
      </LedgerProvider>
    </AuthProvider>
  </React.StrictMode>
)
