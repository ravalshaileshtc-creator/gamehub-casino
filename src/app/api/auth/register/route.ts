import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { BonusService } from '@/services/bonus.service'
import { AuditService } from '@/services/audit.service'

/**
 * POST /api/auth/register
 * Register new user with referral support
 */
export async function POST(req: Request) {
  try {
    const { name, email, password, referredByCode } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 })
    }

    // Generate unique referral code
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()

    // Check if referred by someone
    let referrerId: string | undefined
    if (referredByCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referredByCode },
      })

      if (referrer) {
        referrerId = referrer.id
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        referralCode,
        referredBy: referrerId,
        mainBalance: 0, // Start with 0, will add signup bonus
      },
    })

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        type: 'EMAIL_VERIFY',
        expires,
      },
    })

    // Send verification email (import at top: import { sendEmail, getVerificationEmailHtml } from '@/lib/email')
    // const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    // const emailHtml = getVerificationEmailHtml(name || 'User', verificationToken, baseUrl)
    // await sendEmail({
    //   to: email,
    //   subject: '🎰 Verify Your Email - Casino Platform',
    //   html: emailHtml,
    // })

    // Grant signup bonus
    await BonusService.grantSignupBonus(user.id)

    // Grant referral reward to referrer if applicable
    if (referrerId) {
      await BonusService.grantReferralBonus(referrerId, user.id, 'SIGNUP')
    }

    // Log registration
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    await AuditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'USER',
      resourceId: user.id,
      ipAddress: ipAddress || undefined,
    })

    return NextResponse.json({
      message: "User created successfully. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referralCode,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
