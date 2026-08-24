'use client'

import { useState } from 'react'
import MasterAdminLuckyBallPage from './luckyball/page'
import AdminGamesPage from './games/page'
import AdminUsersPage from './users/page'
import AdminAnalyticsPage from './analytics/page'
import { Crown, Gamepad2, Users, BarChart3 } from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'luckyball' | 'allgames' | 'users' | 'analytics'>('luckyball')

  return (
    <div className="min-h-screen bg-[#090C15] text-white p-4 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Top Admin Navigation Tabs */}
      <div className="bg-[#121826] p-2 rounded-2xl border border-white/10 flex flex-wrap gap-2 shadow-2xl">
        <button
          onClick={() => setActiveTab('luckyball')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
            activeTab === 'luckyball'
              ? 'bg-[#F7B500] text-black shadow-lg shadow-[#F7B500]/30 scale-105'
              : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Crown className="w-4 h-4" /> 1. LUCKY BALL CONTROL
        </button>

        <button
          onClick={() => setActiveTab('allgames')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
            activeTab === 'allgames'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
              : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Gamepad2 className="w-4 h-4" /> 2. ALL 10 GAMES CONTROL
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
              : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" /> 3. REAL USERS & ACCOUNTS
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
              : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> 4. PLATFORM ANALYTICS
        </button>
      </div>

      {/* Tab Content */}
      <div className="transition-all">
        {activeTab === 'luckyball' && <MasterAdminLuckyBallPage />}
        {activeTab === 'allgames' && <AdminGamesPage />}
        {activeTab === 'users' && <AdminUsersPage />}
        {activeTab === 'analytics' && <AdminAnalyticsPage />}
      </div>

    </div>
  )
}
