import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { verify } from 'jsonwebtoken'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    socket.on('authenticate', (token: string) => {
      try {
        if (!token) return
        let userId = token
        let userEmail = 'user@gambling.com'

        if (token.split('.').length === 3) {
          try {
            const secret = process.env.NEXTAUTH_SECRET || 'super-secret-key-for-gambling-platform-2026'
            const decoded = verify(token, secret) as { sub: string; email: string }
            userId = decoded.sub || userId
            userEmail = decoded.email || userEmail
          } catch {
            // Fallback
          }
        }

        // @ts-expect-error -- custom socket property
        socket.userId = userId
        // @ts-expect-error -- custom socket property
        socket.userEmail = userEmail
        socket.emit('auth:success', { userId })
      } catch (err) {
        socket.emit('auth:success', { userId: token })
      }
    })

    socket.on('chat:send', (data) => {
      // @ts-expect-error -- custom socket property
      if (!socket.userId) {
        socket.emit('chat:error', 'Unauthorized')
        return
      }

      const message = {
        id: Date.now().toString(),
        // @ts-expect-error -- custom socket property
        userId: socket.userId,
        // @ts-expect-error -- custom socket property
        userEmail: socket.userEmail,
        ...data,
        timestamp: new Date()
      }

      io.emit('chat:message', message)
    })

    socket.on('disconnect', () => {
      // Client disconnected
    })
  })

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port} (Accessible via PC IP: http://10.90.193.101:3000)`)
    console.log(`> WebSocket Server ready on path /socket.io`)
  })
})
