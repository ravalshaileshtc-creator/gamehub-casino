'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { db } from '@/lib/firebase'
import { doc, setDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore'
import { getBallColor, getGlobalRoundWinningNumber } from '@/app/(dashboard)/(games)/lottery/page'
import { Crown, ShieldAlert, Cpu, Zap, RefreshCw, Eye, History, CheckCircle, AlertTriangle, Play, Lock } from 'lucide-react'

export type ControlMode = 'AUTO' | 'FORCED' | 'HOUSE_MAX_PROFIT'

export interface LuckyBallAdminConfig {
  mode: ControlMode
  forcedNumber: number
  updatedAt: string
  updatedBy: string
}

export default function MasterAdminLuckyBallPage() {
  const [config, setConfig] = useState<LuckyBallAdminConfig>({
    mode: 'AUTO',
    forcedNumber: 7,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin'
  })

  const [saving, setSaving] = useState(false)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  // Live Round Sync
  const [roundId, setRoundId] = useState(9100)
  const [phase, setPhase] = useState<'BETTING' | 'DRAWING' | 'RESULT'>('BETTING')
  const [timeLeft, setTimeLeft] = useState(30)
  const [expectedNextWin, setExpectedNextWin] = useState<number>(7)

  // Live Bets Stream from Firebase
  const [liveBets, setLiveBets] = useState<any[]>([])

  // Listen to Admin Settings from Firebase
  useEffect(() => {
    const docRef = doc(db, 'admin_settings', 'luckyball')
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as LuckyBallAdminConfig)
      }
    }, (err) => {
      console.warn('Firebase Admin Listen Error:', err)
    })

    return () => unsub()
  }, [])

  // Listen to Live Bets Stream from Firebase
  useEffect(() => {
    const betsQuery = query(collection(db, 'bets'), orderBy('timestamp', 'desc'), limit(20))
    const unsubBets = onSnapshot(betsQuery, (snapshot) => {
      const betsList: any[] = []
      snapshot.forEach(d => {
        betsList.push({ id: d.id, ...d.data() })
      })
      setLiveBets(betsList)
    }, (err) => {
      console.warn('Firebase Bets Listen Error:', err)
    })

    return () => unsubBets()
  }, [])

  // Global Clock Ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      const CYCLE = 40
      const nowSec = Math.floor(Date.now() / 1000)
      const curRound = 9100 + Math.floor(nowSec / CYCLE)
      const cycleSec = nowSec % CYCLE

      setRoundId(curRound)

      if (cycleSec < 30) {
        setPhase('BETTING')
        setTimeLeft(30 - cycleSec)
      } else if (cycleSec >= 30 && cycleSec < 35) {
        setPhase('DRAWING')
        setTimeLeft(35 - cycleSec)
      } else {
        setPhase('RESULT')
        setTimeLeft(40 - cycleSec)
      }

      // Compute expected win number based on config
      if (config.mode === 'FORCED') {
        setExpectedNextWin(config.forcedNumber)
      } else {
        setExpectedNextWin(getGlobalRoundWinningNumber(curRound))
      }
    }, 500)

    return () => clearInterval(ticker)
  }, [config])

  // Save Settings to Firebase Firestore
  const saveAdminSettings = async (newMode: ControlMode, newForcedNum: number) => {
    setSaving(true)
    const newConfig: LuckyBallAdminConfig = {
      mode: newMode,
      forcedNumber: newForcedNum,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Master Admin'
    }

    try {
      await setDoc(doc(db, 'admin_settings', 'luckyball'), newConfig, { merge: true })
      setConfig(newConfig)
      setSaveNotice(`✅ MASTER ADMIN CONTROL UPDATED: ${newMode} MODE (${newMode === 'FORCED' ? `BALL #${newForcedNum}` : 'GLOBAL RNG'})`)
      setTimeout(() => setSaveNotice(null), 3000)
    } catch (e) {
      console.error('Firebase Admin Save Error:', e)
      setSaveNotice('⚠️ Failed to save settings to Firebase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090C15] text-white p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121826] p-4 rounded-3xl border border-[#F7B500]/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F7B500]/10 border border-[#F7B500] flex items-center justify-center text-[#F7B500] shadow-lg shadow-[#F7B500]/20">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-[#F7B500] to-yellow-100 flex items-center gap-2">
              MASTER ADMIN CONTROL CENTER
            </h1>
            <p className="text-xs text-gray-400 font-mono">REAL-TIME GLOBAL LUCKY BALL (0-9) CONTROLLER & OVERRIDE</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>FIREBASE LIVE SYNC ACTIVE</span>
        </div>
      </div>

      {/* Save Notice Alert */}
      {saveNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold text-center shadow-lg"
        >
          {saveNotice}
        </motion.div>
      )}

      {/* Live Round Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="bg-[#121826] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 font-mono uppercase font-bold block">GLOBAL ROUND</span>
          <span className="text-2xl font-black font-mono text-[#F7B500]">#{roundId}</span>
        </div>

        <div className="bg-[#121826] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 font-mono uppercase font-bold block">PHASE & COUNTDOWN</span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
              phase === 'BETTING' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
              phase === 'DRAWING' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
              'bg-purple-950 text-purple-400 border border-purple-500/40'
            }`}>
              {phase}
            </span>
            <span className="text-xl font-black font-mono text-white">
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
        </div>

        <div className="bg-[#121826] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 font-mono uppercase font-bold block">CONTROL MODE</span>
          <span className={`text-base font-black font-mono block ${
            config.mode === 'FORCED' ? 'text-red-400' :
            config.mode === 'HOUSE_MAX_PROFIT' ? 'text-purple-400' :
            'text-emerald-400'
          }`}>
            {config.mode === 'FORCED' ? '🎯 FORCED OVERRIDE' :
             config.mode === 'HOUSE_MAX_PROFIT' ? '🛡️ HOUSE MAX PROFIT' :
             '🤖 AUTO GLOBAL RNG'}
          </span>
        </div>

        <div className="bg-[#121826] p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-gray-400 font-mono uppercase font-bold block">NEXT WINNING BALL</span>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center border border-white/40 font-black text-xs text-black shadow-md"
              style={{
                background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${getBallColor(expectedNextWin)} 65%, #000000 100%)`
              }}
            >
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[#090C15] font-black text-[10px]">
                {expectedNextWin}
              </div>
            </div>
            <span className="text-lg font-black font-mono text-white">BALL #{expectedNextWin}</span>
          </div>
        </div>

      </div>

      {/* MASTER RESULT OVERRIDE CONTROLLER */}
      <div className="bg-[#121826] p-6 rounded-3xl border border-[#F7B500]/30 space-y-6 shadow-2xl">
        
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-black text-[#F7B500] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5" /> MASTER WINNING BALL OVERRIDE & ALGORITHM CONTROLLER
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Select mode to dictate the outcome of current & future rounds across all live player devices
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* AUTO MODE */}
          <button
            disabled={saving}
            onClick={() => saveAdminSettings('AUTO', config.forcedNumber)}
            className={`p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer ${
              config.mode === 'AUTO'
                ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-500/20'
                : 'bg-black/40 border-white/10 hover:border-white/30 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span className="font-black text-sm text-white">1. AUTO GLOBAL RNG MODE</span>
            </div>
            <p className="text-[11px] text-gray-300 font-mono leading-tight">
              Uses global Unix epoch timestamp seed PRNG. 100% fair & synchronized across all devices.
            </p>
          </button>

          {/* FORCED OVERRIDE */}
          <button
            disabled={saving}
            onClick={() => saveAdminSettings('FORCED', config.forcedNumber)}
            className={`p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer ${
              config.mode === 'FORCED'
                ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/50 shadow-xl shadow-red-500/20'
                : 'bg-black/40 border-white/10 hover:border-white/30 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span className="font-black text-sm text-white">2. FORCED BALL OVERRIDE</span>
            </div>
            <p className="text-[11px] text-gray-300 font-mono leading-tight">
              Manually specify exact winning ball (0-9) that MUST win for all current live bets.
            </p>
          </button>

          {/* HOUSE MAX PROFIT */}
          <button
            disabled={saving}
            onClick={() => saveAdminSettings('HOUSE_MAX_PROFIT', config.forcedNumber)}
            className={`p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer ${
              config.mode === 'HOUSE_MAX_PROFIT'
                ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/50 shadow-xl shadow-purple-500/20'
                : 'bg-black/40 border-white/10 hover:border-white/30 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <span className="font-black text-sm text-white">3. HOUSE MAX PROFIT MODE</span>
            </div>
            <p className="text-[11px] text-gray-300 font-mono leading-tight">
              Algorithm automatically picks ball number with LEAST payout (Maximum profit for House).
            </p>
          </button>

        </div>

        {/* Forced Ball Selector Grid (0-9) */}
        {config.mode === 'FORCED' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-2xl bg-black/60 border border-red-500/40 space-y-3"
          >
            <span className="text-xs font-black text-red-400 font-mono uppercase tracking-wider block">
              🎯 SELECT FORCED WINNING BALL NUMBER (0-9):
            </span>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                const isSelected = config.forcedNumber === num
                const bColor = getBallColor(num)
                return (
                  <button
                    key={num}
                    disabled={saving}
                    onClick={() => saveAdminSettings('FORCED', num)}
                    className={`h-12 rounded-2xl font-black text-sm transition-all border flex items-center justify-center relative touch-spring ${
                      isSelected
                        ? 'border-red-500 ring-4 ring-red-500/50 scale-105 shadow-xl shadow-red-500/40'
                        : 'border-white/10 hover:border-white/40'
                    }`}
                    style={{
                      background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${bColor} 65%, #000000 100%)`
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#090C15] font-black text-xs shadow-inner">
                      {num}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

      </div>

      {/* LIVE PLAYER BET STREAM & REAL-TIME MONITORING */}
      <div className="bg-[#121826] p-6 rounded-3xl border border-white/10 space-y-4">
        
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <Eye className="w-5 h-5 text-[#F7B500]" /> REAL-TIME LIVE PLAYER BET STREAM (FIREBASE)
          </h3>
          <span className="text-xs text-gray-400 font-mono">{liveBets.length} RECENT BETS</span>
        </div>

        <div className="overflow-x-auto max-h-64 rounded-2xl border border-white/10 bg-black/40">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-[#182338] text-gray-400 uppercase sticky top-0">
              <tr>
                <th className="py-2 px-3">Bet ID</th>
                <th className="py-2 px-2">Round #</th>
                <th className="py-2 px-2">Bet Type</th>
                <th className="py-2 px-2 text-center">Selected #</th>
                <th className="py-2 px-3 text-right">Wager (₹)</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {liveBets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">No live bets recorded yet</td>
                </tr>
              ) : (
                liveBets.map(b => {
                  const bStatus = b.status || (b.isWin === true ? 'WIN' : b.isWin === false ? 'LOSS' : 'PENDING')
                  return (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 font-bold text-gray-400">{b.betId || b.id}</td>
                      <td className="py-2 px-2 text-[#F7B500] font-bold">#{b.roundId}</td>
                      <td className="py-2 px-2 font-bold text-white">{b.betType}</td>
                      <td className="py-2 px-2 text-center font-bold">
                        {b.selectedNumber !== null ? `#${b.selectedNumber}` : 'ALL'}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-emerald-400">₹{b.amount}</td>
                      <td className="py-2 px-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          bStatus === 'PENDING' ? 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/50 animate-pulse' :
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

    </div>
  )
}
