'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Smartphone, Key, Copy, Check, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSecurityStatus()
  }, [])

  const fetchSecurityStatus = async () => {
    // TODO: Fetch user's 2FA status from API
    setTwoFactorEnabled(false)
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

  const regenerateBackupCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/backup-codes', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        setBackupCodes(data.backupCodes)
      } else {
        alert(data.error || 'Failed to regenerate backup codes')
      }
    } catch (error) {
      console.error('Backup codes error:', error)
      alert('Failed to regenerate backup codes')
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-orbitron font-bold gradient-text mb-8 flex items-center gap-3">
          <Shield className="w-12 h-12" />
          Security Settings
        </h1>

        {/* Two-Factor Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                <Smartphone className="w-6 h-6" />
                Two-Factor Authentication
              </h2>
              <p className="text-gray-400">Add an extra layer of security to your account</p>
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

          {/* Setup Flow */}
          {showSetup && !twoFactorEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 mt-6 p-6 rounded-xl bg-black/20 border border-white/10"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-4">Scan QR Code</h3>
                <p className="text-gray-400 mb-6">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                
                {qrCode && (
                  <div className="inline-block p-4 bg-white rounded-xl">
                    <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm text-gray-300 mb-2">
                    Or enter this code manually:
                  </label>
                  <code className="px-4 py-2 bg-black/40 rounded-lg text-primary font-mono">
                    {secret}
                  </code>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Enter 6-digit verification code
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

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-2">Save Your Backup Codes</h3>
                  <p className="text-sm text-yellow-200/80">
                    Keep these codes safe. You can use them to access your account if you lose your authenticator device.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, i) => (
                  <div key={i} className="px-3 py-2 bg-black/40 rounded-lg text-center">
                    <code className="text-white font-mono">{code}</code>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyBackupCodes}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy All'}
                </button>
                
                {twoFactorEnabled && (
                  <button
                    onClick={regenerateBackupCodes}
                    className="flex-1 px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-bold transition-colors"
                  >
                    Generate New Codes
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>



        {/* Password Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8"
        >

          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
            <Key className="w-6 h-6" />
            Password
          </h2>
          <p className="text-gray-400 mb-6">Change your account password</p>
          
          <button className="btn-secondary px-6 py-3">
            Change Password
          </button>
        </motion.div>
      </div>
    </div>
  )
}


