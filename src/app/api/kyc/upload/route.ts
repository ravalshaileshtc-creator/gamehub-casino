import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { FileUploadService } from '@/services/upload.service'
import prisma from '@/lib/prisma'

const uploadSchema = z.object({
  documentType: z.enum(['idProof', 'addressProof', 'selfie']),
  fileData: z.string(), // Base64 encoded file
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { documentType, fileData } = uploadSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, kycDocument: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upload file to Cloudinary
    const uploadResult = await FileUploadService.uploadFile(fileData, 'kyc')

    // Update user's KYC documents
    const existingDocs = user.kycDocument ? JSON.parse(user.kycDocument) : {}
    const updatedDocs = {
      ...existingDocs,
      [documentType]: uploadResult.url,
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { kycDocument: JSON.stringify(updatedDocs) },
    })

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      documentType,
    })
  } catch (error) {
    console.error('KYC upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    }, { status: 500 })
  }
}
