import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { sendEmail } from "@/lib/mailer"

export const runtime = 'nodejs'

const schema = z.object({
  email: z.string().email()
})

function normalizeEmailError(error: unknown) {
  if (error instanceof Error) {
    const code = (error as any)?.code || error.name || "UNKNOWN"
    return {
      message: error.message || "Unknown error",
      code,
      details: {
        name: error.name,
        message: error.message,
        code: (error as any)?.code,
        statusCode: (error as any)?.statusCode,
        cause: (error as any)?.cause,
        stack: error.stack,
      },
    }
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    const message =
      typeof record.message === "string"
        ? record.message
        : JSON.stringify(record, null, 2)
    const code =
      typeof record.code === "string"
        ? record.code
        : typeof record.name === "string"
          ? record.name
          : "UNKNOWN"
    return { message, code, details: record }
  }

  const fallback = typeof error === "string" ? error : "Unknown error"
  return { message: fallback, code: "UNKNOWN", details: { raw: error } }
}

export async function POST(req: Request) {
  try {
    console.log("=".repeat(60))
    console.log("[FORGOT PASSWORD] Request received")
    console.log("=".repeat(60))
    
    const body = await req.json()
    const { email } = schema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()

    console.log(`[FORGOT PASSWORD] Processing request for email: ${normalizedEmail}`)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Don't reveal if user exists or not for security
    if (!user) {
      console.log(`[FORGOT PASSWORD] User not found for email: ${normalizedEmail}`)
      console.log("=".repeat(60))
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: "If an account exists with this email, a password reset link has been sent. Please check your inbox."
      })
    }

    console.log(`[FORGOT PASSWORD] User found: ${user.id}`)

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // Token expires in 1 hour

    console.log(`[FORGOT PASSWORD] Generated reset token (expires in 1 hour)`)

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    console.log(`[FORGOT PASSWORD] Reset token saved to database`)

    // Create reset URL - handle Vercel deployment URLs properly
    const baseUrl = process.env.NEXTAUTH_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || process.env.NEXT_PUBLIC_APP_URL
      || "https://app.heybassh.com"
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    console.log(`[FORGOT PASSWORD] Reset URL created: ${resetUrl}`)

    const fromAddress = process.env.EMAIL_FROM

    console.log(`[FORGOT PASSWORD] Attempting to send password reset email...`)
    console.log(`   To: ${normalizedEmail}`)
    console.log(`   From: ${fromAddress}`)
    console.log(`   Subject: Password Reset Request`)
    console.log(`   Reset URL: ${resetUrl}`)

    try {
      await sendEmail({
        from: fromAddress,
        to: normalizedEmail,
        subject: "Password Reset Request - Heybassh Business Suite",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0e6f69;">Password Reset Request</h2>
              <p>You requested to reset your password. Click the link below to reset it:</p>
              <p style="margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #0e6f69; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${resetUrl}</p>
              <p style="color: #999; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour.</p>
              <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
        text: `Password Reset Request\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      })

      console.log(`[FORGOT PASSWORD] Email sent successfully!`)
      console.log(`[FORGOT PASSWORD] Password reset email has been sent to ${normalizedEmail}`)
      console.log("=".repeat(60))

      return NextResponse.json({
        success: true,
        emailSent: true,
        message: `Password reset email has been sent. Please check your inbox (and spam folder).`,
        details: {
          to: normalizedEmail,
        },
      })
    } catch (emailError) {
      console.error(`[FORGOT PASSWORD] Email sending failed!`)
      console.error(`   Error:`, emailError)
      const { message: errorMessage, code: errorCode, details } = normalizeEmailError(emailError)
      const isConfigError =
        errorMessage.toLowerCase().includes("resend_api_key") ||
        errorMessage.toLowerCase().includes("sender email")
      console.log("=".repeat(60))

      return NextResponse.json(
        {
          success: false,
          emailSent: false,
          message: `Failed to send password reset email: ${errorMessage}`,
          error: errorMessage,
          errorCode,
          errorDetails: details,
          smtpConfigured: isConfigError ? false : undefined,
          resetUrl: isConfigError ? resetUrl : undefined,
        },
        { status: 500 },
      )
    }

  } catch (error) {
    console.error("=".repeat(60))
    console.error("[FORGOT PASSWORD] Error occurred:")
    console.error(error)
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`)
      console.error(`   Error stack: ${error.stack}`)
    }
    console.error("=".repeat(60))
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid email format." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "SERVER_ERROR", message: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}

