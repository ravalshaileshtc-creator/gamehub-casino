'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Key, Lock, AlertTriangle, Check, Copy, Loader, Monitor, X } from 'lucide-react'
import Image from 'next/image'

interface Session {
  id: string
  deviceInfo: string
  ipAddress: string
  lastActive: string
  current: boolean
}

function TransactionPasswordSection() {
  const [isSet, setIsSet] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newTxPassword, setNewTxPassword] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/user/settings/transaction-password')
      const data = await res.json()
      if (data.success) setIsSet(data.isSet)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/user/settings/transaction-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newTransactionPassword: newTxPassword }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Transaction password set successfully!')
        setShowForm(false)
        setCurrentPassword('')
        setNewTxPassword('')
        fetchStatus()
      } else {
        alert(data.error || 'Failed to set transaction password')
      }
    } catch {
      alert('Failed to set transaction password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 rounded-xl bg-black/20 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            Transaction Password
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {isSet ? 'Secondary password required for withdrawals and sensitive actions.' : 'Set a secondary password for extra security.'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary px-4 py-2"
        >
          {showForm ? 'Cancel' : isSet ? 'Change' : 'Set Now'}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="space-y-4 mt-4"
        >
          <div>
            <label className="block text-sm text-gray-300 mb-2">Account Password (to verify it&apos;s you)</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">New Transaction Password (6+ characters)</label>
            <input
              type="password"
              value={newTxPassword}
              onChange={(e) => setNewTxPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-3 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Transaction Password'}
          </button>
        </motion.form>
      )}
    </div>
  )
}

export default function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    fetchSecurityStatus()
    fetchSessions()
  }, [])

  const fetchSecurityStatus = async () => {
    try {
      const res = await fetch('/api/user/security/status')
      const data = await res.json()
      if (data.success) {
        setTwoFactorEnabled(data.twoFactorEnabled || false)
      }
    } catch (error) {
      console.error('Failed to fetch security status:', error)
    }
  }

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/user/settings/sessions')
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const startSetup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setShowSetup(true)
      } else {
        alert(data.error || 'Failed to start 2FA setup')
      }
    } catch (error) {
      console.error('2FA setup error:', error)
      alert('Failed to start 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      alert('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode, secret }),
      })

      const data = await res.json()
      
      if (data.success) {
        setBackupCodes(data.backupCodes)
        setTwoFactorEnabled(true)
        setVerificationCode('')
      } else {
        alert(data.error || 'Invalid verification code')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      alert('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:')
    if (!password) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      
      if (data.success) {
        setTwoFactorEnabled(false)
        setShowSetup(false)
        setBackupCodes([])
        alert('2FA disabled successfully')
      } else {
        alert(data.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      console.error('2FA disable error:', error)
      alert('Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (data.success) {
        alert('Password changed successfully!')
        setShowPasswordForm(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        alert(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      alert('Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const logoutSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to logout this session?')) return

    try {
      const res = await fetch(`/api/user/settings/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        setSessions(sessions.filter(s => s.id !== sessionId))
        alert('Session logged out successfully')
      } else {
        alert(data.error || 'Failed to logout session')
      }
    } catch (error) {
      console.error('Logout session error:', error)
      alert('Failed to logout session')
    }
  }

  const logoutAllSessions = async () => {
    if (!confirm('Are you sure you want to logout all other sessions? You will remain logged in on this device.')) return

    try {
      const res = await fetch('/api/user/settings/sessions?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        fetchSessions()
        alert('All other sessions logged out successfully')
      } else {
        alert(data.error || 'Failed to logout sessions')
      }
    } catch (error) {
      console.error('Logout all error:', error)
      alert('Failed to logout sessions')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Security Settings</h2>
        <p className="text-gray-400">Manage your account security and authentication</p>
      </div>

      {/* Password Section */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Account Password
            </h3>
            <p className="text-sm text-gray-400 mt-1">Change your account password</p>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="btn-secondary px-4 py-2"
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleChangePassword}
            className="space-y-4 mt-4"
          >
            <div>
              <label className="block text-sm text-gray-300 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </motion.form>
        )}
      </div>

      {/* Transaction Password Section */}
      <TransactionPasswordSection />

      {/* 2FA Section */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-400 mt-1">Add an extra layer of security</p>
          </div>
          
          {twoFactorEnabled ? (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-bold">
                Enabled
              </span>
              <button
                onClick={disable2FA}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold transition-colors disabled:opacity-50"
              >
                Disable
              </button>
            </div>
          ) : (
            <button
              onClick={startSetup}
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Enable 2FA'}
            </button>
          )}
        </div>

        {showSetup && !twoFactorEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 mt-4 p-4 rounded-xl bg-black/40"
          >
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                Scan this QR code with your authenticator app
              </p>
              
              {qrCode && (
                <div className="inline-block p-4 bg-white rounded-xl">
                  <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Or enter manually:
                </label>
                <code className="px-4 py-2 bg-black/40 rounded-lg text-primary font-mono">
                  {secret}
                </code>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Enter 6-digit code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-center text-2xl font-bold tracking-wider focus:border-primary focus:outline-none"
                maxLength={6}
              />
            </div>

            <button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </motion.div>
        )}

        {backupCodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-yellow-400 mb-2">Save Your Backup Codes</h4>
                <p className="text-sm text-yellow-200/80">
                  Keep these safe. Use them to access your account if you lose your device.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((code, i) => (
                <div key={i} className="px-3 py-2 bg-black/40 rounded-lg text-center">
                  <code className="text-white font-mono text-sm">{code}</code>
                </div>
              ))}
            </div>

            <button
              onClick={copyBackupCodes}
              className="w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Active Sessions
            </h3>
            <p className="text-sm text-gray-400 mt-1">Manage devices logged into your account</p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={logoutAllSessions}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold transition-colors text-sm"
            >
              Logout All Others
            </button>
          )}
        </div>

        {loadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl bg-black/40"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-white">{session.deviceInfo}</p>
                    <p className="text-sm text-gray-400">{session.ipAddress}</p>
                    <p className="text-xs text-gray-500">
                      Last active: {new Date(session.lastActive).toLocaleString()}
                    </p>
                  </div>
                </div>
                {session.current ? (
                  <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">
                    Current
                  </span>
                ) : (
                  <button
                    onClick={() => logoutSession(session.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
