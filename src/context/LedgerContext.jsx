import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import * as storage from '../storage'
import * as api from '../lib/api'

const DEFAULT_ACCOUNTS = [
  'Eggs', 'Vegetables', 'Rice', 'Oil', 'Milk', 'Flour', 'Sugar', 'Tea', 'Salt', 'Spices',
  'Ginger', 'Garlic', 'Onion', 'Tomato', 'Potato', 'Dal', 'Coconut', 'Lemon',
  'Groceries', 'Fruits', 'Meat', 'Fish', 'Snacks', 'Cash', 'Sales', 'Rent', 'Other',
]

const LedgerContext = createContext(null)

export function LedgerProvider({ children }) {
  const [accounts, setAccounts] = useState([...DEFAULT_ACCOUNTS])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [useDb, setUseDb] = useState(false)

  const loadData = useCallback(async () => {
    // 1. Local Postgres API (priority when VITE_API_URL is set)
    if (api.getApiUrl()) {
      if (!api.getToken()) {
        setAccounts(DEFAULT_ACCOUNTS)
        setEntries([])
        setLoading(false)
        setUseDb(false)
        return
      }
      setLoading(true)
      try {
        const data = await api.fetchLedger()
        setUseDb(true)
        setAccounts(Array.isArray(data?.accounts) ? data.accounts : DEFAULT_ACCOUNTS)
        setEntries(Array.isArray(data?.entries) ? data.entries : [])
      } catch (_) {
        const data = storage.getStored()
        setAccounts(data.accounts || DEFAULT_ACCOUNTS)
        setEntries(data.entries || [])
      }
      setLoading(false)
      return
    }

    // 2. Supabase
    if (supabase) {
      try {
        let { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          await supabase.auth.signInAnonymously()
          const r = await supabase.auth.getUser()
          user = r.data?.user
        }
        if (!user) {
          const data = storage.getStored()
          setAccounts(data.accounts || DEFAULT_ACCOUNTS)
          setEntries(data.entries || [])
          setLoading(false)
          return
        }

        const { data: row, error } = await supabase
          .from('ledger_data')
          .select('accounts, entries')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          const data = storage.getStored()
          setAccounts(data.accounts || DEFAULT_ACCOUNTS)
          setEntries(data.entries || [])
          setLoading(false)
          return
        }

        setUseDb(true)
        if (row) {
          setAccounts(Array.isArray(row.accounts) ? row.accounts : DEFAULT_ACCOUNTS)
          setEntries(Array.isArray(row.entries) ? row.entries : [])
        } else {
          await supabase.from('ledger_data').insert({
            user_id: user.id,
            accounts: DEFAULT_ACCOUNTS,
            entries: [],
          })
          setAccounts([...DEFAULT_ACCOUNTS])
          setEntries([])
        }
      } catch (_) {
        const data = storage.getStored()
        setAccounts(data.accounts || DEFAULT_ACCOUNTS)
        setEntries(data.entries || [])
      }
      setLoading(false)
      return
    }

    // 3. localStorage fallback
    const data = storage.getStored()
    setAccounts(data.accounts || DEFAULT_ACCOUNTS)
    setEntries(data.entries || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const saveToBackend = useCallback(async (acc, ent) => {
    if (!useDb) return
    if (api.getApiUrl()) {
      await api.saveLedger(acc, ent)
      return
    }
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase
        .from('ledger_data')
        .upsert(
          { user_id: user.id, accounts: acc, entries: ent, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
    }
  }, [useDb])

  const addEntry = useCallback((entry) => {
    if (!useDb) {
      const result = storage.addEntry(entry)
      const data = storage.getStored()
      setAccounts(data.accounts)
      setEntries(data.entries)
      return result
    }
    const account = (entry.account || '').trim() || 'Other'
    const newAccounts = accounts.some(a => a.toLowerCase() === account.toLowerCase())
      ? accounts : [...accounts, account]
    const newEntry = storage.computeEntry(entry)
    const newEntries = [...entries, newEntry]
    setAccounts(newAccounts)
    setEntries(newEntries)
    saveToBackend(newAccounts, newEntries)
    return newEntry
  }, [useDb, accounts, entries, saveToBackend])

  const addAccount = useCallback((name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return null
    const lower = trimmed.toLowerCase()
    if (accounts.some(a => a.toLowerCase() === lower)) return trimmed
    const newAccounts = [...accounts, trimmed]
    setAccounts(newAccounts)
    if (useDb) saveToBackend(newAccounts, entries)
    else {
      storage.addAccount(name)
      setEntries(storage.getStored().entries)
    }
    return trimmed
  }, [useDb, accounts, entries, saveToBackend])

  const deleteAccount = useCallback((name) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const newAccounts = accounts.filter(a => (a || '').toLowerCase() !== lower)
    const newEntries = entries.filter(e => (e.account || '').toLowerCase() !== lower)
    setAccounts(newAccounts)
    setEntries(newEntries)
    if (useDb) saveToBackend(newAccounts, newEntries)
    else {
      storage.deleteAccount(name)
      setAccounts(storage.getStored().accounts)
      setEntries(storage.getStored().entries)
    }
  }, [useDb, accounts, entries, saveToBackend])

  const deleteEntry = useCallback((id) => {
    const entryToRemove = entries.find(e => e.id === id)
    const newEntries = entries.filter(e => e.id !== id)
    let newAccounts = accounts
    if (entryToRemove) {
      const account = (entryToRemove.account || '').trim()
      const hasOtherEntries = newEntries.some(e => (e.account || '').toLowerCase() === account.toLowerCase())
      if (account && !hasOtherEntries) {
        newAccounts = accounts.filter(a => (a || '').toLowerCase() !== account.toLowerCase())
      }
    }
    setEntries(newEntries)
    setAccounts(newAccounts)
    if (useDb) saveToBackend(newAccounts, newEntries)
    else {
      storage.deleteEntry(id)
      setAccounts(storage.getStored().accounts)
    }
  }, [useDb, accounts, entries, saveToBackend])

  const clearAllData = useCallback(async () => {
    setAccounts([...DEFAULT_ACCOUNTS])
    setEntries([])
    if (useDb) {
      await saveToBackend(DEFAULT_ACCOUNTS, [])
    } else {
      storage.clearAllData()
    }
  }, [useDb, saveToBackend])

  const value = {
    accounts,
    entries,
    loading,
    useDb,
    addEntry,
    addAccount,
    deleteAccount,
    deleteEntry,
    clearAllData,
    refresh: loadData,
  }

  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  )
}

export function useLedger() {
  const ctx = useContext(LedgerContext)
  if (!ctx) throw new Error('useLedger must be used within LedgerProvider')
  return ctx
}
