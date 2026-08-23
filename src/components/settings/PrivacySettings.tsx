'use client'

import { useState, useEffect } from 'react'
import { Eye, Users, History, Shield, Save, Loader } from 'lucide-react'

interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
  showBettingHistory: boolean
  allowFriendRequests: boolean
  shareDataForImprovements: boolean
}

export default function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'PUBLIC',
    showBettingHistory: false,
    allowFriendRequests: true,
    shareDataForImprovements: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/settings/privacy')
      const data = await res.json()
      
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await res.json()

      if (data.success) {
        alert('Privacy settings saved!')
      } else {
        alert(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save settings')
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
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Privacy Settings</h2>
        <p className="text-gray-400">Control who can see your information and activity</p>
      </div>

      {/* Profile Visibility */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Profile Visibility
        </h3>
        <p className="text-sm text-gray-400 mb-4">Choose who can view your profile</p>
        
        <div className="space-y-3">
          {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as const).map((visibility) => (
            <button
              key={visibility}
              onClick={() => setSettings({ ...settings, profileVisibility: visibility })}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                settings.profileVisibility === visibility
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-black/20 hover:bg-black/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white">
                    {visibility === 'PUBLIC' && '🌐 Public'}
                    {visibility === 'FRIENDS' && '👥 Friends Only'}
                    {visibility === 'PRIVATE' && '🔒 Private'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {visibility === 'PUBLIC' && 'Anyone can view your profile and stats'}
                    {visibility === 'FRIENDS' && 'Only your friends can see your profile'}
                    {visibility === 'PRIVATE' && 'Only you can see your profile'}
                  </p>
                </div>
                {settings.profileVisibility === visibility && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Betting History */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Activity & History
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Show Betting History</p>
              <p className="text-sm text-gray-400">Allow others to see your betting activity</p>
            </div>
            <Toggle
              checked={settings.showBettingHistory}
              onChange={() => setSettings({ ...settings, showBettingHistory: !settings.showBettingHistory })}
            />
          </div>
        </div>
      </div>

      {/* Social Settings */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Social Interactions
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Allow Friend Requests</p>
              <p className="text-sm text-gray-400">Let other users send you friend requests</p>
            </div>
            <Toggle
              checked={settings.allowFriendRequests}
              onChange={() => setSettings({ ...settings, allowFriendRequests: !settings.allowFriendRequests })}
            />
          </div>
        </div>
      </div>

      {/* Data Sharing */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Data & Analytics
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Share Anonymous Data</p>
              <p className="text-sm text-gray-400">
                Help us improve by sharing anonymized usage data
              </p>
            </div>
            <Toggle
              checked={settings.shareDataForImprovements}
              onChange={() => setSettings({ ...settings, shareDataForImprovements: !settings.shareDataForImprovements })}
            />
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <Shield className="w-4 h-4 inline mr-2" />
          <strong>Privacy Notice:</strong> Your personal data is encrypted and securely stored. 
          We never share your information with third parties without your consent.
        </p>
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
            Save Settings
          </>
        )}
      </button>
    </div>
  )
}
