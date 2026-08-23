'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  Home,
  Wallet,
  Gamepad2,
  TrendingUp,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  History,
  Shield,
  Gift,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  name: string
  href?: string
  icon: LucideIcon
  children?: {
    name: string
    href: string
    emoji: string
  }[]
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Games', icon: Gamepad2, children: [
    { name: 'Dice', href: '/dice', emoji: '🎲' },
    { name: 'Coinflip', href: '/coinflip', emoji: '🪙' },
    { name: 'Roulette', href: '/roulette', emoji: '🎡' },
    { name: 'Crash', href: '/crash', emoji: '🚀' },
    { name: 'Mines', href: '/mines', emoji: '💣' },
    { name: 'Slots', href: '/slots', emoji: '🎰' },
  ]},
  { name: 'Transactions', href: '/transactions', icon: History },
  { name: 'Deposit', href: '/deposit', icon: DollarSign },
  { name: 'Withdraw', href: '/withdraw', icon: TrendingUp },
  { name: 'Bonuses', href: '/bonuses', icon: Gift },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Admin', href: '/admin', icon: Shield },
]

const adminNavigation: NavItem[] = [
  { name: 'Overview', href: '/admin', icon: Home }, // Using Home as Overview
  { name: 'Users', href: '/admin/users', icon: User },
  { name: 'Games', href: '/admin/games', icon: Gamepad2 },
  { name: 'Finance', href: '/admin/finance', icon: DollarSign },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Back to Site', href: '/dashboard', icon: LogOut },
]

interface SidebarProps {
  items?: typeof navigation
}

export default function Sidebar({ items }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const pathname = usePathname()
  const { data: session } = useSession()

  // Close mobile sidebar on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false)
  }, [pathname])

  // Auto-expand Games menu if on a game page
  useEffect(() => {
    const gameRoutes = ['/dice', '/coinflip', '/roulette', '/crash', '/mines', '/slots', '/plinko']
    if (gameRoutes.some(route => pathname?.includes(route))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedMenu('Games')
    }
  }, [pathname])

  // Filter out Admin link for non-admins if using default navigation
  const filteredNavigation = navigation.filter(item => 
    item.name !== 'Admin' || session?.user?.role === 'ADMIN'
  )

  const currentNav = items || (pathname?.startsWith('/admin') ? adminNavigation : filteredNavigation)

  const toggleMenu = (name: string) => {
    setExpandedMenu(expandedMenu === name ? null : name)
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-black/80 backdrop-blur-xl border border-white/20 text-white hover:bg-black/90 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(102,126,234,0.3)]"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-black/95 via-gray-950/95 to-black/95 backdrop-blur-2xl border-r border-white/10 z-40 overflow-y-auto custom-scrollbar transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-6">
          {/* Logo */}
          <Link href="/" className="block mb-10 px-2 group">
            <motion.h1 
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-yellow-400 to-orange-500 tracking-wider text-center drop-shadow-[0_0_15px_rgba(102,126,234,0.5)]"
            >
              GAMBLEFI
            </motion.h1>
          </Link>

          {/* Navigation */}
          <nav className="space-y-2">
            {currentNav.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 transition-all group ${
                        expandedMenu === item.name ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <span className="font-medium group-hover:text-white transition-colors">{item.name}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedMenu === item.name ? 180 : 0 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className="text-xs"
                      >
                        ▼
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {expandedMenu === item.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-4 mt-2 space-y-1 overflow-hidden"
                        >
                          {item.children.map((child: { name: string; href: string; emoji: string }) => {
                            const isActive = pathname === child.href
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className="relative group"
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="activeGameBg"
                                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-sm"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  />
                                )}
                                <div className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                                  isActive
                                    ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_20px_rgba(102,126,234,0.4)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}>
                                  <span className="text-lg">{child.emoji}</span>
                                  <span className="font-medium">{child.name}</span>
                                </div>
                              </Link>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    className="relative group"
                  >
                    {pathname === item.href && (
                      <motion.div
                        layoutId="activeBg"
                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      pathname === item.href
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_20px_rgba(102,126,234,0.4)]'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}>
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
             {/* Mini Profile (if logged in) */}
             {session?.user && (
              <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/10 hover:border-primary/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                     {session.user.image ? (
                         <Image src={session.user.image} alt={session.user.name || "User"} width={40} height={40} className="w-full h-full object-cover" />
                     ) : (
                        <span className="font-bold text-white text-xs">{session.user.name?.charAt(0).toUpperCase()}</span>
                     )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate group-hover:text-primary transition-colors">{session.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                </div>
              </Link>
             )}

            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20 hover:border-red-500/40"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        />
      )}
    </>
  )
}
