import { v4 as uuidv4 } from "uuid"
import { prisma } from "./prisma"
import { sendEmail } from "./mailer"

const VERIFICATION_TOKEN_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours

export async function createEmailVerificationToken(
  email: string,
  tokenValue?: string,
  expiresInMs: number = VERIFICATION_TOKEN_EXPIRY,
) {
  await prisma.emailVerificationToken.deleteMany({ where: { email } })
  const token = tokenValue ?? uuidv4()
  const expires = new Date(Date.now() + expiresInMs)
  return prisma.emailVerificationToken.create({
    data: { email, token, expires },
  })
}

export async function sendVerificationEmail(email: string, token: string, companyName?: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`

  const mailOptions = {
    to: email,
    subject: "Verify your Heybassh Shell account",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0b1124;">
        <h2>Welcome${companyName ? ` to ${companyName}` : ""}!</h2>
        <p>Thanks for creating a Heybassh Shell workspace. Please confirm your email address to activate your account.</p>
        <p>
          <a href="${verifyUrl}" style="background:#0e6f69;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Verify email</a>
        </p>
        <p>This link will expire in 24 hours. If you didn't request this, feel free to ignore this email.</p>
      </div>
    `,
  }

  await sendEmail(mailOptions)
  return verifyUrl
}

export async function sendVerificationCodeEmail(email: string, code: string, companyName?: string) {
  const mailOptions = {
    to: email,
    subject: "Your Heybassh Shell verification code",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0b1124;">
        <h2>Verify your email ${companyName ? `for ${companyName}` : ""}</h2>
        <p>Use the verification code below to continue setting up your Heybassh Shell workspace.</p>
        <p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #0e6f69; margin: 24px 0;">${code}</p>
        <p>This code will expire in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>
    `,
  }

  await sendEmail(mailOptions)
}

export async function validateVerificationToken(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })
  if (!record || record.expires < new Date()) {
    return null
  }
  return record
}

