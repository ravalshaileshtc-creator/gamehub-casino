'use client'

import { motion } from 'framer-motion'
import { Shield, Smartphone, Zap, Gift, Globe, Lock } from 'lucide-react'

const features = [
  {
    title: 'Provably Fair Gaming',
    description: 'Every roll is verifiable on the client-side. We use a transparent cryptographic seed system to ensure 100% fairness.',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'Instant Withdrawals',
    description: 'No more waiting days for your winnings. Our automated payout system processes 99% of withdrawals instantly.',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    title: 'Mobile Optimized',
    description: 'Play anywhere, anytime. Our platform is fully responsive and optimized for a native-app-like experience on iOS and Android.',
    icon: Smartphone,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Daily Rewards',
    description: 'Log in daily to claim free bonuses, rakeback, and level up your VIP status for exclusive perks.',
    icon: Gift,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Global Community',
    description: 'Join thousands of players in our live chat. Share your wins, strategies, and participate in community rain events.',
    icon: Globe,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    title: 'Ironclad Security',
    description: 'Your assets are protected by enterprise-grade cold storage wallets and mandatory 2FA for withdrawals.',
    icon: Lock,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
]

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wide"
          >
            Why Choose Us
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white mb-6 font-heading"
          >
            The Ultimate <span className="text-gradient-gold">Crypto Casino</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg leading-relaxed"
          >
            We combine cutting-edge technology with premium design to deliver the most transparent and enjoyable gambling experience.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group p-8 rounded-3xl glass-card border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
