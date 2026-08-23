
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET: Fetch recent messages
export async function GET() {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { name: true, image: true, vipLevel: true, role: true }
        }
      }
    })

    return NextResponse.json(messages.reverse())
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

// POST: Send a message
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await req.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message empty' }, { status: 400 })
    }

    if (message.length > 200) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Rate limiting could go here (Redis)

    const newMessage = await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        message: message.trim(),
        isSystem: false
      },
      include: {
        user: { select: { name: true, image: true, vipLevel: true, role: true } }
      }
    })

    return NextResponse.json(newMessage)

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred'
    console.error('Chat Post Error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
