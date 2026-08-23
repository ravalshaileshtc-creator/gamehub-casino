"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface Transaction {
  id: string
  game: string
  type: 'DEBIT' | 'CREDIT' | 'TOPUP' | 'RESET'
  amount: number
  balanceBefore: number
  balanceAfter: number
  timestamp: string
  status: 'COMPLETED'
}

interface WalletContextType {
  balance: number
  transactions: Transaction[]
  isLoading: boolean
  debit: (amount: number, game: string, roundId?: string) => Promise<boolean>
  credit: (amount: number, game: string, roundId?: string) => Promise<boolean>
  addDemoCoins: (amount?: number) => void
  resetWallet: () => void
  refreshWallet: () => Promise<void>
}

const DEFAULT_BALANCE = 10000.0

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(DEFAULT_BALANCE)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const savedBalance = localStorage.getItem('hub_shared_wallet')
    if (savedBalance !== null) {
      const parsed = parseFloat(savedBalance)
      if (!isNaN(parsed)) setBalance(parsed)
    }

    const savedTx = localStorage.getItem('hub_wallet_tx')
    if (savedTx) {
      try {
        setTransactions(JSON.parse(savedTx))
      } catch (e) {}
    }

    setIsLoading(false)
  }, [])

  const updateBalanceState = (newBal: number) => {
    setBalance(newBal)
    localStorage.setItem('hub_shared_wallet', newBal.toFixed(2))
  }

  const saveTransactions = (txList: Transaction[]) => {
    setTransactions(txList)
    localStorage.setItem('hub_wallet_tx', JSON.stringify(txList.slice(0, 100)))
  }

  const refreshWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/balance')
      if (res.ok) {
        const data = await res.json()
        if (data.wallet?.totalBalance !== undefined) {
          updateBalanceState(data.wallet.totalBalance)
        }
      }
    } catch (e) {}
  }, [])

  const debit = useCallback(async (amount: number, game: string): Promise<boolean> => {
    if (amount <= 0) return false

    let currentBal = balance
    if (currentBal < amount) {
      currentBal += 1000.0 // Auto-refill demo coins!
    }

    const balanceBefore = currentBal
    const balanceAfter = balanceBefore - amount
    updateBalanceState(balanceAfter)

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      game,
      type: 'DEBIT',
      amount,
      balanceBefore,
      balanceAfter,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    }

    saveTransactions([newTx, ...transactions])

    fetch('/api/wallet/debit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, game })
    }).catch(() => {})

    return true
  }, [balance, transactions])

  const credit = useCallback(async (amount: number, game: string): Promise<boolean> => {
    if (amount <= 0) return true

    const balanceBefore = balance
    const balanceAfter = balanceBefore + amount
    updateBalanceState(balanceAfter)

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      game,
      type: 'CREDIT',
      amount,
      balanceBefore,
      balanceAfter,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    }

    saveTransactions([newTx, ...transactions])

    fetch('/api/wallet/credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, game })
    }).catch(() => {})

    return true
  }, [balance, transactions])

  const addDemoCoins = useCallback((amount = 1000) => {
    const balanceBefore = balance
    const balanceAfter = balanceBefore + amount
    updateBalanceState(balanceAfter)

    const newTx: Transaction = {
      id: `topup-${Date.now()}`,
      game: 'WALLET TOP-UP',
      type: 'TOPUP',
      amount,
      balanceBefore,
      balanceAfter,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    }

    saveTransactions([newTx, ...transactions])
  }, [balance, transactions])

  const resetWallet = useCallback(() => {
    const balanceBefore = balance
    const balanceAfter = DEFAULT_BALANCE
    updateBalanceState(balanceAfter)

    const newTx: Transaction = {
      id: `reset-${Date.now()}`,
      game: 'WALLET RESET',
      type: 'RESET',
      amount: DEFAULT_BALANCE,
      balanceBefore,
      balanceAfter,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    }

    saveTransactions([newTx, ...transactions])
  }, [balance, transactions])

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        isLoading,
        debit,
        credit,
        addDemoCoins,
        resetWallet,
        refreshWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

const DEFAULT_FALLBACK_WALLET: WalletContextType = {
  balance: DEFAULT_BALANCE,
  transactions: [],
  isLoading: false,
  debit: async () => true,
  credit: async () => true,
  addDemoCoins: () => {},
  resetWallet: () => {},
  refreshWallet: async () => {}
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    return DEFAULT_FALLBACK_WALLET
  }
  return context
}
