'use client'

import { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Power, Settings, AlertTriangle, Loader } from 'lucide-react'

interface Game {
  id: string
  name: string
  enabled: boolean
  maintenance: boolean
  rtp: number
  houseEdge: number
  totalWagered: number
  totalPayout: number
}

export function GameControlPanel() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/games/control')
      const data = await res.json()
      if (data.success) setGames(data.games)
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  const toggleGame = async (gameId: string, field: 'enabled' | 'maintenance') => {
    try {
      const game = games.find(g => g.id === gameId)
      if (!game) return

      const newValue = !game[field]
      
      // Optimistic update
      setGames(games.map(g => g.id === gameId ? { ...g, [field]: newValue } : g))

      await fetch(`/api/admin/games/control`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, field, value: newValue }),
      })
    } catch (error) {
      console.error('Failed to toggle game:', error)
      fetchGames() // Revert on error
    }
  }

  const updateHouseEdge = async (gameId: string, houseEdge: number) => {
    setEditingId(null)
    if (isNaN(houseEdge) || houseEdge < 0 || houseEdge > 20) {
        alert("Invalid House Edge (Must be 0-20%)")
        return
    }

    try {
      // Optimistic update
      setGames(games.map(g => g.id === gameId ? { ...g, houseEdge } : g))

      await fetch(`/api/admin/games/control`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, field: 'houseEdge', value: houseEdge }),
      })
    } catch (error) {
      console.error('Failed to update house edge:', error)
      fetchGames()
    }
  }

  if (loading) {
    return <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card key={game.id} className="bg-black/40 border-white/10 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white font-bold">{game.name}</CardTitle>
              {game.maintenance && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Maintenance
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Power className={`w-4 h-4 ${game.enabled ? 'text-green-500' : 'text-gray-500'}`} />
                    Status
                  </div>
                  <Switch 
                    checked={game.enabled}
                    onCheckedChange={() => toggleGame(game.id, 'enabled')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Settings className="w-4 h-4" />
                    Maintenance
                  </div>
                  <Switch 
                    checked={game.maintenance}
                    onCheckedChange={() => toggleGame(game.id, 'maintenance')}
                  />
                </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm mb-2 items-center">
                        <span className="text-gray-400">Theoretical RTP</span>
                        <div className="flex items-center gap-2">
                            {editingId === game.id ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">HE:</span>
                                    <input 
                                        type="number" 
                                        className="w-16 bg-black/50 border border-white/20 rounded px-1 text-right text-xs"
                                        defaultValue={game.houseEdge}
                                        onBlur={(e) => updateHouseEdge(game.id, parseFloat(e.target.value))}
                                        autoFocus
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                </div>
                            ) : (
                                <span 
                                    className="cursor-pointer hover:text-white transition-colors"
                                    onClick={() => setEditingId(game.id)}
                                    title="Click to edit House Edge"
                                >
                                    {(100 - game.houseEdge).toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                     <span className="text-gray-400">Real RTP (All-time)</span>
                     <span className={`font-bold ${game.rtp < 95 ? 'text-red-400' : 'text-green-400'}`}>
                       {game.rtp.toFixed(2)}%
                     </span>
                   </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Wagered</span>
                      <span className="text-white">₹{game.totalWagered.toLocaleString()}</span>
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
