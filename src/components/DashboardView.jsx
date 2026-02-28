import { useMemo } from 'react'
import { useLedger } from '../context/LedgerContext'
import { getAccountLabel, getAccountIcon } from '../i18n'

function getBalanceForAccount(entries, account) {
  return entries
    .filter((e) => (e.account || '').toLowerCase() === (account || '').toLowerCase())
    .reduce((sum, e) => sum + (e.credit || 0) - (e.debit || 0), 0)
}

function getPendingByParty(entries) {
  const byParty = {}
  entries.forEach((e) => {
    const p = (e.party || '').trim()
    if (!p) return
    if (!byParty[p]) byParty[p] = 0
    byParty[p] += (e.debit || 0) - (e.credit || 0)
  })
  return Object.entries(byParty)
    .filter(([, pending]) => pending > 0)
    .map(([name, pending]) => ({ name, pending }))
    .sort((a, b) => b.pending - a.pending)
}

function getLastEntryDate(entries, account) {
  const filtered = entries
    .filter((e) => (e.account || '').toLowerCase() === (account || '').toLowerCase())
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''))
  return filtered[0]?.date || null
}

function formatNum(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function timeAgo(dateStr, t, lang = 'en') {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN'
  if (diffHrs < 1) return t.justNow || 'Just now'
  if (diffHrs < 24) return `${diffHrs} ${t.hoursAgo || 'hours ago'}`
  if (diffDays === 1) return t.oneDayAgo || '1 day ago'
  if (diffDays < 7) return `${diffDays} ${t.daysAgo || 'days ago'}`
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

export default function DashboardView({
  t,
  lang,
  onViewReport,
  onSelectAccount,
  onAddEntry,
  refreshTrigger,
}) {
  const { accounts, entries } = useLedger()

  const accountList = useMemo(() => {
    return accounts
      .map((acc) => ({
        key: acc,
        label: getAccountLabel(acc, lang),
        balance: getBalanceForAccount(entries, acc),
        lastDate: getLastEntryDate(entries, acc),
      }))
      .filter((a) => a.balance !== 0)
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
  }, [accounts, entries, lang, refreshTrigger])

  const pendingList = useMemo(() => getPendingByParty(entries), [entries, refreshTrigger])

  // Match Ledger/Reports calculation: sum of debits = expense, sum of credits = income
  const { totalSpent, totalReceived, net } = useMemo(() => {
    let expense = 0
    let income = 0
    entries.forEach((e) => {
      expense += e.debit || 0
      income += e.credit || 0
    })
    return {
      totalSpent: expense,
      totalReceived: income,
      net: income - expense,
    }
  }, [entries])

  return (
    <section style={{ paddingBottom: 24 }}>
      {/* Summary Card */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--gray-200)',
        }}
      >
        <div className="dashboard-summary" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {t.totalExpense || 'Total Expense'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--red-600)' }}>
              ₹{formatNum(totalSpent)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {t.totalIncome || 'Total Income'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--green-600)' }}>
              ₹{formatNum(totalReceived)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {t.net || 'Net'}
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: net >= 0 ? 'var(--green-600)' : 'var(--red-600)',
              }}
            >
              ₹{formatNum(net)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewReport}
          title={t.viewReportHint}
          style={{
            width: '100%',
            padding: 12,
            background: '#2563eb',
            color: 'var(--white)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          {t.viewReport || 'VIEW REPORT'} ›
        </button>
      </div>

      {/* Pending Collections */}
      {pendingList.length > 0 && (
        <>
          <div style={{ marginBottom: 12, padding: '0 4px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              {t.pendingCollections || 'Pending to collect'}
            </span>
          </div>
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--gray-200)',
              marginBottom: 16,
            }}
          >
            {pendingList.map(({ name, pending }) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--gray-200)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{name}</span>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--red-600)' }}>
                  ₹{formatNum(pending)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* List Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '0 4px',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>
          {accountList.length} {t.accounts || 'Accounts'}
        </span>
      </div>

      {/* Account List */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--gray-200)',
        }}
      >
        {accountList.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            <p>{t.noEntriesGeneric || 'No entries yet. Add one to get started.'}</p>
          </div>
        ) : (
          accountList.map((acc) => (
            <button
              key={acc.key}
              type="button"
              onClick={() => onSelectAccount(acc.key)}
              title={t.accountCardHint}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderBottom: '1px solid var(--gray-200)',
                textAlign: 'left',
                background: 'transparent',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--gray-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                }}
              >
                {getAccountIcon(acc.key)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {acc.label}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {acc.lastDate ? timeAgo(acc.lastDate, t, lang) : ''}
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  flexShrink: 0,
                  color: acc.balance > 0 ? 'var(--green-600)' : 'var(--red-600)',
                }}
              >
                ₹{formatNum(Math.abs(acc.balance))}
                <div style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  {acc.balance > 0 ? t.received || 'Received' : t.spent || 'Spent'}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
