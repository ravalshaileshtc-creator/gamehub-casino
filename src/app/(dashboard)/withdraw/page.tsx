'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, TrendingDown, Shield, Clock } from 'lucide-react'
import { useBalance } from '@/context/BalanceContext'
import { useToast } from '@/hooks/use-toast'

export default function WithdrawPage() {
  const { toast } = useToast()
  const [amount, setAmount] = useState(500)
  const [method, setMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  
  const [upiId, setUpiId] = useState('')
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const withdrawalFee = Math.max(10, amount * 0.02)
  const finalAmount = amount - withdrawalFee

  const { refreshBalance } = useBalance()

  const handleSendOtp = async () => {
    setOtpLoading(true)
    try {
        const res = await fetch('/api/auth/otp/send', { method: 'POST' })
        const data = await res.json()
        if (data.success) {
            setOtpSent(true)
            toast({ title: 'OTP Sent', description: 'Check your email for the code.' })
        } else {
            toast({ title: 'Error', description: data.error || 'Failed to send OTP', variant: 'destructive' })
        }
    } catch {
        toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
        setOtpLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!otp) {
      toast({ title: 'Error', description: 'Please enter the OTP sent to your email', variant: 'destructive' })
      return
    }

    if (method === 'UPI' && !upiId) {
      toast({ title: 'Error', description: 'Please enter your UPI ID', variant: 'destructive' })
      return
    }

    if (method === 'BANK_TRANSFER' && (!bankDetails.accountNumber || !bankDetails.ifscCode)) {
      toast({ title: 'Error', description: 'Please enter your bank details', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method,
          otp,
          upiId: method === 'UPI' ? upiId : undefined,
          ...( method === 'BANK_TRANSFER' && bankDetails),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        refreshBalance() // Update balance immediately
        setTimeout(() => {
          setSuccess(false)
          setAmount(500)
          setOtp('')
          setOtpSent(false)
          setUpiId('')
          setBankDetails({ accountNumber: '', ifscCode: '', bankName: '' })
        }, 3000)
      } else {
        toast({ title: 'Withdrawal Failed', description: data.error || 'Please try again', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast({ title: 'Error', description: 'Failed to create withdrawal request', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-gray-950 to-black p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent opacity-50" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown className="w-6 h-6 text-orange-400 animate-pulse" />
            <span className="text-sm uppercase tracking-wider text-gray-500 font-bold">Secure Withdrawals</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-3 text-white font-heading tracking-tight">
            💸 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-200 to-orange-400 animate-text-shimmer bg-[length:200%_auto]">Withdraw Funds</span>
          </h1>
          <p className="text-gray-400 text-lg">Fast and secure withdrawals to your account.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-8 space-y-6">
              {success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-16"
                >
                  <CheckCircle className="w-28 h-28 text-green-400 mx-auto mb-6" />
                  <h2 className="text-4xl font-bold text-white mb-3 font-heading">Withdrawal Requested!</h2>
                  <p className="text-gray-400 text-lg">Your request is under review. Funds will be transferred within 24 hours.</p>
                </motion.div>
              ) : (
                <>
                  {/* Warning */}
                  <div className="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-bold mb-2 text-base">Important Notice:</p>
                      <ul className="space-y-1.5 text-yellow-200/80">
                        <li>• Withdrawals require admin approval</li>
                        <li>• Processing time: 24-48 hours</li>
                        <li>• 2% fee applies (minimum ₹10)</li>
                        <li>• KYC verification required</li>
                      </ul>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-3 uppercase tracking-wider font-medium">Withdrawal Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min="500"
                      max="50000"
                      className="w-full px-6 py-4 rounded-xl bg-black/60 border border-white/10 text-white text-3xl font-bold font-heading focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Fee Calculation */}
                  <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-400">Requested Amount</span>
                      <span className="text-white font-bold text-lg">₹{amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-400">Withdrawal Fee (2%)</span>
                      <span className="text-red-400 font-bold text-lg">-₹{withdrawalFee.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/20 my-2"></div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-white font-bold text-lg">You will receive</span>
                      <span className="text-green-400 font-bold text-2xl font-heading">₹{finalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-4 uppercase tracking-wider font-medium">Withdrawal Method</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setMethod('UPI')}
                        className={`flex-1 py-4 rounded-xl font-bold transition-all hover:scale-105 ${
                          method === 'UPI'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_30px_rgba(102,126,234,0.3)]'
                            : 'bg-black/60 text-gray-400 hover:bg-black/80 border border-white/10'
                        }`}
                      >
                        UPI
                      </button>
                      <button
                        onClick={() => setMethod('BANK_TRANSFER')}
                        className={`flex-1 py-4 rounded-xl font-bold transition-all hover:scale-105 ${
                          method === 'BANK_TRANSFER'
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_30px_rgba(102,126,234,0.3)]'
                            : 'bg-black/60 text-gray-400 hover:bg-black/80 border border-white/10'
                        }`}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  {/* UPI Details */}
                  {method === 'UPI' && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-3 uppercase tracking-wider font-medium">UPI ID *</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@paytm"
                        className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Bank Details */}
                  {method === 'BANK_TRANSFER' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-3 uppercase tracking-wider font-medium">Bank Name *</label>
                        <input
                          type="text"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                          placeholder="State Bank of India"
                          className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-3 uppercase tracking-wider font-medium">Account Number *</label>
                        <input
                          type="text"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                          placeholder="1234567890"
                          className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-3 uppercase tracking-wider font-medium">IFSC Code *</label>
                        <input
                          type="text"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                          placeholder="SBIN0001234"
                          className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* OTP Verification */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm text-gray-300 uppercase tracking-wider font-medium">Verification Code *</label>
                        {!otpSent && (
                            <button 
                                onClick={handleSendOtp} 
                                disabled={otpLoading}
                                className="text-xs text-orange-400 hover:text-orange-300 font-bold disabled:opacity-50"
                            >
                                {otpLoading ? 'Sending...' : 'SEND OTP'}
                            </button>
                        )}
                        {otpSent && (
                             <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3"/> Sent
                             </span>
                        )}
                    </div>
                    
                    {otpSent ? (
                        <div className="relative">
                            <input
                              type="text"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only digits
                              placeholder="Enter 6-digit OTP"
                              className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all tracking-[0.5em] text-center text-2xl font-mono"
                            />
                            <button 
                                onClick={handleSendOtp}
                                disabled={otpLoading}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                            >
                                Resend
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                            <p className="text-sm text-gray-300 mb-3">We will send a verification code to your email.</p>
                            <button 
                                onClick={handleSendOtp}
                                disabled={otpLoading} 
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-black font-bold text-sm transition-colors"
                            >
                                {otpLoading ? <span className="animate-pulse">Sending...</span> : 'Send Verification Code'}
                            </button>
                        </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Two-factor authentication required for withdrawals
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || !otpSent || otp.length < 6}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-5 text-xl font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_40px_rgba(251,146,60,0.4)] hover:scale-[1.02]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                        Processing...
                      </span>
                    ) : (
                      `🔒 Verify & Withdraw`
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 font-heading text-lg">Withdrawal Limits</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                  <span className="text-gray-400">Minimum</span>
                  <span className="text-white font-bold">₹500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                  <span className="text-gray-400">Maximum</span>
                  <span className="text-white font-bold">₹50,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    24-48h
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 font-heading text-lg">Required Documents</h3>
              <ul className="text-sm text-gray-400 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  PAN Card verification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  Bank account verification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  Phone number verification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  Email verification
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
