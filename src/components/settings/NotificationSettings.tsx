'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, Megaphone, Save, Loader } from 'lucide-react'

interface NotificationPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  depositNotifications: boolean
  withdrawalNotifications: boolean
  bonusNotifications: boolean
  promotionNotifications: boolean
  securityAlerts: boolean
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: true,
    depositNotifications: true,
    withdrawalNotifications: true,
    bonusNotifications: true,
    promotionNotifications: true,
    securityAlerts: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/settings/notifications')
      const data = await res.json()
      
      if (data.success) {
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      const data = await res.json()

      if (data.success) {
        alert('Notification preferences saved!')
      } else {
        alert(data.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-gradient-primary' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Notification Settings</h2>
        <p className="text-gray-400">Manage how you receive updates and alerts</p>
      </div>

      {/* Communication Channels */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Communication Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-white">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive updates via email</p>
              </div>
            </div>
            <Toggle
              checked={preferences.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-white">SMS Notifications</p>
                <p className="text-sm text-gray-400">Get text messages for important alerts</p>
              </div>
            </div>
            <Toggle
              checked={preferences.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-white">Push Notifications</p>
                <p className="text-sm text-gray-400">Browser notifications for instant updates</p>
              </div>
            </div>
            <Toggle
              checked={preferences.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
            />
          </div>
        </div>
      </div>

      {/* Transaction Notifications */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Transaction Alerts</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Deposits</p>
              <p className="text-sm text-gray-400">Get notified when funds are added</p>
            </div>
            <Toggle
              checked={preferences.depositNotifications}
              onChange={() => handleToggle('depositNotifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Withdrawals</p>
              <p className="text-sm text-gray-400">Updates on withdrawal status</p>
            </div>
            <Toggle
              checked={preferences.withdrawalNotifications}
              onChange={() => handleToggle('withdrawalNotifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Bonuses</p>
              <p className="text-sm text-gray-400">Alerts when you receive bonuses</p>
            </div>
            <Toggle
              checked={preferences.bonusNotifications}
              onChange={() => handleToggle('bonusNotifications')}
            />
          </div>
        </div>
      </div>

      {/* Marketing & Promotions */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          Marketing & Promotions
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Promotional Emails</p>
              <p className="text-sm text-gray-400">Special offers and promotions</p>
            </div>
            <Toggle
              checked={preferences.marketingEmails}
              onChange={() => handleToggle('marketingEmails')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Promotion Notifications</p>
              <p className="text-sm text-gray-400">New games, tournaments, and events</p>
            </div>
            <Toggle
              checked={preferences.promotionNotifications}
              onChange={() => handleToggle('promotionNotifications')}
            />
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Security Alerts</p>
            <p className="text-sm text-yellow-200/80">
              Critical security notifications (always enabled for your protection)
            </p>
          </div>
          <Toggle
            checked={preferences.securityAlerts}
            onChange={() => handleToggle('securityAlerts')}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Preferences
          </>
        )}
      </button>
    </div>
  )
}
