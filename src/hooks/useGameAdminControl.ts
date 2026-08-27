'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface AdminControlSettings {
  enabled: boolean
  mode: 'AUTO' | 'FORCED' | 'HOUSE_MAX_PROFIT'
  forcedTarget: any
  houseEdge: number
  minBet: number
  maxBet: number
}

export function useGameAdminControl(gameKey: string) {
  const [adminSettings, setAdminSettings] = useState<AdminControlSettings>({
    enabled: true,
    mode: 'AUTO',
    forcedTarget: null,
    houseEdge: 2.0,
    minBet: 1,
    maxBet: 10000
  })

  useEffect(() => {
    if (!gameKey) return
    const docRef = doc(db, 'admin_settings', gameKey)
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setAdminSettings({
          enabled: data.enabled !== undefined ? data.enabled : true,
          mode: data.mode || 'AUTO',
          forcedTarget: data.forcedTarget !== undefined ? data.forcedTarget : null,
          houseEdge: data.houseEdge !== undefined ? Number(data.houseEdge) : 2.0,
          minBet: data.minBet !== undefined ? Number(data.minBet) : 1,
          maxBet: data.maxBet !== undefined ? Number(data.maxBet) : 10000
        })
      }
    }, (err) => {
      console.warn(`Firestore admin sync note for ${gameKey}:`, err)
    })

    return () => unsub()
  }, [gameKey])

  return adminSettings
}
