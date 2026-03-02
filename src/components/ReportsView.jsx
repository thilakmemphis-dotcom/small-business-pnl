import { useState, useMemo } from 'react'
import { useLedger } from '../context/LedgerContext'
import {
  getSummaryForPeriod,
  getWeekBounds,
  getMonthBounds,
} from '../storage'

function formatNum(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatPrice(n) {
  const v = Number(n)
  if (Number.isNaN(v)) return '0'
  return v.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

function formatDate(dateStr, lang = 'en') {
  const d = new Date(dateStr)
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN'
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function ReportsView({ t, refreshTrigger, lang = 'en' }) {
  const { entries: allEntries } = useLedger()
  const today = new Date().toISOString().slice(0, 10)
  const [period, setPeriod] = useState('weekly') // 'weekly' | 'monthly'
  const [weekDate, setWeekDate] = useState(today)
  const [monthDate, setMonthDate] = useState(today)

  const bounds = useMemo(() => {
    if (period === 'weekly') return getWeekBounds(weekDate)
    return getMonthBounds(monthDate)
  }, [period, weekDate, monthDate])

  const entries = useMemo(() => {
    return allEntries
      .filter(e => e.date >= bounds.start && e.date <= bounds.end)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [allEntries, bounds, refreshTrigger])

  const summary = useMemo(() => getSummaryForPeriod(entries), [entries])

  const entriesByDate = useMemo(() => {
    const map = new Map()
    entries.forEach(e => {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date).push(e)
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [entries])

  /** Group day entries by party; each group has { party, totalOut, totalIn, net } */
  const groupByParty = (dayEntries) => {
    const byParty = new Map()
    dayEntries.forEach(e => {
      const key = (e.party || '').trim() || '__none__'
      if (!byParty.has(key)) {
        byParty.set(key, { party: key === '__none__' ? null : key, totalOut: 0, totalIn: 0 })
      }
      const g = byParty.get(key)
      g.totalOut += e.debit || 0
      g.totalIn += e.credit || 0
    })
    return [...byParty.entries()].map(([k, g]) => ({
      ...g,
      net: g.totalIn - g.totalOut,
    })).sort((a, b) => a.net - b.net) // Most pending first
  }

  const goPrev = () => {
    if (period === 'weekly') {
      const d = new Date(weekDate)
      d.setDate(d.getDate() - 7)
      setWeekDate(d.toISOString().slice(0, 10))
    } else {
      const [y, m] = monthDate.split('-')
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 2, 1)
      setMonthDate(d.toISOString().slice(0, 10))
    }
  }

  const goNext = () => {
    if (period === 'weekly') {
      const d = new Date(weekDate)
      d.setDate(d.getDate() + 7)
      setWeekDate(d.toISOString().slice(0, 10))
    } else {
      const [y, m] = monthDate.split('-')
      const d = new Date(parseInt(y, 10), parseInt(m, 10), 1)
      setMonthDate(d.toISOString().slice(0, 10))
    }
  }

  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN'
  const periodLabel = period === 'weekly'
    ? `${formatDate(bounds.start, lang)} – ${formatDate(bounds.end, lang)}`
    : new Date(bounds.start + 'T12:00:00').toLocaleDateString(locale, { month: 'long', year: 'numeric' })

  return (
    <section className="reports-view">
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 20,
          padding: 4,
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--gray-200)',
        }}
      >
        <button
          type="button"
          onClick={() => setPeriod('weekly')}
          data-active={period === 'weekly'}
          title={t.reportsWeeklyHint}
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '0.9375rem',
            background: period === 'weekly' ? 'var(--slate-900)' : 'transparent',
            color: period === 'weekly' ? 'var(--white)' : 'var(--text-secondary)',
          }}
        >
          {t.weekly}
        </button>
        <button
          type="button"
          onClick={() => setPeriod('monthly')}
          data-active={period === 'monthly'}
          title={t.reportsMonthlyHint}
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '0.9375rem',
            background: period === 'monthly' ? 'var(--slate-900)' : 'transparent',
            color: period === 'monthly' ? 'var(--white)' : 'var(--text-secondary)',
          }}
        >
          {t.monthly}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
          padding: '14px 20px',
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--gray-200)',
        }}
      >
        <button
          type="button"
          onClick={goPrev}
          title={t.reportsDateNavHint}
          style={{
            minWidth: 44,
            minHeight: 44,
            borderRadius: 'var(--radius-sm)',
            fontSize: '1.25rem',
            fontWeight: 600,
            background: 'var(--gray-100)',
            color: 'var(--slate-700)',
          }}
        >
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', flex: 1, textAlign: 'center', color: 'var(--slate-900)' }}>
          {periodLabel}
        </span>
        <button
          type="button"
          onClick={goNext}
          title={t.reportsDateNavHint}
          style={{
            minWidth: 44,
            minHeight: 44,
            borderRadius: 'var(--radius-sm)',
            fontSize: '1.25rem',
            fontWeight: 600,
            background: 'var(--gray-100)',
            color: 'var(--slate-700)',
          }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
          padding: 20,
          background: 'var(--slate-900)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--white)',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.totalIncome}</div>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹{formatNum(summary.income)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.totalExpense}</div>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹{formatNum(summary.expense)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.net}</div>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹{formatNum(summary.net)}</div>
        </div>
      </div>

      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 14, color: 'var(--slate-900)' }}>
        {period === 'weekly' ? t.weeklyReport : t.monthlyReport}
      </h3>
      {entriesByDate.length === 0 ? (
        <p
          style={{
            color: 'var(--text-secondary)',
            padding: 32,
            textAlign: 'center',
            background: 'var(--white)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)',
          }}
        >
          {t.noEntries}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entriesByDate.map(([date, dayEntries]) => (
            <div
              key={date}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--gray-200)',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--slate-100)',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  color: 'var(--gray-600)',
                }}
              >
                {formatDate(date, lang)}
              </div>
              <ul style={{ listStyle: 'none' }}>
                {groupByParty(dayEntries).map((g, idx) => (
                  <li
                    key={g.party ?? `general-${idx}`}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--gray-200)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--slate-900)', marginBottom: 8 }}>
                      {g.party || (t.noCustomer || 'General')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--gray-600)' }}>{t.totalGiven || 'Total Given'}</span>
                        <span style={{ fontWeight: 600, color: 'var(--red-600)', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{formatNum(g.totalOut)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--gray-600)' }}>{t.totalCollected || 'Total Collected'}</span>
                        <span style={{ fontWeight: 600, color: 'var(--green-600)', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{formatNum(g.totalIn)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 6,
                          paddingTop: 6,
                          borderTop: '1px solid var(--gray-200)',
                          fontWeight: 700,
                          fontSize: '1rem',
                        }}
                      >
                        <span style={{ color: 'var(--slate-700)' }}>{t.net || 'Net'}</span>
                        {g.net < 0 ? (
                          <span style={{ color: 'var(--red-600)', fontVariantNumeric: 'tabular-nums' }}>
                            ₹{formatNum(Math.abs(g.net))} ({t.balancePending})
                          </span>
                        ) : g.net > 0 ? (
                          <span style={{ color: 'var(--green-600)', fontVariantNumeric: 'tabular-nums' }}>
                            ₹{formatNum(g.net)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--gray-500)', fontVariantNumeric: 'tabular-nums' }}>—</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
