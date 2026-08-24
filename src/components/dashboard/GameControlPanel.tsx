'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Gamepad2, Cpu, ShieldAlert, Crown, Flame, Sliders, Activity, Zap, CheckCircle2, AlertTriangle, Sparkles 
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc, query, collection, orderBy, limit } from 'firebase/firestore'

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
  const [activeTab, setActiveTab] = useState<string>('ALL')
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

  // Global Timer Telemetry
  const [roundId, setRoundId] = useState<number>(44698492)
  const [timeLeft, setTimeLeft] = useState<number>(27)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const cycle = now % 30
      setRoundId(44698000 + Math.floor(now / 30))
      setTimeLeft(30 - cycle)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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

  const selectedGameList = activeTab === 'ALL' 
    ? ALL_GAMES_MASTER 
    : ALL_GAMES_MASTER.filter(g => g.key === activeTab)

  return (
    <div className="space-y-8 select-none">

      {/* Top Header Banner & Navigation Pills */}
      <div className="bg-[#121826]/90 p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4 backdrop-blur">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 font-orbitron uppercase tracking-wide">
              <Crown className="w-6 h-6 text-[#F7B500] fill-[#F7B500]" /> 10 GAMES MASTER ADMIN CONTROL CENTER
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Real-time Global Telemetry, Forced Result Overrides, and House Max Profit Algorithms for All Games
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="px-3 py-1 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-300 font-mono text-xs font-bold animate-bounce">
                {savedNotice}
              </span>
            )}
            <span className="px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              FIREBASE LIVE SYNC ACTIVE
            </span>
          </div>
        </div>

        {/* Game Navigation Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-2xl uppercase transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#F7B500] text-black shadow-lg shadow-[#F7B500]/30 font-black scale-105'
                : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            🌐 ALL 10 GAMES
          </button>
          {ALL_GAMES_MASTER.map((g) => (
            <button
              key={g.key}
              onClick={() => setActiveTab(g.key)}
              className={`px-3 py-2 rounded-2xl uppercase transition-all cursor-pointer ${
                activeTab === g.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-white font-black scale-105'
                  : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Render Dedicated Master Control Center for Selected Game(s) */}
      <div className="space-y-10">
        {selectedGameList.map((g) => {
          const state = gamesState[g.key] || {
            mode: 'AUTO',
            forcedTarget: g.targets[0],
            enabled: true,
            houseEdge: 2.0,
            minBet: 1,
            maxBet: 10000
          }

          return (
            <SingleGameMasterCard
              key={g.key}
              gameConfig={g}
              state={state}
              roundId={roundId}
              timeLeft={timeLeft}
              onUpdate={(updates) => handleUpdate(g.key, g.name, updates)}
            />
          )
        })}
      </div>

      {/* Global Real-Time Live Bet Stream Table for All Games */}
      {activeTab === 'ALL' && <AllGamesRealtimeBetStream />}

    </div>
  )
}

/**
 * Dedicated Master Control Layout matching user screenshot Exactly for Each Game
 */
