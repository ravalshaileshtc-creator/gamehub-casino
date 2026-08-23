'use client'

import Sidebar from '@/components/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import GlobalChat from '@/components/chat/GlobalChat'
import { WalletProvider } from '@/context/WalletContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <WalletProvider>
      <div className="flex min-h-screen bg-[#0A0A0F] text-white select-none overscroll-none overflow-x-hidden">
        
        {/* Sidebar - Desktop Only */}
        <Sidebar />
        
        {/* Main Content Shell */}
        <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
          {/* Top Header App Bar with Balance Switcher */}
          <Navbar />
          
          {/* Page Content with Slide Transition */}
          <main className="flex-1 p-3 md:p-8 pt-4 relative overflow-hidden pb-24 md:pb-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-background to-background z-0 pointer-events-none" />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="relative z-10 h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        
        {/* Global Chat Overlay */}
        <GlobalChat />

        {/* Floating Frosted Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    </WalletProvider>
  )
}
