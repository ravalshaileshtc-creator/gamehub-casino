'use client'

import { useState, useEffect } from 'react'
import { Globe, DollarSign, Clock, Volume2, Save, Loader } from 'lucide-react'

interface Preferences {
  language: string
  currency: string
  timezone: string
  soundEffects: boolean
  theme: 'dark' | 'light'
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]

const currencies = [
  { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
]

const timezones = [
  { value: 'Asia/Kolkata', label: '(UTC+5:30) India Standard Time' },
  { value: 'America/New_York', label: '(UTC-5:00) Eastern Time' },
  { value: 'Europe/London', label: '(UTC+0:00) London' },
  { value: 'Asia/Dubai', label: '(UTC+4:00) Dubai' },
  { value: 'Asia/Singapore', label: '(UTC+8:00) Singapore' },
]

export default function PreferencesSettings() {
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    soundEffects: true,
    theme: 'dark',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/settings/preferences')
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      const data = await res.json()

      if (data.success) {
        alert('Preferences saved! Some changes may require a page refresh.')
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
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Preferences</h2>
        <p className="text-gray-400">Customize your experience</p>
      </div>

      {/* Language */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Language
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setPreferences({ ...preferences, language: lang.code })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                preferences.language === lang.code
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-black/20 hover:bg-black/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-semibold text-white">{lang.name}</span>
                </div>
                {preferences.language === lang.code && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Currency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setPreferences({ ...preferences, currency: curr.code })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                preferences.currency === curr.code
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-black/20 hover:bg-black/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{curr.code}</p>
                  <p className="text-sm text-gray-400">{curr.name}</p>
                </div>
                {preferences.currency === curr.code && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Timezone */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timezone
        </h3>
        <select
          value={preferences.timezone}
          onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sound & Display */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Sound & Display</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-white">Sound Effects</p>
                <p className="text-sm text-gray-400">Play sounds for wins, losses, and actions</p>
              </div>
            </div>
            <Toggle
              checked={preferences.soundEffects}
              onChange={() => setPreferences({ ...preferences, soundEffects: !preferences.soundEffects })}
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          💡 <strong>Note:</strong> Some preference changes may require refreshing the page to take full effect.
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
            Save Preferences
          </>
        )}
      </button>
    </div>
  )
}
