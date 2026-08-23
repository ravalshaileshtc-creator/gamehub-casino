'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

import { SharedBet } from '@/types'

interface BalanceUpdate {
  userId: string
  balance: number
  type: 'MAIN' | 'BONUS'
}

interface ChatMessage {
  id: string
  userId: string
  userEmail: string
  message: string
  timestamp: Date
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io',
      addTrailingSlash: false,
      autoConnect: false,
    })

    socketInstance.on('connect', () => {
      setConnected(true)

      // Authenticate if session exists
      if (session?.user?.id) {
        socketInstance.emit('authenticate', session.user.id)
      }
    })

    socketInstance.on('disconnect', () => {
      setConnected(false)
    })

    socketInstance.on('auth:success', (data: { userId: string }) => {
      // Authenticated cleanly
    })

    socketInstance.on('auth:error', () => {
      // Handled silently
    })

    socketInstance.connect()

    // Use microtask to avoid synchronous state update in effect warning
    Promise.resolve().then(() => {
      setSocket(socketInstance)
    })

    return () => {
      socketInstance.disconnect()
      setSocket(null)
    }
  }, [session?.user?.id])

  return { socket, connected }
}

/**
 * Hook for live bets feed
 */
export function useLiveBets() {
  const { socket } = useWebSocket()
  const [bets, setBets] = useState<SharedBet[]>([])

  useEffect(() => {
    if (!socket) return

    const handleNewBet = (bet: SharedBet) => {
      setBets((prev) => [bet, ...prev].slice(0, 50)) // Keep last 50 bets
    }

    socket.on('bet:new', handleNewBet)

    return () => {
      socket.off('bet:new', handleNewBet)
    }
  }, [socket])

  return { bets }
}

/**
 * Hook for wallet balance updates
 */
export function useWalletUpdates(userId?: string) {
  const { socket } = useWebSocket()
  const [balance, setBalance] = useState<BalanceUpdate | null>(null)

  useEffect(() => {
    if (!socket || !userId) return

    const handleBalanceUpdate = (update: BalanceUpdate) => {
      setBalance(update)
    }

    socket.on(`balance:${userId}`, handleBalanceUpdate)

    return () => {
      socket.off(`balance:${userId}`, handleBalanceUpdate)
    }
  }, [socket, userId])

  return { balance }
}

/**
 * Hook for game room
 */
export function useGameRoom(roomId: string) {
  const { socket, connected } = useWebSocket()
  const [joined, setJoined] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    if (!socket || !connected) return

    // Join room
    socket.emit('room:join', roomId)

    socket.on('room:joined', () => {
      setJoined(true)
    })

    socket.on('chat:message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message])
    })

    return () => {
      socket.emit('room:leave', roomId)
      setJoined(false)
    }
  }, [socket, connected, roomId])

  const sendMessage = useCallback(
    (message: string) => {
      if (!socket || !joined) return
      socket.emit('chat:send', { roomId, message })
    },
    [socket, joined, roomId]
  )

  return { joined, messages, sendMessage }
}
