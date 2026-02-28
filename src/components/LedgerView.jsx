import { useState, useMemo, useEffect } from 'react'
import { useLedger } from '../context/LedgerContext'
import { getSummaryForPeriod } from '../storage'
import { getAccountLabel, getAccountKeyFromLabel, getAccountIcon } from '../i18n'

function getEntriesWithBalance(entries, account) {
  const filtered = entries.filter(e => e.account?.toLowerCase() === account?.toLowerCase())
  const sorted = filtered.sort((a, b) => {
    const d = a.date.localeCompare(b.date)
    return d || (a.id > b.id ? 1 : -1)
  })
  // Full account running balance
  let fullBalance = 0
  // Per-party running balance (party -> balance so far)
  const partyBalances = {}
  return sorted.map(e => {
    fullBalance += (e.credit || 0) - (e.debit || 0)
    const p = (e.party || '').trim()
    if (p) {
      if (!partyBalances[p]) partyBalances[p] = 0
      partyBalances[p] += (e.credit || 0) - (e.debit || 0)
      return { ...e, balance: partyBalances[p] }
    }
    return { ...e, balance: fullBalance }
  })
}

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
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })
}

const DEFAULT_ACCOUNTS = new Set([
  'Eggs', 'Vegetables', 'Rice', 'Oil', 'Milk', 'Flour', 'Sugar', 'Tea', 'Salt', 'Spices',
  'Ginger', 'Garlic', 'Onion', 'Tomato', 'Potato', 'Dal', 'Coconut', 'Lemon',
  'Groceries', 'Fruits', 'Meat', 'Fish', 'Snacks', 'Cash', 'Sales', 'Rent', 'Other',
])

