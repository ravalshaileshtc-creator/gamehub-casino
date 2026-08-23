'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { GAMES } from '@/lib/games'
import { Search, Heart, Play, ChevronRight, Gamepad2, Sparkles, Filter, Zap } from 'lucide-react'

const CATEGORIES = ['All', 'Ball Games', 'Casino', 'Live', 'Casual']

export default function GamesLibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])

  const toggleFavorite = (title: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#0F1117] text-white pt-8 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-3xl md:text-5xl font-black flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-amber-400" />
              GAME LIBRARY
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              Explore 9 premium games powered by one central shared wallet.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-gray-500 font-medium text-sm focus:border-amber-400 outline-none transition"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-gray-400 shrink-0 mr-1" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-zinc-900 text-gray-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Responsive Game Cards Grid (2 cols mobile, 3 tablet, 4 desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredGames.map((game) => {
              const Icon = game.icon
              const isFav = favorites.includes(game.title)

              return (
                <motion.div
                  key={game.title}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative"
                >
                  <Link href={game.href}>
                    <div className="p-5 rounded-3xl bg-zinc-900/90 border border-white/10 hover:border-amber-400 transition-all shadow-xl backdrop-blur-xl flex flex-col justify-between h-full relative overflow-hidden">
                      
                      {/* Top Icon & Favorite Toggle */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl bg-zinc-800/80 ${game.color} border border-white/5`}>
                          <Icon className="w-6 h-6" />
                        </div>

                        <button
                          onClick={(e) => toggleFavorite(game.title, e)}
                          className={`p-2 rounded-full transition ${
                            isFav ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-white bg-black/40'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {game.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                          {game.title}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {game.description}
                        </p>
                      </div>

                      {/* Footer Play CTA */}
                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          PLAY NOW <ChevronRight className="w-4 h-4" />
                        </span>
                        <div className="w-8 h-8 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-black transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>

                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
            <p className="text-xl font-bold text-gray-400">No games found matching "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs"
            >
              Clear Filters
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
