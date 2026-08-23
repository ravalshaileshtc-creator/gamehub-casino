"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface BalanceContextType {
  balance: number
  updateBalance: (amount: number, localOnly?: boolean) => Promise<void>
  refreshBalance: () => Promise<void>
  isLoading: boolean
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const refreshBalance = useCallback(async () => {
    if (!session?.user?.email) {
        setBalance(0)
        setIsLoading(false) // Not logged in, stop loading
        return
    }

    try {
      const res = await fetch('/api/user/balance')
      if (res.ok) {
        const data = await res.json()
        setBalance(data.totalBalance || 0)
      }
    } catch (error) {
      console.error("Failed to fetch balance", error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.email, setBalance, setIsLoading]) // Added setBalance and setIsLoading to dependencies

  // Load balance on mount and when session changes
  useEffect(() => {
    refreshBalance()
  }, [session, refreshBalance])

  const updateBalance = async (amount: number, localOnly = false) => {
    // Optimistic update for UI responsiveness
    setBalance((prev) => prev + amount)

    if (localOnly || !session?.user?.email) return 
    
    // logic to call API...
    try {
        const type = amount >= 0 ? 'credit' : 'debit'
        const absAmount = Math.abs(amount)
        
        const res = await fetch('/api/user/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: absAmount, type }),
        })

        if (!res.ok) {
            // Revert on failure
             const data = await res.json()
             toast({
                 variant: "destructive",
                 title: "Transaction Failed",
                 description: data.error || "Could not update balance",
             })
             refreshBalance() // Sync with server
        }
    } catch (error) {
        console.error("Failed to sync balance", error)
        refreshBalance()
    }
  }

  return (
    <BalanceContext.Provider value={{ balance, updateBalance, refreshBalance, isLoading }}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider')
  }
  return context
}
