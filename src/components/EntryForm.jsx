import { useState } from 'react'
import { getAccounts, addAccount } from '../storage'
import { getAccountLabel, getAccountKeyFromLabel } from '../i18n'

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
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 4 }}>{hint}</p>
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
  const [unitsPerQty, setUnitsPerQty] = useState('30')
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
        background: 'rgba(0,0,0,0.5)',
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
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="form-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
          {t.addEntry}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: 20 }}>
          {t.formIntro}
        </p>
        <form onSubmit={handleSubmit}>
          <Field label={t.account} hint={t.accountFormHint} title={t.accountFormHint}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                list="form-account-list"
                value={getAccountLabel(account, lang)}
                onChange={(e) => {
                  const val = e.target.value
                  const key = getAccountKeyFromLabel(val, lang) || val.trim()
                  setAccount(key)
                }}
                placeholder={lang === 'ta' ? 'எ.கா. முட்டை, அரிசி' : 'e.g. Eggs, Rice'}
                title={t.accountFormHint}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddItem}
                title={t.addItemHint}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  borderRadius: 8,
                  background: 'var(--teal-600)',
                  color: 'var(--white)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                +
              </button>
            </div>
          </Field>
          <datalist id="form-account-list">
            {accounts.map(a => (
              <option key={a} value={a}>{getAccountLabel(a, lang)}</option>
            ))}
          </datalist>

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
              placeholder={t.placeholderParticulars}
              title={t.particularsHint}
              autoComplete="off"
            />
          </Field>

          <Field label={t.type} hint={type === 'debit' ? t.debitHint : t.creditHint} title={t.debitHint}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: 4,
                background: 'var(--gray-200)',
                borderRadius: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setType('debit')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: type === 'debit' ? 'var(--white)' : 'transparent',
                  boxShadow: type === 'debit' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
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
                  borderRadius: 8,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: type === 'credit' ? 'var(--white)' : 'transparent',
                  boxShadow: type === 'credit' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
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
                placeholder="e.g. 200"
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
                placeholder="30"
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
                placeholder="e.g. 5.25"
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
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder={t.placeholderAmount}
              title={t.amountHint}
              disabled={computedAmount != null}
            />
          </Field>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                minHeight: 48,
                background: 'var(--gray-200)',
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                minHeight: 48,
                background: type === 'credit'
                  ? 'linear-gradient(135deg, var(--green-600) 0%, #15803d 100%)'
                  : 'linear-gradient(135deg, var(--red-600) 0%, #b91c1c 100%)',
                color: 'var(--white)',
                borderRadius: 12,
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
