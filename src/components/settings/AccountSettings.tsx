import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Download, Clock, Info } from 'lucide-react'

export default function AccountSettings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSelfExclusion, setShowSelfExclusion] = useState(false)
  const [exclusionPeriod, setExclusionPeriod] = useState<'7' | '30' | '90' | '365'>('30')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [transactionPassword, setTransactionPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelfExclusion = async () => {
    if (!transactionPassword) {
      alert('Please enter your transaction password')
      return
    }

    if (!confirm(`Are you sure you want to self-exclude for ${exclusionPeriod} days? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/settings/self-exclusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          days: parseInt(exclusionPeriod),
          transactionPassword
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert('Self-exclusion activated. You will be logged out.')
        window.location.href = '/auth/login'
      } else {
        alert(data.error || 'Failed to activate self-exclusion')
      }
    } catch (error) {
      console.error('Self-exclusion error:', error)
      alert('Failed to activate self-exclusion')
    } finally {
      setLoading(false)
    }
  }

  const handleDataExport = async () => {
    try {
      const res = await fetch('/api/user/settings/export-data', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success) {
        alert('Data export request received. You will receive an email with download link within 24 hours.')
      } else {
        alert(data.error || 'Failed to request data export')
      }
    } catch (error) {
      console.error('Data export error:', error)
      alert('Failed to request data export')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm')
      return
    }

    if (!transactionPassword) {
      alert('Please enter your transaction password')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionPassword })
      })

      const data = await res.json()

      if (data.success) {
        alert('Account deletion request submitted. You will receive a confirmation email.')
        window.location.href = '/'
      } else {
        alert(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      alert('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Account Management</h2>
        <p className="text-gray-400">Responsible gambling and account controls</p>
      </div>

      {/* Account Status */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Info className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Account Status: Active</h3>
            <p className="text-sm text-gray-400">Your account is in good standing</p>
          </div>
        </div>
      </div>

      {/* Self-Exclusion */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Self-Exclusion
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Take a break from gambling for a set period. During this time, you won&apos;t be able to access your account.
        </p>

        {!showSelfExclusion ? (
          <button
            onClick={() => setShowSelfExclusion(true)}
            className="px-6 py-3 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 font-bold transition-colors"
          >
            Request Self-Exclusion
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select exclusion period
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['7', '30', '90', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setExclusionPeriod(days as '7' | '30' | '90' | '365')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      exclusionPeriod === days
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-white/10 bg-black/20 hover:bg-black/30'
                    }`}
                  >
                    <p className="font-bold text-white">{days} days</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {days === '7' && '1 week'}
                      {days === '30' && '1 month'}
                      {days === '90' && '3 months'}
                      {days === '365' && '1 year'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-200">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                <strong>Warning:</strong> This action cannot be reversed. You will be logged out immediately 
                and won&apos;t be able to access your account for the selected period.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Transaction Password
              </label>
              <input
                type="password"
                value={transactionPassword}
                onChange={(e) => setTransactionPassword(e.target.value)}
                placeholder="Enter 6-digit password"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSelfExclusion(false)
                  setTransactionPassword('')
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSelfExclusion}
                disabled={loading || !transactionPassword}
                className="flex-1 px-6 py-3 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 font-bold transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Activate Exclusion'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Data Export */}
      <div className="p-6 rounded-xl bg-black/20 border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <Download className="w-5 h-5" />
              Export Your Data
            </h3>
            <p className="text-sm text-gray-400">
              Download a copy of all your personal data and activity history
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDataExport}
          className="btn-secondary px-6 py-3"
        >
          Request Data Export
        </button>
      </div>

      {/* Account Deletion */}
      <div className="p-6 rounded-xl bg-red-500/10 border-2 border-red-500/30">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-200/80">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-black/40">
              <p className="text-sm text-gray-300 mb-4">
                <strong>Before you proceed:</strong>
              </p>
              <ul className="text-sm text-gray-400 space-y-2 mb-4">
                <li>• All your data will be permanently deleted</li>
                <li>• Your remaining balance will need to be withdrawn first</li>
                <li>• You won&apos;t be able to create a new account with the same email</li>
                <li>• This action cannot be reversed</li>
              </ul>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type <strong className="text-red-400">DELETE</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-red-500/30 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Password
                  </label>
                  <input
                    type="password"
                    value={transactionPassword}
                    onChange={(e) => setTransactionPassword(e.target.value)}
                    placeholder="Enter 6-digit password"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-red-500/30 text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                  setTransactionPassword('')
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'DELETE' || !transactionPassword}
                className="flex-1 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Permanently Delete Account'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Help & Support */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          Need help? Contact our support team at <strong>support@casinoplatform.com</strong> or visit our Help Center.
        </p>
      </div>
    </div>
  )
}
