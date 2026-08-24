'use client'

import Sidebar from '@/components/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { WalletProvider } from '@/context/WalletContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Check NextAuth session OR localStorage user credentials
    const localEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null
    
    if (status === 'loading') return

    if (session?.user || localEmail) {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
      router.replace('/login')
    }
  }, [session, status, router])

  const isGamePage = [
    '/plinko', '/crash', '/roulette', '/slots', '/mines', 
    '/coinflip', '/dice', '/penalty', '/lottery', '/dragontower'
  ].some(path => pathname.startsWith(path))

  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0c10] text-gold font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Verifying session & redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <WalletProvider>
      <div className="flex h-dvh w-vw bg-[#0b0c10] text-white select-none overscroll-none overflow-hidden">
        
        {/* Sidebar - Desktop Only */}
        <Sidebar />
        
        {/* Main Content Shell */}
        <div className="flex-1 lg:pl-72 flex flex-col h-full w-full overflow-hidden relative">
          {/* Top App Bar Header */}
          <Navbar />
          
          {/* Page Content Shell */}
          <main className={`flex-1 pt-14 pb-20 px-2 relative w-full h-full ${isGamePage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-background to-background z-0 pointer-events-none" />
            
            <div key={pathname} className="relative z-10 h-full w-full">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Floating Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </WalletProvider>
  )
}
