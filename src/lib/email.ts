import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set - email functionality disabled')
}

export const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789')

export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[Email] Skipping send (no API key):', { to, subject })
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Sent successfully:', { to, subject, id: data?.id })
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('[Email] Exception:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Email templates
export function getVerificationEmailHtml(name: string, token: string, baseUrl: string) {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎰 Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Thanks for signing up! Please verify your email address to activate your account and start playing.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Casino Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getPasswordResetEmailHtml(name: string, token: string, baseUrl: string) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2024 Casino Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getTwoFactorEmailHtml(name: string, code: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
          .code { font-size: 36px; font-weight: bold; color: #fa709a; letter-spacing: 8px; margin: 30px 0; padding: 20px; background: white; border-radius: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Your 2FA Code</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Here's your two-factor authentication code:</p>
            <div class="code">${code}</div>
            <p><strong>This code will expire in 5 minutes.</strong></p>
            <p>If you didn't request this code, please secure your account immediately.</p>
          </div>
          <div class="footer">
            <p>© 2024 Casino Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
