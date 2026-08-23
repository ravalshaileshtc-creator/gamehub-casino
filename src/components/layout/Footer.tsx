import Link from "next/link"
import { Trophy, Twitter, Github, Disc, Bitcoin, CircleDollarSign, Activity } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl relative z-10">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="space-y-4">
                <Link href="/" className="flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold font-heading text-white tracking-wider">
                    GAMBLEFI
                    </span>
                </Link>
                <p className="text-sm text-gray-400 leading-relaxed">
                    The next generation of crypto gambling. Provably fair, instant payouts, and premium rewards.
                </p>
                <div className="flex items-center space-x-4">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github className="h-5 w-5" /></a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><Disc className="h-5 w-5" /></a>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h3 className="text-white font-bold mb-4 font-heading">Platform</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link href="/games" className="hover:text-primary transition-colors">Games</Link></li>
                    <li><Link href="/promotions" className="hover:text-primary transition-colors">Promotions</Link></li>
                    <li><Link href="/vip" className="hover:text-primary transition-colors">VIP Club</Link></li>
                    <li><Link href="/fairness" className="hover:text-primary transition-colors">Provably Fair</Link></li>
                </ul>
            </div>

            {/* Support */}
            <div>
                <h3 className="text-white font-bold mb-4 font-heading">Support</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                    <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                    <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/gamble-aware" className="hover:text-primary transition-colors">Gamble Aware</Link></li>
                </ul>
            </div>

            {/* Status & Newsletter */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-white font-bold mb-4 font-heading">System Status</h3>
                    <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 blur animate-pulse" />
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full relative z-10" />
                        </div>
                        <span className="text-emerald-400 text-sm font-medium tracking-wide">All Systems Operational</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4 font-heading">Accepted Networks</h3>
                    <div className="flex items-center space-x-3 text-gray-400">
                        <Bitcoin className="h-6 w-6 hover:text-[#F7931A] transition-colors cursor-help" />
                        <CircleDollarSign className="h-6 w-6 hover:text-[#2775CA] transition-colors cursor-help" />
                        <Activity className="h-6 w-6 hover:text-[#000000] bg-white rounded-full p-0.5 text-black transition-colors cursor-help" />
                    </div>
                </div>
            </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600">
                &copy; {new Date().getFullYear()} GambleFi. All rights reserved. 18+ Only.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
                <span>Server Time: {new Date().toUTCString()}</span>
            </div>
        </div>
      </div>
    </footer>
  )
}
