'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Gamepad2, Cpu, ShieldAlert, Crown, Flame, Sliders 
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

const ALL_GAMES_MASTER = [
  {
    key: 'luckyball',
    name: '🎱 Lucky Ball (0-9)',
    dbType: 'LOTTERY',
    targets: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    targetLabel: 'Target Ball #'
  },
  {
    key: 'plinko',
    name: '🟢 Plinko Peg Drop',
    dbType: 'PLINKO',
    targets: ['1000x', '130x', '26x', '9x', '4x', '2x', '0.2x (Loss)'],
    targetLabel: 'Target Multiplier'
  },
  {
    key: 'crash',
    name: '🚀 Crash Rocket Multiplier',
    dbType: 'CRASH',
    targets: ['1.00x (Insta-Bust)', '1.20x', '1.50x', '2.00x', '5.00x', '10.00x', '100.00x'],
    targetLabel: 'Target Crash Point'
  },
  {
    key: 'mines',
    name: '💣 Minesweeper Treasure',
    dbType: 'MINES',
    targets: ['BOMBED (Hit Next Tile)', 'SAFE (Win Next Tile)'],
    targetLabel: 'Next Click Outcome'
  },
  {
    key: 'coinflip',
    name: '🪙 Coinflip Double Up',
    dbType: 'COINFLIP',
    targets: ['HEADS 🪙', 'TAILS 🪙'],
    targetLabel: 'Target Coin Side'
  },
  {
    key: 'roulette',
    name: '🎰 European Roulette 36',
    dbType: 'ROULETTE',
    targets: ['0 (Green)', '7 (Red)', '17 (Black)', '36 (Red)'],
    targetLabel: 'Target Pocket'
  },
  {
    key: 'slots',
    name: '🍒 Slots 777 Vegas',
    dbType: 'SLOTS',
    targets: ['777 JACKPOT (100x)', 'SCATTER BONUS (25x)', 'NO MATCH (0x)'],
    targetLabel: 'Target Slot Reel'
  },
  {
    key: 'dice',
    name: '🎲 Cyber Dice 100',
    dbType: 'DICE',
    targets: ['FORCE WIN', 'FORCE LOSS'],
    targetLabel: 'Target Roll Result'
  },
  {
    key: 'dragontower',
    name: '🐉 Dragon Tower Climb',
    dbType: 'DRAGONTOWER',
    targets: ['TRAP EGG (Bust)', 'GOLD EGG (Pass)'],
    targetLabel: 'Tower Step Outcome'
  },
  {
    key: 'penalty',
    name: '⚽ Penalty Shootout 3D',
    dbType: 'PENALTY',
    targets: ['GOALKEEPER SAVE (Loss)', 'NET GOAL (Win)'],
    targetLabel: 'Kick Outcome'
  }
]

