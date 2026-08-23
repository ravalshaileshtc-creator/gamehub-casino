
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// MOCK STORAGE: In production, use S3/R2/Cloudinary
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'kyc')

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('document') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, PDF allowed.' }, { status: 400 })
    }

    // Validate file size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (Max 5MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Ensure directory exists
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }

    // Create unique filename
    const ext = file.name.split('.').pop()
    const filename = `${session.user.id}-${Date.now()}.${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    // Write file
    await writeFile(filepath, buffer)

    // Update user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        kycStatus: 'PENDING',
        kycDocument: `/uploads/kyc/${filename}`,
        kycRejectionReason: null // Clear previous reason if any
      }
    })

    return NextResponse.json({ success: true, message: 'Document uploaded successfully' })

  } catch (error) {
    console.error('KYC Upload Error:', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An error occurred') || 'Internal Server Error' }, { status: 500 })
  }
}
