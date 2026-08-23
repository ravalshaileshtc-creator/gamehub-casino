import type { Metadata } from 'next'
// import { Inter, Orbitron, Rajdhani } from 'next/font/google' // Google Fonts blocked
import './globals.css'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/Providers'

// Fallback fonts are handled by system defaults
// const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
// const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-heading' })
// const rajdhani = Rajdhani({ ... })

export const metadata: Metadata = {
  title: 'GambleFi - Web3 Gambling Platform',
  description: 'Provably fair crypto gambling games',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        suppressHydrationWarning={true}
        className={cn(
        "min-h-screen bg-background font-sans antialiased overflow-x-hidden selection:bg-primary/20 selection:text-primary"
        // inter.variable,
        // orbitron.variable,
        // rajdhani.variable
      )}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
