import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib'
const authenticator = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
})
import QRCode from 'qrcode'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const TOTP_ISSUER = process.env.TOTP_ISSUER || 'CasinoPlatform'

export class TwoFactorService {
  /**
   * Generate a new TOTP secret for a user
   */
  static generateSecret() {
    return authenticator.generateSecret()
  }

  /**
   * Generate QR code for authenticator app
   */
  static async generateQRCode(email: string, secret: string): Promise<string> {
    const otpauthUrl = authenticator.toURI({
      label: email,
      issuer: TOTP_ISSUER,
      secret,
    })
    try {
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      console.error('QR Code generation error:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Verify a TOTP token
   */
  static async verifyToken(token: string, secret: string): Promise<boolean> {
    try {
      const result = await authenticator.verify(token, { secret })
      return result?.valid === true
    } catch (error) {
      console.error('Token verification error:', error)
      return false
    }
  }

  /**
   * Generate backup codes
   */
  static async generateBackupCodes(count: number = 8): Promise<{ plain: string[], hashed: string[] }> {
    const plain: string[] = []
    const hashed: string[] = []

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      plain.push(code)

      // Hash the code for storage
      const hash = await bcrypt.hash(code, 10)
      hashed.push(hash)
    }

    return { plain, hashed }
  }

  /**
   * Verify a backup code
   */
  static async verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isValid = await bcrypt.compare(code, hashedCodes[i])
      if (isValid) {
        return i // Return index of used code
      }
    }
    return -1 // Not found
  }

  /**
   * Enable 2FA for a user
   */
  static async enable2FA(userId: string, secret: string) {
    const backupCodes = await this.generateBackupCodes()

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackup: backupCodes.hashed,
      },
    })

    return backupCodes.plain
  }

  /**
   * Disable 2FA for a user
   */
  static async disable2FA(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackup: [],
      },
    })
  }

  /**
   * Validate and consume a backup code
   */
  static async useBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackup: true },
    })

    if (!user || !user.twoFactorBackup) return false

    const index = await this.verifyBackupCode(code, user.twoFactorBackup)
    if (index === -1) return false

    // Remove used backup code
    const newBackupCodes = user.twoFactorBackup.filter((_, i) => i !== index)

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackup: newBackupCodes },
    })

    return true
  }

  /**
   * Generate new backup codes (replacing old ones)
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = await this.generateBackupCodes()

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackup: backupCodes.hashed },
    })

    return backupCodes.plain
  }

  /**
   * Check if user has 2FA enabled
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })

    return user?.twoFactorEnabled || false
  }

  /**
   * Send 2FA code via email (for email-based 2FA)
   */
  static generateEmailCode(): string {
    return crypto.randomInt(100000, 999999).toString()
  }
}
