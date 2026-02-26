import { useState } from 'react'
import { getAccounts, addAccount } from '../storage'
import { getAccountLabel, getAccountKeyFromLabel } from '../i18n'

const ACCOUNT_ICONS = {
  Eggs: '🥚', Vegetables: '🥬', Rice: '🍚', Oil: '🫒', Milk: '🥛',
  Flour: '🍞', Sugar: '🍬', Tea: '🍵', Salt: '🧂', Spices: '🌶️',
  Groceries: '🛒', Fruits: '🍎', Meat: '🥩', Fish: '🐟', Snacks: '🍿',
  Cash: '💵', Sales: '💰', Rent: '🏠', Other: '📦',
}
function getAccountIcon(key) {
  return ACCOUNT_ICONS[key] || '📋'
}

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

export default function EntryForm({ t, onSave, onClose, initialAccount, lang = 'en' }) {
  const today = new Date().toISOString().slice(0, 10)
  const [account, setAccount] = useState(initialAccount || '')
  const [date, setDate] = useState(today)
  const [particulars, setParticulars] = useState('')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [unitsPerQty, setUnitsPerQty] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('debit')

  const accounts = getAccounts()
  const unitsMult = (() => {
    const v = String(unitsPerQty || '').trim()
    const n = Number(v)
    return (v !== '' && !isNaN(n) && n > 0) ? n : 1
  })()
  const totalUnits = (qty !== '' && !isNaN(Number(qty))) ? Number(qty) * unitsMult : null
  const computedAmount = (totalUnits != null && price !== '' && !isNaN(Number(price)))
    ? totalUnits * Number(price)
    : null

  const handleAddItem = () => {
    const name = window.prompt(t.addItemHint)
    if (name && name.trim()) {
      const added = addAccount(name.trim())
      if (added) setAccount(added)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const acc = (account || '').trim() || 'Other'
    const amt = computedAmount ?? (amount ? Number(amount.replace(/,/g, '')) : 0)
    if (!amt || amt <= 0) return
    onSave({
      account: acc,
      date,
      particulars: particulars.trim() || '—',
      qty: qty !== '' ? qty : null,
      unitsPerTray: unitsPerQty && String(unitsPerQty).trim() !== '' ? unitsPerQty : '1',
      price: price !== '' ? price : null,
      amount: amt,
      type: type === 'credit' ? 'credit' : 'debit',
    })
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
        padding: 16,
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 28,
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
          {t.formIntro}
        </p>
        <form onSubmit={handleSubmit}>
          <Field
            label={lang === 'ta' ? 'எதுக்கு? (தட்டுங்க)' : 'For what? (Tap to select)'}
            hint={t.accountFormHint}
            title={t.accountFormHint}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              {accounts.map((a) => (
                <button
                  key={a}
                  data-testid={`account-${a}`}
                  type="button"
                  onClick={() => setAccount(a)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: account === a ? '#2563eb' : 'var(--gray-100)',
                    color: account === a ? 'var(--white)' : 'var(--slate-800)',
                    border: account === a ? 'none' : '1px solid var(--gray-200)',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{getAccountIcon(a)}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{getAccountLabel(a, lang)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                title={t.addItemHint}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--white)',
                  border: '2px dashed var(--gray-300)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>➕</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>{lang === 'ta' ? 'புதியது' : 'New'}</span>
              </button>
            </div>
          </Field>

          <Field label={t.date} hint={t.dateHint} title={t.dateHint}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              title={t.dateHint}
            />
          </Field>

          <Field label={t.particulars} hint={t.particularsHint} title={t.particularsHint}>
            <input
              type="text"
              value={particulars}
              onChange={(e) => setParticulars(e.target.value)}
              title={t.particularsHint}
              autoComplete="off"
            />
          </Field>

          <Field label={t.type} hint={type === 'debit' ? t.debitHint : t.creditHint} title={t.debitHint}>
            <div
              style={{
                display: 'flex',
                gap: 6,
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
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  background: type === 'debit' ? 'var(--white)' : 'transparent',
                  color: type === 'debit' ? 'var(--slate-900)' : 'var(--text-secondary)',
                  boxShadow: type === 'debit' ? 'var(--shadow-sm)' : 'none',
                  border: type === 'debit' ? '1px solid var(--gray-200)' : '1px solid transparent',
                }}
              >
                {t.debitType}
              </button>
              <button
                type="button"
                onClick={() => setType('credit')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  background: type === 'credit' ? 'var(--white)' : 'transparent',
                  color: type === 'credit' ? 'var(--slate-900)' : 'var(--text-secondary)',
                  boxShadow: type === 'credit' ? 'var(--shadow-sm)' : 'none',
                  border: type === 'credit' ? '1px solid var(--gray-200)' : '1px solid transparent',
                }}
              >
                {t.creditType}
              </button>
            </div>
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
            />
          </Field>
          {computedAmount != null && (
            <p style={{ fontSize: '0.85rem', color: 'var(--teal-700)', marginBottom: 12, fontWeight: 600 }}>
              {Math.floor(Number(qty)).toLocaleString('en-IN')} × {Math.floor(unitsMult).toLocaleString('en-IN')} × ₹{formatPrice(Number(price))} = ₹{formatNum(computedAmount)}
            </p>
          )}
          <Field label={t.amount} hint={t.amountHint} title={t.amountHint}>
            <input
              data-testid="entry-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              title={t.amountHint}
              disabled={computedAmount != null}
            />
          </Field>

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
              {t.cancel}
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