export default function LedgerView({ t, onAddEntry, onRefresh, refreshTrigger, lang, accountToSelect, onAccountSelected }) {
  const { accounts, entries: allEntries, deleteEntry, deleteAccount } = useLedger()
  const [selectedAccount, setSelectedAccount] = useState('')
  const [filterOpen, setFilterOpen] = useState(null) // 'date' | 'particulars' | 'debit' | 'credit' | 'balance'
  const [filters, setFilters] = useState({ date: new Set(), particulars: new Set(), debit: new Set(), credit: new Set(), balance: new Set() })

  useEffect(() => {
    if (accountToSelect) {
      setSelectedAccount(accountToSelect)
      onAccountSelected?.()
    }
  }, [accountToSelect, onAccountSelected])

  const accountsWithEntries = useMemo(() => {
    return accounts.filter((acc) =>
      allEntries.some((e) => (e.account || '').toLowerCase() === (acc || '').toLowerCase())
    )
  }, [accounts, allEntries])

  const entries = useMemo(() => {
    if (!selectedAccount) return []
    return getEntriesWithBalance(allEntries, selectedAccount)
  }, [selectedAccount, allEntries, refreshTrigger])

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const d = formatDate(e.date, lang)
      const part = (e.particulars || '').toString()
      const party = (e.party || '').trim()
      const deb = e.debit != null ? formatNum(e.debit) : ''
      const cred = e.credit != null ? formatNum(e.credit) : ''
      const bal = formatNum(e.balance)

      if (filters.date.size && !filters.date.has(d)) return false
      if (filters.particulars.size && !filters.particulars.has(part) && !(party && filters.particulars.has(party))) return false
      if (filters.debit.size && !filters.debit.has(deb)) return false
      if (filters.credit.size && !filters.credit.has(cred)) return false
      if (filters.balance.size && !filters.balance.has(bal)) return false
      return true
    })
  }, [entries, filters, lang])

  const summary = useMemo(() => getSummaryForPeriod(filteredEntries), [filteredEntries])

  useEffect(() => {
    if (selectedAccount && !accountsWithEntries.some((a) => (a || '').toLowerCase() === (selectedAccount || '').toLowerCase())) {
      setSelectedAccount(accountsWithEntries[0] || '')
    }
  }, [accountsWithEntries, selectedAccount])

  const distinctValues = useMemo(() => {
    const date = new Set()
    const particulars = new Set()
    const debit = new Set()
    const credit = new Set()
    const balance = new Set()
    entries.forEach(e => {
      date.add(formatDate(e.date, lang))
      particulars.add((e.particulars || '').toString())
      if ((e.party || '').trim()) particulars.add((e.party || '').trim())
      if (e.debit != null) debit.add(formatNum(e.debit))
      if (e.credit != null) credit.add(formatNum(e.credit))
      balance.add(formatNum(e.balance))
    })
    return { date: [...date].sort(), particulars: [...particulars].sort(), debit: [...debit].sort(), credit: [...credit].sort(), balance: [...balance].sort() }
  }, [entries, lang])

  const toggleFilter = (col, val) => {
    setFilters(prev => {
      const next = { ...prev }
      const set = new Set(next[col])
      if (set.has(val)) set.delete(val)
      else set.add(val)
      next[col] = set
      return next
    })
  }

  const clearFilter = (col) => {
    setFilters(prev => ({ ...prev, [col]: new Set() }))
    setFilterOpen(null)
  }

  const handleDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) {
      deleteEntry(id)
      onRefresh?.()
    }
  }

  const isCustomAccount = (a) => !DEFAULT_ACCOUNTS.has(a)
  const handleRemoveItem = (name) => {
    const msg = (t.removeItemConfirm || 'Remove "{name}" and all its entries?').replace('{name}', name)
    if (window.confirm(msg)) {
      const others = accountsWithEntries.filter(a => (a || '').toLowerCase() !== (name || '').toLowerCase())
      deleteAccount(name)
      setSelectedAccount(others[0] || '')
      onRefresh?.()
    }
  }

  const FilterDropdown = ({ col, label }) => {
    const vals = distinctValues[col]
    const active = filters[col].size > 0
    const isOpen = filterOpen === col
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={() => setFilterOpen(isOpen ? null : col)}
          title={t.filter}
          style={{
            padding: '4px 6px',
            marginLeft: 4,
            borderRadius: 4,
            background: active ? 'var(--teal-100)' : 'transparent',
            border: '1px solid transparent',
            cursor: 'help',
            fontSize: '0.85rem',
          }}
        >
          ▾
        </button>
        {isOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={() => setFilterOpen(null)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'var(--white)',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                minWidth: 160,
                maxHeight: 220,
                overflow: 'auto',
                zIndex: 20,
                padding: 8,
              }}
            >
              <button
                type="button"
                onClick={() => clearFilter(col)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  borderRadius: 6,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {t.selectAll} / {t.clear}
              </button>
              {vals.map(v => (
                <label
                  key={v}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters[col].has(v)}
                    onChange={() => toggleFilter(col, v)}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{v}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <section className="ledger-view">
      {/* Visual tap grid - no typing needed */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 12 }}>
          {accountsWithEntries.length === 0
            ? t.ledgerEmptyHint
            : t.ledgerTapPrompt}
        </p>
        <div
          className="account-grid-small"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
        >
          {accountsWithEntries.map((acc) => (
            <div key={acc} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setSelectedAccount(acc)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '14px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedAccount === acc ? '#2563eb' : 'var(--white)',
                  color: selectedAccount === acc ? 'var(--white)' : 'var(--slate-800)',
                  border: selectedAccount === acc ? 'none' : '1px solid var(--gray-200)',
                  boxShadow: selectedAccount === acc ? '0 2px 8px rgba(37,99,235,0.3)' : 'var(--shadow-sm)',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>{getAccountIcon(acc)}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
                  {getAccountLabel(acc, lang)}
                </span>
              </button>
              {isCustomAccount(acc) && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveItem(acc); }}
                  title={t.removeItem}
                  aria-label={t.removeItem}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--red-600)',
                    color: 'white',
                    border: '2px solid white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedAccount && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--slate-800)' }}>
              {getAccountIcon(selectedAccount)} {getAccountLabel(selectedAccount, lang)}
            </span>
            {isCustomAccount(selectedAccount) && (
              <button
                type="button"
                onClick={() => handleRemoveItem(selectedAccount)}
                title={t.removeItem}
                aria-label={t.removeItem}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--red-600)',
                  color: 'white',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t.removeItem}
              </button>
            )}
          </div>
          <div style={{ overflowX: 'auto', marginBottom: 12, WebkitOverflowScrolling: 'touch' }}>
            <table
              className="ledger-table-font"
              style={{
                width: '100%',
                minWidth: 360,
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}
            >
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '14px 12px',
                      background: 'var(--slate-100)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'var(--slate-700)',
                      borderBottom: '2px solid var(--gray-200)',
                    }}
                  >
                    {t.date}
                    <FilterDropdown col="date" />
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '14px 12px',
                      background: 'var(--slate-100)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'var(--slate-700)',
                      borderBottom: '2px solid var(--gray-200)',
                    }}
                  >
                    {t.particulars}
                    <FilterDropdown col="particulars" />
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '14px 12px',
                      background: 'var(--slate-100)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'var(--slate-700)',
                      borderBottom: '2px solid var(--gray-200)',
                    }}
                    title={t.debitHint}
                  >
                    <span style={{ marginRight: 4 }} aria-hidden="true">💸</span>
                    {t.outShort || t.debit}
                    <FilterDropdown col="debit" />
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '14px 12px',
                      background: 'var(--slate-100)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'var(--slate-700)',
                      borderBottom: '2px solid var(--gray-200)',
                    }}
                    title={t.creditHint}
                  >
                    <span style={{ marginRight: 4 }} aria-hidden="true">💰</span>
                    {t.inShort || t.credit}
                    <FilterDropdown col="credit" />
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '14px 12px',
                      background: 'var(--slate-100)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'var(--slate-700)',
                      borderBottom: '2px solid var(--gray-200)',
                    }}
                  >
                    {t.balance}
                    <FilterDropdown col="balance" />
                  </th>
                  <th style={{ width: 48, padding: '14px 8px', background: 'var(--slate-100)', borderBottom: '2px solid var(--gray-200)' }} />
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--gray-600)' }}>
                      {t.noEntriesLedger}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, idx) => (
                    <tr
                      key={e.id}
                      style={{
                        borderBottom: '1px solid var(--gray-200)',
                        transition: 'background 0.15s',
                        background: idx % 2 === 1 ? 'var(--gray-50)' : 'var(--white)',
                      }}
                      className="ledger-row"
                    >
                      <td style={{ padding: '14px 12px', fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>{formatDate(e.date, lang)}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              flexShrink: 0,
                              background: e.debit ? 'var(--red-50)' : 'var(--green-50)',
                              color: e.debit ? 'var(--red-700)' : 'var(--green-700)',
                            }}
                          >
                            {e.debit ? `💸 ${t.outShort}` : `💰 ${t.inShort}`}
                          </span>
                          <span>{e.particulars}</span>
                          {e.party && (
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                background: 'var(--teal-100)',
                                color: 'var(--teal-700)',
                              }}
                            >
                              {e.party}
                            </span>
                          )}
                        </div>
                        {e.qty != null && e.price != null && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 4 }}>
                            {Math.floor(e.qty).toLocaleString('en-IN')} × {(e.unitsPerTray || 1)} × ₹{formatPrice(e.price)} = ₹{formatNum(e.debit || e.credit)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '14px 12px', color: e.debit ? 'var(--red-600)' : undefined, fontVariantNumeric: 'tabular-nums' }}>
                        {e.debit ? `₹${formatNum(e.debit)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '14px 12px', color: e.credit ? 'var(--green-600)' : undefined, fontVariantNumeric: 'tabular-nums' }}>
                        {e.credit ? `₹${formatNum(e.credit)}` : '—'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: '14px 12px',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          color: (e.balance ?? 0) >= 0 ? 'var(--green-600)' : 'var(--red-600)',
                        }}
                      >
                        ₹{formatNum(e.balance)}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          aria-label={t.deleteEntry}
                          title={t.deleteEntry}
                          className="delete-btn"
                          style={{
                            minWidth: 40,
                            minHeight: 40,
                            borderRadius: 8,
                            color: 'var(--gray-600)',
                            fontSize: '1.1rem',
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              padding: 20,
              background: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--gray-200)',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.totalIncome}</div>
              <div style={{ fontWeight: 700, color: 'var(--green-600)' }}>₹{formatNum(summary.income)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.totalExpense}</div>
              <div style={{ fontWeight: 700, color: 'var(--red-600)' }}>₹{formatNum(summary.expense)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.net}</div>
              <div style={{ fontWeight: 700, color: summary.net >= 0 ? 'var(--green-600)' : 'var(--red-600)' }}>₹{formatNum(summary.net)}</div>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => onAddEntry(selectedAccount)}
        style={{
          width: '100%',
          minHeight: 52,
          background: 'var(--slate-900)',
          color: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          fontSize: '0.9375rem',
        }}
      >
        + {t.addEntry}
      </button>
    </section>
  )
}
