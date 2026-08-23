'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Bell, Lock, Settings as SettingsIcon, UserX } from 'lucide-react'

// Import settings components
import ProfileSettings from '@/components/settings/ProfileSettings'
import SecuritySettings from '@/components/settings/SecuritySettings'
import NotificationSettings from '@/components/settings/NotificationSettings'
import PrivacySettings from '@/components/settings/PrivacySettings'
import PreferencesSettings from '@/components/settings/PreferencesSettings'
import AccountSettings from '@/components/settings/AccountSettings'

type TabId = 'profile' | 'security' | 'notifications' | 'privacy' | 'preferences' | 'account'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  { id: 'account', label: 'Account', icon: UserX },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />
      case 'security':
        return <SecuritySettings />
      case 'notifications':
        return <NotificationSettings />
      case 'privacy':
        return <PrivacySettings />
      case 'preferences':
        return <PreferencesSettings />
      case 'account':
        return <AccountSettings />
      default:
        return <ProfileSettings />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-orbitron font-bold gradient-text mb-8">
            ⚙️ Settings
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tab Navigation - Sidebar on desktop, horizontal on mobile */}
          <div className="lg:col-span-1">
            <div className="glass-card p-4">
              <nav className="space-y-1">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-primary text-white shadow-lg'
                          : 'text-gray-400 hover:bg-black/20 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </motion.button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-6 md:p-8"
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
