'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Dices, 
  Coins, 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert,
  UserCheck,
  Megaphone,
  Headphones,
  Settings,
  ArrowUpRight,
  Download,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { AdminStatsOverview } from '@/components/dashboard/AdminStatsOverview'
import { AdminAnalytics } from '@/components/dashboard/AdminAnalytics'
import { AuditLogViewer } from '@/components/dashboard/AuditLogViewer'

export default function AdminDashboard() {
  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto text-white">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl text-purple-400">🛡️</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              ADMIN HUB
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">Real-time system metrics, shared wallet analytics, and platform health.</p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/10 transition flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            Last 24 Hours
          </button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-500 text-white text-sm font-bold shadow-lg hover:brightness-110 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </motion.div>

      {/* High-Level Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Users */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-teal-400 text-xs font-bold bg-teal-500/10 px-2 py-1 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" /> +12.5%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Active Users</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">24,592</h3>
          </div>
        </div>

        {/* Metric 2: Total Bets */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Dices className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-teal-400 text-xs font-bold bg-teal-500/10 px-2 py-1 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" /> +8.2%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Total Bets (24h)</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">$1.2M</h3>
          </div>
        </div>

        {/* Metric 3: Demo Coins */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
              <Coins className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-gray-400 text-xs font-bold bg-gray-500/10 px-2 py-1 rounded-md">
              0.0%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Demo Coins Circulating</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">45.8M</h3>
          </div>
        </div>

        {/* Metric 4: Server Load */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 border-l-4 border-l-teal-400 rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="px-2 py-1 bg-teal-500/20 text-teal-300 text-xs font-extrabold rounded-md uppercase">
              Optimal
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Server Load</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">24%</h3>
          </div>
        </div>
      </div>

      {/* Legacy Stats Overview */}
      <AdminStatsOverview />

      {/* Analytics & Live Activity Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AdminAnalytics />
        </div>

        {/* Recent High-Value Transactions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Live Transactions</h3>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-400"></span>
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                    U8
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">User_8492</p>
                    <p className="text-xs text-gray-400">2 mins ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-400">+$1,500.00</p>
                  <p className="text-xs text-gray-400">Plinko Win</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                    VX
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Vip_GamerX</p>
                    <p className="text-xs text-gray-400">5 mins ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">+$800.00</p>
                  <p className="text-xs text-gray-400">Crash Cashout</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                    CK
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">CryptoKing</p>
                    <p className="text-xs text-gray-400">12 mins ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-400">+$4,200.00</p>
                  <p className="text-xs text-gray-400">Slots Jackpot</p>
                </div>
              </div>
            </div>
          </div>

          <Link href="/history">
            <button className="w-full mt-6 py-2.5 rounded-xl border border-white/10 text-purple-300 text-sm font-bold hover:bg-white/5 transition-colors">
              View All Logs
            </button>
          </Link>
        </div>
      </div>

      {/* Bottom Section: Quick Links & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">System Health Alerts</h3>
          <div className="space-y-3">
            <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r-xl flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-semibold">Database Sync Auto-Bypass</p>
                <p className="text-xs text-gray-400 mt-0.5">DB offline mode active: All endpoints returning 200 OK via memory fallback.</p>
              </div>
            </div>
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-xl flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-semibold">Shared Wallet Operational</p>
                <p className="text-xs text-gray-400 mt-0.5">7 games synchronized under single central state ($10,000 base balance).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Admin Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/5 transition-all text-gray-300">
              <UserCheck className="w-6 h-6 mb-2 text-purple-400" />
              <span className="text-xs font-semibold">Manage Roles</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-teal-500/20 hover:text-teal-300 border border-white/5 transition-all text-gray-300">
              <Megaphone className="w-6 h-6 mb-2 text-teal-400" />
              <span className="text-xs font-semibold">New Promo</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/5 transition-all text-gray-300">
              <Headphones className="w-6 h-6 mb-2 text-amber-400" />
              <span className="text-xs font-semibold">Support Queue</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-all text-gray-300">
              <Settings className="w-6 h-6 mb-2 text-gray-400" />
              <span className="text-xs font-semibold">System Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          📜 System & Wallet Audit Logs
        </h3>
        <AuditLogViewer />
      </div>
    </div>
  )
}
