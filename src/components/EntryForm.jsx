import { useState, useRef, useEffect, useMemo } from 'react'
import { useLedger } from '../context/LedgerContext'
import { getItemSuggestions, getAccountIcon, getAccountLabel } from '../i18n'

function formatNum(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatPrice(n) {
  const v = Number(n)
  if (Number.isNaN(v)) return '0'
  return v.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

function Field({ label, hint, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: 'block',
          fontWeight: 600,
          marginBottom: 8,
          fontSize: '0.875rem',
          color: 'var(--slate-700)',
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 6 }}>{hint}</p>
      )}
    </div>
  )
}

export default function EntryForm({ t, onSave, onClose, initialAccount, lang = 'en', stayOpenAfterSave = false }) {
  const { accounts, entries } = useLedger()
  const [account, setAccount] = useState(initialAccount || '')
  const getTodayStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const [date, setDate] = useState(getTodayStr)
  const [particulars, setParticulars] = useState('')
  const [party, setParty] = useState('')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [unitsPerQty, setUnitsPerQty] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('debit')
  const [showMore, setShowMore] = useState(false)
  const amountInputRef = useRef(null)

  const isQuickMode = !!initialAccount
  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // Auto-focus amount (number pad) as soon as form opens
  useEffect(() => {
    const timer = setTimeout(() => amountInputRef.current?.focus(), 200)
    return () => clearTimeout(timer)
  }, [])

  const unitsMult = (() => {
    const v = String(unitsPerQty || '').trim()
    const n = Number(v)
    return (v !== '' && !isNaN(n) && n > 0) ? n : 1
  })()
  const totalUnits = (qty !== '' && !isNaN(Number(qty))) ? Number(qty) * unitsMult : null
  const computedAmount = (totalUnits != null && price !== '' && !isNaN(Number(price)))
    ? totalUnits * Number(price)
    : null

  // Recently used customers first (most recent at top)
  const partySuggestions = useMemo(() => {
    const withLastUsed = entries
      .filter((e) => e.party)
      .map((e) => ({ party: e.party, sortKey: `${e.date || ''}_${e.id || ''}` }))
    const byParty = new Map()
    for (const { party, sortKey } of withLastUsed) {
      const existing = byParty.get(party)
      if (!existing || sortKey > (existing.sortKey || '')) byParty.set(party, { party, sortKey })
    }
    return [...byParty.values()].sort((a, b) => (b.sortKey || '').localeCompare(a.sortKey || '')).map((x) => x.party)
  }, [entries])

  // Item suggestions: muttai→Eggs, arisi→Rice, etc. + custom accounts
  const itemSuggestions = useMemo(() => {
    const q = (account || '').trim().toLowerCase()
    if (!q) return []
    const fromI18n = getItemSuggestions(account, lang, 10)
    const seen = new Set(fromI18n.map((s) => s.key.toLowerCase()))
    const fromAccounts = accounts.filter(
      (a) => (a || '').toLowerCase().includes(q) && !seen.has((a || '').toLowerCase())
    )
    for (const a of fromAccounts) {
      seen.add((a || '').toLowerCase())
    }
    return [
      ...fromI18n,
      ...fromAccounts.map((a) => ({ key: a, label: getAccountLabel(a, lang) || a })),
    ].slice(0, 8)
  }, [account, lang, accounts])

  const handleSubmit = (e) => {
    e.preventDefault()
    const acc = (account || '').trim() || 'Other'
    const amt = computedAmount ?? (amount ? Number(amount.replace(/,/g, '')) : 0)
    if (!amt || amt <= 0) return
    const payload = {
      account: acc,
      date,
      particulars: particulars.trim() || '—',
      party: party.trim() || null,
      qty: qty !== '' ? qty : null,
      unitsPerTray: unitsPerQty && String(unitsPerQty).trim() !== '' ? unitsPerQty : '1',
      price: price !== '' ? price : null,
      amount: amt,
      type: type === 'credit' ? 'credit' : 'debit',
    }
    onSave(payload, { stayOpen: stayOpenAfterSave })
    if (stayOpenAfterSave) {
      setAmount('')
      setParticulars('')
      setQty('')
      setPrice('')
      setUnitsPerQty('')
      setTimeout(() => amountInputRef.current?.focus(), 50)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 12,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="entry-form-sheet"
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          width: '100%',
          maxWidth: 'min(480px, 100vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: 28,
          paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--gray-200)',
          position: 'relative',
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="form-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: 8,
            color: 'var(--slate-900)',
          }}
        >
          {t.addEntry}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
          {stayOpenAfterSave ? (t.formIntroQuick || 'Customer, amount. Date auto. Stays open for next.') : t.formIntro}
        </p>
        <form onSubmit={handleSubmit}>
          {/* 1. Customer – recently used first */}
          <Field
            label={t.partyLabel || 'Customer / Restaurant'}
            hint={type === 'debit' ? (t.partyHintDebit || 'If sold on credit') : (t.partyHintCredit || 'If collecting')}
            title={type === 'debit' ? t.partyHintDebit : t.partyHintCredit}
          >
            <input
              type="text"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder={lang === 'ta' ? 'எ.கா: ஹோட்டல், ரெஸ்டாரன்ட்' : 'e.g. Restaurant, Hotel'}
              list="party-list"
              autoComplete="off"
              autoFocus={false}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gray-200)',
                width: '100%',
                fontSize: '0.9375rem',
              }}
            />
            {partySuggestions.length > 0 && (
              <datalist id="party-list">
                {partySuggestions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            )}
          </Field>

          {/* 2. Item – type muttai, arisi, etc.; suggestions appear, tap to select */}
          <Field
            label={t.accountFormLabel || 'Item (optional)'}
            hint={t.accountFormHint || 'Type e.g. muttai, arisi – suggestions appear'}
            title={t.accountFormHint}
          >
            <div style={{ position: 'relative' }}>
              <input
                data-testid="entry-account"
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={lang === 'ta' ? 'எ.கா: முட்டை, அரிசி, பிற' : 'e.g. muttai, arisi, Other'}
                autoComplete="off"
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--gray-200)',
                  width: '100%',
                  fontSize: '0.9375rem',
                }}
              />
              {itemSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: 'var(--white)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-md)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    zIndex: 10,
                  }}
                >
                  {itemSuggestions.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAccount(key)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 14px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '0.9375rem',
                        cursor: 'pointer',
                        color: 'var(--slate-800)',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{getAccountIcon(key)}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* 3. Money Out / Money In */}
          <Field label={t.type} hint={type === 'debit' ? t.debitHint : t.creditHint} title={t.debitHint}>
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: 4,
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--gray-200)',
              }}
            >
              <button
                type="button"
                onClick={() => setType('debit')}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  background: type === 'debit' ? 'var(--red-50)' : 'transparent',
                  color: type === 'debit' ? 'var(--red-700)' : 'var(--text-secondary)',
                  boxShadow: type === 'debit' ? 'var(--shadow-sm)' : 'none',
                  border: type === 'debit' ? '2px solid var(--red-200)' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: '1.5rem' }} aria-hidden="true">💸</span>
                <span>{t.moneyOut || t.debitType}</span>
              </button>
              <button
                type="button"
                onClick={() => setType('credit')}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  background: type === 'credit' ? 'var(--green-50)' : 'transparent',
                  color: type === 'credit' ? 'var(--green-700)' : 'var(--text-secondary)',
                  boxShadow: type === 'credit' ? 'var(--shadow-sm)' : 'none',
                  border: type === 'credit' ? '2px solid var(--green-200)' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: '1.5rem' }} aria-hidden="true">💰</span>
                <span>{t.moneyIn || t.creditType}</span>
              </button>
            </div>
          </Field>

          {/* 4. Amount – big, number pad ready */}
          <Field label={t.amount} hint={t.amountHint} title={t.amountHint}>
            <input
              ref={amountInputRef}
              data-testid="entry-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              title={t.amountHint}
              disabled={computedAmount != null}
              placeholder="0"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--gray-200)',
                width: '100%',
                textAlign: 'center',
              }}
            />
            {computedAmount == null && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {[100, 500, 1000, 2000].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(String(n))}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      background: 'var(--gray-100)',
                      border: '1px solid var(--gray-200)',
                      color: 'var(--slate-800)',
                    }}
                  >
                    ₹{n.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            )}
          </Field>
          {computedAmount != null && (
            <p style={{ fontSize: '0.85rem', color: 'var(--teal-700)', marginBottom: 12, fontWeight: 600 }}>
              {Math.floor(Number(qty)).toLocaleString('en-IN')} × {Math.floor(unitsMult).toLocaleString('en-IN')} × ₹{formatPrice(Number(price))} = ₹{formatNum(computedAmount)}
            </p>
          )}

          {/* 5. More options – Date, particulars, qty/price */}
          {showMore && (
            <>

          {/* Date - auto today, in More */}
          {showMore && (
            <Field label={t.date} hint={t.dateHint} title={t.dateHint}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDate(today)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    background: date === today ? '#2563eb' : 'var(--gray-100)',
                    color: date === today ? 'var(--white)' : 'var(--slate-700)',
                    border: date === today ? 'none' : '1px solid var(--gray-200)',
                  }}
                >
                  {t.today || 'Today'}
                </button>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  title={t.dateHint}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)' }}
                />
              </div>
            </Field>
          )}

          {/* Particulars + qty/units/price */}
          {showMore && (
            <>
              <Field label={t.particulars} hint={t.particularsHint} title={t.particularsHint}>
                <input
                  type="text"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  title={t.particularsHint}
                  autoComplete="off"
                  style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', width: '100%' }}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label={t.qtyLabel} hint={t.qtyHintForm} title={t.qtyHintForm}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={qty}
                    onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ''))}
                    title={t.qtyHintForm}
                    autoComplete="off"
                    style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', width: '100%' }}
                  />
                </Field>
                <Field label={t.unitsPerQty} hint={t.unitsPerQtyHint} title={t.unitsPerQtyHint}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={unitsPerQty}
                    onChange={(e) => setUnitsPerQty(e.target.value.replace(/[^\d.]/g, ''))}
                    title={t.unitsPerQtyHint}
                    autoComplete="off"
                    style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', width: '100%' }}
                  />
                </Field>
              </div>
              <Field label={t.pricePerUnit} hint={t.pricePerUnitHint} title={t.priceHint}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
                  title={t.priceHint}
                  autoComplete="off"
                  style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', width: '100%' }}
                />
              </Field>
            </>
          )}
            </>
          )}

          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            style={{
              marginBottom: 20,
              padding: 10,
              background: 'none',
              color: 'var(--slate-600)',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {showMore ? t.showLess : t.showMoreOptions} {showMore ? '▲' : '▼'}
          </button>

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                minHeight: 48,
                background: 'var(--white)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                border: '1px solid var(--gray-200)',
                color: 'var(--text-secondary)',
              }}
            >
              {stayOpenAfterSave ? (t.done || 'Done') : t.cancel}
            </button>
            <button
              data-testid="entry-save"
              type="submit"
              style={{
                flex: 1,
                minHeight: 48,
                background: type === 'credit' ? 'var(--green-600)' : 'var(--red-600)',
                color: 'var(--white)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9375rem',
              }}
            >
              {t.post}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