function SingleGameMasterCard({
  gameConfig,
  state,
  roundId,
  timeLeft,
  onUpdate
}: {
  gameConfig: typeof ALL_GAMES_MASTER[0]
  state: {
    mode: 'AUTO' | 'FORCED' | 'HOUSE_MAX_PROFIT'
    forcedTarget: any
    enabled: boolean
    houseEdge: number
    minBet: number
    maxBet: number
  }
  roundId: number
  timeLeft: number
  onUpdate: (updates: Partial<typeof state>) => void
}) {
  return (
    <div className="bg-[#0e1422] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
      
      {/* 1. TOP HEADER BANNER (Matching Screenshot) */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#141b2d] p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#F7B500]/10 border border-[#F7B500]/30 text-[#F7B500]">
            <Crown className="w-6 h-6 fill-[#F7B500]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider font-orbitron">
              MASTER ADMIN CONTROL CENTER
            </h3>
            <p className="text-xs text-amber-400 font-mono font-bold">
              REAL-TIME GLOBAL {gameConfig.name.toUpperCase()} CONTROLLER & OVERRIDE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={state.enabled ? 'default' : 'destructive'} className={state.enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : ''}>
            {state.enabled ? '🟢 ACTIVE & ONLINE' : '🔴 MAINTENANCE'}
          </Badge>

          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-xs font-mono text-gray-400">ENABLE GAME</span>
            <Switch
              checked={state.enabled}
              onCheckedChange={(val) => onUpdate({ enabled: val })}
            />
          </div>
        </div>
      </div>

      {/* 2. 4 TELEMETRY STATUS CARDS (Matching Screenshot) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        
        {/* Card 1: Global Round */}
        <div className="bg-[#121929] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">GLOBAL ROUND / ID</span>
          <div className="text-lg font-black text-[#F7B500]">
            #{roundId}
          </div>
        </div>

        {/* Card 2: Phase & Countdown */}
        <div className="bg-[#121929] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">PHASE & COUNTDOWN</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              BETTING
            </span>
            <span className="text-lg font-black text-white font-mono">
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
        </div>

        {/* Card 3: Active Control Mode */}
        <div className="bg-[#121929] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">CONTROL MODE</span>
          <div className="text-sm font-black flex items-center gap-1.5">
            {state.mode === 'AUTO' && <span className="text-emerald-400">🤖 AUTO GLOBAL RNG</span>}
            {state.mode === 'FORCED' && <span className="text-amber-400">🎯 FORCED OVERRIDE</span>}
            {state.mode === 'HOUSE_MAX_PROFIT' && <span className="text-purple-400">👑 HOUSE MAX PROFIT</span>}
          </div>
        </div>

        {/* Card 4: Next Winning Target */}
        <div className="bg-[#121929] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">NEXT WINNING OUTCOME</span>
          <div className="text-base font-black text-amber-300 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {state.forcedTarget ? String(state.forcedTarget) : gameConfig.targets[0]}
          </div>
        </div>

      </div>

      {/* 3. MASTER WINNING OVERRIDE & ALGORITHM CONTROLLER (Matching Screenshot) */}
      <div className="bg-[#121929] p-6 rounded-2xl border border-white/10 space-y-5">
        <div>
          <h4 className="text-base font-black text-amber-400 uppercase tracking-wide flex items-center gap-2 font-orbitron">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" /> MASTER WINNING OUTCOME OVERRIDE & ALGORITHM CONTROLLER
          </h4>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Select mode to dictate the outcome of current & future rounds across all live player devices
          </p>
        </div>

        {/* 3 Interactive Mode Selector Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          
          {/* 1. AUTO GLOBAL RNG MODE */}
          <button
            onClick={() => onUpdate({ mode: 'AUTO' })}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
              state.mode === 'AUTO'
                ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/50 text-white shadow-xl'
                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            <div className="font-black text-sm text-emerald-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> 1. AUTO GLOBAL RNG MODE
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-mono">
              Uses global Unix epoch timestamp seed PRNG. 100% fair & synchronized across all devices.
            </p>
          </button>

          {/* 2. FORCED OUTCOME OVERRIDE */}
          <button
            onClick={() => onUpdate({ mode: 'FORCED' })}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
              state.mode === 'FORCED'
                ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-xl'
                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            <div className="font-black text-sm text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> 2. FORCED OUTCOME OVERRIDE
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-mono">
              Manually specify exact winning outcome ({gameConfig.targetLabel}) that MUST win for all current live bets.
            </p>
          </button>

          {/* 3. HOUSE MAX PROFIT MODE */}
          <button
            onClick={() => onUpdate({ mode: 'HOUSE_MAX_PROFIT' })}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
              state.mode === 'HOUSE_MAX_PROFIT'
                ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/50 text-white shadow-xl'
                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            <div className="font-black text-sm text-purple-400 flex items-center gap-2">
              <Crown className="w-4 h-4" /> 3. HOUSE MAX PROFIT MODE
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-mono">
              Algorithm automatically picks outcome with LEAST payout (Maximum profit for House).
            </p>
          </button>

        </div>

        {/* TARGET OUTCOME SELECTION BUTTONS (Active in FORCED Mode or Always Clickable) */}
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
          <Label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
            🎯 SELECT FORCED TARGET OUTCOME ({gameConfig.targetLabel})
          </Label>

          <div className="flex flex-wrap gap-2">
            {gameConfig.targets.map((target) => (
              <button
                key={target}
                onClick={() => onUpdate({ mode: 'FORCED', forcedTarget: target })}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  state.mode === 'FORCED' && String(state.forcedTarget) === String(target)
                    ? 'bg-gradient-to-r from-[#F7B500] to-yellow-400 text-black font-black shadow-lg shadow-[#F7B500]/40 scale-105 ring-2 ring-white'
                    : 'bg-black/60 border border-white/15 text-gray-300 hover:border-white/40 hover:text-white'
                }`}
              >
                {target}
              </button>
            ))}
          </div>
        </div>

        {/* HOUSE EDGE & BET LIMITS ROW */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10 font-mono">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">HOUSE EDGE (%)</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={state.houseEdge}
              onChange={(e) => onUpdate({ houseEdge: parseFloat(e.target.value) || 0 })}
              className="bg-black/60 border-white/10 text-white h-9 text-xs font-mono text-center rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">MIN BET (₹)</Label>
            <Input
              type="number"
              value={state.minBet}
              onChange={(e) => onUpdate({ minBet: parseFloat(e.target.value) || 1 })}
              className="bg-black/60 border-white/10 text-white h-9 text-xs font-mono text-center rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">MAX BET (₹)</Label>
            <Input
              type="number"
              value={state.maxBet}
              onChange={(e) => onUpdate({ maxBet: parseFloat(e.target.value) || 10000 })}
              className="bg-black/60 border-white/10 text-white h-9 text-xs font-mono text-center rounded-xl"
            />
          </div>
        </div>

      </div>

      {/* 4. REAL-TIME LIVE PLAYER BET STREAM FOR THIS GAME */}
      <DedicatedGameBetStream gameKey={gameConfig.dbType} gameName={gameConfig.name} />

    </div>
  )
}

/**
 * Real-time Bet Stream table filtered for specific game
 */
function DedicatedGameBetStream({ gameKey, gameName }: { gameKey: string; gameName: string }) {
  const [bets, setBets] = useState<Array<any>>([])

  useEffect(() => {
    try {
      const q = query(collection(db, 'bets'), orderBy('timestamp', 'desc'), limit(30))
      const unsub = onSnapshot(q, (snap) => {
        const list: any[] = []
        snap.forEach(doc => {
          const data = doc.data()
          const gType = (data.game || data.gameType || data.betType || '').toString().toUpperCase()
          if (gType.includes(gameKey) || gameKey.includes(gType) || gameKey === 'LOTTERY') {
            list.push({ id: doc.id, ...data })
          }
        })
        setBets(list)
      }, (e) => {
        console.warn('Game Bet Stream Note:', e)
      })
      return () => unsub()
    } catch (e) {
      console.warn('Firebase query init:', e)
    }
  }, [gameKey])

  return (
    <div className="bg-[#121929] p-5 rounded-2xl border border-white/10 space-y-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 font-orbitron">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> REAL-TIME LIVE PLAYER BET STREAM ({gameName.toUpperCase()})
        </h4>
        <span className="text-xs text-gray-400 font-mono">{bets.length} RECENT BETS</span>
      </div>

      <div className="overflow-x-auto max-h-64 rounded-xl border border-white/10 bg-black/50">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead className="bg-[#182338] text-gray-400 uppercase sticky top-0">
            <tr>
              <th className="py-2.5 px-3">Bet ID</th>
              <th className="py-2.5 px-2">Player</th>
              <th className="py-2.5 px-2">Round #</th>
              <th className="py-2.5 px-2 text-center">Selected / Target</th>
              <th className="py-2.5 px-3 text-right">Wager (₹)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {bets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  No live bets recorded yet for {gameName}
                </td>
              </tr>
            ) : (
              bets.map((b) => {
                const bStatus = b.status || (b.isWin === true ? 'WIN' : b.isWin === false ? 'LOSS' : 'PENDING')
                const pName = b.userName || (b.userEmail ? b.userEmail.split('@')[0] : 'Real Player')
                const wagerAmt = b.amount || b.wager || 0

                return (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 font-bold text-gray-400 text-[11px]">{b.betId || b.id}</td>
                    <td className="py-2 px-2 text-white font-bold">{pName}</td>
                    <td className="py-2 px-2 text-[#F7B500] font-bold">#{b.roundId || 'LIVE'}</td>
                    <td className="py-2 px-2 text-center font-bold text-gray-300">
                      {b.selectedNumber !== undefined && b.selectedNumber !== null ? `#${b.selectedNumber}` :
                       b.selectedOption ? String(b.selectedOption) :
                       b.multiplier ? `${b.multiplier}x` : 'STANDARD'}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-amber-400">₹{wagerAmt}</td>
                    <td className="py-2 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        bStatus === 'PENDING' ? 'bg-yellow-950/90 text-yellow-300 border border-yellow-500/50 animate-pulse' :
                        bStatus === 'WIN' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' :
                        'bg-red-950 text-red-400 border border-red-500/30'
                      }`}>
                        {bStatus === 'PENDING' ? '⏳ PENDING' : bStatus === 'WIN' ? '🟢 WIN' : '🔴 LOSS'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-400 text-[10px]">
                      {b.timestamp ? new Date(b.timestamp).toLocaleTimeString() : 'NOW'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AllGamesRealtimeBetStream() {
  const [bets, setBets] = useState<Array<any>>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')

  useEffect(() => {
    try {
      const q = query(collection(db, 'bets'), orderBy('timestamp', 'desc'), limit(60))
      const unsub = onSnapshot(q, (snap) => {
        const list: any[] = []
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }))
        setBets(list)
      }, (e) => {
        console.warn('Firebase All Games Bet Stream Note:', e)
      })
      return () => unsub()
    } catch (e) {
      console.warn('Firebase query init:', e)
    }
  }, [])

  const filteredBets = bets.filter(b => {
    if (selectedFilter === 'ALL') return true
    const gKey = (b.game || b.gameType || b.betType || '').toString().toUpperCase()
    return gKey.includes(selectedFilter) || selectedFilter.includes(gKey)
  })

  // Summary Metrics
  const totalWagered = filteredBets.reduce((acc, b) => acc + (b.amount || b.wager || 0), 0)
  const totalPayout = filteredBets.reduce((acc, b) => acc + (b.payout || 0), 0)
  const pendingCount = filteredBets.filter(b => (b.status || (b.isWin === undefined ? 'PENDING' : '')) === 'PENDING').length

  return (
    <div className="bg-[#121826] p-6 rounded-3xl border border-white/10 space-y-5 shadow-2xl">
      
      {/* Header & Metrics */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 font-orbitron">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" /> GLOBAL LIVE PLAYER BET STREAM (ALL 10 GAMES)
          </h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Streaming live wagers, outcomes, and pending status across Plinko, Lucky Ball, Crash, Mines & Casino
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10">
            <span className="text-gray-400">TOTAL LIVE WAGER: </span>
            <span className="font-bold text-[#F7B500]">₹{totalWagered.toFixed(2)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10">
            <span className="text-gray-400">TOTAL PAYOUT: </span>
            <span className="font-bold text-emerald-400">₹{totalPayout.toFixed(2)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-yellow-950/80 border border-yellow-500/40 text-yellow-300 font-bold animate-pulse">
            ⏳ PENDING: {pendingCount}
          </div>
        </div>
      </div>

      {/* Game Filter Pills */}
      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono font-bold">
        {['ALL', 'LOTTERY', 'PLINKO', 'CRASH', 'MINES', 'COINFLIP', 'ROULETTE', 'SLOTS', 'DICE', 'DRAGONTOWER', 'PENALTY'].map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded-xl uppercase transition-all cursor-pointer ${
              selectedFilter === f
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-white'
                : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {f === 'ALL' ? '🌐 ALL GAMES' : f}
          </button>
        ))}
      </div>

      {/* Live Stream Table */}
      <div className="overflow-x-auto max-h-80 rounded-2xl border border-white/10 bg-black/50">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead className="bg-[#182338] text-gray-400 uppercase sticky top-0">
            <tr>
              <th className="py-2.5 px-3">Bet ID</th>
              <th className="py-2.5 px-2">Game</th>
              <th className="py-2.5 px-2">Player</th>
              <th className="py-2.5 px-2 text-right">Wager (₹)</th>
              <th className="py-2.5 px-2 text-center">Selection / Target</th>
              <th className="py-2.5 px-3 text-right">Payout (₹)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {filteredBets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500 font-mono">
                  No live bets recorded in real-time stream for filter "{selectedFilter}"
                </td>
              </tr>
            ) : (
              filteredBets.map((b) => {
                const bStatus = b.status || (b.isWin === true ? 'WIN' : b.isWin === false ? 'LOSS' : 'PENDING')
                const gName = (b.game || b.gameType || b.betType || 'GAME').toString().toUpperCase()
                const wagerAmt = b.amount || b.wager || 0
                const payoutAmt = b.payout || 0

                return (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-gray-400 text-[11px]">{b.betId || b.id}</td>

                    <td className="py-2.5 px-2 font-bold">
                      <span className="px-2 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px]">
                        {gName}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-white font-bold">{b.userName || (b.userEmail ? b.userEmail.split('@')[0] : 'Player')}</td>

                    <td className="py-2.5 px-2 text-right font-black text-amber-400">₹{wagerAmt}</td>

                    <td className="py-2.5 px-2 text-center font-bold text-gray-300">
                      {b.selectedNumber !== undefined && b.selectedNumber !== null ? `#${b.selectedNumber}` :
                       b.selectedOption ? String(b.selectedOption) :
                       b.multiplier ? `${b.multiplier}x` : 'STANDARD'}
                    </td>

                    <td className={`py-2.5 px-3 text-right font-black ${bStatus === 'WIN' ? 'text-emerald-400' : 'text-gray-500'}`}>
                      ₹{payoutAmt.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        bStatus === 'PENDING' ? 'bg-yellow-950/90 text-yellow-300 border border-yellow-500/50 animate-pulse' :
                        bStatus === 'WIN' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' :
                        'bg-red-950 text-red-400 border border-red-500/30'
                      }`}>
                        {bStatus === 'PENDING' ? '⏳ PENDING' : bStatus === 'WIN' ? '🟢 WIN' : '🔴 LOSS'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right text-gray-400 text-[10px]">
                      {b.timestamp ? new Date(b.timestamp).toLocaleTimeString() : 'NOW'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
