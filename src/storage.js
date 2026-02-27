const STORAGE_KEY = 'small-business-pnl-v2'

const DEFAULT_ACCOUNTS = [
  'Eggs', 'Vegetables', 'Rice', 'Oil', 'Milk', 'Flour', 'Sugar', 'Tea', 'Salt', 'Spices',
  'Groceries', 'Fruits', 'Meat', 'Fish', 'Snacks', 'Cash', 'Sales', 'Rent', 'Other'
]

export function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.accounts && data.entries) return data
    }
    // Migrate from v1 if exists
    const v1 = localStorage.getItem('small-business-pnl-v1')
    if (v1) {
      const old = JSON.parse(v1)
      const accounts = [...DEFAULT_ACCOUNTS]
      const entries = (old.entries || []).map(e => {
        const account = e.category === 'goods' ? 'Groceries' : e.category === 'rent' ? 'Rent' : e.category === 'transport' ? 'Other' : e.category === 'salary' ? 'Other' : 'Other'
        const isCredit = e.type === 'income'
        return {
          id: e.id || id(),
          account,
          date: e.date || new Date().toISOString().slice(0, 10),
          particulars: e.note || (isCredit ? 'Income' : 'Expense'),
          qty: null,
          price: null,
          debit: isCredit ? null : Number(e.amount) || 0,
          credit: isCredit ? Number(e.amount) || 0 : null,
        }
      })
      return { accounts: [...new Set([...accounts, ...entries.map(e => e.account)])], entries }
    }
  } catch (_) {}
  return { accounts: [...DEFAULT_ACCOUNTS], entries: [] }
}

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function saveStored(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (_) {}
}

export function getAccounts() {
  return getStored().accounts
}

export function addAccount(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return null
  const data = getStored()
  const lower = trimmed.toLowerCase()
  if (data.accounts.some(a => a.toLowerCase() === lower)) return trimmed
  data.accounts.push(trimmed)
  saveStored(data)
  return trimmed
}

export function getEntries(account = null) {
  const { entries } = getStored()
  if (!account) return entries
  return entries.filter(e => e.account.toLowerCase() === account.toLowerCase())
}

export function computeEntry(entry) {
  const qty = entry.qty != null && entry.qty !== '' ? Number(entry.qty) : null
  const unitsPerTray = (entry.unitsPerTray != null && entry.unitsPerTray !== '') ? Number(entry.unitsPerTray) : 1
  const price = entry.price != null && entry.price !== '' ? Number(entry.price) : null
  const amount = Number(entry.amount) || 0

  const isCredit = entry.type === 'credit'
  const totalUnits = (qty != null && unitsPerTray) ? qty * unitsPerTray : qty
  const amt = (totalUnits != null && price != null) ? totalUnits * price : amount
  const debit = isCredit ? null : amt
  const credit = isCredit ? amt : null

  const account = (entry.account || '').trim() || 'Other'
  return {
    id: id(),
    account,
    date: entry.date || new Date().toISOString().slice(0, 10),
    particulars: (entry.particulars || '').trim().slice(0, 200) || '—',
    qty,
    unitsPerTray: (qty != null && unitsPerTray !== 1) ? unitsPerTray : null,
    price,
    debit,
    credit,
  }
}

export function addEntry(entry) {
  const data = getStored()
  const account = (entry.account || '').trim() || 'Other'
  if (!data.accounts.some(a => a.toLowerCase() === account.toLowerCase())) {
    data.accounts.push(account)
  }
  const newEntry = computeEntry(entry)
  data.entries.push(newEntry)
  saveStored(data)
  return newEntry
}

export function deleteEntry(id) {
  const data = getStored()
  const entryToRemove = data.entries.find(e => e.id === id)
  data.entries = data.entries.filter(e => e.id !== id)
  if (entryToRemove) {
    const account = (entryToRemove.account || '').trim()
    const hasOtherEntries = data.entries.some(e => (e.account || '').toLowerCase() === account.toLowerCase())
    if (account && !hasOtherEntries) {
      data.accounts = data.accounts.filter(a => (a || '').toLowerCase() !== account.toLowerCase())
    }
  }
  saveStored(data)
}

export function clearAllData() {
  const data = { accounts: [...DEFAULT_ACCOUNTS], entries: [] }
  saveStored(data)
}

export function replaceAllData(accounts, entries) {
  const data = {
    accounts: Array.isArray(accounts) ? accounts : [...DEFAULT_ACCOUNTS],
    entries: Array.isArray(entries) ? entries : [],
  }
  saveStored(data)
}

export function getEntriesWithBalance(account) {
  const entries = getEntries(account).sort((a, b) => {
    const d = a.date.localeCompare(b.date)
    return d || (a.id > b.id ? 1 : -1)
  })
  let balance = 0
  return entries.map(e => {
    balance += (e.credit || 0) - (e.debit || 0)
    return { ...e, balance }
  })
}

export function getSummaryForPeriod(entries) {
  const income = entries.reduce((s, e) => s + (e.credit || 0), 0)
  const expense = entries.reduce((s, e) => s + (e.debit || 0), 0)
  return { income, expense, net: income - expense }
}

export function getEntriesByDateRange(startDate, endDate) {
  const { entries } = getStored()
  return entries.filter(e => e.date >= startDate && e.date <= endDate)
}

export function getWeekBounds(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  }
}

export function getMonthBounds(dateStr) {
  const [y, m] = dateStr.split('-')
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${new Date(y, m, 0).getDate().toString().padStart(2, '0')}`,
  }
}
