import { useMemo } from 'react'
import { useLedger } from '../context/LedgerContext'
import { getAvatarColor } from '../lib/avatarColor'

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

function formatNum(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function DashboardView({
  t,
  lang,
  onViewReport,
  onAddEntry,
  refreshTrigger,
}) {
  const { entries } = useLedger()

  const pendingList = useMemo(() => getPendingByParty(entries), [entries, refreshTrigger])
  const totalOutstanding = useMemo(
    () => pendingList.reduce((sum, { pending }) => sum + pending, 0),
    [pendingList]
  )

  const { givenToday: todayExpense, receivedToday: todayIncome } = useMemo(() => {
    const d = new Date()
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    let expense = 0
    let income = 0
    ;(entries || []).forEach((e) => {
      const raw = (e.date || '').toString().trim()
      let entryDate = raw.slice(0, 10)
      if (!entryDate) return
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
        const parsed = new Date(raw)
        if (Number.isNaN(parsed.getTime())) return
        entryDate = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
      }
      if (entryDate !== todayStr) return
      expense += Number(e.debit ?? e.Debit) || 0
      income += Number(e.credit ?? e.Credit) || 0
    })
    return { givenToday: expense, receivedToday: income }
  }, [entries, refreshTrigger])

  return (
    <section style={{ paddingBottom: 24 }}>
      {/* Daily Control Panel Card */}
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
        {/* 1. Today's Status – icon-first, red=out green=in */}
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '2px dashed var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '1.25rem' }} aria-hidden>📅</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: 600 }} title={new Date().toISOString().slice(0, 10)}>
              {t.today || 'Today'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                <span style={{ fontSize: '1.25rem' }} aria-hidden>💸</span>
                {t.givenToday || 'Given'}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--red-600)', fontVariantNumeric: 'tabular-nums' }}>
                ₹{formatNum(todayExpense)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                <span style={{ fontSize: '1.25rem' }} aria-hidden>💰</span>
                {t.receivedToday || 'Received'}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-600)', fontVariantNumeric: 'tabular-nums' }}>
                ₹{formatNum(todayIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Outstanding Customers – icon-first */}
        {(pendingList.length > 0) && (
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '2px dashed var(--gray-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '1.25rem' }} aria-hidden>👥</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: 600 }}>
                {t.outstandingCustomers || t.pendingCollections || 'Outstanding Customers'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingList.map(({ name, pending }) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: '0.9375rem' }}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: getAvatarColor(name),
                        flexShrink: 0,
                      }}
                      aria-hidden
                    />
                    {name}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--red-600)', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{formatNum(pending)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Total Outstanding – icon + red = pending/debt */}
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '2px dashed var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.25rem' }} aria-hidden>💰</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: 600 }}>
              {t.totalOutstanding || 'Total Outstanding'}
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalOutstanding > 0 ? 'var(--red-600)' : 'var(--gray-500)' }}>
            ₹{formatNum(totalOutstanding)}
          </div>
        </div>

        {/* Add Entry + View Report – icon-first */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={onAddEntry}
            title={t.addEntry}
            style={{
              width: '100%',
              padding: 16,
              background: 'var(--slate-900)',
              color: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '1.5rem' }} aria-hidden>➕</span>
            <span style={{ fontSize: '1.25rem' }} aria-hidden>💵</span>
            {t.addEntry}
          </button>
          <button
            type="button"
            onClick={onViewReport}
            title={t.viewReportHint}
            style={{
              width: '100%',
              padding: 14,
              background: '#2563eb',
              color: 'var(--white)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '1.25rem' }} aria-hidden>📊</span>
            {t.viewReport || 'VIEW REPORT'} ›
          </button>
        </div>
      </div>
    </section>
  )
}
