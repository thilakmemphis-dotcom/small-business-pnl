import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { LedgerProvider } from './context/LedgerContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LedgerProvider>
        <App />
      </LedgerProvider>
    </AuthProvider>
  </React.StrictMode>
)
