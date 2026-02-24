import { useState, useEffect, useCallback } from 'react'
import { translations } from './i18n'
import { addEntry, clearAllData } from './storage'
import Header from './components/Header'
import LedgerView from './components/LedgerView'
import ReportsView from './components/ReportsView'
import EntryForm from './components/EntryForm'

const LANG_KEY = 'small-business-pnl-lang'

function getInitialLang() {
  try {
    return localStorage.getItem(LANG_KEY) || 'en'
  } catch (_) {
    return 'en'
  }
}

function App() {
  const [lang, setLang] = useState(getInitialLang)
  const [activeTab, setActiveTab] = useState('ledger') // 'ledger' | 'reports'
  const [formOpen, setFormOpen] = useState(false)
  const [initialAccount, setInitialAccount] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [accountToSelect, setAccountToSelect] = useState(null)

  const t = translations[lang] || translations.en

  const refresh = useCallback(() => {
    setRefreshTrigger((k) => k + 1)
  }, [])

  const handleSaveEntry = (data) => {
    addEntry(data)
    const acc = (data.account || '').trim() || 'Other'
    setAccountToSelect(acc)
    refresh()
    setFormOpen(false)
  }

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch (_) {}
    document.documentElement.lang = lang === 'ta' ? 'ta' : 'en'
    document.body.classList.toggle('lang-ta', lang === 'ta')
  }, [lang])

  const handleClearData = () => {
    if (window.confirm(t.clearDataConfirm)) {
      clearAllData()
      refresh()
    }
  }

  return (
    <>
      <Header
        title={t.appName}
        lang={lang}
        onLangToggle={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
      />

      <main style={{ padding: '16px', paddingBottom: 24, maxWidth: 600, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            padding: 4,
            background: 'var(--gray-200)',
            borderRadius: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            data-active={activeTab === 'ledger'}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '1rem',
              transition: 'all 0.2s',
              background: activeTab === 'ledger' ? 'var(--white)' : 'transparent',
              boxShadow: activeTab === 'ledger' ? '0 2px 12px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t.ledger}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            data-active={activeTab === 'reports'}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '1rem',
              transition: 'all 0.2s',
              background: activeTab === 'reports' ? 'var(--white)' : 'transparent',
              boxShadow: activeTab === 'reports' ? '0 2px 12px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t.reports}
          </button>
        </div>

        {activeTab === 'ledger' && (
          <LedgerView
            t={t}
            lang={lang}
            onAddEntry={(account) => {
              setInitialAccount(account || '')
              setFormOpen(true)
            }}
            onRefresh={refresh}
            refreshTrigger={refreshTrigger}
            accountToSelect={accountToSelect}
            onAccountSelected={() => setAccountToSelect(null)}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsView t={t} refreshTrigger={refreshTrigger} lang={lang} />
        )}

        <button
          type="button"
          onClick={handleClearData}
          title={t.clearDataHint}
          style={{
            width: '100%',
            marginTop: 24,
            padding: '14px 20px',
            background: 'var(--gray-200)',
            color: 'var(--red-600)',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {t.clearData}
        </button>
      </main>

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
