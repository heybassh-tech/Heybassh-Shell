import { v4 as uuidv4 } from "uuid"
import { prisma } from "./prisma"
import { sendEmail } from "./mailer"

const INVITATION_TOKEN_EXPIRY = 1000 * 60 * 60 * 24 * 7 // 7 days

export async function createInvitationToken(
  email: string,
  account_id: string,
  tokenValue?: string,
  expiresInMs: number = INVITATION_TOKEN_EXPIRY,
) {
  // Ensure only one active invite per email per account
  await prisma.emailVerificationToken.deleteMany({ where: { email, account_id } })
  const token = tokenValue ?? uuidv4()
  const expires = new Date(Date.now() + expiresInMs)
  return prisma.emailVerificationToken.create({
    data: { email, token, expires, account_id },
  })
}

export async function sendInvitationEmail(email: string, token: string, account_id: string, companyName: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  const inviteUrl = `${baseUrl.replace(/\/$/, "")}/register?email=${encodeURIComponent(email)}&account_id=${account_id}&token=${encodeURIComponent(token)}`

  const mailOptions = {
    to: email,
    subject: `You've been invited to join ${companyName} on Heybassh Shell`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0b1124; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0e6f69;">You've been invited!</h2>
        <p>You've been invited to join <strong>${companyName}</strong> on Heybassh Shell.</p>
        <p>Click the button below to create your account and get started:</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background: #0e6f69; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">Accept Invitation</a>
        </p>
        <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br><a href="${inviteUrl}" style="color: #0e6f69; word-break: break-all;">${inviteUrl}</a></p>
      </div>
    `,
  }

  await sendEmail(mailOptions)
  return inviteUrl
}

export async function validateInvitationToken(token: string, email: string, account_id?: string) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })
  if (!record) {
    return null
  }
  const emailMatches = record.email.toLowerCase() === email.toLowerCase()
  const accountMatches = account_id ? record.account_id === account_id : true
  if (!emailMatches || !accountMatches || record.expires < new Date()) {
    return null
  }
  return record
}

