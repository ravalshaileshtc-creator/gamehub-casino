'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Smartphone, Bitcoin, CheckCircle, Zap, Shield, DollarSign } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void
    }
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => Promise<void>
  prefill: {
    name: string
    email: string
  }
  theme: {
    color: string
  }
  modal: {
    ondismiss: () => void
  }
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export default function DepositPage() {
  const [amount, setAmount] = useState(500)
  const [method, setMethod] = useState<'RAZORPAY' | 'UPI' | 'CRYPTO'>('RAZORPAY')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)

  const quickAmounts = [100, 500, 1000, 5000, 10000]

  // Toggle Dev Mode with secret key combo (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsDevMode(prev => !prev)
        console.log('Dev Mode Toggled')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRazorpayDeposit = async () => {
    if (!razorpayLoaded && !isDevMode) {
      alert('Payment gateway is loading. Please wait...')
      return
    }

    setLoading(true)

    try {
      // Create order
      const res = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.error || 'Failed to create order')
        setLoading(false)
        return
      }

      if (isDevMode) {
        // DEV MODE: Simulate successful payment
        console.log('DEV MODE:  biggestWin: { profit: number } | nullment success...')
        const mockPaymentId = `pay_${Math.random().toString(36).substring(7)}`
        
        // Get valid signature from dev endpoint
        const sigRes = await fetch('/api/dev/mock-razorpay-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.order.orderId,
            paymentId: mockPaymentId
          })
        })
        
        const sigData = await sigRes.json()
        
        if (!sigData.success) {
          throw new Error(sigData.error || 'Failed to generate mock signature')
        }

        // Verify payment
        const verifyRes = await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.order.orderId,
            paymentId: mockPaymentId,
            signature: sigData.signature,
          }),
        })

        const verifyData = await verifyRes.json()

        if (verifyData.success) {
            setSuccess(true)
            setTimeout(() => {
              setSuccess(false)
              window.location.reload()
            }, 3000)
        } else {
            alert('Payment verification failed')
        }
        setLoading(false)
        return
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Casino Platform',
        description: 'Deposit to wallet',
        order_id: data.order.orderId,
        handler: async function (response: RazorpayResponse) {
          // Verify payment
          const verifyRes = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          })

          const verifyData = await verifyRes.json()

          if (verifyData.success) {
            setSuccess(true)
            setTimeout(() => {
              setSuccess(false)
              window.location.reload()
            }, 3000)
          } else {
            alert('Payment verification failed')
          }

          setLoading(false)
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#667eea',
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Deposit error:', error)
      alert('Failed to initiate payment')
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (method === 'RAZORPAY') {
      handleRazorpayDeposit()
    } else {
      // Handle other payment methods (manual)
      alert(`${method} deposit: Please contact support for manual deposit instructions.`)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      
      <div className="space-y-8">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-gray-950 to-black p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px] animate-pulse-slow" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-6 h-6 text-green-400 animate-pulse" />
              <span className="text-sm uppercase tracking-wider text-gray-500 font-bold">Secure Deposits</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-3 text-white font-heading tracking-tight">
              💰 <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-200 to-green-400 animate-text-shimmer bg-[length:200%_auto]">Deposit Funds</span>
            </h1>
            <p className="text-gray-400 text-lg">Instant deposits. Start playing in seconds.</p>
            {isDevMode && (
              <div className="mt-2 inline-block px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-500 text-xs font-bold uppercase tracking-wider">
                DEV MODE ACTIVE
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deposit Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-8 space-y-6">
                {success ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-16"
                  >
                    <CheckCircle className="w-28 h-28 text-green-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-bold text-white mb-3 font-heading">Deposit Successful!</h2>
                    <p className="text-gray-400 text-lg">Your funds have been credited to your wallet</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Amount */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-3 uppercase tracking-wider font-medium">Amount (₹)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        min="100"
                        max="100000"
                        className="w-full px-6 py-4 rounded-xl bg-black/60 border border-white/10 text-white text-3xl font-bold font-heading focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                    </div>

                    {/* Quick Amounts */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-3 uppercase tracking-wider font-medium">Quick Select</label>
                      <div className="grid grid-cols-5 gap-2">
                        {quickAmounts.map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setAmount(amt)}
                            className={`py-3 rounded-xl font-bold transition-all hover:scale-105 ${
                              amount === amt
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                : 'bg-black/60 text-gray-400 hover:bg-black/80 border border-white/10'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-4 uppercase tracking-wider font-medium">Payment Method</label>
                      <div className="space-y-3">
                        <button
                          onClick={() => setMethod('RAZORPAY')}
                          className={`w-full p-5 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] ${
                            method === 'RAZORPAY'
                              ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_30px_rgba(102,126,234,0.3)]'
                              : 'bg-black/60 text-gray-400 hover:bg-black/80 border border-white/10'
                          }`}
                        >
                          <CreditCard className="w-7 h-7" />
                          <div className="text-left flex-1">
                            <p className="font-bold text-lg">Razorpay (Recommended)</p>
                            <p className="text-sm opacity-80">Cards, UPI, NetBanking - Instant ⚡</p>
                          </div>
                          {method === 'RAZORPAY' && <Zap className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={() => setMethod('UPI')}
                          className={`w-full p-5 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] ${
                            method === 'UPI'
                              ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_30px_rgba(102,126,234,0.3)]'
                              : 'bg-black/60 text-gray-400 hover:bg-black/80 border border-white/10'
                          }`}
                        >
                          <Smartphone className="w-7 h-7" />
                          <div className="text-left flex-1">
                            <p className="font-bold text-lg">Direct UPI</p>
                            <p className="text-sm opacity-80">Manual UPI transfer</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setMethod('CRYPTO')}
                          className={`w-full p-5 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] ${
                            method === 'CRYPTO'
                              ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_30px_rgba(102,126,234,0.3)]'
                              : 'bg-black/60 text-gray-400 hover:bg-black/80 border border-white/10'
                          }`}
                        >
                          <Bitcoin className="w-7 h-7" />
                          <div className="text-left flex-1">
                            <p className="font-bold text-lg">Cryptocurrency</p>
                            <p className="text-sm opacity-80">USDT, BTC, ETH</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleDeposit}
                      disabled={loading || !razorpayLoaded}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-5 text-xl font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-[1.02]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                          Processing...
                        </span>
                      ) : !razorpayLoaded ? (
                        'Loading Payment Gateway...'
                      ) : (
                        `💳 Deposit ₹${amount}`
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
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4 font-heading text-lg">Deposit Limits</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                    <span className="text-gray-400">Minimum</span>
                    <span className="text-white font-bold">₹100</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                    <span className="text-gray-400">Maximum</span>
                    <span className="text-white font-bold">₹100,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                    <span className="text-gray-400">Processing</span>
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Instant
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4 font-heading text-lg">🎁 Bonuses</h3>
                <ul className="text-sm text-gray-400 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    First deposit: Signup bonus credited
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    Daily deposit bonus available
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    VIP deposits get extra cashback
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4 font-heading text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Security
                </h3>
                <ul className="text-sm text-gray-400 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    256-bit SSL encryption
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    Secure payment gateway
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    Instant confirmation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    24/7 support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
