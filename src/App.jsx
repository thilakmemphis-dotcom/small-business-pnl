import { useState, useEffect, useCallback } from 'react'
import { translations } from './i18n'
import { useLedger } from './context/LedgerContext'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import DashboardView from './components/DashboardView'
import LedgerView from './components/LedgerView'
import ReportsView from './components/ReportsView'
import EntryForm from './components/EntryForm'
import AuthScreen from './components/AuthScreen'

const LANG_KEY = 'small-business-pnl-lang'

function getInitialLang() {
  try {
    return localStorage.getItem(LANG_KEY) || 'en'
  } catch (_) {
    return 'en'
  }
}

function App() {
  const { addEntry, refresh, loading, clearAllData } = useLedger()
  const { user, loading: authLoading, login, signup, logout, hasApi } = useAuth()
  const [lang, setLang] = useState(getInitialLang)
  const [activeTab, setActiveTab] = useState('home') // 'home' | 'ledger' | 'reports'
  const [formOpen, setFormOpen] = useState(false)
  const [formOpenedFrom, setFormOpenedFrom] = useState('home') // 'home' | 'ledger' | 'fab'
  const [initialAccount, setInitialAccount] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [accountToSelect, setAccountToSelect] = useState(null)

  const t = translations[lang] || translations.en

  const refreshApp = useCallback(() => {
    refresh()
    setRefreshTrigger((k) => k + 1)
  }, [refresh])

  const handleSaveEntry = (data) => {
    addEntry(data)
    const acc = (data.account || '').trim() || 'Other'
    setAccountToSelect(acc)
    refreshApp()
    setFormOpen(false)
    setActiveTab(formOpenedFrom === 'ledger' ? 'ledger' : 'home')
  }

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch (_) {}
    document.documentElement.lang = lang === 'ta' ? 'ta' : 'en'
    document.body.classList.toggle('lang-ta', lang === 'ta')
  }, [lang])

  useEffect(() => {
    if (hasApi && user) refresh()
  }, [hasApi, user, refresh])

  const handleSelectAccount = (acc) => {
    setAccountToSelect(acc)
    setActiveTab('ledger')
  }

  const handleViewReport = () => {
    setActiveTab('reports')
  }

  if (hasApi && !authLoading && !user) {
    return (
      <AuthScreen
        lang={lang}
        onLangToggle={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
        onLogin={login}
        onSignup={signup}
      />
    )
  }

  if (loading || authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
        }}
      >
        {lang === 'ta' ? 'லோட் செய்யுது…' : 'Loading…'}
      </div>
    )
  }

  return (
    <>
      <Header
        title={t.appName}
        lang={lang}
        onLangToggle={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
        user={user}
        onLogout={logout}
      />

      <main style={{ padding: '16px 20px calc(80px + env(safe-area-inset-bottom)) 20px', maxWidth: 480, margin: '0 auto' }}>
        {activeTab === 'home' && (
          <DashboardView
            t={t}
            lang={lang}
            onViewReport={handleViewReport}
            onSelectAccount={handleSelectAccount}
            onAddEntry={() => {
              setFormOpenedFrom('home')
              setFormOpen(true)
            }}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === 'ledger' && (
          <LedgerView
            t={t}
            lang={lang}
            onAddEntry={(account) => {
              setFormOpenedFrom('ledger')
              setInitialAccount(account || '')
              setFormOpen(true)
            }}
            onRefresh={refreshApp}
            refreshTrigger={refreshTrigger}
            accountToSelect={accountToSelect}
            onAccountSelected={() => setAccountToSelect(null)}
          />
        )}
        {activeTab === 'reports' && (
          <>
            <ReportsView t={t} refreshTrigger={refreshTrigger} lang={lang} />
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(t.clearDataConfirm)) {
                  await clearAllData()
                  refreshApp()
                }
              }}
              title={t.clearDataHint}
              style={{
                width: '100%',
                marginTop: 20,
                padding: 14,
                background: 'var(--white)',
                color: 'var(--red-600)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                border: '1px solid var(--gray-200)',
              }}
            >
              {t.clearData}
            </button>
          </>
        )}
      </main>

      {/* FAB - Add Entry */}
      <button
        data-testid="fab-add-entry"
        type="button"
        onClick={() => {
          setFormOpenedFrom('fab')
          setInitialAccount('')
          setFormOpen(true)
        }}
        aria-label={t.addEntry}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #ec4899 0%, #dc2626 100%)',
          color: 'var(--white)',
          fontSize: '1.5rem',
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(236, 72, 153, 0.4)',
          zIndex: 100,
        }}
      >
        +
      </button>

      {/* Bottom Navigation */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--white)',
          borderTop: '1px solid var(--gray-200)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '12px 0',
          zIndex: 50,
        }}
      >
        <button
          data-testid="nav-home"
          type="button"
          onClick={() => setActiveTab('home')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            color: activeTab === 'home' ? '#2563eb' : 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{t.home || 'Home'}</span>
        </button>
        <button
          data-testid="nav-ledger"
          type="button"
          onClick={() => setActiveTab('ledger')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            color: activeTab === 'ledger' ? '#2563eb' : 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📒</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{t.ledger}</span>
        </button>
        <button
          data-testid="nav-reports"
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            color: activeTab === 'reports' ? '#2563eb' : 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📊</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{t.reports}</span>
        </button>
      </nav>

      {formOpen && (
        <EntryForm
          t={t}
          onSave={handleSaveEntry}
          onClose={() => setFormOpen(false)}
          initialAccount={initialAccount}
          lang={lang}
        />
      )}
    </>
  )
}

export default App