export function GameControlPanel() {
  const [gamesState, setGamesState] = useState<Record<string, {
    mode: 'AUTO' | 'FORCED' | 'HOUSE_MAX_PROFIT'
    forcedTarget: any
    enabled: boolean
    houseEdge: number
    minBet: number
    maxBet: number
  }>>({})

  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  // Subscribe to real-time Firebase Firestore admin settings for ALL 10 games
  useEffect(() => {
    const unsubs = ALL_GAMES_MASTER.map(g => {
      return onSnapshot(doc(db, 'admin_settings', g.key), (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setGamesState(prev => ({
            ...prev,
            [g.key]: {
              mode: data.mode || 'AUTO',
              forcedTarget: data.forcedTarget !== undefined ? data.forcedTarget : g.targets[0],
              enabled: data.enabled !== undefined ? data.enabled : true,
              houseEdge: data.houseEdge !== undefined ? data.houseEdge : 2.0,
              minBet: data.minBet !== undefined ? data.minBet : 1,
              maxBet: data.maxBet !== undefined ? data.maxBet : 10000
            }
          }))
        } else {
          setGamesState(prev => ({
            ...prev,
            [g.key]: {
              mode: 'AUTO',
              forcedTarget: g.targets[0],
              enabled: true,
              houseEdge: 2.0,
              minBet: 1,
              maxBet: 10000
            }
          }))
        }
      })
    })

    return () => unsubs.forEach(unsub => unsub())
  }, [])

  const handleUpdate = async (gameKey: string, gameName: string, updates: Partial<{
    mode: 'AUTO' | 'FORCED' | 'HOUSE_MAX_PROFIT'
    forcedTarget: any
    enabled: boolean
    houseEdge: number
    minBet: number
    maxBet: number
  }>) => {
    setSavingKey(gameKey)

    const current = gamesState[gameKey] || {
      mode: 'AUTO',
      forcedTarget: '',
      enabled: true,
      houseEdge: 2.0,
      minBet: 1,
      maxBet: 10000
    }

    const payload = { ...current, ...updates }

    setGamesState(prev => ({ ...prev, [gameKey]: payload }))

    try {
      const firestoreRef = doc(db, 'admin_settings', gameKey)
      await setDoc(firestoreRef, {
        ...payload,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      await fetch('/api/admin/games/control', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName: gameKey.toUpperCase(),
          ...payload
        })
      })

      setSavedNotice(`✅ Saved ${gameName} settings!`)
      setTimeout(() => setSavedNotice(null), 3000)
    } catch (e) {
      console.error('Failed to save game settings:', e)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-black p-6 rounded-3xl border border-purple-500/30 shadow-2xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 font-orbitron uppercase">
            <Flame className="w-6 h-6 text-[#F7B500] animate-pulse" /> MASTER CONTROL CENTER FOR ALL 10 GAMES
          </h2>
          <p className="text-xs text-gray-300 font-mono mt-1">
            Real-time Forced Outcome Overrides, House Max Profit Engine, and Live RTP Settings
          </p>
        </div>

        {savedNotice && (
          <div className="px-4 py-2 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 font-mono text-xs font-bold shadow-lg animate-bounce">
            {savedNotice}
          </div>
        )}
      </div>

      {/* 10 Master Game Control Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {ALL_GAMES_MASTER.map((g) => {
          const state = gamesState[g.key] || {
            mode: 'AUTO',
            forcedTarget: g.targets[0],
            enabled: true,
            houseEdge: 2.0,
            minBet: 1,
            maxBet: 10000
          }

          return (
            <Card key={g.key} className="bg-[#121826]/90 border-white/10 shadow-2xl rounded-3xl overflow-hidden backdrop-blur">
              <CardHeader className="bg-[#182338] border-b border-white/10 p-5 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-black text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-[#F7B500]" />
                    {g.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={state.enabled ? 'default' : 'destructive'} className={state.enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : ''}>
                      {state.enabled ? '🟢 ACTIVE & ONLINE' : '🔴 MAINTENANCE'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono border-white/20 text-gray-300">
                      RTP: {(100 - state.houseEdge).toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400">STATUS</span>
                  <Switch
                    checked={state.enabled}
                    onCheckedChange={(val) => handleUpdate(g.key, g.name, { enabled: val })}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">

                {/* 3 Master Control Mode Selectors */}
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#F7B500]" /> CONTROL MODE SELECTOR
                  </Label>

                  <div className="grid grid-cols-3 gap-2">
                    {/* AUTO MODE */}
                    <button
                      onClick={() => handleUpdate(g.key, g.name, { mode: 'AUTO' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        state.mode === 'AUTO'
                          ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <Cpu className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      <span className="text-[10px] uppercase font-mono block">1. AUTO RNG</span>
                    </button>

                    {/* FORCED OVERRIDE */}
                    <button
                      onClick={() => handleUpdate(g.key, g.name, { mode: 'FORCED' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        state.mode === 'FORCED'
                          ? 'bg-red-950/80 border-red-500 ring-2 ring-red-500/40 text-red-300 font-bold'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-red-400" />
                      <span className="text-[10px] uppercase font-mono block">2. FORCED OVERRIDE</span>
                    </button>

                    {/* HOUSE MAX PROFIT */}
                    <button
                      onClick={() => handleUpdate(g.key, g.name, { mode: 'HOUSE_MAX_PROFIT' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        state.mode === 'HOUSE_MAX_PROFIT'
                          ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/40 text-purple-300 font-bold'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <Crown className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                      <span className="text-[10px] uppercase font-mono block">3. MAX PROFIT</span>
                    </button>
                  </div>
                </div>

                {/* FORCED TARGET PICKER (Visible when FORCED mode selected) */}
                {state.mode === 'FORCED' && (
                  <div className="p-3 bg-red-950/40 rounded-2xl border border-red-500/40 space-y-2 animate-fadeIn">
                    <Label className="text-[11px] font-black text-red-300 uppercase tracking-wider flex items-center gap-1 font-mono">
                      🎯 {g.targetLabel} FORCED OVERRIDE:
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {g.targets.map((t) => (
                        <button
                          key={t}
                          onClick={() => handleUpdate(g.key, g.name, { forcedTarget: t })}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            state.forcedTarget === t
                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-105 border border-white'
                              : 'bg-black/50 text-gray-300 border border-white/10 hover:border-white/30'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* HOUSE EDGE & BET LIMITS */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <Label className="text-[9px] text-gray-400 font-mono">HOUSE EDGE (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={state.houseEdge}
                      onChange={(e) => handleUpdate(g.key, g.name, { houseEdge: parseFloat(e.target.value) || 0 })}
                      className="bg-black/40 border-white/10 text-white h-8 text-xs font-mono text-center rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] text-gray-400 font-mono">MIN BET (₹)</Label>
                    <Input
                      type="number"
                      value={state.minBet}
                      onChange={(e) => handleUpdate(g.key, g.name, { minBet: parseFloat(e.target.value) || 1 })}
                      className="bg-black/40 border-white/10 text-white h-8 text-xs font-mono text-center rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] text-gray-400 font-mono">MAX BET (₹)</Label>
                    <Input
                      type="number"
                      value={state.maxBet}
                      onChange={(e) => handleUpdate(g.key, g.name, { maxBet: parseFloat(e.target.value) || 10000 })}
                      className="bg-black/40 border-white/10 text-white h-8 text-xs font-mono text-center rounded-lg"
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
