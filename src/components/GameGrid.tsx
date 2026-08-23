'use client'

import { GameCard } from "@/components/GameCard"
import { GAMES } from "@/lib/games"
import { motion } from "framer-motion"

export function GameGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {GAMES.map((game, index) => (
        <motion.div
            key={game.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
        >
            <GameCard 
                title={game.title}
                description={game.description}
                icon={game.icon}
                href={game.href}
                color={game.color}
                gradient={game.gradient}
            />
        </motion.div>
      ))}
    </div>
  )
}
