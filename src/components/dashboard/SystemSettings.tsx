'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Shield, AlertTriangle, Lock, Save, Loader } from 'lucide-react'

interface SystemConfig {
  maintenanceMode: boolean
  registrationEnabled: boolean
  minDeposit: number
  maxWithdrawal: number
  defaultRtp: number
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    registrationEnabled: true,
    minDeposit: 100,
    maxWithdrawal: 50000,
    defaultRtp: 98.0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/system/settings')
      const data = await res.json()
      if (data.success) setConfig(data.config)
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      alert('System settings updated!')
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Global Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="font-bold text-red-400">Maintenance Mode</p>
                <p className="text-sm text-red-200/60">
                  Disconnect all users and disable gameplay immediately.
                </p>
              </div>
            </div>
            <Switch 
              checked={config.maintenanceMode}
              onCheckedChange={(c) => setConfig({ ...config, maintenanceMode: c })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-blue-400" />
              <div>
                <p className="font-bold text-white">User Registration</p>
                <p className="text-sm text-gray-400">
                  Allow new users to sign up to the platform.
                </p>
              </div>
            </div>
            <Switch 
              checked={config.registrationEnabled}
              onCheckedChange={(c) => setConfig({ ...config, registrationEnabled: c })}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Deposit (₹)</label>
              <input
                type="number"
                value={config.minDeposit}
                onChange={(e) => setConfig({ ...config, minDeposit: Number(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Withdrawal (₹)</label>
              <input
                type="number"
                value={config.maxWithdrawal}
                onChange={(e) => setConfig({ ...config, maxWithdrawal: Number(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Global RTP Target (%)</label>
              <input
                type="number"
                value={config.defaultRtp}
                onChange={(e) => setConfig({ ...config, defaultRtp: Number(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-primary py-3 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save System Configuration
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
