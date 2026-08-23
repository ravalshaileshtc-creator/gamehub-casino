import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { verify } from 'jsonwebtoken'

let io: SocketIOServer | null = null

interface AuthenticatedSocket extends Socket {
  userId?: string
  email?: string
}

export function initializeWebSocket(httpServer: HTTPServer) {
  if (io) {
    console.log('[WebSocket] Already initialized')
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io',
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('[WebSocket] Client connected:', socket.id)

    // Authentication
    socket.on('authenticate', async (token: string) => {
      try {
        if (!process.env.NEXTAUTH_SECRET) {
          socket.emit('auth:error', 'Server configuration error')
          return
        }

        const decoded = verify(token, process.env.NEXTAUTH_SECRET) as { sub: string, email: string }
        socket.userId = decoded.sub
        socket.email = decoded.email

        socket.emit('auth:success', { userId: socket.userId })
        console.log('[WebSocket] User authenticated:', socket.userId)
      } catch (error) {
        console.error('[WebSocket] Auth error:', error)
        socket.emit('auth:error', 'Invalid token')
      }
    })

    // Join game room
    socket.on('room:join', (roomId: string) => {
      socket.join(roomId)
      socket.emit('room:joined', roomId)
      io?.to(roomId).emit('room:user-joined', {
        userId: socket.userId,
        socketId: socket.id,
      })
      console.log(`[WebSocket] User ${socket.userId} joined room ${roomId}`)
    })

    // Leave game room
    socket.on('room:leave', (roomId: string) => {
      socket.leave(roomId)
      io?.to(roomId).emit('room:user-left', {
        userId: socket.userId,
        socketId: socket.id,
      })
      console.log(`[WebSocket] User ${socket.userId} left room ${roomId}`)
    })

    // Chat message
    socket.on('chat:send', (data: { roomId: string; message: string }) => {
      if (!socket.userId) {
        socket.emit('chat:error', 'Not authenticated')
        return
      }

      const chatMessage = {
        id: Date.now().toString(),
        userId: socket.userId,
        message: data.message,
        timestamp: new Date(),
      }

      io?.to(data.roomId).emit('chat:message', chatMessage)
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log('[WebSocket] Client disconnected:', socket.id)
    })
  })

  console.log('[WebSocket] Server initialized')
  return io
}

export function getIO(): SocketIOServer | null {
  return io
}

/**
 * Emit events to clients
 */
export const WebSocketEvents = {
  // Broadcast new bet to all clients
  newBet: (bet: unknown) => {
    io?.emit('bet:new', bet)
  },

  // Emit balance update to specific user
  balanceUpdate: (userId: string, balance: unknown) => {
    io?.emit(`balance:${userId}`, balance)
  },

  // Emit notification to specific user
  notification: (userId: string, notification: unknown) => {
    io?.emit(`notification:${userId}`, notification)
  },

  // Broadcast game result to room
  gameResult: (roomId: string, result: unknown) => {
    io?.to(roomId).emit('game:result', result)
  },

  // Broadcast crash multiplier update
  crashUpdate: (roomId: string, multiplier: number) => {
    io?.to(roomId).emit('crash:update', multiplier)
  },
}
