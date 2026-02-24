import { useState, useMemo, useEffect } from 'react'
import {
  getAccounts,
  addAccount,
  getEntriesWithBalance,
  deleteEntry,
  getSummaryForPeriod,
} from '../storage'
import { getAccountLabel, getAccountKeyFromLabel } from '../i18n'

function formatNum(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatPrice(n) {
  const v = Number(n)
  if (Number.isNaN(v)) return '0'
  return v.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

function formatDate(dateStr, t) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function LedgerView({ t, onAddEntry, onRefresh, refreshTrigger, lang, accountToSelect, onAccountSelected }) {
  const [selectedAccount, setSelectedAccount] = useState('')
  const [filterOpen, setFilterOpen] = useState(null) // 'date' | 'particulars' | 'debit' | 'credit' | 'balance'
  const [filters, setFilters] = useState({ date: new Set(), particulars: new Set(), debit: new Set(), credit: new Set(), balance: new Set() })

  useEffect(() => {
    if (accountToSelect) {
      setSelectedAccount(accountToSelect)
      onAccountSelected?.()
    }
  }, [accountToSelect, onAccountSelected])

  const accounts = getAccounts()
  const entries = useMemo(() => {
    if (!selectedAccount) return []
    return getEntriesWithBalance(selectedAccount)
  }, [selectedAccount, refreshTrigger])

  const summary = useMemo(() => getSummaryForPeriod(entries), [entries])

  const addNewItem = () => {
    const name = window.prompt(lang === 'ta' ? 'புதியது பேரு எழுது' : 'Enter new item name')
    if (name && name.trim()) {
      const added = addAccount(name.trim())
      if (added) {
        setSelectedAccount(added)
        onRefresh?.()
      }
    }
  }

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const d = formatDate(e.date, t)
      const part = (e.particulars || '').toString()
      const deb = e.debit != null ? formatNum(e.debit) : ''
      const cred = e.credit != null ? formatNum(e.credit) : ''
      const bal = formatNum(e.balance)

      if (filters.date.size && !filters.date.has(d)) return false
      if (filters.particulars.size && !filters.particulars.has(part)) return false
      if (filters.debit.size && !filters.debit.has(deb)) return false
      if (filters.credit.size && !filters.credit.has(cred)) return false
      if (filters.balance.size && !filters.balance.has(bal)) return false
      return true
    })
  }, [entries, filters, t])

  const distinctValues = useMemo(() => {
    const date = new Set()
    const particulars = new Set()
    const debit = new Set()
    const credit = new Set()
    const balance = new Set()
    entries.forEach(e => {
      date.add(formatDate(e.date, t))
      particulars.add((e.particulars || '').toString())
      if (e.debit != null) debit.add(formatNum(e.debit))
      if (e.credit != null) credit.add(formatNum(e.credit))
      balance.add(formatNum(e.balance))
    })
    return { date: [...date].sort(), particulars: [...particulars].sort(), debit: [...debit].sort(), credit: [...credit].sort(), balance: [...balance].sort() }
  }, [entries, t])

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
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }}>
          {t.account}
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            list="account-list"
            value={getAccountLabel(selectedAccount, lang)}
            onChange={(e) => {
              const val = e.target.value
              const key = getAccountKeyFromLabel(val, lang) || val.trim()
              setSelectedAccount(key)
            }}
            onBlur={(e) => {
              const v = (e.target.value || '').trim()
              const key = getAccountKeyFromLabel(v, lang) || v
              if (key && !accounts.some(a => a.toLowerCase() === key.toLowerCase())) {
                addAccount(key)
                onRefresh?.()
              }
            }}
            placeholder={t.selectAccount}
            title={t.selectAccount}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={addNewItem}
            title={t.addItemHint}
            style={{
              minWidth: 44,
              minHeight: 44,
              borderRadius: 8,
              background: 'var(--teal-600)',
              color: 'var(--white)',
              fontWeight: 700,
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            +
          </button>
        </div>
        <datalist id="account-list">
          {accounts.map(a => (
            <option key={a} value={a}>{getAccountLabel(a, lang)}</option>
          ))}
        </datalist>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 4 }}>
          {selectedAccount ? t.selectAccount : (lang === 'ta' ? 'கணக்கு தேர்ந்தெடு, அல்லது கீழே பதிவு சேர்' : 'Select account above to view table, or add entry below')}
        </p>
      </div>

      {selectedAccount && (
        <>
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 8px', background: 'var(--gray-200)', fontWeight: 600 }}>
                    {t.date}
                    <FilterDropdown col="date" />
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', background: 'var(--gray-200)', fontWeight: 600 }}>
                    {t.particulars}
                    <FilterDropdown col="particulars" />
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', background: 'var(--gray-200)', fontWeight: 600 }}>
                    {t.debit}
                    <FilterDropdown col="debit" />
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', background: 'var(--gray-200)', fontWeight: 600 }}>
                    {t.credit}
                    <FilterDropdown col="credit" />
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', background: 'var(--gray-200)', fontWeight: 600 }}>
                    {t.balance}
                    <FilterDropdown col="balance" />
                  </th>
                  <th style={{ width: 44, padding: '10px 4px', background: 'var(--gray-200)' }} />
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
                  filteredEntries.map((e) => (
                    <tr
                      key={e.id}
                      style={{
                        borderBottom: '1px solid var(--gray-200)',
                        transition: 'background 0.15s',
                      }}
                      className="ledger-row"
                    >
                      <td style={{ padding: '10px 8px', fontVariantNumeric: 'tabular-nums' }}>{formatDate(e.date, t)}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div>{e.particulars}</div>
                        {e.qty != null && e.price != null && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 2 }}>
                            {Math.floor(e.qty).toLocaleString('en-IN')} × {(e.unitsPerTray || 1)} × ₹{formatPrice(e.price)} = ₹{formatNum(e.debit || e.credit)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 8px', color: e.debit ? 'var(--red-600)' : undefined, fontVariantNumeric: 'tabular-nums' }}>
                        {e.debit ? `₹${formatNum(e.debit)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 8px', color: e.credit ? 'var(--green-600)' : undefined, fontVariantNumeric: 'tabular-nums' }}>
                        {e.credit ? `₹${formatNum(e.credit)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        ₹{formatNum(e.balance)}
                      </td>
                      <td style={{ padding: '8px 4px' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          aria-label={t.deleteEntry}
                          title={t.deleteEntry}
                          className="delete-btn"
                          style={{
                            minWidth: 36,
                            minHeight: 36,
                            borderRadius: 8,
                            color: 'var(--gray-600)',
                            fontSize: '1rem',
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
              gap: 12,
              padding: 16,
              background: 'var(--white)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: 16,
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
          background: 'linear-gradient(135deg, var(--teal-600) 0%, var(--green-600) 100%)',
          color: 'var(--white)',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '1rem',
          boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
        }}
      >
        + {t.addEntry}
      </button>
    </section>
  )
}
