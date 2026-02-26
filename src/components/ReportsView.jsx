import { useState, useMemo } from 'react'
import { useLedger } from '../context/LedgerContext'
import {
  getSummaryForPeriod,
  getWeekBounds,
  getMonthBounds,
} from '../storage'
import { getAccountLabel } from '../i18n'

function formatNum(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatPrice(n) {
  const v = Number(n)
  if (Number.isNaN(v)) return '0'
  return v.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
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

  const periodLabel = period === 'weekly'
    ? `${formatDate(bounds.start)} – ${formatDate(bounds.end)}`
    : new Date(bounds.start + 'T12:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

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
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{formatNum(summary.income)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.totalExpense}</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{formatNum(summary.expense)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.net}</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{formatNum(summary.net)}</div>
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
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--slate-700)',
                }}
              >
                {formatDate(date)}
              </div>
              <ul style={{ listStyle: 'none' }}>
                {dayEntries.map((e) => (
                  <li
                    key={e.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--gray-200)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{getAccountLabel(e.account, lang)} · {e.particulars}</div>
                      {e.qty != null && e.price != null && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 2 }}>
                          {Math.floor(e.qty).toLocaleString('en-IN')} × {(e.unitsPerTray || 1)} × ₹{formatPrice(e.price)} = ₹{formatNum(e.debit || e.credit)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {e.debit ? (
                        <span style={{ color: 'var(--red-600)', fontWeight: 600 }}>− ₹{formatNum(e.debit)}</span>
                      ) : (
                        <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>+ ₹{formatNum(e.credit)}</span>
                      )}
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
