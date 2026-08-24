'use client'

import Sidebar from '@/components/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { WalletProvider } from '@/context/WalletContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localEmail = localStorage.getItem('user_email')
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
      if (!session?.user && !localEmail && !isAuthPage) {
        window.location.href = '/login'
      }
    }
  }, [session, pathname])

  const isGamePage = [
    '/plinko', '/crash', '/roulette', '/slots', '/mines', 
    '/coinflip', '/dice', '/penalty', '/lottery', '/dragontower'
  ].some(path => pathname.startsWith(path))

  return (
    <WalletProvider>
      <div className="flex h-dvh w-vw bg-[#0b0c10] text-white select-none overscroll-none overflow-hidden">
        
        {/* Sidebar - Desktop Only */}
        <Sidebar />
        
        {/* Main Content Shell */}
        <div className="flex-1 lg:pl-72 flex flex-col h-full w-full overflow-hidden relative font-sans">
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
